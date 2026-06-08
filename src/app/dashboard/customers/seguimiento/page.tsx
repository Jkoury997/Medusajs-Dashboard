"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAllCustomers,
  useCustomerGroups,
  buildGroupNameMap,
  resolveCustomerGroups,
  useCustomerMetadataMutation,
  type CustomerFollowup,
} from "@/hooks/use-customers"
import { useAllOrders, useOrderPhoneMap } from "@/hooks/use-orders"
import { getCustomerMetrics } from "@/lib/aggregations"
import { formatCurrency, formatNumber, formatDate, formatDateTime } from "@/lib/format"
import { getWhatsAppUrl } from "@/lib/whatsapp"
import { cn } from "@/lib/utils"
import {
  CalendarClock,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  ClipboardList,
} from "lucide-react"

type Tab = "pendientes" | "vencidos" | "hoy" | "programados" | "en_riesgo"

const TABS: { key: Tab; label: string }[] = [
  { key: "pendientes", label: "Pendientes" },
  { key: "vencidos", label: "Vencidos" },
  { key: "hoy", label: "Hoy" },
  { key: "programados", label: "Programados" },
  { key: "en_riesgo", label: "En riesgo" },
]

/** YYYY-MM-DD de hoy en local. */
function todayStr(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60_000).toISOString().split("T")[0]
}

interface Row {
  id: string
  name: string
  email: string
  phone?: string | null
  totalSpent: number
  orderCount: number
  daysSinceLastOrder: number | null
  metadata: Record<string, unknown>
  followup: CustomerFollowup
  priority: number
}

function churnConfig(days: number | null) {
  if (days === null) return { label: "Sin compras", cls: "bg-gray-100 text-gray-500" }
  if (days <= 30) return { label: "Activo", cls: "bg-green-50 text-green-700" }
  if (days <= 60) return { label: "Alerta", cls: "bg-yellow-50 text-yellow-700" }
  if (days <= 90) return { label: "Riesgo", cls: "bg-orange-50 text-orange-700" }
  return { label: "Crítico", cls: "bg-red-50 text-red-700" }
}

