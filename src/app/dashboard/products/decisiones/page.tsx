"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { useAllOrders } from "@/hooks/use-orders"
import { useProductsWithStock } from "@/hooks/use-inventory"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { filterPaidOrders } from "@/lib/aggregations"
import { formatCurrency, formatNumber } from "@/lib/format"
import { exportToCSV, formatCurrencyCSV } from "@/lib/export"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"
import {
  TrendingUp,
  TrendingDown,
  Percent,
  PackageCheck,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Tag,
  Search,
  BarChart3,
  Package,
  ShoppingCart,
  Eye,
} from "lucide-react"

// ============================================================
// TYPES
// ============================================================

type Decision = "aumentar_stock" | "reducir_stock" | "descuento" | "sin_accion"

interface ProductDecision {
  product_id: string
  name: string
  thumbnail: string | null
  stock: number
  unitsSold: number
  revenue: number
  orderCount: number
  avgPerOrder: number
  velocityPerDay: number
  daysOfStock: number
  decision: Decision
  priority: number // 1-5, higher = more urgent
  reason: string
}

// ============================================================
// DECISION LOGIC
// ============================================================

const DECISION_CONFIG = {
  aumentar_stock: {
    label: "Aumentar Stock",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: ArrowUpCircle,
    description: "Alta demanda, stock bajo. Reabastecer pronto.",
  },
  reducir_stock: {
    label: "Reducir Stock",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ArrowDownCircle,
    description: "Baja demanda, stock alto. No reabastecer.",
  },
  descuento: {
    label: "Aplicar Descuento",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Tag,
    description: "Stock estancado. Descuento para liberar inventario.",
  },
  sin_accion: {
    label: "Sin Acción",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: PackageCheck,
    description: "Equilibrio entre stock y demanda.",
  },
}

function analyzeProducts(
  orders: any[],
  productsWithStock: { id: string; title: string; thumbnail: string | null; totalStock: number; variants: any[] }[],
  periodDays: number
): ProductDecision[] {
  const paidOrders = filterPaidOrders(orders)

  // Aggregate sales by product_id
  const salesByProduct = new Map<
    string,
    { units: number; revenue: number; orders: Set<string> }
  >()

  for (const order of paidOrders) {
    if (!order.items) continue
    for (const item of order.items) {
      const id = item.product_id
      if (!id) continue
      const existing = salesByProduct.get(id) || {
        units: 0,
        revenue: 0,
        orders: new Set<string>(),
      }
      existing.units += item.quantity || 0
      existing.revenue += item.total || item.unit_price * item.quantity || 0
      existing.orders.add(order.id)
      salesByProduct.set(id, existing)
    }
  }

  const decisions: ProductDecision[] = []

  for (const product of productsWithStock) {
    const sales = salesByProduct.get(product.id)
    const unitsSold = sales?.units || 0
    const revenue = sales?.revenue || 0
    const orderCount = sales?.orders.size || 0
    const stock = product.totalStock
    const avgPerOrder = orderCount > 0 ? unitsSold / orderCount : 0
    const velocityPerDay = periodDays > 0 ? unitsSold / periodDays : 0
    const daysOfStock =
      velocityPerDay > 0 ? Math.round(stock / velocityPerDay) : stock > 0 ? 999 : 0

    // Decision logic
    let decision: Decision = "sin_accion"
    let priority = 1
    let reason = ""

    if (stock === 0 && unitsSold > 0) {
      // Sin stock pero vende -> urgente reabastecer
      decision = "aumentar_stock"
      priority = 5
      reason = `Sin stock. Vendió ${unitsSold} unidades en el período. Perdiendo ventas.`
    } else if (stock > 0 && velocityPerDay > 0 && daysOfStock <= 7) {
      // Stock para menos de 7 días -> reabastecer
      decision = "aumentar_stock"
      priority = 4
      reason = `Solo ${daysOfStock} días de stock. Velocidad: ${velocityPerDay.toFixed(1)} u/día.`
    } else if (stock > 0 && velocityPerDay > 0 && daysOfStock <= 15) {
      // Stock para menos de 15 días -> reabastecer pronto
      decision = "aumentar_stock"
      priority = 3
      reason = `${daysOfStock} días de stock restante. Velocidad: ${velocityPerDay.toFixed(1)} u/día.`
    } else if (stock > 50 && unitsSold === 0) {
      // Mucho stock y sin ventas -> descuento agresivo
      decision = "descuento"
      priority = 5
      reason = `${stock} unidades sin ninguna venta. Capital inmovilizado.`
    } else if (stock > 20 && daysOfStock > 180) {
      // Stock para más de 6 meses -> descuento
      decision = "descuento"
      priority = 4
      reason = `Stock para ${daysOfStock > 365 ? "+1 año" : daysOfStock + " días"}. Baja rotación.`
    } else if (stock > 10 && daysOfStock > 90) {
      // Stock para más de 3 meses -> considerar descuento
      decision = "descuento"
      priority = 3
      reason = `Stock para ${daysOfStock} días. Rotación lenta.`
    } else if (stock > 100 && velocityPerDay < 0.5 && unitsSold > 0) {
      // Stock alto con venta muy baja -> no reabastecer
      decision = "reducir_stock"
      priority = 3
      reason = `${stock} unidades, solo ${velocityPerDay.toFixed(1)} u/día. No reabastecer.`
    } else if (stock > 0 && unitsSold === 0 && stock <= 50) {
      // Stock bajo-medio sin ventas -> descuento leve
      decision = "descuento"
      priority = 2
      reason = `${stock} unidades sin ventas en el período.`
    } else if (stock > 0 && daysOfStock >= 15 && daysOfStock <= 90) {
      // Stock razonable
      decision = "sin_accion"
      priority = 1
      reason = `Equilibrio OK. Stock para ${daysOfStock} días.`
    } else if (stock === 0 && unitsSold === 0) {
      // Sin stock y sin ventas -> evaluar si discontinuar
      decision = "sin_accion"
      priority = 1
      reason = "Sin stock ni ventas. Evaluar si continuar el producto."
    } else {
      decision = "sin_accion"
      priority = 1
      reason = daysOfStock > 0
        ? `Stock para ${daysOfStock === 999 ? "mucho tiempo" : daysOfStock + " días"}.`
        : "Sin datos suficientes."
    }

    decisions.push({
      product_id: product.id,
      name: product.title,
      thumbnail: product.thumbnail,
      stock,
      unitsSold,
      revenue,
      orderCount,
      avgPerOrder: Math.round(avgPerOrder * 10) / 10,
      velocityPerDay: Math.round(velocityPerDay * 100) / 100,
      daysOfStock: daysOfStock === 999 ? Infinity : daysOfStock,
      decision,
      priority,
      reason,
    })
  }

  // Sort by priority (high first), then by revenue (high first)
  decisions.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return b.revenue - a.revenue
  })

  return decisions
}

