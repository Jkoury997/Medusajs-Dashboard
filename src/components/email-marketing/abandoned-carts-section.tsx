"use client"

import { useState, useMemo } from "react"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useAbandonedCartStats,
  useAbandonedCartList,
  useProcessAbandonedCarts,
  useForceSendEmail,
  useDeleteAbandonedCart,
} from "@/hooks/use-email-marketing"
import { formatNumber, formatCurrency } from "@/lib/format"
import type { AbandonedCartListFilters } from "@/types/email-marketing"

const GROUP_LABELS: Record<string, string> = {
  minorista: "Minorista",
  mayorista: "Mayorista",
  revendedora: "Revendedora",
  comercios: "Comercios",
  "personal interno": "Personal Interno",
}

const GROUP_COLORS: Record<string, string> = {
  minorista: "bg-blue-100 text-blue-700",
  mayorista: "bg-purple-100 text-purple-700",
  revendedora: "bg-amber-100 text-amber-700",
  comercios: "bg-cyan-100 text-cyan-700",
  "personal interno": "bg-indigo-100 text-indigo-700",
}

function EmailStatusBadge({
  sent,
  delivered,
  opened,
  clicked,
  bounced,
}: {
  sent: boolean
  delivered: boolean
  opened: boolean
  clicked: boolean
  bounced: boolean
}) {
  if (bounced) return <Badge className="bg-red-100 text-red-700 text-[10px]">Rebotado</Badge>
  if (clicked) return <Badge className="bg-green-100 text-green-700 text-[10px]">Click</Badge>
  if (opened) return <Badge className="bg-blue-100 text-blue-700 text-[10px]">Abierto</Badge>
  if (delivered) return <Badge className="bg-gray-100 text-gray-700 text-[10px]">Entregado</Badge>
  if (sent) return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Enviado</Badge>
  return <Badge className="bg-gray-50 text-gray-400 text-[10px]">Pendiente</Badge>
}

