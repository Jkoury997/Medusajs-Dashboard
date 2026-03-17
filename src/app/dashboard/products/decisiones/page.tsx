"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { useAllOrders } from "@/hooks/use-orders"
import { useProductsWithStock } from "@/hooks/use-inventory"
import { useEventProducts } from "@/hooks/use-events"
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
import type { ProductStatsItem } from "@/types/events"
import {
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
  Eye,
  ShoppingCart,
  MousePointerClick,
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
  // Analytics data
  views: number
  clicks: number
  addedToCart: number
  conversionRate: number // views → purchased %
  // Decision
  decision: Decision
  priority: number // 1-5, higher = more urgent
  reason: string
}

// ============================================================
// DECISION CONFIG
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

// ============================================================
// DECISION LOGIC
// ============================================================

/**
 * Umbrales:
 * - "Sin acción" solo si stock <= 45 días
 * - > 45 días ya requiere acción (descuento o reducir)
 *
 * Señales de analítica:
 * - Muchas vistas + pocas ventas → problema de precio → descuento
 * - Muchos cart adds + pocas compras → fricción o precio → descuento
 * - Sin vistas ni ventas + stock alto → producto invisible → reducir/descuento
 * - Vistas altas + sin stock → demanda real → urgente reabastecer
 */
function analyzeProducts(
  orders: any[],
  productsWithStock: { id: string; title: string; thumbnail: string | null; totalStock: number; variants: any[] }[],
  periodDays: number,
  eventProducts: ProductStatsItem[]
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

  // Index event analytics by product_id
  const eventsByProduct = new Map<string, ProductStatsItem>()
  for (const ep of eventProducts) {
    eventsByProduct.set(ep.product_id, ep)
  }

  const decisions: ProductDecision[] = []

  for (const product of productsWithStock) {
    const sales = salesByProduct.get(product.id)
    const events = eventsByProduct.get(product.id)

    const unitsSold = sales?.units || 0
    const revenue = sales?.revenue || 0
    const orderCount = sales?.orders.size || 0
    const stock = product.totalStock
    const avgPerOrder = orderCount > 0 ? unitsSold / orderCount : 0
    const velocityPerDay = periodDays > 0 ? unitsSold / periodDays : 0
    const daysOfStock =
      velocityPerDay > 0 ? Math.round(stock / velocityPerDay) : stock > 0 ? 999 : 0

    // Analytics signals
    const views = events?.views || 0
    const clicks = events?.clicks || 0
    const addedToCart = events?.added_to_cart || 0
    const purchased = events?.purchased || 0
    const conversionRate = views > 0 ? (purchased / views) * 100 : 0

    // Derived signals
    const hasHighViews = views >= 20
    const hasCartAdds = addedToCart >= 3
    const hasLowConversion = views > 10 && conversionRate < 2
    const isInvisible = views === 0 && clicks === 0

    // Decision logic — thresholds adjusted: sin accion only up to 45 days
    let decision: Decision = "sin_accion"
    let priority = 1
    let reason = ""

    // ── AUMENTAR STOCK ──────────────────────────────────────────
    if (stock === 0 && unitsSold > 0) {
      decision = "aumentar_stock"
      priority = 5
      reason = `Sin stock. Vendió ${unitsSold} u. en el período.`
      if (hasHighViews) {
        reason += ` ${views} vistas confirman demanda activa.`
      }
    } else if (stock === 0 && hasHighViews) {
      // Sin stock pero la gente lo busca/ve
      decision = "aumentar_stock"
      priority = 5
      reason = `Sin stock con ${views} vistas y ${addedToCart} intentos de carrito. Demanda real.`
    } else if (stock > 0 && velocityPerDay > 0 && daysOfStock <= 7) {
      decision = "aumentar_stock"
      priority = 4
      reason = `Solo ${daysOfStock} días de stock. Vel: ${velocityPerDay.toFixed(1)} u/día.`
    } else if (stock > 0 && velocityPerDay > 0 && daysOfStock <= 15) {
      decision = "aumentar_stock"
      priority = 3
      reason = `${daysOfStock} días de stock. Vel: ${velocityPerDay.toFixed(1)} u/día.`
      if (hasHighViews) reason += ` ${views} vistas respaldan demanda.`
    }
    // ── DESCUENTO ────────────────────────────────────────────────
    else if (stock > 50 && unitsSold === 0 && !hasHighViews) {
      // Mucho stock, sin ventas, nadie lo ve → descuento agresivo
      decision = "descuento"
      priority = 5
      reason = `${stock} u. sin ventas ni visibilidad. Capital inmovilizado.`
    } else if (stock > 50 && unitsSold === 0 && hasHighViews) {
      // Lo ven pero no compran → precio es el problema
      decision = "descuento"
      priority = 5
      reason = `${stock} u. sin ventas pero ${views} vistas. El precio frena la compra.`
    } else if (hasHighViews && hasLowConversion && stock > 0 && daysOfStock > 45) {
      // Muchas vistas, baja conversión, stock alto → descuento para convertir
      decision = "descuento"
      priority = 4
      reason = `${views} vistas, ${conversionRate.toFixed(1)}% conversión. Descuento para mejorar conversión.`
    } else if (hasCartAdds && purchased === 0 && stock > 0) {
      // Agregan al carrito pero no compran → precio
      decision = "descuento"
      priority = 4
      reason = `${addedToCart} agregados al carrito sin compra. Barrera de precio.`
    } else if (stock > 20 && daysOfStock > 90) {
      decision = "descuento"
      priority = 4
      reason = `Stock para ${daysOfStock > 365 ? "+1 año" : daysOfStock + " días"}. Baja rotación.`
      if (isInvisible) reason += " Sin vistas en el período."
    } else if (stock > 0 && daysOfStock > 45 && daysOfStock <= 90) {
      // Más de 45 días de stock → ya necesita acción
      decision = "descuento"
      priority = 3
      reason = `Stock para ${daysOfStock} días (supera los 45d). Rotación lenta.`
      if (hasHighViews && hasLowConversion) {
        reason += ` ${views} vistas con baja conversión (${conversionRate.toFixed(1)}%).`
      }
    } else if (stock > 0 && unitsSold === 0 && stock <= 50) {
      decision = "descuento"
      priority = 2
      reason = `${stock} u. sin ventas en el período.`
      if (hasHighViews) reason += ` Tiene ${views} vistas, descuento puede destrabar.`
    }
    // ── REDUCIR STOCK ────────────────────────────────────────────
    else if (stock > 100 && velocityPerDay < 0.5 && unitsSold > 0 && isInvisible) {
      // Stock altísimo, venta mínima, nadie lo ve → no reabastecer
      decision = "reducir_stock"
      priority = 4
      reason = `${stock} u., ${velocityPerDay.toFixed(1)} u/día, sin vistas. No reabastecer.`
    } else if (stock > 100 && velocityPerDay < 0.5 && unitsSold > 0) {
      decision = "reducir_stock"
      priority = 3
      reason = `${stock} u., solo ${velocityPerDay.toFixed(1)} u/día. No reabastecer.`
    }
    // ── SIN ACCIÓN ───────────────────────────────────────────────
    else if (stock > 0 && daysOfStock >= 15 && daysOfStock <= 45) {
      // Solo "sin acción" si stock es para 15-45 días
      decision = "sin_accion"
      priority = 1
      reason = `Equilibrio OK. Stock para ${daysOfStock} días.`
      if (views > 0) reason += ` ${views} vistas, ${conversionRate.toFixed(1)}% conversión.`
    } else if (stock === 0 && unitsSold === 0) {
      decision = "sin_accion"
      priority = 1
      reason = "Sin stock ni ventas."
      if (hasHighViews) {
        // Sin stock pero con vistas → reabastecer
        decision = "aumentar_stock"
        priority = 3
        reason = `Sin stock ni ventas pero ${views} vistas. Hay interés, evaluar reposición.`
      } else {
        reason += " Evaluar si discontinuar."
      }
    } else {
      decision = "sin_accion"
      priority = 1
      reason = daysOfStock > 0
        ? `Stock para ${daysOfStock === 999 ? "mucho tiempo" : daysOfStock + " días"}.`
        : "Sin datos suficientes."
      // Catch-all: si tiene más de 45 días de stock, marcar descuento
      if (daysOfStock > 45 && stock > 0) {
        decision = "descuento"
        priority = 2
        reason = `Stock para ${daysOfStock === 999 ? "mucho tiempo" : daysOfStock + " días"}. Supera 45 días.`
      }
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
      views,
      clicks,
      addedToCart,
      conversionRate: Math.round(conversionRate * 10) / 10,
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

  const { data: eventProductsData, isLoading: loadingEvents } = useEventProducts(
    dateRange.from,
    dateRange.to,
    500 // traer todos los productos con analytics
  )

  const isLoading = loadingOrders || loadingStock

  // Calculate period days
  const periodDays = useMemo(() => {
    const diff = dateRange.to.getTime() - dateRange.from.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [dateRange])

  // Generate decisions
  const allDecisions = useMemo(() => {
    if (!orders || !stockData) return []
    return analyzeProducts(
      orders,
      stockData.products,
      periodDays,
      eventProductsData?.products || []
    )
  }, [orders, stockData, periodDays, eventProductsData])

  // Summary metrics
  const summary = useMemo(() => {
    const counts = { aumentar_stock: 0, reducir_stock: 0, descuento: 0, sin_accion: 0 }
    let urgentCount = 0
    let revenueAtRisk = 0
    let stuckCapital = 0
    let totalViews = 0
    let totalCartAdds = 0

    for (const d of allDecisions) {
      counts[d.decision]++
      if (d.priority >= 4) urgentCount++
      totalViews += d.views
      totalCartAdds += d.addedToCart
      if (d.decision === "aumentar_stock" && d.stock === 0) {
        revenueAtRisk += d.revenue
      }
      if (d.decision === "descuento" || d.decision === "reducir_stock") {
        if (d.unitsSold > 0) {
          stuckCapital += d.stock * (d.revenue / d.unitsSold)
        }
      }
    }

    return { counts, urgentCount, revenueAtRisk, stuckCapital, totalViews, totalCartAdds }
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
        description="Análisis cruzado de ventas, stock y comportamiento del usuario para tomar decisiones"
      />

      <div className="p-6 space-y-6">
        {/* Date range + export */}
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
                    { header: "Vistas", accessor: (d) => d.views },
                    { header: "Clicks", accessor: (d) => d.clicks },
                    { header: "Agregados Carrito", accessor: (d) => d.addedToCart },
                    { header: "Conversión %", accessor: (d) => d.conversionRate.toFixed(1) + "%" },
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

        {/* Data sources indicator */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loadingOrders ? "bg-yellow-400 animate-pulse" : orders ? "bg-green-500" : "bg-gray-300"}`} />
            Ventas (Medusa)
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loadingStock ? "bg-yellow-400 animate-pulse" : stockData ? "bg-green-500" : "bg-gray-300"}`} />
            Inventario
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loadingEvents ? "bg-yellow-400 animate-pulse" : eventProductsData ? "bg-green-500" : "bg-gray-300"}`} />
            Analítica (Eventos)
          </span>
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
                subtitle="Stock > 45 días o baja conversión"
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
                          Ingresos en Riesgo (sin stock que vendían)
                        </p>
                        <p className="text-xl font-bold text-red-700">
                          {formatCurrency(summary.revenueAtRisk)}
                        </p>
                        <p className="text-xs text-red-600">
                          Facturación del período de productos ahora sin stock
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

            {/* Analytics signal summary */}
            {(summary.totalViews > 0 || summary.totalCartAdds > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Eye className="w-6 h-6 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Vistas Totales</p>
                      <p className="text-lg font-bold">{formatNumber(summary.totalViews)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-purple-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Agregados al Carrito</p>
                      <p className="text-lg font-bold">{formatNumber(summary.totalCartAdds)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <MousePointerClick className="w-6 h-6 text-green-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Productos con Datos de Analítica</p>
                      <p className="text-lg font-bold">
                        {allDecisions.filter((d) => d.views > 0).length} de {allDecisions.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Decisión</TableHead>
                    <TableHead className="text-center">Prior.</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Vendidas</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Vel.</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <Eye className="w-3 h-3" /> Vistas
                      </span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1">
                        <ShoppingCart className="w-3 h-3" /> Carrito
                      </span>
                    </TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="min-w-[180px]">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDecisions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-gray-500 py-8">
                        No se encontraron productos con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDecisions.map((d, i) => {
                      const config = DECISION_CONFIG[d.decision]
                      const Icon = config.icon
                      return (
                        <TableRow key={d.product_id}>
                          <TableCell className="text-gray-400 text-xs">
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
                            {d.velocityPerDay.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {d.daysOfStock === Infinity ? (
                              <span className="text-red-600 font-bold">∞</span>
                            ) : d.daysOfStock === 0 ? (
                              <span className="text-red-600 font-bold">0</span>
                            ) : (
                              <span
                                className={
                                  d.daysOfStock <= 7
                                    ? "text-red-600 font-bold"
                                    : d.daysOfStock <= 15
                                      ? "text-orange-600"
                                      : d.daysOfStock > 45
                                        ? "text-purple-600 font-semibold"
                                        : ""
                                }
                              >
                                {d.daysOfStock}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {d.views > 0 ? (
                              formatNumber(d.views)
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {d.addedToCart > 0 ? (
                              formatNumber(d.addedToCart)
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {d.views > 0 ? (
                              <span
                                className={
                                  d.conversionRate < 2
                                    ? "text-red-600"
                                    : d.conversionRate >= 5
                                      ? "text-green-600"
                                      : ""
                                }
                              >
                                {d.conversionRate.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
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
                      vistas: d.views,
                      carrito: d.addedToCart,
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
                      vistas: d.views,
                      conversion: d.conversionRate + "%",
                      carrito: d.addedToCart,
                      motivo: d.reason,
                    })),
                  topReducir: allDecisions
                    .filter((d) => d.decision === "reducir_stock")
                    .slice(0, 5)
                    .map((d) => ({
                      nombre: d.name,
                      stock: d.stock,
                      vendidas: d.unitsSold,
                      vistas: d.views,
                      motivo: d.reason,
                    })),
                  periodoAnalizado: `${periodDays} días`,
                  datosAnalitica: {
                    productosConVistas: allDecisions.filter((d) => d.views > 0).length,
                    totalVistas: summary.totalViews,
                    totalCarrito: summary.totalCartAdds,
                  },
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