// ============================================================
// PAGE COMPONENT
// ============================================================

export default function DecisionesInventarioPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [filter, setFilter] = useState<Decision | "all">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const { data: orders, isLoading: loadingOrders } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })

  const { data: stockData, isLoading: loadingStock } = useProductsWithStock()

  const isLoading = loadingOrders || loadingStock

  // Calculate period days
  const periodDays = useMemo(() => {
    const diff = dateRange.to.getTime() - dateRange.from.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [dateRange])

  // Generate decisions
  const allDecisions = useMemo(() => {
    if (!orders || !stockData) return []
    return analyzeProducts(orders, stockData.products, periodDays)
  }, [orders, stockData, periodDays])

  // Summary metrics
  const summary = useMemo(() => {
    const counts = { aumentar_stock: 0, reducir_stock: 0, descuento: 0, sin_accion: 0 }
    let urgentCount = 0
    let revenueAtRisk = 0
    let stuckCapital = 0

    for (const d of allDecisions) {
      counts[d.decision]++
      if (d.priority >= 4) urgentCount++
      if (d.decision === "aumentar_stock" && d.stock === 0) {
        revenueAtRisk += d.revenue
      }
      if (d.decision === "descuento" || d.decision === "reducir_stock") {
        // Estimate stuck capital: stock * avg unit price
        if (d.unitsSold > 0) {
          stuckCapital += d.stock * (d.revenue / d.unitsSold)
        }
      }
    }

    return { counts, urgentCount, revenueAtRisk, stuckCapital }
  }, [allDecisions])

  // Filtered + searched decisions
  const filteredDecisions = useMemo(() => {
    let result = allDecisions
    if (filter !== "all") {
      result = result.filter((d) => d.decision === filter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((d) => d.name.toLowerCase().includes(q))
    }
    return result
  }, [allDecisions, filter, search])

  // Paginated
  const paginatedDecisions = useMemo(() => {
    const start = page * PAGE_SIZE
    return filteredDecisions.slice(start, start + PAGE_SIZE)
  }, [filteredDecisions, page])

  const totalPages = Math.ceil(filteredDecisions.length / PAGE_SIZE)

  // Reset page when filters change
  const handleFilterChange = (v: Decision | "all") => {
    setFilter(v)
    setPage(0)
  }
  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(0)
  }

  return (
    <div>
      <Header
        title="Reporte de Decisiones de Inventario"
        description="Análisis inteligente para decidir qué productos reabastecer, descontar o reducir"
      />

      <div className="p-6 space-y-6">
        {/* Date range */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {filteredDecisions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                exportToCSV(
                  filteredDecisions,
                  [
                    { header: "Producto", accessor: (d) => d.name },
                    { header: "Decisión", accessor: (d) => DECISION_CONFIG[d.decision].label },
                    { header: "Prioridad", accessor: (d) => d.priority },
                    { header: "Stock Actual", accessor: (d) => d.stock },
                    { header: "Unidades Vendidas", accessor: (d) => d.unitsSold },
                    { header: "Ingresos", accessor: (d) => formatCurrencyCSV(d.revenue) },
                    { header: "Velocidad (u/día)", accessor: (d) => d.velocityPerDay.toFixed(2) },
                    { header: "Días de Stock", accessor: (d) => d.daysOfStock === Infinity ? "∞" : String(d.daysOfStock) },
                    { header: "Motivo", accessor: (d) => d.reason },
                  ],
                  `decisiones_inventario_${new Date().toISOString().slice(0, 10)}`
                )
              }}
            >
              Exportar CSV
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px]" />
              ))}
            </div>
            <Skeleton className="h-[500px]" />
          </div>
        ) : (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Aumentar Stock"
                value={String(summary.counts.aumentar_stock)}
                icon={<ArrowUpCircle className="w-5 h-5 text-green-600" />}
                subtitle="Productos con alta demanda"
              />
              <MetricCard
                title="Aplicar Descuento"
                value={String(summary.counts.descuento)}
                icon={<Percent className="w-5 h-5 text-purple-600" />}
                subtitle="Productos con baja rotación"
              />
              <MetricCard
                title="Reducir Stock"
                value={String(summary.counts.reducir_stock)}
                icon={<ArrowDownCircle className="w-5 h-5 text-orange-600" />}
                subtitle="No reabastecer"
              />
              <MetricCard
                title="Acciones Urgentes"
                value={String(summary.urgentCount)}
                icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                subtitle="Prioridad 4-5"
              />
            </div>

            {/* Revenue at risk & stuck capital */}
            {(summary.revenueAtRisk > 0 || summary.stuckCapital > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.revenueAtRisk > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <TrendingDown className="w-8 h-8 text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Ingresos en Riesgo (productos sin stock que vendían)
                        </p>
                        <p className="text-xl font-bold text-red-700">
                          {formatCurrency(summary.revenueAtRisk)}
                        </p>
                        <p className="text-xs text-red-600">
                          Facturación del período de productos que ahora están sin stock
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {summary.stuckCapital > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Package className="w-8 h-8 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Capital Estimado Inmovilizado
                        </p>
                        <p className="text-xl font-bold text-orange-700">
                          {formatCurrency(summary.stuckCapital)}
                        </p>
                        <p className="text-xs text-orange-600">
                          Valor estimado del stock que necesita descuento o reducción
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Decision distribution visual */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  Distribución de Decisiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
                  {(
                    [
                      { key: "aumentar_stock" as Decision, color: "bg-green-500" },
                      { key: "descuento" as Decision, color: "bg-purple-500" },
                      { key: "reducir_stock" as Decision, color: "bg-orange-500" },
                      { key: "sin_accion" as Decision, color: "bg-gray-300" },
                    ] as const
                  ).map(({ key, color }) => {
                    const count = summary.counts[key]
                    const pct =
                      allDecisions.length > 0
                        ? (count / allDecisions.length) * 100
                        : 0
                    if (pct === 0) return null
                    return (
                      <div
                        key={key}
                        className={`${color} transition-all duration-500 relative group cursor-pointer`}
                        style={{ width: `${pct}%` }}
                        onClick={() => handleFilterChange(filter === key ? "all" : key)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {pct > 8 && (
                            <span className="text-white text-xs font-bold">
                              {count}
                            </span>
                          )}
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {DECISION_CONFIG[key].label}: {count} ({pct.toFixed(0)}%)
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  {(
                    [
                      { key: "aumentar_stock" as Decision, dot: "bg-green-500" },
                      { key: "descuento" as Decision, dot: "bg-purple-500" },
                      { key: "reducir_stock" as Decision, dot: "bg-orange-500" },
                      { key: "sin_accion" as Decision, dot: "bg-gray-400" },
                    ] as const
                  ).map(({ key, dot }) => (
                    <button
                      key={key}
                      onClick={() => handleFilterChange(filter === key ? "all" : key)}
                      className={`flex items-center gap-1.5 text-xs transition-opacity ${
                        filter !== "all" && filter !== key ? "opacity-40" : ""
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                      {DECISION_CONFIG[key].label} ({summary.counts[key]})
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={filter}
                onValueChange={(v) => handleFilterChange(v as Decision | "all")}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar decisión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las decisiones</SelectItem>
                  <SelectItem value="aumentar_stock">Aumentar Stock</SelectItem>
                  <SelectItem value="descuento">Aplicar Descuento</SelectItem>
                  <SelectItem value="reducir_stock">Reducir Stock</SelectItem>
                  <SelectItem value="sin_accion">Sin Acción</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                {filteredDecisions.length} producto{filteredDecisions.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Products table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Decisión</TableHead>
                    <TableHead className="text-center">Prioridad</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Vendidas</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Vel. (u/día)</TableHead>
                    <TableHead className="text-right">Días Stock</TableHead>
                    <TableHead className="min-w-[200px]">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDecisions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-gray-500 py-8">
                        No se encontraron productos con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDecisions.map((d, i) => {
                      const config = DECISION_CONFIG[d.decision]
                      const Icon = config.icon
                      return (
                        <TableRow key={d.product_id}>
                          <TableCell className="text-gray-400 text-sm">
                            {page * PAGE_SIZE + i + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {d.thumbnail && (
                                <img
                                  src={d.thumbnail}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover shrink-0"
                                />
                              )}
                              <span className="font-medium text-sm line-clamp-2">
                                {d.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`${config.color} gap-1 text-xs`}
                            >
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <PriorityIndicator priority={d.priority} />
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            <span
                              className={
                                d.stock === 0
                                  ? "text-red-600 font-bold"
                                  : d.stock < 10
                                    ? "text-orange-600"
                                    : ""
                              }
                            >
                              {formatNumber(d.stock)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatNumber(d.unitsSold)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatCurrency(d.revenue)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {d.velocityPerDay.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {d.daysOfStock === Infinity ? (
                              <span className="text-gray-400">∞</span>
                            ) : d.daysOfStock === 0 ? (
                              <span className="text-red-600 font-bold">0</span>
                            ) : (
                              <span
                                className={
                                  d.daysOfStock <= 7
                                    ? "text-red-600 font-bold"
                                    : d.daysOfStock <= 15
                                      ? "text-orange-600"
                                      : ""
                                }
                              >
                                {d.daysOfStock}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {d.reason}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
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

            {/* AI Widget */}
            <AIInsightWidget
              pageContext="products"
              metricsBuilder={() => {
                if (!allDecisions.length) return null
                return {
                  resumen: {
                    aumentarStock: summary.counts.aumentar_stock,
                    aplicarDescuento: summary.counts.descuento,
                    reducirStock: summary.counts.reducir_stock,
                    sinAccion: summary.counts.sin_accion,
                    accionesUrgentes: summary.urgentCount,
                    ingresosEnRiesgo: summary.revenueAtRisk,
                    capitalInmovilizado: summary.stuckCapital,
                  },
                  topAumentarStock: allDecisions
                    .filter((d) => d.decision === "aumentar_stock")
                    .slice(0, 10)
                    .map((d) => ({
                      nombre: d.name,
                      stock: d.stock,
                      vendidas: d.unitsSold,
                      velocidad: d.velocityPerDay,
                      diasStock: d.daysOfStock,
                      motivo: d.reason,
                    })),
                  topDescuento: allDecisions
                    .filter((d) => d.decision === "descuento")
                    .slice(0, 10)
                    .map((d) => ({
                      nombre: d.name,
                      stock: d.stock,
                      vendidas: d.unitsSold,
                      ingresos: d.revenue,
                      motivo: d.reason,
                    })),
                  topReducir: allDecisions
                    .filter((d) => d.decision === "reducir_stock")
                    .slice(0, 5)
                    .map((d) => ({
                      nombre: d.name,
                      stock: d.stock,
                      vendidas: d.unitsSold,
                      motivo: d.reason,
                    })),
                  periodoAnalizado: `${periodDays} días`,
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

// ============================================================
// PRIORITY INDICATOR
// ============================================================

function PriorityIndicator({ priority }: { priority: number }) {
  const dots = Array.from({ length: 5 }, (_, i) => i < priority)
  return (
    <div className="flex gap-0.5 justify-center" title={`Prioridad ${priority}/5`}>
      {dots.map((active, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${
            active
              ? priority >= 4
                ? "bg-red-500"
                : priority >= 3
                  ? "bg-orange-500"
                  : "bg-gray-400"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  )
}
