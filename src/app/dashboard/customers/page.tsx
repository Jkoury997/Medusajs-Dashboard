"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { CustomerFilters } from "@/components/customers/customer-filters"
import { CustomerTable } from "@/components/customers/customer-table"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { useAllCustomers, useCustomerGroups, extractCustomerGroups, buildGroupNameMap, resolveCustomerGroups } from "@/hooks/use-customers"
import { useAllOrders } from "@/hooks/use-orders"
import { getCustomerMetrics } from "@/lib/aggregations"
import { formatCurrency, formatNumber, formatDate } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { exportToCSV, formatDateCSV, formatCurrencyCSV } from "@/lib/export"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"

export default function CustomersPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [search, setSearch] = useState("")
  const [selectedGroup, setSelectedGroup] = useState("all")
  const [daysSinceFilter, setDaysSinceFilter] = useState("all")
  const [orderCountFilter, setOrderCountFilter] = useState("all")
  const [sortBy, setSortBy] = useState("totalSpent")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const { data: customers, isLoading: customersLoading } = useAllCustomers()
  const { data: ordersData, isLoading: ordersLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })
  const { data: customerGroupsData } = useCustomerGroups()

  // Mapa ID → nombre de grupos nativos de Medusa
  const groupNameMap = useMemo(() => {
    if (!customerGroupsData?.customer_groups) return new Map<string, string>()
    return buildGroupNameMap(customerGroupsData.customer_groups)
  }, [customerGroupsData])

  // Resolver nombres de grupo en los clientes (ID → nombre legible)
  const resolvedCustomers = useMemo(() => {
    if (!customers) return []
    return resolveCustomerGroups(customers, groupNameMap)
  }, [customers, groupNameMap])

  // Combinar: grupos nativos de Medusa + grupos encontrados en metadata de clientes
  const groups = useMemo(() => {
    // Grupos que tienen clientes asignados (extraídos de metadata, ya resueltos)
    const fromCustomers = extractCustomerGroups(resolvedCustomers, groupNameMap)
    // Todos los grupos nativos de Medusa (aunque no tengan clientes aún)
    const fromApi = customerGroupsData?.customer_groups?.map((g: any) => g.name as string) || []
    // Unir ambos sin duplicados
    const allGroups = new Set([...fromCustomers, ...fromApi])
    return Array.from(allGroups).sort()
  }, [resolvedCustomers, groupNameMap, customerGroupsData])

  const isLoading = customersLoading || ordersLoading

  const enrichedCustomers = useMemo(() => {
    if (!resolvedCustomers.length || !ordersData) return []
    return getCustomerMetrics(resolvedCustomers, ordersData)
  }, [resolvedCustomers, ordersData])

  const filteredCustomers = useMemo(() => {
    let result = enrichedCustomers

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.first_name?.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
    }

    // Filtrar por grupo (usa el nombre resuelto)
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
        result = result.filter(
          (c) => c.orderCount >= 2 && c.orderCount <= 5
        )
      } else if (orderCountFilter === "6+") {
        result = result.filter((c) => c.orderCount >= 6)
      }
    }

    result.sort((a, b) => {
      const aVal = a[sortBy] ?? 0
      const bVal = b[sortBy] ?? 0
      if (sortDir === "asc") return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

    return result
  }, [enrichedCustomers, search, selectedGroup, daysSinceFilter, orderCountFilter, sortBy, sortDir])

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

  const summaryMetrics = useMemo(() => {
    const total = enrichedCustomers.length
    const withOrders = enrichedCustomers.filter((c) => c.orderCount > 0).length
    const repeat = enrichedCustomers.filter((c) => c.orderCount > 1).length
    const atRisk = enrichedCustomers.filter(
      (c) => c.daysSinceLastOrder !== null && c.daysSinceLastOrder > 60
    ).length
    const avgLtv =
      withOrders > 0
        ? enrichedCustomers
            .filter((c) => c.orderCount > 0)
            .reduce((sum, c) => sum + c.totalSpent, 0) / withOrders
        : 0

    return { total, withOrders, repeat, atRisk, avgLtv }
  }, [enrichedCustomers])

  return (
    <div>
      <Header
        title="Seguimiento de Clientes"
        description="Analisis de clientes, segmentacion y riesgo de churn"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Total Clientes"
                value={formatNumber(summaryMetrics.total)}
                icon="👥"
              />
              <MetricCard
                title="Con Compras"
                value={formatNumber(summaryMetrics.withOrders)}
                icon="🛒"
              />
              <MetricCard
                title="Recurrentes"
                value={formatNumber(summaryMetrics.repeat)}
                icon="🔄"
              />
              <MetricCard
                title="En Riesgo (+60d)"
                value={formatNumber(summaryMetrics.atRisk)}
                icon="⚠️"
              />
              <MetricCard
                title="LTV Promedio"
                value={formatCurrency(summaryMetrics.avgLtv)}
                icon="💎"
              />
            </div>

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

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {filteredCustomers.length} clientes encontrados
              </span>
              {filteredCustomers.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  Exportar CSV
                </Button>
              )}
            </div>

            <CustomerTable
              customers={filteredCustomers}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />

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
