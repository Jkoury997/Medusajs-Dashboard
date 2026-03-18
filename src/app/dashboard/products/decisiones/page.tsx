"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { filterPaidOrders } from "@/lib/aggregations"
import { formatCurrency, formatNumber, formatDate } from "@/lib/format"
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
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  History,
  Trash2,
} from "lucide-react"

// ============================================================
// TYPES
// ============================================================

type Decision = "aumentar_stock" | "reducir_stock" | "descuento" | "sin_accion"

type ActionType =
  | "pedido_reposicion"
  | "descuento_aplicado"
  | "no_reabastecer"
  | "discontinuar"
  | "marketing"
  | "otro"

interface TrackedAction {
  id: string
  productId: string
  productName: string
  decision: Decision
  actionType: ActionType
  note: string
  date: string // ISO
  resolved: boolean
  resolvedDate?: string
  resolvedNote?: string
}

interface VariantStockInfo {
  id: string
  title: string
  sku: string | null
  stock: number
}

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
  // Variants
  variants: VariantStockInfo[]
  variantsOutOfStock: number
  variantsTotal: number
  hasVariantProblem: boolean // some variants out of stock
  // Analytics
  views: number
  clicks: number
  addedToCart: number
  conversionRate: number
  // Decision
  decision: Decision
  priority: number
  reason: string
}

// ============================================================
// ACTION TRACKING (localStorage)
// ============================================================

const ACTIONS_KEY = "inventory-decision-actions"

function loadActions(): TrackedAction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ACTIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveActions(actions: TrackedAction[]) {
  try {
    localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions))
  } catch {
    /* SSR / incognito */
  }
}

// ============================================================
// ACTION CONFIG
// ============================================================

const ACTION_TYPES: { value: ActionType; label: string; emoji: string }[] = [
  { value: "pedido_reposicion", label: "Pedí reposición", emoji: "📦" },
  { value: "descuento_aplicado", label: "Apliqué descuento", emoji: "🏷️" },
  { value: "no_reabastecer", label: "No reabastecer", emoji: "🚫" },
  { value: "discontinuar", label: "Discontinuar producto", emoji: "❌" },
  { value: "marketing", label: "Acción de marketing", emoji: "📣" },
  { value: "otro", label: "Otra acción", emoji: "📝" },
]

function getActionLabel(type: ActionType): string {
  return ACTION_TYPES.find((a) => a.value === type)?.label || type
}

function getActionEmoji(type: ActionType): string {
  return ACTION_TYPES.find((a) => a.value === type)?.emoji || "📝"
}

// ============================================================
// DECISION CONFIG
// ============================================================

const DECISION_CONFIG = {
  aumentar_stock: {
    label: "Aumentar Stock",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: ArrowUpCircle,
  },
  reducir_stock: {
    label: "Reducir Stock",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: ArrowDownCircle,
  },
  descuento: {
    label: "Aplicar Descuento",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Tag,
  },
  sin_accion: {
    label: "Sin Acción",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: PackageCheck,
  },
}

// ============================================================
// DECISION LOGIC
// ============================================================

