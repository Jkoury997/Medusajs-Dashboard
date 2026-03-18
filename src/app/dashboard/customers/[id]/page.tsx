"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"
import { useCustomerOrders } from "@/hooks/use-customers"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { formatCurrency, formatDate, daysSince } from "@/lib/format"
import { getWhatsAppUrl, getWhatsAppMessageType } from "@/lib/whatsapp"
import { getPaymentStatusLabel, getFulfillmentStatusLabel } from "@/lib/aggregations"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  DollarSign,
  Package,
  Receipt,
  Clock,
  Mail,
  Phone,
  Building2,
  CreditCard,
  CalendarDays,
  Users,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
} from "lucide-react"

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/customers/${id}`)
      return response as { customer: any }
    },
  })

  const { data: ordersData, isLoading: ordersLoading } = useCustomerOrders(id)

  const rawCustomer = customerData?.customer
  const orders = ordersData?.orders || []
  const isLoading = customerLoading || ordersLoading

  const customer = rawCustomer
    ? {
        ...rawCustomer,
        phone:
          rawCustomer.phone ||
          orders.find((o: any) => o.shipping_address?.phone)?.shipping_address?.phone ||
          null,
      }
    : rawCustomer

  // Metrics
  const paidOrders = useMemo(
    () => orders.filter((o: any) => o.payment_status === "captured"),
    [orders]
  )
  const totalSpent = paidOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const avgOrderValue = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0
  const lastOrderDate = orders.length > 0 ? orders[0].created_at : null
  const daysSinceLastOrder = lastOrderDate ? daysSince(lastOrderDate) : null

  // Frequency: average days between orders
  const avgDaysBetweenOrders = useMemo(() => {
    if (paidOrders.length < 2) return null
    const dates = paidOrders.map((o: any) => new Date(o.created_at).getTime()).sort((a: number, b: number) => a - b)
    let totalDiff = 0
    for (let i = 1; i < dates.length; i++) {
      totalDiff += dates[i] - dates[i - 1]
    }
    return Math.round(totalDiff / (dates.length - 1) / (1000 * 60 * 60 * 24))
  }, [paidOrders])

  // Top products
  const topProducts = useMemo(() => {
    const productFrequency = new Map<string, { name: string; count: number; revenue: number }>()
    for (const order of orders) {
      if (!order.items) continue
      for (const item of order.items) {
        const key = item.product_id || item.title
        const existing = productFrequency.get(key) || {
          name: item.product_title || item.title,
          count: 0,
          revenue: 0,
        }
        existing.count += item.quantity || 0
        existing.revenue += item.total || 0
        productFrequency.set(key, existing)
      }
    }
    return Array.from(productFrequency.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [orders])

  // Churn status
  const churnStatus = useMemo(() => {
    if (daysSinceLastOrder === null) return { label: "Sin compras", color: "gray", icon: XCircle }
    if (daysSinceLastOrder <= 30) return { label: "Activo", color: "green", icon: CheckCircle2 }
    if (daysSinceLastOrder <= 60) return { label: "Alerta", color: "yellow", icon: Clock }
    if (daysSinceLastOrder <= 90) return { label: "En Riesgo", color: "orange", icon: AlertTriangle }
    return { label: "Crítico", color: "red", icon: AlertTriangle }
  }, [daysSinceLastOrder])

  if (isLoading) {
    return (
      <div>
        <Header title="Detalle de Cliente" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = churnStatus.icon

  return (
    <div>
      <Header
        title={`${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() || "Cliente"}
        description={customer?.email}
      />
      <div className="p-6 space-y-6">
        {/* Navigation */}
        <div className="flex flex-wrap gap-3 items-center">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          </Link>

          {customer?.phone && (
            <a
              href={getWhatsAppUrl({
                phone: customer.phone,
                firstName: customer.first_name || "",
                orderCount: orders.length,
                daysSinceLastOrder,
                totalSpent,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ({getWhatsAppMessageType(orders.length, daysSinceLastOrder)})
              </Button>
            </a>
          )}

          {/* Churn status badge */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            churnStatus.color === "green" && "bg-green-50 text-green-700",
            churnStatus.color === "yellow" && "bg-yellow-50 text-yellow-700",
            churnStatus.color === "orange" && "bg-orange-50 text-orange-700",
            churnStatus.color === "red" && "bg-red-50 text-red-700",
            churnStatus.color === "gray" && "bg-gray-50 text-gray-600",
          )}>
            <StatusIcon className="w-4 h-4" />
            {churnStatus.label}
            {daysSinceLastOrder !== null && (
              <span className="text-xs opacity-75">({daysSinceLastOrder}d)</span>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Lifetime Value"
            value={formatCurrency(totalSpent)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Órdenes"
            value={`${paidOrders.length}`}
            subtitle={orders.length !== paidOrders.length ? `${orders.length} total` : undefined}
            icon={Package}
            color="blue"
          />
          <StatCard
            title="Ticket Promedio"
            value={formatCurrency(avgOrderValue)}
            icon={Receipt}
            color="green"
          />
          <StatCard
            title="Frecuencia"
            value={avgDaysBetweenOrders !== null ? `${avgDaysBetweenOrders}d` : "N/A"}
            subtitle={avgDaysBetweenOrders !== null ? "entre compras" : "1 sola compra"}
            icon={TrendingUp}
            color="amber"
          />
          <StatCard
            title="Última Compra"
            value={daysSinceLastOrder !== null ? `${daysSinceLastOrder}d` : "Nunca"}
            subtitle={lastOrderDate ? formatDate(lastOrderDate) : undefined}
            icon={CalendarDays}
            color={daysSinceLastOrder !== null && daysSinceLastOrder > 60 ? "red" : "blue"}
          />
        </div>

        {/* Info + Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Info */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                <InfoRow icon={Users} label="Nombre" value={`${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() || "-"} />
                <InfoRow icon={Mail} label="Email" value={customer?.email || "-"} />
                <InfoRow
                  icon={Phone}
                  label="Teléfono"
                  value={customer?.phone || "-"}
                  extra={customer?.phone ? (
                    <a
                      href={getWhatsAppUrl({
                        phone: customer.phone,
                        firstName: customer.first_name || "",
                        orderCount: orders.length,
                        daysSinceLastOrder,
                        totalSpent,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                      title="Enviar WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  ) : undefined}
                />
                <InfoRow icon={Building2} label="Empresa" value={customer?.company_name || "-"} />
                <InfoRow icon={CreditCard} label="DNI" value={customer?.metadata?.dni || "-"} />
                <InfoRow icon={CalendarDays} label="Registrado" value={customer?.created_at ? formatDate(customer.created_at) : "-"} />
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    Grupo
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {customer?.metadata?.customer_group
                      ? customer.metadata.customer_group.charAt(0).toUpperCase() +
                        customer.metadata.customer_group.slice(1)
                      : "Minorista"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-gray-500" />
                Productos Más Comprados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <ShoppingBag className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Sin compras registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
                        i === 0 ? "bg-amber-50 text-amber-600" :
                        i === 1 ? "bg-gray-100 text-gray-500" :
                        i === 2 ? "bg-orange-50 text-orange-500" :
                        "bg-gray-50 text-gray-400"
                      )}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">{p.count} unidades</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-500" />
              Historial de Órdenes
              <span className="text-sm font-normal text-gray-400">({orders.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Envío</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center text-gray-400">
                        <Package className="w-10 h-10 mb-2 opacity-50" />
                        <p className="text-sm">Sin órdenes registradas</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => {
                    const isPaid = order.payment_status === "captured"
                    const isDelivered = order.fulfillment_status === "delivered"

                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm font-medium">
                          #{order.display_id}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-xs gap-1",
                              isPaid
                                ? "bg-green-50 text-green-700 hover:bg-green-50 border border-green-200"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-50 border border-gray-200"
                            )}
                          >
                            {isPaid ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {getPaymentStatusLabel(order.payment_status || order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "text-xs gap-1",
                              isDelivered
                                ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-50 border border-gray-200"
                            )}
                          >
                            {isDelivered ? (
                              <Truck className="w-3 h-3" />
                            ) : (
                              <Package className="w-3 h-3" />
                            )}
                            {getFulfillmentStatusLabel(order.fulfillment_status || "unknown")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {order.items?.length || 0} items
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.total || 0)}
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

// ============================================================
// HELPER COMPONENTS
// ============================================================

const STAT_COLORS = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  amber: "bg-amber-50 text-amber-600",
  purple: "bg-purple-50 text-purple-600",
} as const

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  color: keyof typeof STAT_COLORS
}) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={cn("p-2 rounded-lg", STAT_COLORS[color])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
  extra,
}: {
  icon: React.ElementType
  label: string
  value: string
  extra?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
        {value}
        {extra}
      </div>
    </div>
  )
}
