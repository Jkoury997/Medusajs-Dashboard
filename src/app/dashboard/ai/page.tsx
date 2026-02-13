"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { useAllOrders } from "@/hooks/use-orders"
import { useAllCustomers, useCustomerGroups, buildGroupNameMap, resolveCustomerGroups } from "@/hooks/use-customers"
import { useAIRecommendations } from "@/hooks/use-ai-recommendations"
import {
  calculateMetrics,
  aggregateTopProducts,
  aggregateRevenueByGroup,
  getCustomerMetrics,
} from "@/lib/aggregations"
import { formatCurrency } from "@/lib/format"

export default function AIPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [provider, setProvider] = useState<"anthropic" | "openai">("openai")
  const [history, setHistory] = useState<
    { date: string; provider: string; content: string }[]
  >([])

  const { data: orders, isLoading: ordersLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })
  const { data: customers, isLoading: customersLoading } = useAllCustomers()
  const { data: customerGroupsData } = useCustomerGroups()
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const aiMutation = useAIRecommendations()

  // Resolver grupos de clientes
  const groupNameMap = useMemo(() => {
    if (!customerGroupsData?.customer_groups) return new Map<string, string>()
    return buildGroupNameMap(customerGroupsData.customer_groups)
  }, [customerGroupsData])

  const resolvedCustomers = useMemo(() => {
    if (!customers) return []
    return resolveCustomerGroups(customers, groupNameMap)
  }, [customers, groupNameMap])

  const previousFrom = new Date(dateRange.from)
  const daysDiff =
    (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
  previousFrom.setDate(previousFrom.getDate() - daysDiff)

  const { data: previousOrders } = useAllOrders({
    from: previousFrom,
    to: dateRange.from,
  })

  const metricsContext = useMemo(() => {
    if (!orders || !customers) return null

    const salesMetrics = calculateMetrics(orders, previousOrders || [])
    const topProducts = aggregateTopProducts(orders).slice(0, 10)
    const customerMetrics = getCustomerMetrics(resolvedCustomers, orders)

    const totalCustomers = customerMetrics.length
    const withOrders = customerMetrics.filter((c) => c.orderCount > 0).length
    const repeatCustomers = customerMetrics.filter((c) => c.orderCount > 1).length
    const atRisk = customerMetrics.filter(
      (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60
    ).length
    const avgLtv =
      withOrders > 0
        ? customerMetrics
            .filter((c) => c.orderCount > 0)
            .reduce((s, c) => s + c.totalSpent, 0) / withOrders
        : 0

    const churnByDays = {
      "0-30": customerMetrics.filter(
        (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder <= 30
      ).length,
      "31-60": customerMetrics.filter(
        (c) =>
          c.daysSinceLastOrder !== null &&
          c.daysSinceLastOrder > 30 &&
          c.daysSinceLastOrder <= 60
      ).length,
      "61-90": customerMetrics.filter(
        (c) =>
          c.daysSinceLastOrder !== null &&
          c.daysSinceLastOrder > 60 &&
          c.daysSinceLastOrder <= 90
      ).length,
      "90+": customerMetrics.filter(
        (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 90
      ).length,
    }

    // Distribución por grupo de cliente
    const revenueByGroup = aggregateRevenueByGroup(orders, resolvedCustomers)
    const groupDistribution: Record<string, { clientes: number; ingresos: number; ordenes: number }> = {}
    const customersByGroup = new Map<string, number>()
    for (const c of customerMetrics) {
      const group = c.metadata?.customer_group_resolved || "Minorista"
      customersByGroup.set(group, (customersByGroup.get(group) || 0) + 1)
    }
    for (const g of revenueByGroup) {
      groupDistribution[g.group] = {
        clientes: customersByGroup.get(g.group) || 0,
        ingresos: g.revenue,
        ordenes: g.orders,
      }
    }
    // Agregar grupos que no tienen ingresos pero sí clientes
    for (const [group, count] of customersByGroup) {
      if (!groupDistribution[group]) {
        groupDistribution[group] = { clientes: count, ingresos: 0, ordenes: 0 }
      }
    }

    // Tasa de conversión de pagos
    const paidOrders = orders.filter((o: any) => o.payment_status === "captured").length
    const tasaConversionPago = orders.length > 0
      ? `${((paidOrders / orders.length) * 100).toFixed(1)}%`
      : "0%"

    // Top 5 clientes en riesgo (con más gasto que no compran hace tiempo)
    const topRiskCustomers = customerMetrics
      .filter((c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60 && c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map((c) => ({
        nombre: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
        grupo: c.metadata?.customer_group_resolved || "Minorista",
        totalGastado: c.totalSpent,
        diasSinComprar: c.daysSinceLastOrder,
        ordenes: c.orderCount,
      }))

    return {
      periodo: `${dateRange.from.toLocaleDateString("es-AR")} - ${dateRange.to.toLocaleDateString("es-AR")}`,
      ventas: {
        ingresosTotales: salesMetrics.totalRevenue,
        ordenesPagadas: salesMetrics.paidOrders,
        ordenesTotales: salesMetrics.totalOrders,
        ticketPromedio: salesMetrics.aov,
        tasaConversionPago,
        cambioIngresos: `${salesMetrics.revenueChange.toFixed(1)}%`,
        cambioOrdenes: `${salesMetrics.ordersChange.toFixed(1)}%`,
        cambioTicketPromedio: `${salesMetrics.aovChange.toFixed(1)}%`,
      },
      topProductos: topProducts.map((p) => ({
        nombre: p.name,
        ingresos: p.revenue,
        unidades: p.quantity,
      })),
      distribucionPorGrupo: groupDistribution,
      clientes: {
        total: totalCustomers,
        conCompras: withOrders,
        recurrentes: repeatCustomers,
        tasaRecurrencia:
          withOrders > 0
            ? `${((repeatCustomers / withOrders) * 100).toFixed(1)}%`
            : "0%",
        enRiesgo: atRisk,
        ltvPromedio: avgLtv,
        distribucionChurn: churnByDays,
      },
      clientesEnRiesgoTop: topRiskCustomers,
    }
  }, [orders, customers, resolvedCustomers, previousOrders, dateRange])

  const handleGenerate = () => {
    if (!metricsContext) return

    aiMutation.mutate(
      { metrics: metricsContext, provider },
      {
        onSuccess: (content) => {
          setHistory((prev) => [
            {
              date: new Date().toLocaleString("es-AR"),
              provider,
              content,
            },
            ...prev,
          ])
        },
      }
    )
  }

  const isDataLoading = ordersLoading || customersLoading

  return (
    <div>
      <Header
        title="AI Insights"
        description="Recomendaciones inteligentes basadas en tus datos"
      />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-4 items-center">
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <Select
            value={provider}
            onValueChange={(v) => setProvider(v as "anthropic" | "openai")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
              <SelectItem value="openai">GPT-4 (OpenAI)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleGenerate}
            disabled={isDataLoading || aiMutation.isPending || !metricsContext}
          >
            {aiMutation.isPending
              ? "Analizando..."
              : isDataLoading
                ? "Cargando datos..."
                : "Generar Análisis"}
          </Button>
        </div>

        {metricsContext && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Datos que se enviarán al análisis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Ingresos (Pagados)</p>
                  <p className="font-medium">
                    {formatCurrency(metricsContext.ventas.ingresosTotales)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Órdenes Pagadas</p>
                  <p className="font-medium">
                    {metricsContext.ventas.ordenesPagadas}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Total Órdenes</p>
                  <p className="font-medium">
                    {metricsContext.ventas.ordenesTotales}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ticket Promedio</p>
                  <p className="font-medium">
                    {formatCurrency(metricsContext.ventas.ticketPromedio)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Conv. Pago</p>
                  <p className="font-medium">
                    {metricsContext.ventas.tasaConversionPago}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cambio Ingresos</p>
                  <p className="font-medium">
                    {metricsContext.ventas.cambioIngresos}
                  </p>
                </div>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs text-gray-400 font-medium mb-2">CLIENTES</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium">{metricsContext.clientes.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Con Compras</p>
                    <p className="font-medium">{metricsContext.clientes.conCompras}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Recurrentes</p>
                    <p className="font-medium">{metricsContext.clientes.recurrentes}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tasa Recurrencia</p>
                    <p className="font-medium">{metricsContext.clientes.tasaRecurrencia}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">En Riesgo (60d+)</p>
                    <p className="font-medium text-red-600">{metricsContext.clientes.enRiesgo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">LTV Promedio</p>
                    <p className="font-medium">{formatCurrency(metricsContext.clientes.ltvPromedio)}</p>
                  </div>
                </div>
              </div>
              {Object.keys(metricsContext.distribucionPorGrupo).length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-400 font-medium mb-2">INGRESOS POR GRUPO</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
                    {Object.entries(metricsContext.distribucionPorGrupo).map(([group, data]) => (
                      <div key={group} className="bg-gray-50 rounded px-3 py-2">
                        <p className="text-gray-500 text-xs">{group}</p>
                        <p className="font-medium">{formatCurrency(data.ingresos)}</p>
                        <p className="text-xs text-gray-400">{data.clientes} clientes · {data.ordenes} órdenes</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {aiMutation.isPending && (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardContent>
          </Card>
        )}

        {aiMutation.isError && (
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              Error: {aiMutation.error.message}. Verificá que las API keys
              estén configuradas en .env.local
            </CardContent>
          </Card>
        )}

        {history.map((entry, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">
                  Análisis - {entry.date}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(entry.content)
                      setCopiedIndex(i)
                      setTimeout(() => setCopiedIndex(null), 2000)
                    }}
                  >
                    {copiedIndex === i ? "Copiado!" : "Copiar"}
                  </Button>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {entry.provider === "anthropic" ? "Claude" : "GPT-4"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: markdownToHtml(entry.content),
                }}
              />
            </CardContent>
          </Card>
        ))}

        {!aiMutation.isPending && history.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p className="text-lg mb-2">
                Hacé click en &quot;Generar Análisis&quot; para obtener
                recomendaciones AI
              </p>
              <p className="text-sm">
                Se analizarán tus métricas de ventas, clientes y productos
                para generar insights accionables
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-6 mb-3">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(new RegExp("(<li.*</li>)", "s"), '<ul class="list-disc space-y-1">$1</ul>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
}
