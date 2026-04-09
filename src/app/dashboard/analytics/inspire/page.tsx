"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useInspireStats } from "@/hooks/use-events"
import { formatNumber } from "@/lib/format"
import type { InspireProductMetric } from "@/types/events"

type SortField = "views" | "avg_dwell_time_ms" | "like_rate" | "cart_rate" | "skip_rate" | "detail_clicks"
type SortDir = "asc" | "desc"

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}m ${secs}s`
}

function parsePercent(pct: string): number {
  return parseFloat(pct.replace("%", "")) || 0
}

export default function InspireAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [sortField, setSortField] = useState<SortField>("views")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const { data, isLoading } = useInspireStats(dateRange.from, dateRange.to)

  const sortedProducts = useMemo(() => {
    if (!data?.products) return []
    return [...data.products].sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case "like_rate":
          aVal = parsePercent(a.like_rate)
          bVal = parsePercent(b.like_rate)
          break
        case "cart_rate":
          aVal = parsePercent(a.cart_rate)
          bVal = parsePercent(b.cart_rate)
          break
        case "skip_rate":
          aVal = parsePercent(a.skip_rate)
          bVal = parsePercent(b.skip_rate)
          break
        default:
          aVal = a[sortField] as number
          bVal = b[sortField] as number
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })
  }, [data?.products, sortField, sortDir])

  const topProductsChart = useMemo(() => {
    if (!data?.products) return []
    return [...data.products]
      .sort((a, b) => {
        const scoreA = parsePercent(a.like_rate) * 0.3 + parsePercent(a.cart_rate) * 0.4 + (a.avg_dwell_time_ms / 1000) * 0.3
        const scoreB = parsePercent(b.like_rate) * 0.3 + parsePercent(b.cart_rate) * 0.4 + (b.avg_dwell_time_ms / 1000) * 0.3
        return scoreB - scoreA
      })
      .slice(0, 10)
      .map((p) => ({
        name: p.product_title.length > 20 ? p.product_title.slice(0, 20) + "..." : p.product_title,
        like_rate: parsePercent(p.like_rate),
        cart_rate: parsePercent(p.cart_rate),
      }))
  }, [data?.products])

  const positionChartData = useMemo(() => {
    if (!data?.position_metrics) return []
    return data.position_metrics.map((p) => ({
      position: p.position + 1,
      like_rate: parsePercent(p.like_rate),
      cart_rate: parsePercent(p.cart_rate),
      dwell_s: p.avg_dwell_time_ms / 1000,
    }))
  }, [data?.position_metrics])

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir(sortDir === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
  }

  const sm = data?.session_metrics

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Inspirate Analytics"
        description="Metricas del feed estilo Reels/TikTok: engagement, dwell time, likes y conversiones por producto"
      />

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Date range */}
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {/* Session metric cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sm ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Sesiones"
              value={formatNumber(sm.total_sessions)}
              subtitle="Total de sesiones en el feed"
            />
            <MetricCard
              title="Profundidad promedio"
              value={sm.avg_depth.toFixed(1)}
              subtitle="Productos vistos por sesion"
            />
            <MetricCard
              title="Duracion promedio"
              value={formatDuration(sm.avg_duration_ms)}
              subtitle="Tiempo en el feed"
            />
            <MetricCard
              title="Likes/sesion"
              value={sm.avg_likes_per_session.toFixed(1)}
              subtitle="Promedio de likes por sesion"
            />
            <MetricCard
              title="Carritos/sesion"
              value={sm.avg_carts_per_session.toFixed(1)}
              subtitle="Agregados al carrito por sesion"
            />
          </div>
        ) : null}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement vs Position */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement por posicion en feed</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : positionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={positionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="position" label={{ value: "Posicion", position: "insideBottom", offset: -5 }} />
                    <YAxis label={{ value: "%", angle: -90, position: "insideLeft" }} />
                    <RechartsTooltip
                      formatter={(value: number, name: string) => {
                        if (name === "dwell_s") return [`${value.toFixed(1)}s`, "Dwell time"]
                        return [`${value.toFixed(1)}%`, name === "like_rate" ? "Like rate" : "Cart rate"]
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="like_rate" stroke="#ef4444" name="Like rate" strokeWidth={2} />
                    <Line type="monotone" dataKey="cart_rate" stroke="#3b82f6" name="Cart rate" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">Sin datos de posicion</p>
              )}
            </CardContent>
          </Card>

          {/* Top products by engagement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 productos por engagement</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : topProductsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsChart} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" unit="%" />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Legend />
                    <Bar dataKey="like_rate" fill="#ef4444" name="Like rate" />
                    <Bar dataKey="cart_rate" fill="#3b82f6" name="Cart rate" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">Sin datos de productos</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metricas por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Producto</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("views")}>
                        Vistas <SortIcon field="views" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("avg_dwell_time_ms")}>
                        Dwell time <SortIcon field="avg_dwell_time_ms" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("like_rate")}>
                        Like rate <SortIcon field="like_rate" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cart_rate")}>
                        Cart rate <SortIcon field="cart_rate" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("skip_rate")}>
                        Skip rate <SortIcon field="skip_rate" />
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("detail_clicks")}>
                        Detalle <SortIcon field="detail_clicks" />
                      </TableHead>
                      <TableHead>Imgs vistas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((p) => (
                      <TableRow key={p.product_id}>
                        <TableCell className="font-medium max-w-[250px] truncate" title={p.product_title}>
                          {p.product_title}
                        </TableCell>
                        <TableCell>{formatNumber(p.views)}</TableCell>
                        <TableCell>{formatDuration(p.avg_dwell_time_ms)}</TableCell>
                        <TableCell>{p.like_rate}</TableCell>
                        <TableCell>{p.cart_rate}</TableCell>
                        <TableCell className={parsePercent(p.skip_rate) > 50 ? "text-red-600 font-medium" : ""}>
                          {p.skip_rate}
                        </TableCell>
                        <TableCell>{p.detail_clicks}</TableCell>
                        <TableCell>{p.avg_images_viewed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-12">No hay datos de productos. Los eventos comenzaran a aparecer cuando los usuarios usen /inspirate.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
