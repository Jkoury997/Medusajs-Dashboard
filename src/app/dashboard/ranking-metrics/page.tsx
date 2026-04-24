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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  useAiCostTimeseries,
  useAiCostSummary,
  useRankingPerformance,
  useTriggerPerformanceMeasure,
} from "@/hooks/use-ranking-metrics"
import { formatNumber, formatDate } from "@/lib/format"
import {
  DollarSign,
  Cpu,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertCircle,
} from "lucide-react"

function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value)
}

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

function dayLabel(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  })
}

export default function RankingMetricsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const { data: summary, isLoading: loadingSummary } = useAiCostSummary(
    dateRange.from,
    dateRange.to
  )
  const { data: timeseries, isLoading: loadingTs } = useAiCostTimeseries(
    dateRange.from,
    dateRange.to,
    "day"
  )
  const { data: perf, isLoading: loadingPerf } = useRankingPerformance(
    dateRange.from,
    dateRange.to
  )
  const triggerMeasure = useTriggerPerformanceMeasure()

  const chartData = useMemo(() => {
    return (
      timeseries?.series?.map((p) => ({
        date: dayLabel(p.date),
        cost: p.cost_usd,
        prompt: p.prompt_tokens,
        completion: p.completion_tokens,
        total: p.total_tokens,
        calls: p.calls,
      })) || []
    )
  }, [timeseries])

  const verdict = useMemo(() => {
    const items = perf?.items || []
    if (items.length === 0) return null
    const deltas = items
      .map((i) => i.total_delta_revenue_pct)
      .filter((d): d is number => d !== null && d !== undefined)
    if (deltas.length === 0) return null
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length
    return { avgDelta, sampleSize: deltas.length }
  }, [perf])

  const successRate = summary?.total_calls
    ? (summary.successful_calls / summary.total_calls) * 100
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header
          title="Métricas del Ranking IA"
          description="Consumo en dólares, tokens y efecto del ranking sobre las ventas"
        />
        <div className="flex items-center gap-2 px-6 py-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerMeasure.mutate()}
            disabled={triggerMeasure.isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${triggerMeasure.isPending ? "animate-spin" : ""}`}
            />
            Medir performance
          </Button>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {/* KPI Cards */}
        {loadingSummary ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Costo total"
              value={formatUSD(summary?.total_cost_usd || 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              subtitle={`${formatNumber(summary?.total_calls || 0)} llamadas a Claude`}
            />
            <MetricCard
              title="Tokens consumidos"
              value={formatNumber(summary?.total_tokens || 0)}
              icon={<Cpu className="h-5 w-5 text-purple-500" />}
              subtitle={`input ${formatNumber(summary?.total_prompt_tokens || 0)} / output ${formatNumber(summary?.total_completion_tokens || 0)}`}
            />
            <MetricCard
              title="Costo promedio por corrida"
              value={formatUSD(summary?.avg_cost_per_call || 0)}
              icon={<Activity className="h-5 w-5 text-blue-500" />}
              subtitle={`${successRate.toFixed(1)}% exitosas`}
            />
            <MetricCard
              title="Δ revenue promedio"
              value={formatPct(verdict?.avgDelta ?? null)}
              icon={
                verdict && verdict.avgDelta >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )
              }
              subtitle={
                verdict
                  ? `${verdict.sampleSize} rankings medidos`
                  : "Sin mediciones aún"
              }
              changeType={
                verdict && verdict.avgDelta >= 0 ? "positive" : "negative"
              }
              change={
                verdict
                  ? verdict.avgDelta >= 0
                    ? "Está sirviendo"
                    : "No está sirviendo"
                  : undefined
              }
            />
          </div>
        )}

        {/* Veredicto */}
        {verdict && summary && (
          <Card
            className={
              verdict.avgDelta >= 0 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }
          >
            <CardContent className="flex items-start gap-4 p-6">
              {verdict.avgDelta >= 0 ? (
                <TrendingUp className="h-6 w-6 flex-shrink-0 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 flex-shrink-0 text-red-600" />
              )}
              <div>
                <h3
                  className={`font-semibold ${
                    verdict.avgDelta >= 0 ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {verdict.avgDelta >= 0
                    ? "El ranking está generando valor"
                    : "El ranking no está mejorando las ventas"}
                </h3>
                <p className="mt-1 text-sm text-gray-700">
                  En el rango seleccionado gastaste{" "}
                  <strong>{formatUSD(summary.total_cost_usd)}</strong> y el revenue de los
                  productos rankeados cambió en promedio{" "}
                  <strong>{formatPct(verdict.avgDelta)}</strong> comparando los 7 días previos
                  vs. los 7 días siguientes a cada corrida ({verdict.sampleSize}{" "}
                  {verdict.sampleSize === 1 ? "ranking medido" : "rankings medidos"}).
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart: costo USD por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Costo USD por día</CardTitle>
            <CardDescription>
              Consumo diario del servicio de ranking IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTs ? (
              <Skeleton className="h-64" />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <DollarSign className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Sin datos de consumo en el rango seleccionado
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="costColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis
                    fontSize={12}
                    tickFormatter={(v) => `$${v.toFixed(2)}`}
                  />
                  <RechartsTooltip
                    formatter={(value) =>
                      typeof value === "number" ? formatUSD(value) : ""
                    }
                    labelFormatter={(l) => `Fecha: ${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Costo USD"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#costColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart: tokens por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Tokens por día</CardTitle>
            <CardDescription>Input vs. output</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTs ? (
              <Skeleton className="h-64" />
            ) : chartData.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Cpu className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">Sin datos de tokens</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <RechartsTooltip
                    formatter={(v) =>
                      typeof v === "number" ? formatNumber(v) : ""
                    }
                  />
                  <Legend />
                  <Bar
                    dataKey="prompt"
                    stackId="tokens"
                    fill="#8b5cf6"
                    name="Input"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="completion"
                    stackId="tokens"
                    fill="#ec4899"
                    name="Output"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tabla de performance por ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por ranking</CardTitle>
            <CardDescription>
              Ventas de los productos rankeados en los 7 días previos vs. los 7 días siguientes
              a cada corrida
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPerf ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : !perf || perf.items.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Activity className="mb-3 h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Todavía no hay rankings medidos en este rango.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Las mediciones se generan diariamente para rankings con al menos 7 días de
                  antigüedad.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Ventas pre → activo</TableHead>
                    <TableHead>Δ ventas</TableHead>
                    <TableHead>Δ revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perf.items.map((item) => {
                    const deltaRev = item.total_delta_revenue_pct
                    const positive = deltaRev !== null && deltaRev >= 0
                    return (
                      <TableRow key={item.ranking_id}>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(item.applied_at)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate font-medium">
                          {item.entity_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.ranking_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatNumber(item.products_count)}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatNumber(item.total_pre_sales)} →{" "}
                          {formatNumber(item.total_active_sales)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              (item.total_delta_sales_pct ?? 0) >= 0
                                ? "font-medium text-green-600"
                                : "font-medium text-red-600"
                            }
                          >
                            {formatPct(item.total_delta_sales_pct)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              positive
                                ? "font-medium text-green-600"
                                : "font-medium text-red-600"
                            }
                          >
                            {formatPct(deltaRev)}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Desglose por modelo */}
        {summary && summary.by_model.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Desglose por modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Llamadas</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Costo USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.by_model.map((m) => (
                    <TableRow key={m.model}>
                      <TableCell className="font-mono text-xs">{m.model}</TableCell>
                      <TableCell>{formatNumber(m.calls)}</TableCell>
                      <TableCell>{formatNumber(m.tokens)}</TableCell>
                      <TableCell className="font-medium">{formatUSD(m.cost_usd)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
