"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { useAllOrders } from "@/hooks/use-orders"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/dashboard/metric-card"
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format"
import { getPaymentStatusLabel, getFulfillmentStatusLabel, getOrderPaymentProvider, getPaymentProviderLabel } from "@/lib/aggregations"
import { exportToCSV, formatDateCSV, formatCurrencyCSV } from "@/lib/export"
import { ExternalLink } from "lucide-react"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"

const MEDUSA_BACKEND_ADMIN_URL = "https://backend.marcelakoury.com/app"

export default function OrdersPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [paymentStatus, setPaymentStatus] = useState("all")
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all")
  const [paymentMethod, setPaymentMethod] = useState("all")
  const [page, setPage] = useState(0)
  const limit = 20

  const { data: allOrders, isLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })

  // Extraer medios de pago únicos para el filtro
  const paymentMethods = useMemo(() => {
    if (!allOrders) return []
    const methods = new Set<string>()
    for (const order of allOrders as any[]) {
      const provider = getOrderPaymentProvider(order)
      if (provider !== "—") methods.add(provider)
    }
    return Array.from(methods).sort()
  }, [allOrders])

  // Filtrado client-side por payment_status, fulfillment_status y medio de pago
  const filteredOrders = useMemo(() => {
    if (!allOrders) return []
    let result = allOrders

    if (paymentStatus !== "all") {
      result = result.filter((o: any) => o.payment_status === paymentStatus)
    }

    if (fulfillmentStatus !== "all") {
      result = result.filter((o: any) => o.fulfillment_status === fulfillmentStatus)
    }

    if (paymentMethod !== "all") {
      result = result.filter((o: any) => getOrderPaymentProvider(o) === paymentMethod)
    }

    return result
  }, [allOrders, paymentStatus, fulfillmentStatus, paymentMethod])

  // Paginación client-side
  const totalCount = filteredOrders.length
  const totalPages = Math.ceil(totalCount / limit)
  const orders = filteredOrders.slice(page * limit, (page + 1) * limit)

  const resetFilters = () => {
    setPaymentStatus("all")
    setFulfillmentStatus("all")
    setPaymentMethod("all")
    setPage(0)
  }

  // Métricas de reembolsos
  const refundMetrics = useMemo(() => {
    if (!allOrders) return { count: 0, amount: 0, rate: "0%" }
    const refunded = (allOrders as any[]).filter(
      (o: any) => o.payment_status === "refunded"
    )
    const count = refunded.length
    const amount = refunded.reduce((s: number, o: any) => s + (o.total || 0), 0)
    const rate = allOrders.length > 0
      ? ((count / allOrders.length) * 100).toFixed(1) + "%"
      : "0%"
    return { count, amount, rate }
  }, [allOrders])

  const handleExportCSV = () => {
    exportToCSV(filteredOrders, [
      { header: "Orden", accessor: (o: any) => `#${o.display_id}` },
      { header: "Fecha", accessor: (o: any) => formatDateCSV(o.created_at) },
      { header: "Email", accessor: (o: any) => o.email },
      { header: "Estado Pago", accessor: (o: any) => getPaymentStatusLabel(o.payment_status || o.status) },
      { header: "Estado Envio", accessor: (o: any) => getFulfillmentStatusLabel(o.fulfillment_status || "unknown") },
      { header: "Medio de Pago", accessor: (o: any) => { const p = getOrderPaymentProvider(o); return p !== "—" ? getPaymentProviderLabel(p) : "—" } },
      { header: "Items", accessor: (o: any) => o.items?.length || 0 },
      { header: "Total", accessor: (o: any) => formatCurrencyCSV(o.total || 0) },
    ], `ordenes_${new Date().toISOString().slice(0, 10)}`)
  }

  return (
    <div>
      <Header title="Órdenes" description="Listado y detalle de órdenes" />
      <div className="p-6 space-y-6">
        {!isLoading && allOrders && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Total Órdenes"
              value={formatNumber(allOrders.length)}
              icon="📦"
            />
            <MetricCard
              title="Reembolsos"
              value={formatNumber(refundMetrics.count)}
              icon="↩️"
            />
            <MetricCard
              title="Tasa de Reembolso"
              value={refundMetrics.rate}
              icon="📊"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center">
          <DateRangePicker value={dateRange} onChange={(r) => { setDateRange(r); setPage(0) }} />

          <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pagos</SelectItem>
              <SelectItem value="captured">Pagado</SelectItem>
              <SelectItem value="authorized">Autorizado</SelectItem>
              <SelectItem value="not_paid">No pagado</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={fulfillmentStatus} onValueChange={(v) => { setFulfillmentStatus(v); setPage(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado de envío" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los envíos</SelectItem>
              <SelectItem value="not_fulfilled">No preparado</SelectItem>
              <SelectItem value="fulfilled">Preparado</SelectItem>
              <SelectItem value="shipped">Enviado</SelectItem>
              <SelectItem value="delivered">Entregado</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPage(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Medio de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los medios</SelectItem>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {getPaymentProviderLabel(method)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(paymentStatus !== "all" || fulfillmentStatus !== "all" || paymentMethod !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{totalCount} órdenes encontradas</span>
          {filteredOrders.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              Exportar CSV
            </Button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Envío</TableHead>
                  <TableHead>Medio de Pago</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.display_id}
                    </TableCell>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.payment_status === "captured" ? "default" : "outline"}>
                        {getPaymentStatusLabel(order.payment_status || order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.fulfillment_status === "delivered" ? "default" : "outline"}>
                        {getFulfillmentStatusLabel(order.fulfillment_status || "unknown")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const provider = getOrderPaymentProvider(order)
                        return provider !== "—" ? (
                          <Badge variant="secondary">{getPaymentProviderLabel(provider)}</Badge>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      })()}
                    </TableCell>
                    <TableCell>{order.items?.length || 0}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`${MEDUSA_BACKEND_ADMIN_URL}/orders/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        <AIInsightWidget
          pageContext="orders"
          metricsBuilder={() => {
            if (!allOrders) return null
            const byPayment: Record<string, number> = {}
            const byFulfillment: Record<string, number> = {}
            for (const o of allOrders as any[]) {
              const ps = o.payment_status || "unknown"
              const fs = o.fulfillment_status || "unknown"
              byPayment[ps] = (byPayment[ps] || 0) + 1
              byFulfillment[fs] = (byFulfillment[fs] || 0) + 1
            }
            const refunded = (allOrders as any[]).filter((o: any) => o.payment_status === "refunded")
            return {
              totalOrdenes: allOrders.length,
              distribucionPago: byPayment,
              distribucionFulfillment: byFulfillment,
              reembolsos: refunded.length,
              montoReembolsado: refunded.reduce((s: number, o: any) => s + (o.total || 0), 0),
              promedioTotal: allOrders.length > 0
                ? (allOrders as any[]).reduce((s: number, o: any) => s + (o.total || 0), 0) / allOrders.length
                : 0,
            }
          }}
          isDataLoading={isLoading}
        />
      </div>
    </div>
  )
}
