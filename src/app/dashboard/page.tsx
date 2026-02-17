"use client"

import { useState, useMemo } from "react"
import { useAllOrders } from "@/hooks/use-orders"
import {
  useAllCustomers,
  useCustomerGroups,
  buildGroupNameMap,
  resolveCustomerGroups,
} from "@/hooks/use-customers"
import {
  useEventStats,
  useEventProducts,
  useEventSearch,
  useEvents,
} from "@/hooks/use-events"
import { useGA4Overview, useGA4Devices } from "@/hooks/use-ga4"
import { useMetaOverview } from "@/hooks/use-meta"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { OrdersByStatus } from "@/components/charts/orders-by-status"
import { TopProducts } from "@/components/charts/top-products"
import { RevenueByGroup } from "@/components/charts/revenue-by-group"
import { CustomerChurnChart } from "@/components/charts/customer-churn-chart"
import { FullJourneyFunnel } from "@/components/charts/full-journey-funnel"
import { MarketingEfficiencyCard } from "@/components/dashboard/marketing-efficiency-card"
import { ProductConversionTable } from "@/components/dashboard/product-conversion-table"
import { SegmentHealthTable } from "@/components/dashboard/segment-health-table"
import { SearchGapsCard } from "@/components/dashboard/search-gaps-card"
import { AbandonmentSummary } from "@/components/dashboard/abandonment-summary"
import {
  aggregateRevenueByDay,
  aggregateByStatus,
  aggregateTopProducts,
  aggregateRevenueByGroup,
  aggregateChurnDistribution,
  calculateMetrics,
  getCustomerMetrics,
} from "@/lib/aggregations"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"
import { AlertsPanel } from "@/components/dashboard/alerts-panel"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DEVICE_COLORS = ["#ff75a8", "#16a34a", "#eab308", "#ef4444"]

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const previousFrom = new Date(dateRange.from)
  const daysDiff =
    (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)
  previousFrom.setDate(previousFrom.getDate() - daysDiff)

  // ── Medusa Orders ──
  const { data: currentOrders, isLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })
  const { data: previousOrders } = useAllOrders({
    from: previousFrom,
    to: dateRange.from,
  })

  // ── Medusa Customers ──
  const { data: allCustomers } = useAllCustomers()
  const { data: customerGroupsData } = useCustomerGroups()

  // ── Events Backend (MongoDB) ──
  const { data: eventStats } = useEventStats(dateRange.from, dateRange.to)
  const { data: eventProducts } = useEventProducts(dateRange.from, dateRange.to)
  const { data: searchData } = useEventSearch(dateRange.from, dateRange.to)

  const fromStr = dateRange.from.toISOString().split("T")[0]
  const toDate = new Date(dateRange.to)
  toDate.setDate(toDate.getDate() + 1)
  const toStr = toDate.toISOString().split("T")[0]

  const { data: abandonedData } = useEvents({
    event: "checkout.abandoned",
    from: fromStr,
    to: toStr,
    limit: 5,
    sort: "desc",
  })

  // ── GA4 ──
  const { data: ga4Overview } = useGA4Overview(dateRange.from, dateRange.to)
  const { data: ga4Devices } = useGA4Devices(dateRange.from, dateRange.to)

  // ── Meta Ads ──
  const { data: metaOverview } = useMetaOverview(dateRange.from, dateRange.to)

  // ══════════════════════════════════════
  // COMPUTACIONES
  // ══════════════════════════════════════

  const groupNameMap = useMemo(() => {
    if (!customerGroupsData?.customer_groups) return new Map<string, string>()
    return buildGroupNameMap(customerGroupsData.customer_groups)
  }, [customerGroupsData])

  const resolvedCustomers = useMemo(() => {
    if (!allCustomers) return []
    return resolveCustomerGroups(allCustomers, groupNameMap)
  }, [allCustomers, groupNameMap])

  const enrichedCustomers = useMemo(() => {
    if (!resolvedCustomers.length || !currentOrders) return []
    return getCustomerMetrics(resolvedCustomers, currentOrders)
  }, [resolvedCustomers, currentOrders])

  const metrics = useMemo(() => {
    if (!currentOrders) return null
    return calculateMetrics(currentOrders, previousOrders || [])
  }, [currentOrders, previousOrders])

  const revenueByDay = useMemo(
    () => aggregateRevenueByDay(currentOrders || []),
    [currentOrders]
  )
  const byStatus = useMemo(
    () => aggregateByStatus(currentOrders || []),
    [currentOrders]
  )
  const topProducts = useMemo(
    () => aggregateTopProducts(currentOrders || []),
    [currentOrders]
  )
  const revenueByGroup = useMemo(
    () => aggregateRevenueByGroup(currentOrders || [], resolvedCustomers),
    [currentOrders, resolvedCustomers]
  )
  const churnDistribution = useMemo(
    () => aggregateChurnDistribution(enrichedCustomers),
    [enrichedCustomers]
  )

  // ── Métricas cruzadas ──

  const crossMetrics = useMemo(() => {
    const productViews = eventStats?.by_type?.["product.viewed"] || 0
    const checkoutsStarted = eventStats?.by_type?.["checkout.started"] || 0
    const checkoutsAbandoned = eventStats?.by_type?.["checkout.abandoned"] || 0
    const paidOrders = metrics?.paidOrders || 0
    const totalRevenue = metrics?.totalRevenue || 0
    const metaSpend = metaOverview?.spend || 0

    return {
      realRoas: metaSpend > 0 ? totalRevenue / metaSpend : 0,
      costPerSale: paidOrders > 0 && metaSpend > 0 ? metaSpend / paidOrders : 0,
      abandonRate: checkoutsStarted > 0
        ? ((checkoutsAbandoned / checkoutsStarted) * 100).toFixed(1)
        : "0.0",
      viewToSaleRate: productViews > 0
        ? ((paidOrders / productViews) * 100).toFixed(2)
        : "0.00",
      productViews,
      checkoutsStarted,
      checkoutsAbandoned,
    }
  }, [eventStats, metrics, metaOverview])

  // ── Embudo completo (journey) ──

  const journeySteps = useMemo(() => {
    const steps = []
    if (ga4Overview?.sessions) {
      steps.push({ name: "Sesiones Web", count: ga4Overview.sessions, source: "GA4" })
    }
    if (eventStats?.by_type?.["product.viewed"]) {
      steps.push({ name: "Productos Vistos", count: eventStats.by_type["product.viewed"], source: "Events" })
    }
    if (eventStats?.by_type?.["product.added_to_cart"]) {
      steps.push({ name: "Agregado al Carrito", count: eventStats.by_type["product.added_to_cart"], source: "Events" })
    }
    if (eventStats?.by_type?.["checkout.started"]) {
      steps.push({ name: "Checkout Iniciado", count: eventStats.by_type["checkout.started"], source: "Events" })
    }
    if (eventStats?.by_type?.["order.placed"]) {
      steps.push({ name: "Orden Realizada", count: eventStats.by_type["order.placed"], source: "Events" })
    }
    if (metrics?.paidOrders) {
      steps.push({ name: "Pago Capturado", count: metrics.paidOrders, source: "Medusa" })
    }
    if (currentOrders) {
      const shipped = (currentOrders as any[]).filter(
        (o: any) => ["shipped", "delivered"].includes(o.fulfillment_status)
      ).length
      const delivered = (currentOrders as any[]).filter(
        (o: any) => o.fulfillment_status === "delivered"
      ).length
      if (shipped > 0) steps.push({ name: "Enviado", count: shipped, source: "Medusa" })
      if (delivered > 0) steps.push({ name: "Entregado", count: delivered, source: "Medusa" })
    }
    return steps
  }, [ga4Overview, eventStats, metrics, currentOrders])

  // ── Productos cruzados (events + orders) ──

  const productConversionData = useMemo(() => {
    if (!eventProducts?.products || !topProducts.length) return []

    // Indexar por product_id para cruce directo (no por nombre)
    const orderProductMap = new Map<string, { revenue: number; quantity: number }>()
    for (const p of topProducts) {
      orderProductMap.set(p.product_id, { revenue: p.revenue, quantity: p.quantity })
    }

    return eventProducts.products.map((ep) => {
      const orderData = orderProductMap.get(ep.product_id) || { revenue: 0, quantity: 0 }
      return {
        name: ep.title || ep.product_id,
        views: ep.views,
        clicks: ep.clicks,
        addedToCart: ep.added_to_cart,
        actualSold: orderData.quantity,
        actualRevenue: orderData.revenue,
        viewToSaleRate: ep.views > 0
          ? ((orderData.quantity / ep.views) * 100).toFixed(1) + "%"
          : "0%",
        opportunityScore: ep.views > 0 ? ep.views - orderData.quantity : 0,
      }
    }).sort((a, b) => b.views - a.views)
  }, [eventProducts, topProducts])

  // ── Salud por segmento ──

  const segmentHealth = useMemo(() => {
    if (!enrichedCustomers.length) return []

    const segments = new Map<string, {
      customers: number
      withOrders: number
      repeat: number
      atRisk: number
      totalRevenue: number
    }>()

    for (const c of enrichedCustomers) {
      const group = (c as any).metadata?.customer_group_resolved || "Minorista"
      const seg = segments.get(group) || { customers: 0, withOrders: 0, repeat: 0, atRisk: 0, totalRevenue: 0 }
      seg.customers++
      if ((c as any).orderCount > 0) seg.withOrders++
      if ((c as any).orderCount > 1) seg.repeat++
      if ((c as any).daysSinceLastOrder !== null && (c as any).daysSinceLastOrder > 60) seg.atRisk++
      seg.totalRevenue += (c as any).totalSpent || 0
      segments.set(group, seg)
    }

    return Array.from(segments.entries()).map(([group, data]) => {
      const revenueData = revenueByGroup.find((r) => r.group === group)
      return {
        group,
        ...data,
        avgLtv: data.withOrders > 0 ? data.totalRevenue / data.withOrders : 0,
        periodRevenue: revenueData?.revenue || 0,
        retentionRate: data.withOrders > 0
          ? ((data.repeat / data.withOrders) * 100).toFixed(1) + "%"
          : "0%",
        riskRate: data.customers > 0
          ? ((data.atRisk / data.customers) * 100).toFixed(1) + "%"
          : "0%",
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)
  }, [enrichedCustomers, revenueByGroup])

  // ── Búsquedas ──

  const searchInsights = useMemo(() => {
    if (!searchData) return null
    const totalNoResults = searchData.no_results?.reduce((s, sr) => s + sr.count, 0) || 0
    const totalSearches = searchData.top_searches?.reduce((s, sr) => s + sr.count, 0) || 0
    const total = totalSearches + totalNoResults
    return {
      noResultsRate: total > 0 ? ((totalNoResults / total) * 100).toFixed(1) : "0",
      topMissing: searchData.no_results?.slice(0, 8) || [],
      topSearches: searchData.top_searches?.slice(0, 8) || [],
    }
  }, [searchData])

  // ── Abandonos ──

  const abandonmentData = useMemo(() => {
    const count = crossMetrics.checkoutsAbandoned
    const events = abandonedData?.events || []
    const estimatedValue = events.reduce((sum, e) => {
      const total = (e.data?.total as number) || 0
      return sum + total
    }, 0)
    return { count, rate: crossMetrics.abandonRate, estimatedValue, events }
  }, [crossMetrics, abandonedData])

  // ── Alertas cruzadas ──

  const alerts = useMemo(() => {
    const list: { type: "critical" | "warning" | "info"; message: string }[] = []

    const critical = enrichedCustomers.filter(
      (c) => (c as any).daysSinceLastOrder !== null && (c as any).daysSinceLastOrder > 90
    ).length
    if (critical > 0) {
      list.push({ type: "critical", message: `${critical} clientes en riesgo crítico (90+ días sin comprar)` })
    }

    if (metaOverview?.spend > 0 && metrics && crossMetrics.realRoas < 1) {
      list.push({
        type: "critical",
        message: `ROAS negativo: gastás ${formatCurrency(metaOverview.spend)} en Meta pero generás ${formatCurrency(metrics.totalRevenue)} (${crossMetrics.realRoas.toFixed(2)}x)`,
      })
    }

    if (currentOrders) {
      const refunded = (currentOrders as any[]).filter((o: any) => o.payment_status === "refunded").length
      if (refunded > 0) {
        list.push({ type: "warning", message: `${refunded} reembolsos en el período seleccionado` })
      }
    }

    if (parseFloat(crossMetrics.abandonRate) > 30) {
      list.push({
        type: "warning",
        message: `Tasa de abandono de checkout alta: ${crossMetrics.abandonRate}%`,
      })
    }

    if (searchInsights && parseFloat(searchInsights.noResultsRate) > 15) {
      list.push({
        type: "warning",
        message: `${searchInsights.noResultsRate}% de búsquedas sin resultados (demanda no satisfecha)`,
      })
    }

    if (metrics && metrics.totalOrders > 0) {
      const rate = (metrics.paidOrders / metrics.totalOrders) * 100
      if (rate < 50) {
        list.push({ type: "warning", message: `Tasa de conversión de pago baja: ${rate.toFixed(1)}%` })
      }
    }

    return list
  }, [enrichedCustomers, currentOrders, metrics, metaOverview, crossMetrics, searchInsights])

  // ── Devices chart data ──

  const deviceChartData = useMemo(() => {
    if (!ga4Devices) return []
    return (ga4Devices as any[]).map((d: any) => ({
      name: d.device === "desktop" ? "Escritorio" : d.device === "mobile" ? "Móvil" : d.device === "tablet" ? "Tablet" : d.device,
      value: d.sessions,
    }))
  }, [ga4Devices])

  return (
    <div>
      <Header
        title="Comando Central"
        description="Vista unificada — Ventas, Marketing, Comportamiento y Clientes"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {isLoading || !metrics ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[120px]" />
              ))}
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        ) : (
          <>
            {/* ── SECCIÓN 0: Alertas ── */}
            <AlertsPanel alerts={alerts} />

            {/* ── SECCIÓN 1: KPIs Ejecutivos ── */}
            {/* Fila 1: Ventas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Ingresos (Pagados)"
                value={formatCurrency(metrics.totalRevenue)}
                change={formatPercent(metrics.revenueChange)}
                changeType={metrics.revenueChange >= 0 ? "positive" : "negative"}
                icon="💰"
              />
              <MetricCard
                title="Ventas Concretadas"
                value={formatNumber(metrics.paidOrders)}
                change={formatPercent(metrics.paidOrdersChange)}
                changeType={metrics.paidOrdersChange >= 0 ? "positive" : "negative"}
                icon="✅"
              />
              <MetricCard
                title="Ticket Promedio"
                value={formatCurrency(metrics.aov)}
                change={formatPercent(metrics.aovChange)}
                changeType={metrics.aovChange >= 0 ? "positive" : "negative"}
                icon="🧾"
              />
              <MetricCard
                title="Clientes Únicos"
                value={formatNumber(metrics.uniqueCustomers)}
                change={formatPercent(metrics.customersChange)}
                changeType={metrics.customersChange >= 0 ? "positive" : "negative"}
                icon="👥"
              />
              <MetricCard
                title="ROAS Real"
                value={crossMetrics.realRoas > 0 ? `${crossMetrics.realRoas.toFixed(2)}x` : "—"}
                changeType={crossMetrics.realRoas >= 1 ? "positive" : crossMetrics.realRoas > 0 ? "negative" : "neutral"}
                icon="🎯"
              />
            </div>

            {/* Fila 2: Tráfico y Marketing */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Sesiones GA4"
                value={ga4Overview?.sessions ? formatNumber(ga4Overview.sessions) : "—"}
                icon="🌐"
              />
              <MetricCard
                title="Tasa de Rebote"
                value={ga4Overview?.bounceRate != null ? `${(ga4Overview.bounceRate * 100).toFixed(1)}%` : "—"}
                icon="↩️"
              />
              <MetricCard
                title="Gasto Meta Ads"
                value={metaOverview?.spend ? formatCurrency(metaOverview.spend) : "—"}
                icon="📢"
              />
              <MetricCard
                title="Costo por Venta"
                value={crossMetrics.costPerSale > 0 ? formatCurrency(crossMetrics.costPerSale) : "—"}
                changeType={crossMetrics.costPerSale > 0 && metrics.aov > 0 && crossMetrics.costPerSale < metrics.aov ? "positive" : crossMetrics.costPerSale > 0 ? "negative" : "neutral"}
                icon="💸"
              />
            </div>

            {/* Fila 3: Comportamiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Productos Vistos"
                value={formatNumber(crossMetrics.productViews)}
                icon="👀"
              />
              <MetricCard
                title="Checkouts Iniciados"
                value={formatNumber(crossMetrics.checkoutsStarted)}
                icon="🛒"
              />
              <MetricCard
                title="Tasa Abandono"
                value={`${crossMetrics.abandonRate}%`}
                changeType={parseFloat(crossMetrics.abandonRate) > 30 ? "negative" : parseFloat(crossMetrics.abandonRate) > 0 ? "positive" : "neutral"}
                icon="🚪"
              />
              <MetricCard
                title="Conv. Vista→Compra"
                value={`${crossMetrics.viewToSaleRate}%`}
                changeType={parseFloat(crossMetrics.viewToSaleRate) > 1 ? "positive" : "negative"}
                icon="🔄"
              />
            </div>

            {/* ── SECCIÓN 2: Viaje del Cliente ── */}
            {journeySteps.length >= 3 && (
              <FullJourneyFunnel steps={journeySteps} />
            )}

            {/* ── SECCIÓN 3: Ingresos + Marketing ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RevenueChart data={revenueByDay} />
              </div>
              <MarketingEfficiencyCard
                metaSpend={metaOverview?.spend}
                metaRoas={metaOverview?.roas}
                metaCtr={metaOverview?.ctr}
                metaCpc={metaOverview?.cpc}
                metaImpressions={metaOverview?.impressions}
                metaClicks={metaOverview?.clicks}
                realRevenue={metrics.totalRevenue}
                paidOrders={metrics.paidOrders}
              />
            </div>

            {/* ── SECCIÓN 4: Productos — Vistas vs Ventas ── */}
            <TopProducts data={topProducts} />
            {productConversionData.length > 0 && (
              <ProductConversionTable data={productConversionData} />
            )}

            {/* ── SECCIÓN 5: Salud de Clientes ── */}
            {segmentHealth.length > 0 && (
              <SegmentHealthTable data={segmentHealth} />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueByGroup data={revenueByGroup} />
              <CustomerChurnChart data={churnDistribution} />
            </div>

            {/* ── SECCIÓN 6: Oportunidades Perdidas ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AbandonmentSummary
                abandonedCount={abandonmentData.count}
                abandonRate={abandonmentData.rate}
                estimatedLostValue={abandonmentData.estimatedValue}
                recentAbandoned={abandonmentData.events}
              />
              {searchInsights ? (
                <SearchGapsCard
                  topSearches={searchInsights.topSearches}
                  noResults={searchInsights.topMissing}
                  noResultsRate={searchInsights.noResultsRate}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">🔍 Búsquedas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">Cargando datos de búsquedas...</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* ── SECCIÓN 7: Dispositivos + Estado Órdenes ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {deviceChartData.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📱 Dispositivos (GA4)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={deviceChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {deviceChartData.map((_: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">📱 Dispositivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400">Configurá GA4 para ver datos de dispositivos</p>
                  </CardContent>
                </Card>
              )}
              <OrdersByStatus data={byStatus} />
            </div>

            {currentOrders && (currentOrders as any[]).length > 0 && (
              <RecentOrders orders={currentOrders as any[]} />
            )}

            {/* ── SECCIÓN 8: AI Insight ── */}
            <AIInsightWidget
              pageContext="unified"
              metricsBuilder={() => {
                if (!metrics) return null
                return {
                  ingresos: metrics.totalRevenue,
                  cambioIngresos: metrics.revenueChange,
                  ordenesPagadas: metrics.paidOrders,
                  totalOrdenes: metrics.totalOrders,
                  ticketPromedio: metrics.aov,
                  clientesUnicos: metrics.uniqueCustomers,
                  topProductos: topProducts.slice(0, 10),
                  productosConversion: productConversionData?.slice(0, 10),
                  saludSegmentos: segmentHealth,
                  distribucionChurn: churnDistribution,
                  gastoMeta: metaOverview?.spend,
                  roasReportado: metaOverview?.roas,
                  roasReal: crossMetrics.realRoas,
                  costoPorVenta: crossMetrics.costPerSale,
                  embudo: {
                    sesionesGA4: ga4Overview?.sessions,
                    productosVistos: crossMetrics.productViews,
                    checkoutsIniciados: crossMetrics.checkoutsStarted,
                    pagosConcretados: metrics.paidOrders,
                  },
                  abandonos: {
                    tasa: crossMetrics.abandonRate,
                    valor: abandonmentData.estimatedValue,
                    count: abandonmentData.count,
                  },
                  busquedasSinResultados: searchData?.no_results?.slice(0, 10),
                }
              }}
              isDataLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  )
}