function analyzeProducts(
  orders: any[],
  productsWithStock: { id: string; title: string; thumbnail: string | null; totalStock: number; variants: any[] }[],
  periodDays: number,
  eventProducts: ProductStatsItem[]
): ProductDecision[] {
  const paidOrders = filterPaidOrders(orders)

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

    // Variant analysis
    const managedVariants = (product.variants || []).filter((v: any) => v.manage_inventory)
    const variants: VariantStockInfo[] = managedVariants.map((v: any) => ({
      id: v.id,
      title: v.title || "Sin nombre",
      sku: v.sku || null,
      stock: v.inventory_quantity || 0,
    }))
    const variantsOutOfStock = variants.filter((v) => v.stock <= 0).length
    const variantsTotal = variants.length
    const hasVariantProblem = variantsTotal > 1 && variantsOutOfStock > 0 && stock > 0

    // Analytics signals
    const views = events?.views || 0
    const clicks = events?.clicks || 0
    const addedToCart = events?.added_to_cart || 0
    const purchased = events?.purchased || 0
    const conversionRate = views > 0 ? (purchased / views) * 100 : 0

    const hasHighViews = views >= 20
    const hasCartAdds = addedToCart >= 3
    const hasLowConversion = views > 10 && conversionRate < 2
    const isInvisible = views === 0 && clicks === 0

    let decision: Decision = "sin_accion"
    let priority = 1
    let reason = ""

    // ── VARIANT PROBLEM BOOST ────────────────────────────────────
    // If product has stock but key variants are missing, boost priority
    const variantNote = hasVariantProblem
      ? ` ${variantsOutOfStock}/${variantsTotal} variantes sin stock.`
      : ""

    // ── AUMENTAR STOCK ──────────────────────────────────────────
    if (stock === 0 && unitsSold > 0) {
      decision = "aumentar_stock"
      priority = 5
      reason = `Sin stock. Vendió ${unitsSold} u. en el período.`
      if (hasHighViews) reason += ` ${views} vistas confirman demanda.`
    } else if (stock === 0 && hasHighViews) {
      decision = "aumentar_stock"
      priority = 5
      reason = `Sin stock con ${views} vistas y ${addedToCart} intentos de carrito. Demanda real.`
    } else if (hasVariantProblem && unitsSold > 0 && variantsOutOfStock >= variantsTotal / 2) {
      // Más de la mitad de variantes sin stock + vende → urgente
      decision = "aumentar_stock"
      priority = 4
      reason = `${variantsOutOfStock}/${variantsTotal} variantes sin stock (talles/colores). Vendió ${unitsSold} u. Perdiendo ventas por falta de opciones.`
    } else if (stock > 0 && velocityPerDay > 0 && daysOfStock <= 7) {
      decision = "aumentar_stock"
      priority = 4
      reason = `Solo ${daysOfStock} días de stock. Vel: ${velocityPerDay.toFixed(1)} u/día.${variantNote}`
    } else if (hasVariantProblem && unitsSold > 0) {
      decision = "aumentar_stock"
      priority = 3
      reason = `${variantsOutOfStock}/${variantsTotal} variantes sin stock. Vendió ${unitsSold} u. Reponer variantes faltantes.`
    } else if (stock > 0 && velocityPerDay > 0 && daysOfStock <= 15) {
      decision = "aumentar_stock"
      priority = 3
      reason = `${daysOfStock} días de stock. Vel: ${velocityPerDay.toFixed(1)} u/día.${variantNote}`
      if (hasHighViews) reason += ` ${views} vistas respaldan demanda.`
    }
    // ── DESCUENTO ────────────────────────────────────────────────
    else if (stock > 50 && unitsSold === 0 && !hasHighViews) {
      decision = "descuento"
      priority = 5
      reason = `${stock} u. sin ventas ni visibilidad. Capital inmovilizado.`
    } else if (stock > 50 && unitsSold === 0 && hasHighViews) {
      decision = "descuento"
      priority = 5
      reason = `${stock} u. sin ventas pero ${views} vistas. El precio frena la compra.`
    } else if (hasHighViews && hasLowConversion && stock > 0 && daysOfStock > 45) {
      decision = "descuento"
      priority = 4
      reason = `${views} vistas, ${conversionRate.toFixed(1)}% conversión. Descuento para mejorar conversión.${variantNote}`
    } else if (hasCartAdds && purchased === 0 && stock > 0) {
      decision = "descuento"
      priority = 4
      reason = `${addedToCart} agregados al carrito sin compra. Barrera de precio.${variantNote}`
    } else if (stock > 20 && daysOfStock > 90) {
      decision = "descuento"
      priority = 4
      reason = `Stock para ${daysOfStock > 365 ? "+1 año" : daysOfStock + " días"}. Baja rotación.`
      if (isInvisible) reason += " Sin vistas en el período."
    } else if (stock > 0 && daysOfStock > 45 && daysOfStock <= 90) {
      decision = "descuento"
      priority = 3
      reason = `Stock para ${daysOfStock} días (supera 45d). Rotación lenta.${variantNote}`
      if (hasHighViews && hasLowConversion) {
        reason += ` ${views} vistas con baja conversión (${conversionRate.toFixed(1)}%).`
      }
    } else if (stock > 0 && unitsSold === 0 && stock <= 50) {
      decision = "descuento"
      priority = 2
      reason = `${stock} u. sin ventas en el período.${variantNote}`
      if (hasHighViews) reason += ` Tiene ${views} vistas, descuento puede destrabar.`
    }
    // ── REDUCIR STOCK ────────────────────────────────────────────
    else if (stock > 100 && velocityPerDay < 0.5 && unitsSold > 0 && isInvisible) {
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
      decision = "sin_accion"
      priority = 1
      reason = `Equilibrio OK. Stock para ${daysOfStock} días.${variantNote}`
      if (views > 0) reason += ` ${views} vistas, ${conversionRate.toFixed(1)}% conversión.`
      // Variant problem can upgrade even "OK" products
      if (hasVariantProblem && unitsSold > 0) {
        decision = "aumentar_stock"
        priority = 2
        reason = `Stock general OK (${daysOfStock}d) pero ${variantsOutOfStock}/${variantsTotal} variantes sin stock. Reponer variantes.`
      }
    } else if (stock === 0 && unitsSold === 0) {
      decision = "sin_accion"
      priority = 1
      reason = "Sin stock ni ventas."
      if (hasHighViews) {
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
        ? `Stock para ${daysOfStock === 999 ? "mucho tiempo" : daysOfStock + " días"}.${variantNote}`
        : "Sin datos suficientes."
      if (daysOfStock > 45 && stock > 0) {
        decision = "descuento"
        priority = 2
        reason = `Stock para ${daysOfStock === 999 ? "mucho tiempo" : daysOfStock + " días"}. Supera 45 días.${variantNote}`
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
      variants,
      variantsOutOfStock,
      variantsTotal,
      hasVariantProblem,
      views,
      clicks,
      addedToCart,
      conversionRate: Math.round(conversionRate * 10) / 10,
      decision,
      priority,
      reason,
    })
  }

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

  // Action tracking state
  const [actions, setActions] = useState<TrackedAction[]>([])
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionProduct, setActionProduct] = useState<ProductDecision | null>(null)
  const [actionType, setActionType] = useState<ActionType>("pedido_reposicion")
  const [actionNote, setActionNote] = useState("")
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolveAction, setResolveAction] = useState<TrackedAction | null>(null)
  const [resolveNote, setResolveNote] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Load actions from localStorage
  useEffect(() => {
    setActions(loadActions())
  }, [])

  const { data: orders, isLoading: loadingOrders } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })

  const { data: stockData, isLoading: loadingStock } = useProductsWithStock()

  const { data: eventProductsData, isLoading: loadingEvents } = useEventProducts(
    dateRange.from,
    dateRange.to,
    500
  )

  const isLoading = loadingOrders || loadingStock

  const periodDays = useMemo(() => {
    const diff = dateRange.to.getTime() - dateRange.from.getTime()
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [dateRange])

  const allDecisions = useMemo(() => {
    if (!orders || !stockData) return []
    return analyzeProducts(
      orders,
      stockData.products,
      periodDays,
      eventProductsData?.products || []
    )
  }, [orders, stockData, periodDays, eventProductsData])

  // Actions index by product
  const actionsByProduct = useMemo(() => {
    const map = new Map<string, TrackedAction[]>()
    for (const a of actions) {
      const existing = map.get(a.productId) || []
      existing.push(a)
      map.set(a.productId, existing)
    }
    return map
  }, [actions])

  const pendingActions = useMemo(
    () => actions.filter((a) => !a.resolved),
    [actions]
  )

  // Summary
  const summary = useMemo(() => {
    const counts = { aumentar_stock: 0, reducir_stock: 0, descuento: 0, sin_accion: 0 }
    let urgentCount = 0
    let revenueAtRisk = 0
    let stuckCapital = 0
    let totalViews = 0
    let totalCartAdds = 0
    let variantProblems = 0

    for (const d of allDecisions) {
      counts[d.decision]++
      if (d.priority >= 4) urgentCount++
      totalViews += d.views
      totalCartAdds += d.addedToCart
      if (d.hasVariantProblem) variantProblems++
      if (d.decision === "aumentar_stock" && d.stock === 0) {
        revenueAtRisk += d.revenue
      }
      if (d.decision === "descuento" || d.decision === "reducir_stock") {
        if (d.unitsSold > 0) {
          stuckCapital += d.stock * (d.revenue / d.unitsSold)
        }
      }
    }

    return { counts, urgentCount, revenueAtRisk, stuckCapital, totalViews, totalCartAdds, variantProblems }
  }, [allDecisions])

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

  // ── Action handlers ──────────────────────────────────────────

  const openActionDialog = (product: ProductDecision) => {
    setActionProduct(product)
    // Pre-select action based on decision
    const defaultAction: Record<Decision, ActionType> = {
      aumentar_stock: "pedido_reposicion",
      descuento: "descuento_aplicado",
      reducir_stock: "no_reabastecer",
      sin_accion: "otro",
    }
    setActionType(defaultAction[product.decision])
    setActionNote("")
    setActionDialogOpen(true)
  }

  const saveAction = useCallback(() => {
    if (!actionProduct) return
    const newAction: TrackedAction = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      productId: actionProduct.product_id,
      productName: actionProduct.name,
      decision: actionProduct.decision,
      actionType,
      note: actionNote.trim(),
      date: new Date().toISOString(),
      resolved: false,
    }
    const updated = [newAction, ...actions]
    setActions(updated)
    saveActions(updated)
    setActionDialogOpen(false)
  }, [actionProduct, actionType, actionNote, actions])

  const resolveActionHandler = useCallback(() => {
    if (!resolveAction) return
    const updated = actions.map((a) =>
      a.id === resolveAction.id
        ? { ...a, resolved: true, resolvedDate: new Date().toISOString(), resolvedNote: resolveNote.trim() || undefined }
        : a
    )
    setActions(updated)
    saveActions(updated)
    setResolveDialogOpen(false)
    setResolveAction(null)
    setResolveNote("")
  }, [resolveAction, resolveNote, actions])

  const deleteAction = useCallback(
    (id: string) => {
      const updated = actions.filter((a) => a.id !== id)
      setActions(updated)
      saveActions(updated)
    },
    [actions]
  )

  const toggleRow = (productId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  return (
    <div>
      <Header
        title="Reporte de Decisiones de Inventario"
        description="Análisis cruzado de ventas, stock, variantes y comportamiento del usuario"
      />

      <div className="p-6 space-y-6">
        {/* Date range + actions */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <div className="flex gap-2">
            {pendingActions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryDialogOpen(true)}
                className="gap-1.5"
              >
                <ClipboardList className="w-4 h-4" />
                Seguimiento ({pendingActions.length})
              </Button>
            )}
            {actions.length > 0 && pendingActions.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryDialogOpen(true)}
                className="gap-1.5"
              >
                <History className="w-4 h-4" />
                Historial
              </Button>
            )}
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
                      { header: "Variantes Sin Stock", accessor: (d) => `${d.variantsOutOfStock}/${d.variantsTotal}` },
                      { header: "Unidades Vendidas", accessor: (d) => d.unitsSold },
                      { header: "Ingresos", accessor: (d) => formatCurrencyCSV(d.revenue) },
                      { header: "Velocidad (u/día)", accessor: (d) => d.velocityPerDay.toFixed(2) },
                      { header: "Días de Stock", accessor: (d) => d.daysOfStock === Infinity ? "∞" : String(d.daysOfStock) },
                      { header: "Vistas", accessor: (d) => d.views },
                      { header: "Carrito", accessor: (d) => d.addedToCart },
                      { header: "Conversión %", accessor: (d) => d.conversionRate.toFixed(1) + "%" },
                      { header: "Acción Tomada", accessor: (d) => {
                        const pa = actionsByProduct.get(d.product_id)
                        if (!pa?.length) return "—"
                        return pa.map((a) => `${getActionLabel(a.actionType)}${a.resolved ? " (resuelto)" : ""}`).join(", ")
                      }},
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
        </div>

        {/* Data sources */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loadingOrders ? "bg-yellow-400 animate-pulse" : orders ? "bg-green-500" : "bg-gray-300"}`} />
            Ventas
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loadingStock ? "bg-yellow-400 animate-pulse" : stockData ? "bg-green-500" : "bg-gray-300"}`} />
            Inventario + Variantes
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${loadingEvents ? "bg-yellow-400 animate-pulse" : eventProductsData ? "bg-green-500" : "bg-gray-300"}`} />
            Analítica
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Aumentar Stock"
                value={String(summary.counts.aumentar_stock)}
                icon={<ArrowUpCircle className="w-5 h-5 text-green-600" />}
                subtitle="Alta demanda"
              />
              <MetricCard
                title="Aplicar Descuento"
                value={String(summary.counts.descuento)}
                icon={<Percent className="w-5 h-5 text-purple-600" />}
                subtitle="Stock > 45 días"
              />
              <MetricCard
                title="Reducir Stock"
                value={String(summary.counts.reducir_stock)}
                icon={<ArrowDownCircle className="w-5 h-5 text-orange-600" />}
                subtitle="No reabastecer"
              />
              <MetricCard
                title="Urgentes"
                value={String(summary.urgentCount)}
                icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                subtitle="Prioridad 4-5"
              />
              <MetricCard
                title="Problema Variantes"
                value={String(summary.variantProblems)}
                icon={<Package className="w-5 h-5 text-blue-600" />}
                subtitle="Talles/colores sin stock"
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
                        <p className="text-sm font-medium text-red-800">Ingresos en Riesgo</p>
                        <p className="text-xl font-bold text-red-700">{formatCurrency(summary.revenueAtRisk)}</p>
                        <p className="text-xs text-red-600">Productos sin stock que vendían</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {summary.stuckCapital > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Package className="w-8 h-8 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Capital Inmovilizado</p>
                        <p className="text-xl font-bold text-orange-700">{formatCurrency(summary.stuckCapital)}</p>
                        <p className="text-xs text-orange-600">Stock que necesita descuento o reducción</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Analytics summary */}
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
                      <p className="text-xs text-gray-500">Con Datos Analítica</p>
                      <p className="text-lg font-bold">
                        {allDecisions.filter((d) => d.views > 0).length}/{allDecisions.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Distribution bar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  Distribución de Decisiones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 h-8 rounded-lg overflow-hidden">
                  {([
                    { key: "aumentar_stock" as Decision, color: "bg-green-500" },
                    { key: "descuento" as Decision, color: "bg-purple-500" },
                    { key: "reducir_stock" as Decision, color: "bg-orange-500" },
                    { key: "sin_accion" as Decision, color: "bg-gray-300" },
                  ]).map(({ key, color }) => {
                    const count = summary.counts[key]
                    const pct = allDecisions.length > 0 ? (count / allDecisions.length) * 100 : 0
                    if (pct === 0) return null
                    return (
                      <div
                        key={key}
                        className={`${color} transition-all duration-500 relative group cursor-pointer`}
                        style={{ width: `${pct}%` }}
                        onClick={() => handleFilterChange(filter === key ? "all" : key)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          {pct > 8 && <span className="text-white text-xs font-bold">{count}</span>}
                        </div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {DECISION_CONFIG[key].label}: {count} ({pct.toFixed(0)}%)
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  {([
                    { key: "aumentar_stock" as Decision, dot: "bg-green-500" },
                    { key: "descuento" as Decision, dot: "bg-purple-500" },
                    { key: "reducir_stock" as Decision, dot: "bg-orange-500" },
                    { key: "sin_accion" as Decision, dot: "bg-gray-400" },
                  ]).map(({ key, dot }) => (
                    <button
                      key={key}
                      onClick={() => handleFilterChange(filter === key ? "all" : key)}
                      className={`flex items-center gap-1.5 text-xs transition-opacity ${filter !== "all" && filter !== key ? "opacity-40" : ""}`}
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
              <Select value={filter} onValueChange={(v) => handleFilterChange(v as Decision | "all")}>
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
                    <TableHead className="w-[30px]" />
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Decisión</TableHead>
                    <TableHead className="text-center">Prior.</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-center">Variantes</TableHead>
                    <TableHead className="text-right">Vendidas</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1"><Eye className="w-3 h-3" />Vistas</span>
                    </TableHead>
                    <TableHead className="text-right">
                      <span className="flex items-center justify-end gap-1"><ShoppingCart className="w-3 h-3" />Cart</span>
                    </TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="min-w-[200px]">Motivo</TableHead>
                    <TableHead className="text-center min-w-[110px]">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDecisions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center text-gray-500 py-8">
                        No se encontraron productos.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDecisions.map((d) => {
                      const config = DECISION_CONFIG[d.decision]
                      const Icon = config.icon
                      const isExpanded = expandedRows.has(d.product_id)
                      const productActions = actionsByProduct.get(d.product_id) || []
                      const hasPendingAction = productActions.some((a) => !a.resolved)
                      const hasResolvedAction = productActions.some((a) => a.resolved)

                      return (
                        <>
                          <TableRow key={d.product_id} className={hasPendingAction ? "bg-yellow-50/50" : hasResolvedAction ? "bg-green-50/30" : ""}>
                            {/* Expand */}
                            <TableCell className="px-2">
                              {(d.variantsTotal > 1 || productActions.length > 0) && (
                                <button onClick={() => toggleRow(d.product_id)} className="p-0.5 text-gray-400 hover:text-gray-700">
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                              )}
                            </TableCell>
                            {/* Product */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {d.thumbnail && (
                                  <img src={d.thumbnail} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                                )}
                                <div>
                                  <span className="font-medium text-sm line-clamp-1">{d.name}</span>
                                  {d.hasVariantProblem && (
                                    <span className="text-[10px] text-blue-600 block">
                                      {d.variantsOutOfStock} variante{d.variantsOutOfStock > 1 ? "s" : ""} sin stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            {/* Decision */}
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`${config.color} gap-1 text-xs`}>
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            {/* Priority */}
                            <TableCell className="text-center">
                              <PriorityIndicator priority={d.priority} />
                            </TableCell>
                            {/* Stock */}
                            <TableCell className="text-right font-mono text-sm">
                              <span className={d.stock === 0 ? "text-red-600 font-bold" : d.stock < 10 ? "text-orange-600" : ""}>
                                {formatNumber(d.stock)}
                              </span>
                            </TableCell>
                            {/* Variants */}
                            <TableCell className="text-center text-xs">
                              {d.variantsTotal > 0 ? (
                                <span className={d.hasVariantProblem ? "text-blue-600 font-semibold" : "text-gray-500"}>
                                  {d.variantsTotal - d.variantsOutOfStock}/{d.variantsTotal}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </TableCell>
                            {/* Sold */}
                            <TableCell className="text-right font-mono text-sm">
                              {formatNumber(d.unitsSold)}
                            </TableCell>
                            {/* Revenue */}
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(d.revenue)}
                            </TableCell>
                            {/* Days */}
                            <TableCell className="text-right font-mono text-sm">
                              {d.daysOfStock === Infinity ? (
                                <span className="text-red-600 font-bold">∞</span>
                              ) : d.daysOfStock === 0 ? (
                                <span className="text-red-600 font-bold">0</span>
                              ) : (
                                <span className={
                                  d.daysOfStock <= 7 ? "text-red-600 font-bold" :
                                  d.daysOfStock <= 15 ? "text-orange-600" :
                                  d.daysOfStock > 45 ? "text-purple-600 font-semibold" : ""
                                }>
                                  {d.daysOfStock}
                                </span>
                              )}
                            </TableCell>
                            {/* Views */}
                            <TableCell className="text-right font-mono text-sm">
                              {d.views > 0 ? formatNumber(d.views) : <span className="text-gray-300">—</span>}
                            </TableCell>
                            {/* Cart */}
                            <TableCell className="text-right font-mono text-sm">
                              {d.addedToCart > 0 ? formatNumber(d.addedToCart) : <span className="text-gray-300">—</span>}
                            </TableCell>
                            {/* Conversion */}
                            <TableCell className="text-right font-mono text-sm">
                              {d.views > 0 ? (
                                <span className={d.conversionRate < 2 ? "text-red-600" : d.conversionRate >= 5 ? "text-green-600" : ""}>
                                  {d.conversionRate.toFixed(1)}%
                                </span>
                              ) : <span className="text-gray-300">—</span>}
                            </TableCell>
                            {/* Reason */}
                            <TableCell className="text-xs text-gray-600 min-w-[200px] max-w-[300px]">
                              <span className="block whitespace-normal break-words">{d.reason}</span>
                            </TableCell>
                            {/* Action button */}
                            <TableCell className="text-center whitespace-nowrap min-w-[110px]">
                              {hasPendingAction ? (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 gap-1 text-[10px] cursor-pointer" onClick={() => toggleRow(d.product_id)}>
                                  <ClipboardList className="w-3 h-3" />
                                  En curso
                                </Badge>
                              ) : hasResolvedAction ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 gap-1 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Resuelto
                                  </Badge>
                                  <button
                                    onClick={() => openActionDialog(d)}
                                    className="text-[10px] text-gray-400 hover:text-mk-pink underline"
                                  >
                                    Nueva acción
                                  </button>
                                </div>
                              ) : d.decision !== "sin_accion" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7 gap-1"
                                  onClick={() => openActionDialog(d)}
                                >
                                  <ClipboardList className="w-3 h-3" />
                                  Tomar Acción
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>

                          {/* Expanded row: variants + action history */}
                          {isExpanded && (
                            <TableRow key={`${d.product_id}-expanded`}>
                              <TableCell colSpan={14} className="bg-gray-50/80 p-0">
                                <div className="px-6 py-3 space-y-3">
                                  {/* Variants */}
                                  {d.variantsTotal > 1 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 mb-1.5">Stock por Variante</p>
                                      <div className="flex flex-wrap gap-2">
                                        {d.variants.map((v) => (
                                          <span
                                            key={v.id}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                                              v.stock <= 0
                                                ? "bg-red-50 text-red-700 border-red-200"
                                                : v.stock <= 5
                                                  ? "bg-orange-50 text-orange-700 border-orange-200"
                                                  : "bg-gray-50 text-gray-700 border-gray-200"
                                            }`}
                                          >
                                            <span className="font-medium">{v.title}</span>
                                            {v.sku && <span className="text-gray-400">({v.sku})</span>}
                                            <span className="font-bold">{v.stock}</span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action history */}
                                  {productActions.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-gray-700 mb-1.5">Historial de Acciones</p>
                                      <div className="space-y-1.5">
                                        {productActions.map((a) => (
                                          <div
                                            key={a.id}
                                            className={`flex items-start gap-2 p-2 rounded text-xs border ${
                                              a.resolved ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
                                            }`}
                                          >
                                            <span>{getActionEmoji(a.actionType)}</span>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium">
                                                {getActionLabel(a.actionType)}
                                                {a.resolved && <span className="text-green-600 ml-1">(Resuelto)</span>}
                                              </p>
                                              {a.note && <p className="text-gray-600">{a.note}</p>}
                                              <p className="text-gray-400 text-[10px]">
                                                {formatDate(a.date)}
                                                {a.resolvedDate && ` — Resuelto: ${formatDate(a.resolvedDate)}`}
                                              </p>
                                              {a.resolvedNote && <p className="text-green-700 text-[10px]">{a.resolvedNote}</p>}
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                              {!a.resolved && (
                                                <button
                                                  onClick={() => {
                                                    setResolveAction(a)
                                                    setResolveNote("")
                                                    setResolveDialogOpen(true)
                                                  }}
                                                  className="text-green-600 hover:text-green-800 p-0.5"
                                                  title="Marcar como resuelto"
                                                >
                                                  <CheckCircle2 className="w-4 h-4" />
                                                </button>
                                              )}
                                              <button
                                                onClick={() => deleteAction(a.id)}
                                                className="text-gray-400 hover:text-red-600 p-0.5"
                                                title="Eliminar"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Página {page + 1} de {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
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
                    productosConProblemaVariantes: summary.variantProblems,
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
                      variantesSinStock: `${d.variantsOutOfStock}/${d.variantsTotal}`,
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
                  productosMasVistosSinVentas: allDecisions
                    .filter((d) => d.views >= 10 && d.unitsSold === 0)
                    .sort((a, b) => b.views - a.views)
                    .slice(0, 5)
                    .map((d) => ({
                      nombre: d.name,
                      vistas: d.views,
                      carrito: d.addedToCart,
                      stock: d.stock,
                    })),
                  variantesProblematicas: allDecisions
                    .filter((d) => d.hasVariantProblem)
                    .slice(0, 10)
                    .map((d) => ({
                      nombre: d.name,
                      variantesSinStock: d.variants.filter((v) => v.stock <= 0).map((v) => v.title),
                      variantesConStock: d.variants.filter((v) => v.stock > 0).map((v) => `${v.title} (${v.stock})`),
                      vendidas: d.unitsSold,
                    })),
                  accionesTomadas: {
                    pendientes: pendingActions.length,
                    resueltas: actions.filter((a) => a.resolved).length,
                    total: actions.length,
                  },
                  periodoAnalizado: `${periodDays} días`,
                }
              }}
              isDataLoading={isLoading}
            />
          </>
        )}
      </div>

      {/* ── ACTION DIALOG ─────────────────────────────────────── */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tomar Acción</DialogTitle>
            <DialogDescription>
              {actionProduct?.name}
            </DialogDescription>
          </DialogHeader>

          {actionProduct && (
            <div className="space-y-4">
              {/* Current state summary */}
              <div className="bg-gray-50 rounded-md p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Decisión sugerida:</span>
                  <Badge variant="outline" className={`${DECISION_CONFIG[actionProduct.decision].color} text-[10px]`}>
                    {DECISION_CONFIG[actionProduct.decision].label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock actual:</span>
                  <span className="font-mono">{formatNumber(actionProduct.stock)}</span>
                </div>
                {actionProduct.hasVariantProblem && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Variantes sin stock:</span>
                    <span className="text-blue-600 font-semibold">
                      {actionProduct.variantsOutOfStock}/{actionProduct.variantsTotal}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendidas (período):</span>
                  <span className="font-mono">{formatNumber(actionProduct.unitsSold)}</span>
                </div>
                {actionProduct.views > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vistas / Conversión:</span>
                    <span className="font-mono">{actionProduct.views} / {actionProduct.conversionRate}%</span>
                  </div>
                )}
              </div>

              {/* Action type */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Acción a tomar</label>
                <Select value={actionType} onValueChange={(v) => setActionType(v as ActionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((at) => (
                      <SelectItem key={at.value} value={at.value}>
                        {at.emoji} {at.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Nota (opcional)
                </label>
                <Textarea
                  placeholder="Ej: Pedí 200 unidades al proveedor, llegan el viernes..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveAction} className="bg-mk-pink hover:bg-mk-pink-dark text-white">
              Guardar Acción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RESOLVE DIALOG ────────────────────────────────────── */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Resuelto</DialogTitle>
            <DialogDescription>
              {resolveAction?.productName} — {resolveAction && getActionLabel(resolveAction.actionType)}
            </DialogDescription>
          </DialogHeader>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Nota de resolución (opcional)
            </label>
            <Textarea
              placeholder="Ej: Llegó la reposición, ya se actualizó el stock..."
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={resolveActionHandler} className="bg-green-600 hover:bg-green-700 text-white gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Marcar Resuelto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── HISTORY DIALOG ────────────────────────────────────── */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seguimiento de Acciones</DialogTitle>
            <DialogDescription>
              {pendingActions.length} pendiente{pendingActions.length !== 1 ? "s" : ""} · {actions.filter((a) => a.resolved).length} resueltas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Pending */}
            {pendingActions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">Pendientes</h4>
                <div className="space-y-2">
                  {pendingActions.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-yellow-200 bg-yellow-50">
                      <span className="text-lg">{getActionEmoji(a.actionType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.productName}</p>
                        <p className="text-xs text-gray-600">{getActionLabel(a.actionType)}</p>
                        {a.note && <p className="text-xs text-gray-500 mt-0.5">{a.note}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">{formatDate(a.date)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setResolveAction(a)
                            setResolveNote("")
                            setResolveDialogOpen(true)
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Resolver"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteAction(a.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved */}
            {actions.filter((a) => a.resolved).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-800 mb-2">Resueltas</h4>
                <div className="space-y-2">
                  {actions
                    .filter((a) => a.resolved)
                    .slice(0, 20)
                    .map((a) => (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-green-200 bg-green-50">
                        <span className="text-lg">{getActionEmoji(a.actionType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{a.productName}</p>
                          <p className="text-xs text-gray-600">{getActionLabel(a.actionType)}</p>
                          {a.note && <p className="text-xs text-gray-500 mt-0.5">{a.note}</p>}
                          {a.resolvedNote && (
                            <p className="text-xs text-green-700 mt-0.5">Resolución: {a.resolvedNote}</p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-1">
                            Creada: {formatDate(a.date)}
                            {a.resolvedDate && ` — Resuelta: ${formatDate(a.resolvedDate)}`}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteAction(a.id)}
                          className="text-gray-400 hover:text-red-600 p-1 shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {actions.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay acciones registradas aún.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
