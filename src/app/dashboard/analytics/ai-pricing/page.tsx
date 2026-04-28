"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AIDecisionsTab } from "@/components/dashboard/ai-decisions-tab"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import {
  useAIHotLeads,
  useAIPriceSuggestions,
  useAIROISummary,
  useAIROIBySegment,
} from "@/hooks/use-events"
import type {
  HotLead,
  PriceSuggestion,
  PurchaseIntent,
  AISegmentBreakdown,
} from "@/types/events"
import { formatCurrency, formatNumber } from "@/lib/format"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Zap,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Sparkles,
} from "lucide-react"

const SEGMENT_COLORS: Record<string, string> = {
  hot: "#ef4444",
  warm: "#f97316",
  cold: "#3b82f6",
  lost: "#6b7280",
  unknown: "#a3a3a3",
}

const TYPE_COLORS: Record<string, string> = {
  personal: "#8b5cf6",
  cart_recovery: "#f97316",
  intent_boost: "#10b981",
  segment: "#3b82f6",
}

const INTENT_LABELS: Record<PurchaseIntent, { label: string; color: string; icon: typeof Target }> = {
  ready_to_buy: { label: "Listo para comprar", color: "bg-green-100 text-green-800", icon: ShoppingCart },
  cart_abandoner: { label: "Abandonó carrito", color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
  price_watcher: { label: "Busca precios", color: "bg-blue-100 text-blue-800", icon: DollarSign },
  comparing: { label: "Comparando", color: "bg-purple-100 text-purple-800", icon: Target },
  browsing: { label: "Navegando", color: "bg-gray-100 text-gray-800", icon: Clock },
}

const INTENT_PRIORITY: Record<PurchaseIntent, number> = {
  ready_to_buy: 5,
  cart_abandoner: 4,
  comparing: 3,
  price_watcher: 2,
  browsing: 1,
}

const DEMAND_LABELS: Record<string, { label: string; color: string }> = {
  rising: { label: "Subiendo", color: "text-green-600" },
  stable: { label: "Estable", color: "text-gray-600" },
  declining: { label: "Bajando", color: "text-red-600" },
}

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0]
}

