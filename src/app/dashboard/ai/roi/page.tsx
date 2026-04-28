"use client"

import { useMemo, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  Coins,
  Receipt,
  CheckCircle2,
  XCircle,
  Activity,
  Target,
  AlertTriangle,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Header } from "@/components/dashboard/header"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAIROIBySegment, useAIROISummary } from "@/hooks/use-events"
import { formatCurrency, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

function toIso(d: Date): string {
  return d.toISOString().split("T")[0]
}

function KPI({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  tone?: "default" | "good" | "bad" | "warn"
  icon: typeof TrendingUp
}) {
  const toneClass =
    tone === "good"
      ? "text-green-700"
      : tone === "bad"
        ? "text-red-700"
        : tone === "warn"
          ? "text-orange-700"
          : "text-gray-900"
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className={cn("text-2xl font-bold", toneClass)}>{value}</div>
        {sub ? <div className="text-xs text-gray-500">{sub}</div> : null}
      </CardContent>
    </Card>
  )
}

const SEGMENT_LABEL: Record<string, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  lost: "Lost",
}

const TYPE_LABEL: Record<string, string> = {
  personal: "Personal",
  segment: "Por segmento",
  cart_recovery: "Recuperación carrito",
  intent_boost: "Boost de intent",
}

export default function ROIPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const from = toIso(dateRange.from)
  const to = toIso(dateRange.to)

  const summaryQ = useAIROISummary(from, to)
  const segmentQ = useAIROIBySegment(from, to)

  const summary = summaryQ.data
  const segment = segmentQ.data

  const conversionPct = useMemo(() => {
    if (!summary) return 0
    const generated = summary.total_discounts_generated || 0
    if (generated === 0) return 0
    return (summary.total_discounts_converted / generated) * 100
  }, [summary])

  const dailyChart = useMemo(() => {
    return (summary?.daily ?? []).map((d) => ({
      date: d.date,
      Generados: d.generated,
      Convertidos: d.converted,
      Revenue: d.revenue,
      "Costo IA": d.ai_cost,
    }))
  }, [summary])

  const segmentRows = useMemo(() => {
    if (!segment) return []
    return Object.entries(segment.segments).map(([key, v]) => ({
      key,
      label: SEGMENT_LABEL[key] ?? key,
      ...v,
    }))
  }, [segment])

  const typeRows = useMemo(() => {
    if (!segment) return []
    return Object.entries(segment.types).map(([key, v]) => ({
      key,
      label: TYPE_LABEL[key] ?? key,
      ...v,
    }))
  }, [segment])

  const isEmpty =
    !summaryQ.isLoading &&
    summary &&
    summary.total_discounts_generated === 0 &&
    summary.total_discounts_converted === 0

  return (
    <div>
      <Header
        title="ROI de IA"
        description="Retorno de inversión de descuentos generados por IA: revenue, costo y rentabilidad neta"
      />

      <div className="p-6 space-y-6">
        <DateRangePicker onChange={setDateRange} value={dateRange} />

        {summaryQ.error ? (
          <Card>
            <CardContent className="p-6 text-red-700 text-sm">
              Error al cargar ROI: {(summaryQ.error as Error).message}
            </CardContent>
          </Card>
        ) : null}

        {isEmpty ? (
          <Card>
            <CardContent className="p-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Aún no hay descuentos IA en este período.</p>
                <p className="text-xs text-gray-500">
                  El backend está corriendo pero todavía no generó (o no se está
                  emitiendo) descuentos. Cuando se activen, las métricas aparecerán acá.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryQ.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))
          ) : (
            <>
              <KPI
                icon={Target}
                label="ROI"
                tone={summary?.profitable ? "good" : "bad"}
                value={`${(summary?.roi_percentage ?? 0).toFixed(1)}%`}
                sub={summary?.profitable ? "Rentable" : "No rentable"}
              />
              <KPI
                icon={Coins}
                label="Revenue generado"
                tone="good"
                value={formatCurrency(summary?.total_revenue ?? 0)}
                sub={`${formatNumber(summary?.total_discounts_converted ?? 0)} conversiones`}
              />
              <KPI
                icon={Receipt}
                label="Costo total"
                tone="warn"
                value={formatCurrency(
                  (summary?.total_discount_value ?? 0) + (summary?.total_ai_cost ?? 0)
                )}
                sub={`Descuento ${formatCurrency(
                  summary?.total_discount_value ?? 0
                )} + IA ${formatCurrency(summary?.total_ai_cost ?? 0)}`}
              />
              <KPI
                icon={summary && summary.net_profit >= 0 ? TrendingUp : TrendingDown}
                label="Ganancia neta"
                tone={summary && summary.net_profit >= 0 ? "good" : "bad"}
                value={formatCurrency(summary?.net_profit ?? 0)}
                sub={`Conversión ${conversionPct.toFixed(1)}%`}
              />
            </>
          )}
        </section>

        {/* Distribución de descuentos */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI
            icon={Activity}
            label="Generados"
            value={formatNumber(summary?.total_discounts_generated ?? 0)}
          />
          <KPI
            icon={CheckCircle2}
            label="Convertidos"
            tone="good"
            value={formatNumber(summary?.total_discounts_converted ?? 0)}
          />
          <KPI
            icon={Activity}
            label="Activos"
            value={formatNumber(summary?.total_discounts_active ?? 0)}
          />
          <KPI
            icon={XCircle}
            label="Expirados"
            tone="warn"
            value={formatNumber(summary?.total_discounts_expired ?? 0)}
          />
        </section>

        {/* Serie diaria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolución diaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summaryQ.isLoading ? (
              <Skeleton className="h-[280px]" />
            ) : dailyChart.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                Sin actividad diaria en el período seleccionado.
              </div>
            ) : (
              <Tabs defaultValue="counts">
                <TabsList>
                  <TabsTrigger value="counts">Cantidad</TabsTrigger>
                  <TabsTrigger value="money">Dinero</TabsTrigger>
                </TabsList>
                <TabsContent value="counts" className="mt-4">
                  <ResponsiveContainer height={260} width="100%">
                    <AreaChart data={dailyChart}>
                      <defs>
                        <linearGradient id="gGen" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gConv" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Area
                        dataKey="Generados"
                        fill="url(#gGen)"
                        stroke="#ec4899"
                        strokeWidth={2}
                        type="monotone"
                      />
                      <Area
                        dataKey="Convertidos"
                        fill="url(#gConv)"
                        stroke="#16a34a"
                        strokeWidth={2}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="money" className="mt-4">
                  <ResponsiveContainer height={260} width="100%">
                    <LineChart data={dailyChart}>
                      <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => formatCurrency(v)}
                        width={90}
                      />
                      <RechartsTooltip
                        formatter={(v) => formatCurrency(Number(v))}
                      />
                      <Line
                        dataKey="Revenue"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                        type="monotone"
                      />
                      <Line
                        dataKey="Costo IA"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        type="monotone"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Breakdown por segmento + tipo */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ROI por segmento</CardTitle>
            </CardHeader>
            <CardContent>
              {segmentQ.isLoading ? (
                <Skeleton className="h-[200px]" />
              ) : segmentRows.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-sm">Sin datos</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segmento</TableHead>
                      <TableHead className="text-right">Conversiones</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(row.count)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            row.roi >= 0 ? "text-green-700" : "text-red-700"
                          )}
                        >
                          {row.roi.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">ROI por tipo de descuento</CardTitle>
            </CardHeader>
            <CardContent>
              {segmentQ.isLoading ? (
                <Skeleton className="h-[200px]" />
              ) : typeRows.length === 0 ? (
                <div className="py-6 text-center text-gray-500 text-sm">Sin datos</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Conversiones</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeRows.map((row) => (
                      <TableRow key={row.key}>
                        <TableCell className="font-medium">{row.label}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(row.count)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.revenue)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-semibold",
                            row.roi >= 0 ? "text-green-700" : "text-red-700"
                          )}
                        >
                          {row.roi.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        <p className="text-xs text-gray-400">
          Promedio de descuento aplicado:{" "}
          {summary ? `${summary.avg_discount_pct.toFixed(1)}%` : "—"}.
          Datos del backend de eventos.
        </p>
      </div>
    </div>
  )
}
