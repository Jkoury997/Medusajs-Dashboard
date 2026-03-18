"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { CustomerFilters } from "@/components/customers/customer-filters"
import { CustomerTable } from "@/components/customers/customer-table"
import { CustomerChurnChart } from "@/components/charts/customer-churn-chart"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { useAllCustomers, useCustomerGroups, extractCustomerGroups, buildGroupNameMap, resolveCustomerGroups } from "@/hooks/use-customers"
import { useAllOrders, useOrderPhoneMap } from "@/hooks/use-orders"
import { getCustomerMetrics, aggregateChurnDistribution } from "@/lib/aggregations"
import { formatCurrency, formatNumber } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { exportToCSV, formatDateCSV, formatCurrencyCSV } from "@/lib/export"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"
import {
  Users,
  ShoppingCart,
  Repeat,
  AlertTriangle,
  Gem,
  Download,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Crown,
  Filter,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================
// SEGMENT TABS
// ============================================================

type Segment = "all" | "active" | "at_risk" | "no_purchases" | "vip"

const SEGMENTS: { key: Segment; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "Todos", icon: Users },
  { key: "active", label: "Activos", icon: UserCheck },
  { key: "at_risk", label: "En Riesgo", icon: AlertTriangle },
  { key: "no_purchases", label: "Sin Compras", icon: UserX },
  { key: "vip", label: "VIP", icon: Crown },
]

// ============================================================
// PAGE
// ============================================================

