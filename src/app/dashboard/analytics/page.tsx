"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"
import { ConversionFunnel } from "@/components/charts/conversion-funnel"
import {
  useEventStats,
  useEventFunnel,
  useEventProducts,
  useEventSearch,
  useEvents,
  useHeatmap,
  buildHeatmapHtmlUrl,
  useScrollDepth,
  useProductVisibility,
} from "@/hooks/use-events"
import { formatNumber, formatCurrency } from "@/lib/format"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"
import { PageUrlSelector } from "@/components/dashboard/page-url-selector"
import { HeatmapChart } from "@/components/charts/heatmap-chart"
import { ScrollDepthChart } from "@/components/charts/scroll-depth-chart"
import { ProductVisibilityChart } from "@/components/charts/product-visibility-chart"
import type { EventFilters } from "@/types/events"

const EVENT_LABELS: Record<string, string> = {
  "order.placed": "Orden Realizada",
  "order.completed": "Orden Completada",
  "order.canceled": "Orden Cancelada",
  "order.fulfillment_created": "Preparación Creada",
  "order.return_requested": "Devolución Solicitada",
  "payment.captured": "Pago Capturado",
  "payment.refunded": "Pago Reembolsado",
  "shipment.created": "Envío Creado",
  "delivery.created": "Entrega Confirmada",
  "customer.created": "Cliente Creado",
  "cart.created": "Carrito Creado",
  "cart.updated": "Carrito Actualizado",
  "cart.viewed": "Carrito Visto",
  "product.viewed": "Producto Visto",
  "product.clicked": "Producto Clickeado",
  "product.added_to_cart": "Agregado al Carrito",
  "product.removed_from_cart": "Quitado del Carrito",
  "product.variant_selected": "Variante Seleccionada",
  "category.viewed": "Categoría Vista",
  "collection.viewed": "Colección Vista",
  "checkout.started": "Checkout Iniciado",
  "checkout.abandoned": "Checkout Abandonado",
  "search.performed": "Búsqueda Realizada",
  "search.no_results": "Búsqueda sin Resultados",
  "search.result_clicked": "Resultado Clickeado",
  "page.viewed": "Página Vista",
}