function EngagementFunnel({
  label,
  sent,
  delivered,
  opened,
  clicked,
  bounced,
  openRate,
  clickRate,
}: {
  label: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  openRate: string
  clickRate: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Enviados</span>
                <span className="font-medium">{formatNumber(sent)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Entregados</span>
            <span className="font-medium">{formatNumber(delivered)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-blue-400 h-2 rounded-full"
              style={{ width: sent > 0 ? `${(delivered / sent) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Abiertos</span>
            <span className="font-medium">{formatNumber(opened)} ({openRate})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full"
              style={{ width: sent > 0 ? `${(opened / sent) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Clicks</span>
            <span className="font-medium">{formatNumber(clicked)} ({clickRate})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full"
              style={{ width: sent > 0 ? `${(clicked / sent) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {bounced > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-500">Rebotados</span>
              <span className="font-medium text-red-600">{formatNumber(bounced)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-red-400 h-2 rounded-full"
                style={{ width: sent > 0 ? `${(bounced / sent) * 100}%` : "0%" }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function AbandonedCartsSection() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  // Stats
  const { data: stats, isLoading: statsLoading } = useAbandonedCartStats()

  // List filters
  const [recoveredFilter, setRecoveredFilter] = useState("all")
  const [email1Filter, setEmail1Filter] = useState("all")
  const [email2Filter, setEmail2Filter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [listPage, setListPage] = useState(0)
  const listLimit = 50

  const listFilters = useMemo<AbandonedCartListFilters>(() => {
    const f: AbandonedCartListFilters = {
      limit: listLimit,
      offset: listPage * listLimit,
    }
    if (recoveredFilter !== "all") f.recovered = recoveredFilter as "true" | "false"
    if (email1Filter !== "all") f.email_1 = email1Filter as "true" | "false"
    if (email2Filter !== "all") f.email_2 = email2Filter as "true" | "false"
    if (groupFilter !== "all") f.customer_group = groupFilter
    if (dateRange.from) f.from = dateRange.from.toISOString()
    if (dateRange.to) f.to = dateRange.to.toISOString()
    return f
  }, [recoveredFilter, email1Filter, email2Filter, groupFilter, listPage, dateRange])

  const { data: cartList, isLoading: listLoading } = useAbandonedCartList(listFilters)
  const totalListPages = cartList ? Math.ceil(cartList.total / listLimit) : 0

  // Mutations
  const processMutation = useProcessAbandonedCarts()
  const forceSendMutation = useForceSendEmail()
  const deleteCartMutation = useDeleteAbandonedCart()

  // Expanded row
  const [expandedCartId, setExpandedCartId] = useState<string | null>(null)

  // Email preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  if (statsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[250px]" />)}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No se pudieron cargar los datos de carritos abandonados. Verificá la conexión con la API.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Carritos"
          value={formatNumber(stats.total)}
          subtitle={`${formatNumber(stats.pending_email_1)} pendientes email 1`}
          icon="🛒"
        />
        <MetricCard
          title="Recuperados"
          value={formatNumber(stats.recovered)}
          subtitle={`de ${formatNumber(stats.total)} abandonados`}
          changeType="positive"
          icon="✅"
        />
        <MetricCard
          title="Tasa de Recuperacion"
          value={stats.recovery_rate}
          changeType={parseFloat(stats.recovery_rate) >= 15 ? "positive" : "neutral"}
          icon="📈"
        />
        <MetricCard
          title="Con Cupon"
          value={formatNumber(stats.with_coupon)}
          subtitle={`Email 2: ${formatNumber(stats.email_2_sent)} enviados`}
          icon="🎟️"
        />
      </div>

      {/* Email engagement funnels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EngagementFunnel
          label="Email 1 — Recordatorio"
          sent={stats.email_1_sent}
          delivered={stats.engagement.email_1_delivered}
          opened={stats.engagement.email_1_opened}
          clicked={stats.engagement.email_1_clicked}
          bounced={stats.engagement.email_1_bounced}
          openRate={stats.engagement.email_1_open_rate}
          clickRate={stats.engagement.email_1_click_rate}
        />
        <EngagementFunnel
          label="Email 2 — Cupon de descuento"
          sent={stats.email_2_sent}
          delivered={stats.engagement.email_2_delivered}
          opened={stats.engagement.email_2_opened}
          clicked={stats.engagement.email_2_clicked}
          bounced={stats.engagement.email_2_bounced}
          openRate={stats.engagement.email_2_open_rate}
          clickRate={stats.engagement.email_2_click_rate}
        />
      </div>

      {/* Pipeline resumen */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 items-center justify-center">
            <PipelineStep label="Pendiente Email 1" value={stats.pending_email_1} color="bg-yellow-400" />
            <PipelineArrow />
            <PipelineStep label="Email 1 Enviado" value={stats.email_1_sent} color="bg-blue-400" />
            <PipelineArrow />
            <PipelineStep label="Pendiente Email 2" value={stats.pending_email_2} color="bg-orange-400" />
            <PipelineArrow />
            <PipelineStep label="Email 2 Enviado" value={stats.email_2_sent} color="bg-purple-400" />
            <PipelineArrow />
            <PipelineStep label="Recuperados" value={stats.recovered} color="bg-green-500" />
          </div>
        </CardContent>
      </Card>

      {/* Rendimiento por grupo */}
      {stats.by_group?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rendimiento por Grupo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Recuperados</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead className="text-right">E1 Abiertos</TableHead>
                  <TableHead className="text-right">E1 Clicks</TableHead>
                  <TableHead className="text-right">E2 Abiertos</TableHead>
                  <TableHead className="text-right">E2 Clicks</TableHead>
                  <TableHead className="text-right">Con Cupon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.by_group.map((g) => (
                  <TableRow key={g.group}>
                    <TableCell>
                      <Badge className={GROUP_COLORS[g.group] || "bg-gray-100 text-gray-700"}>
                        {GROUP_LABELS[g.group] || g.group}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(g.total)}</TableCell>
                    <TableCell className="text-right">{formatNumber(g.recovered)}</TableCell>
                    <TableCell className="text-right">
                      <span className={parseFloat(g.recovery_rate) >= 15 ? "text-green-600 font-semibold" : ""}>
                        {g.recovery_rate}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(g.email_1_opened)}</TableCell>
                    <TableCell className="text-right">{formatNumber(g.email_1_clicked)}</TableCell>
                    <TableCell className="text-right">{formatNumber(g.email_2_opened)}</TableCell>
                    <TableCell className="text-right">{formatNumber(g.email_2_clicked)}</TableCell>
                    <TableCell className="text-right">{formatNumber(g.with_coupon)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Procesar manualmente */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Procesar Carritos Abandonados</p>
              <p className="text-sm text-gray-500">
                Detectar abandonos, enviar emails pendientes y detectar recuperaciones (cron: cada 15 min)
              </p>
            </div>
            <Button
              onClick={() => processMutation.mutate()}
              disabled={processMutation.isPending}
              variant="outline"
            >
              {processMutation.isPending ? "Procesando..." : "Ejecutar ahora"}
            </Button>
          </div>
          {processMutation.isSuccess && processMutation.data && (
            <div className="mt-3 p-3 bg-green-50 rounded-md text-sm text-green-700">
              Detectados: {processMutation.data.new_carts_detected} &middot; Recordatorios: {processMutation.data.reminders_sent} &middot; Cupones: {processMutation.data.coupons_sent} &middot; Recuperados: {processMutation.data.recovered}
            </div>
          )}
          {processMutation.isError && (
            <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
              Error: {processMutation.error?.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros + lista */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Listado de Carritos Abandonados</CardTitle>
              {cartList && (
                <span className="text-sm text-gray-500">
                  {formatNumber(cartList.total)} resultados
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <DateRangePicker value={dateRange} onChange={(v) => { setDateRange(v); setListPage(0) }} />

              <Select value={recoveredFilter} onValueChange={(v) => { setRecoveredFilter(v); setListPage(0) }}>
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Recuperados</SelectItem>
                  <SelectItem value="false">No recuperados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={email1Filter} onValueChange={(v) => { setEmail1Filter(v); setListPage(0) }}>
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="Email 1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Email 1: Todos</SelectItem>
                  <SelectItem value="true">Email 1: Enviado</SelectItem>
                  <SelectItem value="false">Email 1: Pendiente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={email2Filter} onValueChange={(v) => { setEmail2Filter(v); setListPage(0) }}>
                <SelectTrigger className="w-[155px]">
                  <SelectValue placeholder="Email 2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Email 2: Todos</SelectItem>
                  <SelectItem value="true">Email 2: Enviado</SelectItem>
                  <SelectItem value="false">Email 2: Pendiente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setListPage(0) }}>
                <SelectTrigger className="w-[175px]">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  {stats?.by_group?.map((g) => (
                    <SelectItem key={g.group} value={g.group}>
                      {GROUP_LABELS[g.group] || g.group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <Skeleton className="h-[400px]" />
          ) : cartList?.records?.length ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]" />
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Paso</TableHead>
                      <TableHead>Email 1</TableHead>
                      <TableHead>Email 2</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartList.records.map((r) => {
                      const isExpanded = expandedCartId === r.cart_id
                      return (
                        <>
                          <TableRow
                            key={r.cart_id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedCartId(isExpanded ? null : r.cart_id)}
                          >
                            <TableCell className="text-xs text-gray-400 px-2">
                              {isExpanded ? "▼" : "▶"}
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">
                              {new Date(r.abandoned_at).toLocaleString("es-AR")}
                            </TableCell>
                            <TableCell className="text-xs max-w-[180px]">
                              <div className="truncate font-medium">{r.customer_name || "-"}</div>
                              <div className="truncate text-gray-400">{r.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`text-xs ${GROUP_COLORS[r.customer_group] || "bg-gray-100 text-gray-700"}`}>
                                {GROUP_LABELS[r.customer_group] || r.customer_group}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{r.items_count}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(r.cart_total)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{r.checkout_step || "-"}</Badge>
                            </TableCell>
                            <TableCell>
                              <EmailStatusBadge
                                sent={!!r.email_1_sent_at}
                                delivered={!!r.email_1_delivered_at}
                                opened={!!r.email_1_opened_at}
                                clicked={!!r.email_1_clicked_at}
                                bounced={r.email_1_bounced}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <EmailStatusBadge
                                  sent={!!r.email_2_sent_at}
                                  delivered={!!r.email_2_delivered_at}
                                  opened={!!r.email_2_opened_at}
                                  clicked={!!r.email_2_clicked_at}
                                  bounced={r.email_2_bounced}
                                />
                                {r.coupon_code && (
                                  <Badge className="bg-pink-100 text-pink-700 text-[10px]">🎟️</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.recovered ? (
                                <Badge className="bg-green-100 text-green-700">Recuperado</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700">Perdido</Badge>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1">
                                {!r.recovered && (!r.email_1_sent_at || !r.email_2_sent_at) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    disabled={forceSendMutation.isPending && forceSendMutation.variables?.cart_id === r.cart_id}
                                    onClick={() => forceSendMutation.mutate({ cart_id: r.cart_id, email_type: "next" })}
                                  >
                                    {forceSendMutation.isPending && forceSendMutation.variables?.cart_id === r.cart_id
                                      ? "..."
                                      : !r.email_1_sent_at
                                        ? "Enviar E1"
                                        : "Enviar E2"
                                    }
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 text-red-500 hover:text-red-700"
                                  disabled={deleteCartMutation.isPending && deleteCartMutation.variables === r.cart_id}
                                  onClick={() => {
                                    if (window.confirm(`Eliminar registro de ${r.customer_name || r.email}?`)) {
                                      deleteCartMutation.mutate(r.cart_id)
                                    }
                                  }}
                                >
                                  {deleteCartMutation.isPending && deleteCartMutation.variables === r.cart_id ? "..." : "Eliminar"}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>

                          {/* Fila expandida con detalle */}
                          {isExpanded && (
                            <TableRow key={`${r.cart_id}-detail`} className="bg-gray-50/50">
                              <TableCell colSpan={11} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                  {/* Info del carrito */}
                                  <div className="space-y-2">
                                    <p className="font-medium text-gray-700 mb-2">Datos del Carrito</p>
                                    <DetailRow label="Cart ID" value={r.cart_id} />
                                    <DetailRow label="Customer ID" value={r.customer_id} />
                                    <DetailRow label="Email" value={r.email} />
                                    <DetailRow label="Paso checkout" value={r.checkout_step || "-"} />
                                    <DetailRow label="Items" value={String(r.items_count)} />
                                    <DetailRow label="Total" value={formatCurrency(r.cart_total)} />
                                    <DetailRow
                                      label="Abandonado"
                                      value={new Date(r.abandoned_at).toLocaleString("es-AR")}
                                    />
                                    {r.recovered && r.recovered_at && (
                                      <DetailRow
                                        label="Recuperado"
                                        value={new Date(r.recovered_at).toLocaleString("es-AR")}
                                      />
                                    )}
                                  </div>

                                  {/* Email 1 timeline */}
                                  <div className="space-y-2">
                                    <p className="font-medium text-gray-700 mb-2">Email 1 — Recordatorio</p>
                                    <TimelineItem
                                      label="Enviado"
                                      date={r.email_1_sent_at}
                                      done={!!r.email_1_sent_at}
                                    />
                                    <TimelineItem
                                      label="Entregado"
                                      date={r.email_1_delivered_at}
                                      done={!!r.email_1_delivered_at}
                                    />
                                    <TimelineItem
                                      label="Abierto"
                                      date={r.email_1_opened_at}
                                      done={!!r.email_1_opened_at}
                                    />
                                    <TimelineItem
                                      label="Click"
                                      date={r.email_1_clicked_at}
                                      done={!!r.email_1_clicked_at}
                                    />
                                    {r.email_1_bounced && (
                                      <div className="flex items-center gap-2 text-red-600">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-xs font-medium">Rebotado</span>
                                      </div>
                                    )}
                                    {r.resend_email_1_id && (
                                      <DetailRow label="Resend ID" value={r.resend_email_1_id} />
                                    )}
                                    {r.has_preview_1 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 mt-2"
                                        onClick={() => setPreviewUrl(`/api/email-proxy/campaigns/abandoned-carts/${r.cart_id}/preview/1`)}
                                      >
                                        Ver Email 1
                                      </Button>
                                    )}
                                  </div>

                                  {/* Email 2 timeline */}
                                  <div className="space-y-2">
                                    <p className="font-medium text-gray-700 mb-2">Email 2 — Cupon</p>
                                    <TimelineItem
                                      label="Enviado"
                                      date={r.email_2_sent_at}
                                      done={!!r.email_2_sent_at}
                                    />
                                    <TimelineItem
                                      label="Entregado"
                                      date={r.email_2_delivered_at}
                                      done={!!r.email_2_delivered_at}
                                    />
                                    <TimelineItem
                                      label="Abierto"
                                      date={r.email_2_opened_at}
                                      done={!!r.email_2_opened_at}
                                    />
                                    <TimelineItem
                                      label="Click"
                                      date={r.email_2_clicked_at}
                                      done={!!r.email_2_clicked_at}
                                    />
                                    {r.email_2_bounced && (
                                      <div className="flex items-center gap-2 text-red-600">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-xs font-medium">Rebotado</span>
                                      </div>
                                    )}
                                    {r.coupon_code && (
                                      <DetailRow label="Cupon" value={r.coupon_code} />
                                    )}
                                    {r.discount_percentage != null && (
                                      <DetailRow
                                        label="Descuento"
                                        value={
                                          r.discount_type === "fixed"
                                            ? `$${r.discount_percentage}`
                                            : `${r.discount_percentage}%`
                                        }
                                      />
                                    )}
                                    {r.promotion_id && (
                                      <DetailRow label="Promotion ID" value={r.promotion_id} />
                                    )}
                                    {r.resend_email_2_id && (
                                      <DetailRow label="Resend ID" value={r.resend_email_2_id} />
                                    )}
                                    {r.has_preview_2 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-7 mt-2"
                                        onClick={() => setPreviewUrl(`/api/email-proxy/campaigns/abandoned-carts/${r.cart_id}/preview/2`)}
                                      >
                                        Ver Email 2
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Acciones en detalle */}
                                <div className="flex gap-2 mt-4 pt-3 border-t">
                                  {!r.recovered && !r.email_1_sent_at && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={forceSendMutation.isPending}
                                      onClick={() => forceSendMutation.mutate({ cart_id: r.cart_id, email_type: "email_1" })}
                                    >
                                      {forceSendMutation.isPending && forceSendMutation.variables?.cart_id === r.cart_id
                                        ? "Enviando..."
                                        : "Enviar Email 1"
                                      }
                                    </Button>
                                  )}
                                  {!r.recovered && r.email_1_sent_at && !r.email_2_sent_at && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={forceSendMutation.isPending}
                                      onClick={() => forceSendMutation.mutate({ cart_id: r.cart_id, email_type: "email_2" })}
                                    >
                                      {forceSendMutation.isPending && forceSendMutation.variables?.cart_id === r.cart_id
                                        ? "Enviando..."
                                        : "Enviar Email 2 (con cupon)"
                                      }
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-500 hover:text-red-700"
                                    disabled={deleteCartMutation.isPending}
                                    onClick={() => {
                                      if (window.confirm(`Eliminar registro de ${r.customer_name || r.email}?`)) {
                                        deleteCartMutation.mutate(r.cart_id)
                                      }
                                    }}
                                  >
                                    Eliminar registro
                                  </Button>
                                </div>

                                {/* Force send feedback */}
                                {forceSendMutation.isSuccess && forceSendMutation.data && forceSendMutation.variables?.cart_id === r.cart_id && (
                                  <p className="text-sm text-green-600 mt-2">
                                    Email ({forceSendMutation.data.email_type}) enviado a {forceSendMutation.data.email}
                                  </p>
                                )}
                                {forceSendMutation.isError && forceSendMutation.variables?.cart_id === r.cart_id && (
                                  <p className="text-sm text-red-600 mt-2">
                                    Error: {forceSendMutation.error?.message}
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginacion */}
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  Pagina {listPage + 1} de {totalListPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setListPage((p) => Math.max(0, p - 1))}
                    disabled={listPage === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setListPage((p) => p + 1)}
                    disabled={listPage + 1 >= totalListPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">
              No se encontraron carritos abandonados con los filtros seleccionados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modal preview de email */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Vista previa del email</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full flex-1 border rounded-md bg-white"
              sandbox="allow-same-origin"
              title="Email preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Componentes auxiliares internos ---

function PipelineStep({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {value}
      </div>
      <span className="text-xs text-gray-500 text-center max-w-[80px]">{label}</span>
    </div>
  )
}

function PipelineArrow() {
  return (
    <span className="text-gray-300 text-lg">→</span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-right break-all">{value}</span>
    </div>
  )
}

function TimelineItem({ label, date, done }: { label: string; date: string | null; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${done ? "bg-green-500" : "bg-gray-300"}`} />
      <span className={`text-xs ${done ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
      {date && (
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(date).toLocaleString("es-AR")}
        </span>
      )}
    </div>
  )
}