export default function SeguimientoPage() {
  const today = todayStr()
  const [tab, setTab] = useState<Tab>("pendientes")

  const { data: customers, isLoading: custLoading } = useAllCustomers()
  const { data: ordersData, isLoading: ordersLoading } = useAllOrders({})
  const { data: customerGroupsData } = useCustomerGroups()
  const { data: phoneMap } = useOrderPhoneMap()
  const markContacted = useCustomerMetadataMutation()

  const isLoading = custLoading || ordersLoading

  const rows = useMemo<Row[]>(() => {
    if (!customers || !ordersData) return []
    const groupNameMap = customerGroupsData?.customer_groups
      ? buildGroupNameMap(customerGroupsData.customer_groups)
      : new Map<string, string>()
    const resolved = resolveCustomerGroups(customers, groupNameMap)
    const enriched = getCustomerMetrics(resolved, ordersData, phoneMap)

    return enriched.map((c: Record<string, unknown>) => {
      const metadata = (c.metadata as Record<string, unknown>) ?? {}
      const followup = (metadata.seguimiento as CustomerFollowup | undefined) ?? {}
      const days = c.daysSinceLastOrder as number | null
      const totalSpent = (c.totalSpent as number) ?? 0

      // Prioridad: vencido > hoy > en riesgo sin seguimiento; dentro de cada
      // grupo, mayor valor primero.
      let priority = 0
      if (followup.nextContact && followup.nextContact < today) priority = 4_000_000
      else if (followup.nextContact === today) priority = 3_000_000
      else if (!followup.nextContact && days !== null && days > 60) priority = 2_000_000
      priority += Math.min(totalSpent, 999_999)

      return {
        id: c.id as string,
        name: `${(c.first_name as string) || ""} ${(c.last_name as string) || ""}`.trim() || (c.email as string),
        email: c.email as string,
        phone: c.phone as string | null | undefined,
        totalSpent,
        orderCount: (c.orderCount as number) ?? 0,
        daysSinceLastOrder: days,
        metadata,
        followup,
        priority,
      }
    })
  }, [customers, ordersData, customerGroupsData, phoneMap, today])

  const buckets = useMemo(() => {
    const vencidos = rows.filter((r) => r.followup.nextContact && r.followup.nextContact < today)
    const hoy = rows.filter((r) => r.followup.nextContact === today)
    const programados = rows.filter((r) => r.followup.nextContact && r.followup.nextContact > today)
    const enRiesgo = rows.filter((r) => r.daysSinceLastOrder !== null && r.daysSinceLastOrder > 60)
    const enRiesgoSinSeg = enRiesgo.filter((r) => !r.followup.nextContact)
    const pendientes = [...vencidos, ...hoy, ...enRiesgoSinSeg]
    return { vencidos, hoy, programados, enRiesgo, pendientes }
  }, [rows, today])

  const visibleRows = useMemo(() => {
    const map: Record<Tab, Row[]> = {
      pendientes: buckets.pendientes,
      vencidos: buckets.vencidos,
      hoy: buckets.hoy,
      programados: buckets.programados,
      en_riesgo: buckets.enRiesgo,
    }
    return [...map[tab]].sort((a, b) => b.priority - a.priority)
  }, [buckets, tab])

  async function handleContactedToday(r: Row) {
    const nextFollowup: CustomerFollowup = {
      ...r.followup,
      lastContact: new Date().toISOString(),
      // Sale de "vencidos"/"hoy": se reprograma desde la ficha del cliente.
      nextContact: undefined,
    }
    await markContacted.mutateAsync({
      customerId: r.id,
      metadata: { ...r.metadata, seguimiento: nextFollowup },
    })
  }

  return (
    <div>
      <Header
        title="Seguimiento"
        description="Cola de clientes a contactar, priorizada por vencimiento y valor"
      />
      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title="Vencidos" value={buckets.vencidos.length} icon={CalendarClock} color="red" loading={isLoading} />
          <KPICard title="Para hoy" value={buckets.hoy.length} icon={CalendarCheck} color="amber" loading={isLoading} />
          <KPICard title="En riesgo" value={buckets.enRiesgo.length} icon={AlertTriangle} color="orange" loading={isLoading} />
          <KPICard title="Programados" value={buckets.programados.length} icon={ClipboardList} color="blue" loading={isLoading} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const count =
              t.key === "pendientes" ? buckets.pendientes.length
              : t.key === "vencidos" ? buckets.vencidos.length
              : t.key === "hoy" ? buckets.hoy.length
              : t.key === "programados" ? buckets.programados.length
              : buckets.enRiesgo.length
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                  tab === t.key
                    ? "bg-mk-pink text-white border-mk-pink shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {t.label}
                <span className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full",
                  tab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último contacto</TableHead>
                  <TableHead>Próximo contacto</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : visibleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      No hay clientes en esta categoría 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((r) => {
                    const churn = churnConfig(r.daysSinceLastOrder)
                    const overdue = !!r.followup.nextContact && r.followup.nextContact < today
                    return (
                      <TableRow key={r.id} className="hover:bg-gray-50/50">
                        <TableCell>
                          <Link
                            href={`/dashboard/customers/${r.id}`}
                            className="group flex items-center gap-2"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 group-hover:text-mk-pink truncate">
                                {r.name}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{r.email}</p>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 shrink-0" />
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", churn.cls)}>
                            {churn.label}
                            {r.daysSinceLastOrder !== null && (
                              <span className="ml-1 opacity-70">({r.daysSinceLastOrder}d)</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {r.followup.lastContact ? formatDateTime(r.followup.lastContact) : "Nunca"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {r.followup.nextContact ? (
                            <span className={cn("font-medium", overdue ? "text-red-600" : "text-gray-700")}>
                              {formatDate(r.followup.nextContact)}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-900">
                          {formatCurrency(r.totalSpent)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {r.phone && (
                              <a
                                href={getWhatsAppUrl({
                                  phone: r.phone,
                                  firstName: r.name.split(" ")[0] || "",
                                  orderCount: r.orderCount,
                                  daysSinceLastOrder: r.daysSinceLastOrder,
                                  totalSpent: r.totalSpent,
                                })}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-700"
                                title="WhatsApp"
                              >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </a>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              disabled={markContacted.isPending}
                              onClick={() => handleContactedToday(r)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Contacté
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const KPI_COLORS = {
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  orange: "bg-orange-50 text-orange-600",
  blue: "bg-blue-50 text-blue-600",
} as const

function KPICard({
  title,
  value,
  icon: Icon,
  color,
  loading,
}: {
  title: string
  value: number
  icon: React.ElementType
  color: keyof typeof KPI_COLORS
  loading: boolean
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={cn("p-2 rounded-lg", KPI_COLORS[color])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        {loading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
        )}
      </CardContent>
    </Card>
  )
}