const EVENT_TYPES = [
  "order.placed",
  "order.completed",
  "order.canceled",
  "order.fulfillment_created",
  "order.return_requested",
  "payment.captured",
  "payment.refunded",
  "shipment.created",
  "delivery.created",
  "customer.created",
  "cart.created",
  "cart.updated",
  "cart.viewed",
  "product.viewed",
  "product.clicked",
  "product.added_to_cart",
  "product.removed_from_cart",
  "product.variant_selected",
  "category.viewed",
  "collection.viewed",
  "checkout.started",
  "checkout.abandoned",
  "search.performed",
  "search.no_results",
  "search.result_clicked",
  "page.viewed",
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  // Stats hooks
  const { data: stats, isLoading: statsLoading, isError: statsError } = useEventStats(dateRange.from, dateRange.to)
  const { data: funnel, isLoading: funnelLoading, isError: funnelError } = useEventFunnel(dateRange.from, dateRange.to)
  const { data: products, isLoading: productsLoading, isError: productsError } = useEventProducts(dateRange.from, dateRange.to)
  const { data: search, isLoading: searchLoading, isError: searchError } = useEventSearch(dateRange.from, dateRange.to)

  // Behavior analytics (per-page)
  const [selectedPageUrl, setSelectedPageUrl] = useState("")
  const { data: heatmap, isLoading: heatmapLoading } = useHeatmap(selectedPageUrl, dateRange.from, dateRange.to)
  const heatmapHtmlUrl = buildHeatmapHtmlUrl(selectedPageUrl, dateRange.from, dateRange.to)
  const { data: scrollDepth, isLoading: scrollLoading } = useScrollDepth(selectedPageUrl, dateRange.from, dateRange.to)
  const { data: productVisibility, isLoading: visibilityLoading } = useProductVisibility(selectedPageUrl, dateRange.from, dateRange.to)

  // Stats filtrados por página (para tab Comportamiento) — solo se ejecutan si hay página seleccionada
  const { data: pageStats, isLoading: pageStatsLoading } = useEventStats(dateRange.from, dateRange.to, selectedPageUrl)
  const { data: pageFunnel, isLoading: pageFunnelLoading } = useEventFunnel(dateRange.from, dateRange.to, selectedPageUrl)
  const { data: pageProducts, isLoading: pageProductsLoading } = useEventProducts(dateRange.from, dateRange.to, 20, selectedPageUrl)
  const { data: pageSearch, isLoading: pageSearchLoading } = useEventSearch(dateRange.from, dateRange.to, 20, selectedPageUrl)

  // Raw events filters
  const [eventType, setEventType] = useState<string>("all")
  const [eventSource, setEventSource] = useState<string>("all")
  const [customerSearch, setCustomerSearch] = useState("")
  const [eventsPage, setEventsPage] = useState(0)
  const eventsLimit = 50

  const eventFilters = useMemo<EventFilters>(() => {
    // Sumar 1 día al "to" porque el backend filtra con timestamp < to
    const toNext = new Date(dateRange.to)
    toNext.setDate(toNext.getDate() + 1)
    const f: EventFilters = {
      from: dateRange.from.toISOString().split("T")[0],
      to: toNext.toISOString().split("T")[0],
      limit: eventsLimit,
      offset: eventsPage * eventsLimit,
      sort: "desc",
    }
    if (eventType !== "all") f.event = eventType
    if (eventSource !== "all") f.source = eventSource as "medusa" | "storefront"
    if (customerSearch.trim()) f.customer_id = customerSearch.trim()
    return f
  }, [dateRange, eventType, eventSource, customerSearch, eventsPage])

  const { data: eventsList, isLoading: eventsLoading } = useEvents(eventFilters)

  const totalEventsPages = eventsList ? Math.ceil(eventsList.total / eventsLimit) : 0

  // Abandoned carts filters
  const [abandonedPage, setAbandonedPage] = useState(0)
  const abandonedLimit = 50

  const abandonedFilters = useMemo<EventFilters>(() => {
    const toNext = new Date(dateRange.to)
    toNext.setDate(toNext.getDate() + 1)
    return {
      event: "checkout.abandoned",
      from: dateRange.from.toISOString().split("T")[0],
      to: toNext.toISOString().split("T")[0],
      limit: abandonedLimit,
      offset: abandonedPage * abandonedLimit,
      sort: "desc",
    }
  }, [dateRange, abandonedPage])

  const { data: abandonedList, isLoading: abandonedLoading } = useEvents(abandonedFilters)

  const totalAbandonedPages = abandonedList ? Math.ceil(abandonedList.total / abandonedLimit) : 0

  // Métricas de abandono desde stats
  const abandonedCount = stats?.by_type?.["checkout.abandoned"] || 0
  const checkoutStarted = stats?.by_type?.["checkout.started"] || 0
  const abandonRate = checkoutStarted > 0
    ? ((abandonedCount / checkoutStarted) * 100).toFixed(1) + "%"
    : "0%"

  // Valor estimado perdido (sumando totales de eventos abandonados)
  const estimatedLostValue = useMemo(() => {
    if (!abandonedList?.events?.length) return 0
    return abandonedList.events.reduce((sum, ev) => {
      const total = Number(ev.data?.total) || 0
      return sum + total
    }, 0)
  }, [abandonedList])

  // Abandonos agrupados por día (para gráfico)
  const abandonsByDay = useMemo(() => {
    if (!abandonedList?.events?.length) return []
    const byDay = new Map<string, number>()
    for (const ev of abandonedList.events) {
      const day = new Date(ev.timestamp).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })
      byDay.set(day, (byDay.get(day) || 0) + 1)
    }
    return Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse()
  }, [abandonedList])

  return (
    <div>
      <Header
        title="Analítica de Eventos"
        description="Comportamiento de usuarios, funnel de conversión y búsquedas"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        <Tabs defaultValue="resumen">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="busquedas">Búsquedas</TabsTrigger>
            <TabsTrigger value="abandonos">Abandonos</TabsTrigger>
            <TabsTrigger value="eventos">Eventos</TabsTrigger>
            <TabsTrigger value="comportamiento">Comportamiento</TabsTrigger>
          </TabsList>

          {/* TAB: Resumen */}
          <TabsContent value="resumen" className="space-y-6 mt-4">
            {statsError && (
              <Card>
                <CardContent className="p-6 text-center text-red-500">
                  Error al cargar estadisticas. Verifica que el servicio de analytics este funcionando.
                </CardContent>
              </Card>
            )}
            {statsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
                </div>
                <Skeleton className="h-[400px]" />
              </div>
            ) : stats ? (
              <>
                {/* Fila 1: KPIs de negocio */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Ordenes Realizadas"
                    value={formatNumber(stats.by_type?.["order.placed"] || 0)}
                    icon="📦"
                  />
                  <MetricCard
                    title="Ingresos Totales"
                    value={formatCurrency(products?.products?.reduce((s, p) => s + p.revenue, 0) || 0)}
                    icon="💰"
                  />
                  <MetricCard
                    title="Tasa de Conversión"
                    value={funnel?.conversion_rates?.total_view_to_purchase || "0%"}
                    subtitle="Vista → Compra"
                    icon="📈"
                  />
                  <MetricCard
                    title="Páginas Vistas"
                    value={formatNumber(stats.by_type?.["page.viewed"] || 0)}
                    icon="🌐"
                  />
                </div>

                {/* Fila 2: KPIs de actividad */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Eventos"
                    value={formatNumber(stats.total_events)}
                    icon="📡"
                  />
                  <MetricCard
                    title="Productos Únicos Vistos"
                    value={formatNumber(products?.products?.length || 0)}
                    icon="🛍️"
                  />
                  <MetricCard
                    title="Tasa de Abandono"
                    value={abandonRate}
                    changeType={parseFloat(abandonRate) > 30 ? "negative" : parseFloat(abandonRate) > 0 ? "positive" : "neutral"}
                    icon="🚪"
                  />
                  <MetricCard
                    title="Búsquedas sin Resultado"
                    value={formatNumber(stats.by_type?.["search.no_results"] || 0)}
                    changeType={(stats.by_type?.["search.no_results"] || 0) > 0 ? "negative" : "neutral"}
                    icon="🔍"
                  />
                </div>

                {/* Fila 3: KPIs del funnel */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Vistas de Producto"
                    value={formatNumber(stats.by_type?.["product.viewed"] || 0)}
                    icon="👀"
                  />
                  <MetricCard
                    title="Agregados al Carrito"
                    value={formatNumber(stats.by_type?.["product.added_to_cart"] || 0)}
                    icon="🛒"
                  />
                  <MetricCard
                    title="Checkouts Iniciados"
                    value={formatNumber(stats.by_type?.["checkout.started"] || 0)}
                    icon="💳"
                  />
                  <MetricCard
                    title="Checkouts Abandonados"
                    value={formatNumber(stats.by_type?.["checkout.abandoned"] || 0)}
                    changeType={(stats.by_type?.["checkout.abandoned"] || 0) > 0 ? "negative" : "neutral"}
                    icon="❌"
                  />
                </div>

                {/* Funnel de conversión visual */}
                {funnelLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : funnel ? (
                  <ConversionFunnel data={funnel} />
                ) : null}

                {/* Eventos por día */}
                {stats.by_day && stats.by_day.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Eventos por dia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={stats.by_day}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="count" fill="#ec4899" name="Eventos" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No se pudieron cargar los datos. Verificá que el Events Backend esté
                  corriendo y que EVENTS_API_URL y EVENTS_API_KEY estén configurados en .env.local
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Funnel */}
          <TabsContent value="funnel" className="space-y-6 mt-4">
            {funnelLoading ? (
              <Skeleton className="h-[500px]" />
            ) : funnel ? (
              <ConversionFunnel data={funnel} />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No hay datos de funnel en este periodo. Los datos aparecen cuando los usuarios navegan la tienda.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Productos */}
          <TabsContent value="productos" className="space-y-6 mt-4">
            {productsLoading ? (
              <Skeleton className="h-[400px]" />
            ) : products?.products?.length ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Productos Únicos"
                    value={formatNumber(products.products.length)}
                    icon="📦"
                  />
                  <MetricCard
                    title="Total Vistas"
                    value={formatNumber(products.products.reduce((s, p) => s + p.views, 0))}
                    icon="👀"
                  />
                  <MetricCard
                    title="Total Ingresos"
                    value={formatCurrency(products.products.reduce((s, p) => s + p.revenue, 0))}
                    icon="💰"
                  />
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Rendimiento de Productos ({formatNumber(products.products.length)})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Vistas</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Al Carrito</TableHead>
                          <TableHead className="text-right">Comprados</TableHead>
                          <TableHead className="text-right">Conversión</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.products.map((p) => (
                          <TableRow key={p.product_id}>
                            <TableCell className="font-medium max-w-[250px] truncate">
                              {p.title || p.product_id}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(p.views)}</TableCell>
                            <TableCell className="text-right">{formatNumber(p.clicks)}</TableCell>
                            <TableCell className="text-right">
                              {p.views > 0 ? `${((p.clicks / p.views) * 100).toFixed(1)}%` : "0%"}
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(p.added_to_cart)}</TableCell>
                            <TableCell className="text-right">{formatNumber(p.purchased)}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{p.conversion_rate}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No hay datos de productos en este periodo. Los eventos comenzaran a aparecer cuando los usuarios naveguen la tienda.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Búsquedas */}
          <TabsContent value="busquedas" className="space-y-6 mt-4">
            {searchLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[300px]" />
                <Skeleton className="h-[300px]" />
              </div>
            ) : search ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Búsquedas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {search.top_searches?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Término</TableHead>
                            <TableHead className="text-right">Búsquedas</TableHead>
                            <TableHead className="text-right">Resultados Prom.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {search.top_searches.map((s) => (
                            <TableRow key={s.term}>
                              <TableCell className="font-medium">{s.term}</TableCell>
                              <TableCell className="text-right">{formatNumber(s.count)}</TableCell>
                              <TableCell className="text-right">{s.results_avg}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No hay datos de busqueda en este periodo.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Búsquedas sin Resultados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {search.no_results?.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Término</TableHead>
                            <TableHead className="text-right">Veces</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {search.no_results.map((s) => (
                            <TableRow key={s.term}>
                              <TableCell className="font-medium">
                                {s.term}
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  Sin resultados
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(s.count)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-gray-500 py-4">
                        Todas las búsquedas tuvieron resultados
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No hay datos de busqueda en este periodo. Los eventos aparecen cuando los usuarios usan el buscador.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Carritos Abandonados */}
          <TabsContent value="abandonos" className="space-y-6 mt-4">
            {statsLoading || abandonedLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
                </div>
                <Skeleton className="h-[400px]" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="Checkouts Abandonados"
                    value={formatNumber(abandonedCount)}
                    icon="🛒"
                  />
                  <MetricCard
                    title="Tasa de Abandono"
                    value={abandonRate}
                    changeType={parseFloat(abandonRate) > 30 ? "negative" : parseFloat(abandonRate) > 0 ? "positive" : "neutral"}
                    icon="📉"
                  />
                  <MetricCard
                    title="Valor Estimado Perdido"
                    value={formatCurrency(estimatedLostValue)}
                    icon="💸"
                  />
                </div>

                {/* Gráfico de abandonos por día */}
                {abandonsByDay.length > 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Abandonos por Día</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={abandonsByDay}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" fontSize={11} />
                            <YAxis fontSize={11} allowDecimals={false} />
                            <RechartsTooltip formatter={(value) => [formatNumber(Number(value)), "Abandonos"]} />
                            <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {abandonedList?.events?.length ? (
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Carritos Abandonados ({formatNumber(abandonedList.total)} total)
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          Página {abandonedPage + 1} de {totalAbandonedPages}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-right">Items</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Último Paso</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {abandonedList.events.map((ev) => (
                            <TableRow key={ev._id}>
                              <TableCell className="text-xs whitespace-nowrap">
                                {new Date(ev.timestamp).toLocaleString("es-AR")}
                              </TableCell>
                              <TableCell className="text-xs max-w-[180px] truncate">
                                {(ev.data?.email as string) ||
                                  (ev.data?.customer_id as string) ||
                                  ev.customer_id ||
                                  "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {(ev.data?.items_count as number) || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {ev.data?.total ? formatCurrency(Number(ev.data.total)) : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {(ev.data?.last_step as string) || "-"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      <div className="flex justify-between items-center mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAbandonedPage((p) => Math.max(0, p - 1))}
                          disabled={abandonedPage === 0}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAbandonedPage((p) => p + 1)}
                          disabled={abandonedPage + 1 >= totalAbandonedPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-gray-500">
                      No se encontraron checkouts abandonados en el período seleccionado
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* TAB: Eventos crudos */}
          <TabsContent value="eventos" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Select value={eventType} onValueChange={(v) => { setEventType(v); setEventsPage(0) }}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{EVENT_LABELS[t] || t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={eventSource} onValueChange={(v) => { setEventSource(v); setEventsPage(0) }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fuentes</SelectItem>
                  <SelectItem value="medusa">Medusa (Servidor)</SelectItem>
                  <SelectItem value="storefront">Tienda</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="ID de Cliente..."
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setEventsPage(0) }}
                className="w-[200px]"
              />
            </div>

            {eventsLoading ? (
              <Skeleton className="h-[400px]" />
            ) : eventsList?.events?.length ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      Eventos ({formatNumber(eventsList.total)} total)
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      Página {eventsPage + 1} de {totalEventsPages}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Fuente</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Datos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {eventsList.events.map((ev) => (
                        <TableRow key={ev._id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(ev.timestamp).toLocaleString("es-AR")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {EVENT_LABELS[ev.event] || ev.event}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={ev.source === "medusa" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {ev.source === "medusa" ? "Servidor" : "Tienda"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">
                            {(ev.data?.customer_id as string) ||
                              (ev.data?.email as string) ||
                              ev.customer_id ||
                              "-"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[250px] truncate text-gray-500">
                            {JSON.stringify(ev.data).substring(0, 80)}
                            {JSON.stringify(ev.data).length > 80 ? "..." : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsPage((p) => Math.max(0, p - 1))}
                      disabled={eventsPage === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsPage((p) => p + 1)}
                      disabled={eventsPage + 1 >= totalEventsPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No se encontraron eventos con los filtros seleccionados
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Comportamiento por Página */}
          <TabsContent value="comportamiento" className="space-y-6 mt-4">
            <PageUrlSelector
              value={selectedPageUrl}
              onChange={setSelectedPageUrl}
              dateRange={dateRange}
            />

            {!selectedPageUrl ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  Seleccioná una página para ver las métricas de comportamiento
                </CardContent>
              </Card>
            ) : (
              <>
                {/* KPIs de la página seleccionada */}
                {(heatmap || scrollDepth || productVisibility) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                      title="Total Clics"
                      value={formatNumber(heatmap?.total_clicks || 0)}
                      icon="🖱️"
                    />
                    <MetricCard
                      title="Sesiones con Scroll"
                      value={formatNumber(scrollDepth?.total_sessions || 0)}
                      subtitle={scrollDepth ? `Promedio: ${scrollDepth.avg_max_depth.toFixed(0)}%` : undefined}
                      icon="📜"
                    />
                    <MetricCard
                      title="Visibilidad Productos"
                      value={productVisibility?.visibility_rate || "N/A"}
                      subtitle={productVisibility ? `${Math.round(productVisibility.avg_products_seen)} de ${Math.round(productVisibility.avg_products_total)} productos` : undefined}
                      icon="👁️"
                    />
                  </div>
                )}

                {/* Métricas de la página (stats filtrados) */}
                {(pageStatsLoading || pageStats) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Métricas de esta Página</h3>
                    {pageStatsLoading ? (
                      <Skeleton className="h-[100px]" />
                    ) : pageStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                          title="Eventos en Página"
                          value={formatNumber(pageStats.total_events)}
                          icon="📡"
                        />
                        <MetricCard
                          title="Vistas de Producto"
                          value={formatNumber(pageStats.by_type?.["product.viewed"] || 0)}
                          icon="👀"
                        />
                        <MetricCard
                          title="Agregados al Carrito"
                          value={formatNumber(pageStats.by_type?.["product.added_to_cart"] || 0)}
                          icon="🛒"
                        />
                        <MetricCard
                          title="Checkouts Iniciados"
                          value={formatNumber(pageStats.by_type?.["checkout.started"] || 0)}
                          icon="💳"
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Funnel de la página */}
                {(pageFunnelLoading || pageFunnel) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Funnel de esta Página</h3>
                    {pageFunnelLoading ? (
                      <Skeleton className="h-[300px]" />
                    ) : pageFunnel ? (
                      <ConversionFunnel data={pageFunnel} />
                    ) : null}
                  </div>
                )}

                {/* Productos de la página */}
                {(pageProductsLoading || (pageProducts?.products?.length ?? 0) > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Productos en esta Página</h3>
                    {pageProductsLoading ? (
                      <Skeleton className="h-[300px]" />
                    ) : pageProducts?.products?.length ? (
                      <Card>
                        <CardContent className="pt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">Vistas</TableHead>
                                <TableHead className="text-right">Clicks</TableHead>
                                <TableHead className="text-right">CTR</TableHead>
                                <TableHead className="text-right">Al Carrito</TableHead>
                                <TableHead className="text-right">Comprados</TableHead>
                                <TableHead className="text-right">Conversión</TableHead>
                                <TableHead className="text-right">Ingresos</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pageProducts.products.map((p) => (
                                <TableRow key={p.product_id}>
                                  <TableCell className="font-medium max-w-[250px] truncate">
                                    {p.title || p.product_id}
                                  </TableCell>
                                  <TableCell className="text-right">{formatNumber(p.views)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(p.clicks)}</TableCell>
                                  <TableCell className="text-right">
                                    {p.views > 0 ? `${((p.clicks / p.views) * 100).toFixed(1)}%` : "0%"}
                                  </TableCell>
                                  <TableCell className="text-right">{formatNumber(p.added_to_cart)}</TableCell>
                                  <TableCell className="text-right">{formatNumber(p.purchased)}</TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant="outline">{p.conversion_rate}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                )}

                {/* Búsquedas en la página */}
                {(pageSearchLoading || pageSearch?.top_searches?.length || pageSearch?.no_results?.length) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Búsquedas en esta Página</h3>
                    {pageSearchLoading ? (
                      <Skeleton className="h-[200px]" />
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pageSearch?.top_searches?.length ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Top Búsquedas</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Término</TableHead>
                                    <TableHead className="text-right">Búsquedas</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pageSearch.top_searches.map((s) => (
                                    <TableRow key={s.term}>
                                      <TableCell className="font-medium">{s.term}</TableCell>
                                      <TableCell className="text-right">{formatNumber(s.count)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ) : null}
                        {pageSearch?.no_results?.length ? (
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-base">Búsquedas sin Resultados</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Término</TableHead>
                                    <TableHead className="text-right">Veces</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {pageSearch.no_results.map((s) => (
                                    <TableRow key={s.term}>
                                      <TableCell className="font-medium">
                                        {s.term}
                                        <Badge variant="destructive" className="ml-2 text-xs">
                                          Sin resultados
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">{formatNumber(s.count)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* Mapa de Clics */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Mapa de Clics</h3>
                  {heatmapLoading ? (
                    <Skeleton className="h-[350px]" />
                  ) : heatmap ? (
                    <HeatmapChart data={heatmap} heatmapUrl={heatmapHtmlUrl} />
                  ) : (
                    <Card>
                      <CardContent className="py-6 text-center text-gray-500">
                        No hay datos de heatmap para esta página
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Profundidad de Scroll */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Profundidad de Scroll</h3>
                  {scrollLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : scrollDepth ? (
                    <ScrollDepthChart data={scrollDepth} />
                  ) : (
                    <Card>
                      <CardContent className="py-6 text-center text-gray-500">
                        No hay datos de scroll para esta página
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Visibilidad de Productos */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Visibilidad de Productos</h3>
                  {visibilityLoading ? (
                    <Skeleton className="h-[400px]" />
                  ) : productVisibility ? (
                    <ProductVisibilityChart
                      data={productVisibility}
                      titleFallbacks={products?.products
                        ? new Map(products.products.map((p) => [p.product_id, p.title]))
                        : undefined
                      }
                    />
                  ) : (
                    <Card>
                      <CardContent className="py-6 text-center text-gray-500">
                        No hay datos de visibilidad de productos para esta página
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <AIInsightWidget
          pageContext="analytics"
          metricsBuilder={() => {
            return {
              eventos: stats ? {
                total: stats.total_events,
                porTipo: stats.by_type,
                porFuente: stats.by_source,
              } : null,
              funnel: funnel ? {
                pasos: funnel.funnel,
                tasasConversion: funnel.conversion_rates,
              } : null,
              productosVistos: products?.products?.slice(0, 10) || null,
              busquedas: search ? {
                topBusquedas: search.top_searches?.slice(0, 10) || [],
                sinResultados: search.no_results?.slice(0, 10) || [],
              } : null,
              abandonos: {
                total: abandonedCount,
                tasaAbandono: abandonRate,
                valorEstimadoPerdido: estimatedLostValue,
              },
              comportamiento: selectedPageUrl && (heatmap || scrollDepth || productVisibility) ? {
                paginaAnalizada: selectedPageUrl,
                heatmap: heatmap ? {
                  totalClicks: heatmap.total_clicks,
                  topElementos: heatmap.clicks.slice(0, 5).map(c => ({ tag: c.el_tag, texto: c.el_text, clicks: c.count })),
                  viewport: heatmap.viewport_breakdown,
                } : null,
                scroll: scrollDepth ? {
                  totalSesiones: scrollDepth.total_sessions,
                  promedioMaximo: scrollDepth.avg_max_depth,
                  llegaAlFinal: scrollDepth.milestones["100"] || 0,
                } : null,
                visibilidad: productVisibility ? {
                  tasaVisibilidad: productVisibility.visibility_rate,
                  promedioProductosVistos: productVisibility.avg_products_seen,
                  totalProductos: productVisibility.avg_products_total,
                } : null,
              } : null,
            }
          }}
          isDataLoading={statsLoading}
        />
      </div>
    </div>
  )
}