export default function CustomersPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [search, setSearch] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [daysSinceFilter, setDaysSinceFilter] = useState("all")
  const [orderCountFilter, setOrderCountFilter] = useState("all")
  const [sortBy, setSortBy] = useState("totalSpent")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [segment, setSegment] = useState<Segment>("all")
  const [showFilters, setShowFilters] = useState(false)

  const { data: customers, isLoading: customersLoading } = useAllCustomers()
  const { data: ordersData, isLoading: ordersLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })
  const { data: customerGroupsData } = useCustomerGroups()
  const { data: phoneMap } = useOrderPhoneMap()

  const groupNameMap = useMemo(() => {
    if (!customerGroupsData?.customer_groups) return new Map<string, string>()
    return buildGroupNameMap(customerGroupsData.customer_groups)
  }, [customerGroupsData])

  const resolvedCustomers = useMemo(() => {
    if (!customers) return []
    return resolveCustomerGroups(customers, groupNameMap)
  }, [customers, groupNameMap])

  const groups = useMemo(() => {
    const fromCustomers = extractCustomerGroups(resolvedCustomers, groupNameMap)
    const fromApi = customerGroupsData?.customer_groups?.map((g: any) => g.name as string) || []
    const allGroups = new Set([...fromCustomers, ...fromApi])
    return Array.from(allGroups).sort()
  }, [resolvedCustomers, groupNameMap, customerGroupsData])

  const isLoading = customersLoading || ordersLoading

  const enrichedCustomers = useMemo(() => {
    if (!resolvedCustomers.length || !ordersData) return []
    return getCustomerMetrics(resolvedCustomers, ordersData, phoneMap)
  }, [resolvedCustomers, ordersData, phoneMap])

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const total = enrichedCustomers.length
    const withOrders = enrichedCustomers.filter((c) => c.orderCount > 0).length
    const repeat = enrichedCustomers.filter((c) => c.orderCount > 1).length
    const atRisk = enrichedCustomers.filter(
      (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60
    ).length
    const totalRevenue = enrichedCustomers
      .filter((c) => c.orderCount > 0)
      .reduce((sum, c) => sum + c.totalSpent, 0)
    const avgLtv = withOrders > 0 ? totalRevenue / withOrders : 0

    // VIP: top 10% por gasto
    const vipThreshold = enrichedCustomers.length > 0
      ? [...enrichedCustomers].sort((a, b) => b.totalSpent - a.totalSpent)[
          Math.floor(enrichedCustomers.length * 0.1)
        ]?.totalSpent || 0
      : 0
    const vipCount = enrichedCustomers.filter((c) => c.totalSpent >= vipThreshold && c.totalSpent > 0).length

    const retentionRate = total > 0 ? ((repeat / Math.max(withOrders, 1)) * 100) : 0

    return { total, withOrders, repeat, atRisk, avgLtv, vipCount, vipThreshold, totalRevenue, retentionRate }
  }, [enrichedCustomers])

  // Churn distribution for chart
  const churnData = useMemo(() => {
    return aggregateChurnDistribution(enrichedCustomers)
  }, [enrichedCustomers])

  // Group distribution for chart
  const groupDistribution = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {}
    for (const c of enrichedCustomers) {
      const g = (c.metadata?.customer_group_resolved as string) || "Minorista"
      if (!map[g]) map[g] = { count: 0, revenue: 0 }
      map[g].count++
      map[g].revenue += c.totalSpent
    }
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .map(([group, data]) => ({ group, ...data }))
  }, [enrichedCustomers])

  // Apply segment + filters
  const filteredCustomers = useMemo(() => {
    let result = enrichedCustomers

    // Segment filter
    switch (segment) {
      case "active":
        result = result.filter(
          (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder <= 30
        )
        break
      case "at_risk":
        result = result.filter(
          (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60
        )
        break
      case "no_purchases":
        result = result.filter((c) => c.orderCount === 0)
        break
      case "vip":
        result = result.filter(
          (c) => c.totalSpent >= summaryMetrics.vipThreshold && c.totalSpent > 0
        )
        break
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.first_name?.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
    }

    if (selectedGroup !== "all") {
      result = result.filter(
        (c) => c.metadata?.customer_group_resolved === selectedGroup
      )
    }

    if (daysSinceFilter !== "all") {
      const minDays = parseInt(daysSinceFilter)
      result = result.filter(
        (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder >= minDays
      )
    }

    if (orderCountFilter !== "all") {
      if (orderCountFilter === "0") {
        result = result.filter((c) => c.orderCount === 0)
      } else if (orderCountFilter === "1") {
        result = result.filter((c) => c.orderCount === 1)
      } else if (orderCountFilter === "2-5") {
        result = result.filter((c) => c.orderCount >= 2 && c.orderCount <= 5)
      } else if (orderCountFilter === "6+") {
        result = result.filter((c) => c.orderCount >= 6)
      }
    }

    result.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0
      const bVal = (b as any)[sortBy] ?? 0
      if (sortDir === "asc") return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [enrichedCustomers, search, selectedGroup, daysSinceFilter, orderCountFilter, sortBy, sortDir, segment, summaryMetrics.vipThreshold])

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortDir("desc")
    }
  }

  const handleReset = () => {
    setSearch("")
    setSelectedGroup("all")
    setDaysSinceFilter("all")
    setOrderCountFilter("all")
  }

  const handleExportCSV = () => {
    exportToCSV(filteredCustomers, [
      { header: "Nombre", accessor: (c: any) => `${c.first_name || ""} ${c.last_name || ""}`.trim() },
      { header: "Email", accessor: (c: any) => c.email },
      { header: "Telefono", accessor: (c: any) => c.phone || "" },
      { header: "Grupo", accessor: (c: any) => c.metadata?.customer_group_resolved || "Minorista" },
      { header: "Ordenes", accessor: (c: any) => c.orderCount },
      { header: "Total Gastado", accessor: (c: any) => formatCurrencyCSV(c.totalSpent) },
      { header: "Ticket Promedio", accessor: (c: any) => formatCurrencyCSV(c.avgOrderValue) },
      { header: "Ultima Compra", accessor: (c: any) => formatDateCSV(c.lastOrderDate) },
      { header: "Dias sin Comprar", accessor: (c: any) => c.daysSinceLastOrder ?? "N/A" },
    ], `clientes_${new Date().toISOString().slice(0, 10)}`)
  }

  // Segment counts for tabs
  const segmentCounts = useMemo(() => ({
    all: enrichedCustomers.length,
    active: enrichedCustomers.filter(
      (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder <= 30
    ).length,
    at_risk: enrichedCustomers.filter(
      (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60
    ).length,
    no_purchases: enrichedCustomers.filter((c) => c.orderCount === 0).length,
    vip: enrichedCustomers.filter(
      (c) => c.totalSpent >= summaryMetrics.vipThreshold && c.totalSpent > 0
    ).length,
  }), [enrichedCustomers, summaryMetrics.vipThreshold])

  return (
    <div>
      <Header
        title="Seguimiento de Clientes"
        description="Segmentación, retención y análisis de lifetime value"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-[120px] rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <KPICard
                title="Total Clientes"
                value={formatNumber(summaryMetrics.total)}
                subtitle={`${formatNumber(summaryMetrics.withOrders)} con compras`}
                icon={Users}
                color="blue"
              />
              <KPICard
                title="Tasa de Retención"
                value={`${summaryMetrics.retentionRate.toFixed(1)}%`}
                subtitle={`${formatNumber(summaryMetrics.repeat)} recurrentes`}
                icon={summaryMetrics.retentionRate >= 30 ? TrendingUp : TrendingDown}
                color={summaryMetrics.retentionRate >= 30 ? "green" : "amber"}
              />
              <KPICard
                title="En Riesgo"
                value={formatNumber(summaryMetrics.atRisk)}
                subtitle={`+60 días sin comprar`}
                icon={AlertTriangle}
                color="red"
              />
              <KPICard
                title="LTV Promedio"
                value={formatCurrency(summaryMetrics.avgLtv)}
                subtitle={`Revenue: ${formatCurrency(summaryMetrics.totalRevenue)}`}
                icon={Gem}
                color="purple"
              />
              <KPICard
                title="Clientes VIP"
                value={formatNumber(summaryMetrics.vipCount)}
                subtitle={`Top 10% (>${formatCurrency(summaryMetrics.vipThreshold)})`}
                icon={Crown}
                color="amber"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomerChurnChart data={churnData} />
              <GroupDistributionCard data={groupDistribution} />
            </div>

            {/* Segment Tabs */}
            <div className="flex flex-wrap gap-2">
              {SEGMENTS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setSegment(key)}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                    segment === key
                      ? "bg-mk-pink text-white border-mk-pink shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    segment === key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500"
                  )}>
                    {segmentCounts[key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Filters + Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  <ChevronDown className={cn("w-3 h-3 transition-transform", showFilters && "rotate-180")} />
                </Button>
                <span className="text-sm text-gray-500">
                  {filteredCustomers.length} clientes
                </span>
              </div>
              {filteredCustomers.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              )}
            </div>

            {/* Collapsible filters */}
            <div className={cn(
              "overflow-hidden transition-all duration-200 ease-in-out",
              showFilters ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            )}>
              <CustomerFilters
                search={search}
                onSearchChange={setSearch}
                groups={groups}
                selectedGroup={selectedGroup}
                onGroupChange={setSelectedGroup}
                daysSinceFilter={daysSinceFilter}
                onDaysSinceChange={setDaysSinceFilter}
                orderCountFilter={orderCountFilter}
                onOrderCountChange={setOrderCountFilter}
                onReset={handleReset}
              />
            </div>

            {/* Customer Table */}
            <CustomerTable
              customers={filteredCustomers}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />

            {/* AI Insights */}
            <AIInsightWidget
              pageContext="customers"
              metricsBuilder={() => {
                if (!enrichedCustomers.length) return null
                const byGroup: Record<string, number> = {}
                for (const c of enrichedCustomers) {
                  const g = (c.metadata?.customer_group_resolved as string) || "Minorista"
                  byGroup[g] = (byGroup[g] || 0) + 1
                }
                const atRiskTop = enrichedCustomers
                  .filter((c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60)
                  .sort((a, b) => b.totalSpent - a.totalSpent)
                  .slice(0, 10)
                  .map((c) => ({
                    nombre: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
                    diasSinCompra: c.daysSinceLastOrder,
                    totalGastado: c.totalSpent,
                    ordenes: c.orderCount,
                  }))
                return {
                  ...summaryMetrics,
                  distribucionGrupos: byGroup,
                  clientesEnRiesgoTop: atRiskTop,
                  churnDistribucion: {
                    activos_0_30: enrichedCustomers.filter((c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder <= 30).length,
                    alerta_31_60: enrichedCustomers.filter((c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 30 && c.daysSinceLastOrder <= 60).length,
                    riesgo_61_90: enrichedCustomers.filter((c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60 && c.daysSinceLastOrder <= 90).length,
                    critico_90plus: enrichedCustomers.filter((c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 90).length,
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
// KPI CARD COMPONENT
// ============================================================

const COLOR_STYLES = {
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-green-50 text-green-600 border-green-100",
  red: "bg-red-50 text-red-600 border-red-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  purple: "bg-purple-50 text-purple-600 border-purple-100",
} as const

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: keyof typeof COLOR_STYLES
}) {
  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className={cn("p-2 rounded-lg", COLOR_STYLES[color])}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

// ============================================================
// GROUP DISTRIBUTION CARD
// ============================================================

function GroupDistributionCard({
  data,
}: {
  data: { group: string; count: number; revenue: number }[]
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  const colors = [
    "bg-blue-500", "bg-pink-500", "bg-emerald-500", "bg-amber-500",
    "bg-purple-500", "bg-cyan-500", "bg-rose-500", "bg-indigo-500",
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Distribución por Grupo
        </h3>

        {/* Bar */}
        <div className="flex rounded-full h-3 overflow-hidden mb-4">
          {data.map((d, i) => (
            <div
              key={d.group}
              className={cn(colors[i % colors.length], "transition-all")}
              style={{ width: `${(d.count / total) * 100}%` }}
              title={`${d.group}: ${d.count}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
          {data.map((d, i) => (
            <div key={d.group} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", colors[i % colors.length])} />
                <span className="text-sm text-gray-700">{d.group}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {d.count} ({((d.count / total) * 100).toFixed(0)}%)
                </span>
                <span className="text-sm font-medium text-gray-700 w-28 text-right">
                  {formatCurrency(d.revenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