export default function AIPricingPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [leadsLimit, setLeadsLimit] = useState(50)
  const [intentFilter, setIntentFilter] = useState<PurchaseIntent | "all">("all")
  const [leadsSearch, setLeadsSearch] = useState("")

  const fromStr = formatDateParam(dateRange.from)
  const toStr = formatDateParam(dateRange.to)

  const { data: hotLeads, isLoading: loadingLeads, isFetching: fetchingLeads, refetch: refetchLeads } =
    useAIHotLeads(leadsLimit)
  const { data: priceSuggestions, isLoading: loadingPrices } = useAIPriceSuggestions(20)
  const { data: roiSummary, isLoading: loadingROI } = useAIROISummary(fromStr, toStr)
  const { data: roiSegment, isLoading: loadingSegment } = useAIROIBySegment(fromStr, toStr)

  const filteredLeads = useMemo<HotLead[]>(() => {
    const all = hotLeads?.leads ?? []
    const q = leadsSearch.trim().toLowerCase()
    return all
      .filter((l) => intentFilter === "all" || l.purchase_intent === intentFilter)
      .filter((l) => {
        if (!q) return true
        return (
          l.customer_id?.toLowerCase().includes(q) ||
          l.session_id?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const intentDiff =
          INTENT_PRIORITY[b.purchase_intent] - INTENT_PRIORITY[a.purchase_intent]
        if (intentDiff !== 0) return intentDiff
        if (b.cart_value !== a.cart_value) return b.cart_value - a.cart_value
        return b.confidence - a.confidence
      })
  }, [hotLeads, intentFilter, leadsSearch])

  const dailyChartData = useMemo(() => {
    if (!roiSummary?.daily) return []
    return roiSummary.daily.map((d) => ({
      date: d.date.slice(5),
      generados: d.generated,
      convertidos: d.converted,
      revenue: d.revenue,
    }))
  }, [roiSummary])

  const segmentPieData = useMemo(() => {
    if (!roiSegment?.segments) return []
    return Object.entries(roiSegment.segments).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.count,
      revenue: data.revenue,
      roi: data.roi,
      fill: SEGMENT_COLORS[name] || "#a3a3a3",
    }))
  }, [roiSegment])

  const typePieData = useMemo(() => {
    if (!roiSegment?.types) return []
    return Object.entries(roiSegment.types).map(([name, data]) => ({
      name: name.replace("_", " ").charAt(0).toUpperCase() + name.replace("_", " ").slice(1),
      value: data.count,
      revenue: data.revenue,
      roi: data.roi,
      fill: TYPE_COLORS[name] || "#a3a3a3",
    }))
  }, [roiSegment])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header
          title="Inteligencia de Precios"
          description="Scoring de usuarios, descuentos dinámicos con IA y análisis de ROI"
        />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="hot-leads">Hot Leads</TabsTrigger>
          <TabsTrigger value="precios">Análisis de Precios</TabsTrigger>
          <TabsTrigger value="roi">ROI Descuentos</TabsTrigger>
          <TabsTrigger value="decisiones">Decisiones IA</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB: Resumen */}
        {/* ============================================================ */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPI Cards */}
          {loadingROI ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Descuentos Generados"
                value={formatNumber(roiSummary?.total_discounts_generated || 0)}
                icon={<Brain className="h-5 w-5 text-purple-500" />}
                subtitle={`${roiSummary?.total_discounts_active || 0} activos`}
              />
              <MetricCard
                title="Tasa de Conversión"
                value={roiSummary?.conversion_rate || "0.0%"}
                icon={<Target className="h-5 w-5 text-green-500" />}
                subtitle={`${roiSummary?.total_discounts_converted || 0} convertidos`}
              />
              <MetricCard
                title="Revenue por IA"
                value={formatCurrency(roiSummary?.total_revenue || 0)}
                icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
                subtitle={`Descuentos: ${formatCurrency(roiSummary?.total_discount_value || 0)}`}
              />
              <MetricCard
                title="ROI"
                value={`${roiSummary?.roi_percentage?.toFixed(1) || "0.0"}%`}
                icon={roiSummary?.profitable
                  ? <TrendingUp className="h-5 w-5 text-green-500" />
                  : <TrendingDown className="h-5 w-5 text-red-500" />
                }
                subtitle={`Costo IA: $${roiSummary?.total_ai_cost?.toFixed(4) || "0"} USD`}
                changeType={roiSummary?.profitable ? "positive" : "negative"}
                change={roiSummary?.profitable ? "Rentable" : "No rentable"}
              />
            </div>
          )}

          {/* Chart: Descuentos por día */}
          {dailyChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Descuentos por Día</CardTitle>
                <CardDescription>Generados vs convertidos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="generados" fill="#8b5cf6" name="Generados" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="convertidos" fill="#10b981" name="Convertidos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pie charts: Segmentos y Tipos */}
          {(segmentPieData.length > 0 || typePieData.length > 0) && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {segmentPieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Por Segmento de Usuario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={segmentPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {segmentPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip formatter={(value, name, props) =>
                          [`${value} descuentos | ROI: ${formatCurrency(props?.payload?.roi || 0)}`, name]
                        } />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              {typePieData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Por Tipo de Descuento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={typePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {typePieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip formatter={(value, name, props) =>
                          [`${value} descuentos | ROI: ${formatCurrency(props?.payload?.roi || 0)}`, name]
                        } />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Estado vacío */}
          {!loadingROI && (roiSummary?.total_discounts_generated || 0) === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="mb-4 h-12 w-12 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600">Sin datos de descuentos IA</h3>
                <p className="mt-1 max-w-md text-sm text-gray-400">
                  Los descuentos se generan automáticamente cuando usuarios con alto score de intención
                  visitan la tienda. Los datos aparecerán aquí una vez que el motor esté activo.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: Hot Leads */}
        {/* ============================================================ */}
        <TabsContent value="hot-leads" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Hot Leads — Últimas 24h
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchLeads()}
                  disabled={fetchingLeads}
                >
                  <RefreshCw
                    className={`mr-1.5 h-3.5 w-3.5 ${fetchingLeads ? "animate-spin" : ""}`}
                  />
                  Actualizar
                </Button>
              </CardTitle>
              <CardDescription>
                Usuarios con mayor intención de compra que aún no completaron una orden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar customer / session id..."
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                  />
                </div>
                <Select
                  value={intentFilter}
                  onValueChange={(v) => setIntentFilter(v as PurchaseIntent | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Intent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los intents</SelectItem>
                    <SelectItem value="ready_to_buy">Listo para comprar</SelectItem>
                    <SelectItem value="cart_abandoner">Abandonó carrito</SelectItem>
                    <SelectItem value="comparing">Comparando</SelectItem>
                    <SelectItem value="price_watcher">Busca precios</SelectItem>
                    <SelectItem value="browsing">Navegando</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={String(leadsLimit)}
                  onValueChange={(v) => setLeadsLimit(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Límite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">Top 20</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                    <SelectItem value="100">Top 100</SelectItem>
                    <SelectItem value="200">Top 200</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loadingLeads ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {hotLeads?.leads?.length
                      ? "No hay leads que coincidan con los filtros"
                      : "No hay hot leads en las últimas 24 horas"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Intención</TableHead>
                      <TableHead>Confianza</TableHead>
                      <TableHead>Valor Carrito</TableHead>
                      <TableHead>Última Actividad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead, i) => {
                      const intentInfo = INTENT_LABELS[lead.purchase_intent] || INTENT_LABELS.browsing
                      const id = lead.customer_id ?? lead.session_id ?? "—"
                      return (
                        <TableRow key={`${id}-${i}`}>
                          <TableCell className="font-mono text-xs">
                            {lead.customer_id
                              ? lead.customer_id.slice(0, 20) + "..."
                              : lead.session_id?.slice(0, 12) + "..."
                            }
                            {!lead.customer_id && (
                              <Badge variant="outline" className="ml-2 text-xs">Anónimo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={intentInfo.color}>
                              {intentInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-16 rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-orange-500"
                                  style={{ width: `${lead.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {(lead.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.cart_value > 0
                              ? formatCurrency(lead.cart_value)
                              : <span className="text-gray-400">—</span>
                            }
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(lead.last_activity).toLocaleString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: Análisis de Precios */}
        {/* ============================================================ */}
        <TabsContent value="precios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Sugerencias de Precio
              </CardTitle>
              <CardDescription>
                Productos analizados por IA con recomendaciones de ajuste
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPrices ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : !priceSuggestions?.suggestions?.length ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <DollarSign className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    No hay análisis de precios todavía. Se generan al consultar productos individuales via API.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio Actual</TableHead>
                      <TableHead>Sugerido</TableHead>
                      <TableHead>Demanda</TableHead>
                      <TableHead>Vista→Compra</TableHead>
                      <TableHead>Abandono</TableHead>
                      <TableHead>Razonamiento IA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {priceSuggestions.suggestions.map((item: PriceSuggestion, i: number) => {
                      const demandInfo = DEMAND_LABELS[item.demand_trend] || DEMAND_LABELS.stable
                      const viewsToPurchase =
                        (item as PriceSuggestion & { views_to_purchase_ratio?: number })
                          .views_to_purchase_ratio ?? 0
                      return (
                        <TableRow key={i}>
                          <TableCell className="max-w-[200px] truncate font-medium">
                            {item.product_title}
                          </TableCell>
                          <TableCell>{formatCurrency(item.current_price)}</TableCell>
                          <TableCell>
                            {item.suggested_price ? (
                              <span className={item.suggested_price < item.current_price ? "text-red-600" : "text-green-600"}>
                                {formatCurrency(item.suggested_price)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={demandInfo.color}>{demandInfo.label}</span>
                          </TableCell>
                          <TableCell>
                            {(viewsToPurchase * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <span className={item.cart_abandonment_rate_for_product > 0.5 ? "text-red-600 font-medium" : ""}>
                              {(item.cart_abandonment_rate_for_product * 100).toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate text-xs text-gray-500">
                            {item.ai_reasoning ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                    <Sparkles className="mr-1 h-3 w-3 text-purple-500" />
                                    Ver razón
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>{item.product_title}</DialogTitle>
                                    <DialogDescription>
                                      Análisis y razonamiento de la IA para el ajuste de precio
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <div className="text-xs text-gray-500 uppercase">
                                          Precio actual
                                        </div>
                                        <div className="font-semibold">
                                          {formatCurrency(item.current_price)}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-500 uppercase">
                                          Sugerido
                                        </div>
                                        <div
                                          className={
                                            item.suggested_price != null &&
                                            item.suggested_price < item.current_price
                                              ? "font-semibold text-red-600"
                                              : "font-semibold text-green-600"
                                          }
                                        >
                                          {item.suggested_price != null
                                            ? formatCurrency(item.suggested_price)
                                            : "—"}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
                                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-purple-700">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Razonamiento de la IA
                                      </div>
                                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                        {item.ai_reasoning}
                                      </p>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="italic text-gray-400">Sin análisis IA</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: ROI Descuentos */}
        {/* ============================================================ */}
        <TabsContent value="roi" className="space-y-6">
          {loadingROI || loadingSegment ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <>
              {/* Métricas de ROI */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <MetricCard
                  title="Ganancia Neta"
                  value={formatCurrency(roiSummary?.net_profit || 0)}
                  icon={roiSummary?.profitable
                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                    : <XCircle className="h-5 w-5 text-red-500" />
                  }
                  changeType={roiSummary?.profitable ? "positive" : "negative"}
                  change={roiSummary?.profitable ? "Rentable" : "No rentable"}
                />
                <MetricCard
                  title="Descuento Promedio"
                  value={`${roiSummary?.avg_discount_pct?.toFixed(1) || "0"}%`}
                  icon={<DollarSign className="h-5 w-5 text-purple-500" />}
                />
                <MetricCard
                  title="Descuentos Expirados"
                  value={formatNumber(roiSummary?.total_discounts_expired || 0)}
                  icon={<Clock className="h-5 w-5 text-gray-500" />}
                  subtitle="No fueron utilizados"
                />
              </div>

              {/* Tabla detallada por segmento */}
              {roiSegment?.segments && Object.keys(roiSegment.segments).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>ROI por Segmento de Usuario</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Descuento Dado</TableHead>
                          <TableHead>Costo IA</TableHead>
                          <TableHead>ROI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(roiSegment.segments).map(([segment, data]: [string, AISegmentBreakdown]) => (
                          <TableRow key={segment}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: SEGMENT_COLORS[segment] || "#a3a3a3" }}
                                />
                                <span className="font-medium capitalize">{segment}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatNumber(data.count)}</TableCell>
                            <TableCell>{formatCurrency(data.revenue)}</TableCell>
                            <TableCell>{formatCurrency(data.discount_value)}</TableCell>
                            <TableCell className="text-xs">${data.ai_cost.toFixed(4)}</TableCell>
                            <TableCell>
                              <span className={data.roi >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                                {formatCurrency(data.roi)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Tabla detallada por tipo */}
              {roiSegment?.types && Object.keys(roiSegment.types).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>ROI por Tipo de Descuento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Descuento Dado</TableHead>
                          <TableHead>Costo IA</TableHead>
                          <TableHead>ROI</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(roiSegment.types).map(([type, data]: [string, AISegmentBreakdown]) => (
                          <TableRow key={type}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: TYPE_COLORS[type] || "#a3a3a3" }}
                                />
                                <span className="font-medium capitalize">{type.replace("_", " ")}</span>
                              </div>
                            </TableCell>
                            <TableCell>{formatNumber(data.count)}</TableCell>
                            <TableCell>{formatCurrency(data.revenue)}</TableCell>
                            <TableCell>{formatCurrency(data.discount_value)}</TableCell>
                            <TableCell className="text-xs">${data.ai_cost.toFixed(4)}</TableCell>
                            <TableCell>
                              <span className={data.roi >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                                {formatCurrency(data.roi)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Estado vacío ROI */}
              {(roiSummary?.total_discounts_generated || 0) === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <TrendingUp className="mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600">Sin datos de ROI</h3>
                    <p className="mt-1 max-w-md text-sm text-gray-400">
                      Los reportes de ROI se generan automáticamente cuando hay descuentos
                      creados y convertidos. Los datos se actualizan diariamente a las 3:00 AM.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB: Decisiones IA */}
        {/* ============================================================ */}
        <TabsContent value="decisiones" className="space-y-6">
          <AIDecisionsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
