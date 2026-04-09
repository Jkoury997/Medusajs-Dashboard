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

type SortField = "views" | "avg_dwell_time_ms" | "like_rate" | "cart_rate" | "skip_rate" | "detail_clicks" | "engagement_score"
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
  const [sortField, setSortField] = useState<SortField>("engagement_score")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const { data, isLoading, isError } = useInspireStats(dateRange.from, dateRange.to)

  const sortedProducts = useMemo(() => {
    if (!data?.products) return []
    return [...data.products].sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortField) {
        case "like_rate":
          aVal = parsePercent(a.like_rate); bVal = parsePercent(b.like_rate); break
        case "cart_rate":
          aVal = parsePercent(a.cart_rate); bVal = parsePercent(b.cart_rate); break
        case "skip_rate":
          aVal = parsePercent(a.skip_rate); bVal = parsePercent(b.skip_rate); break
        default:
          aVal = a[sortField] as number; bVal = b[sortField] as number
      }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    })
  }, [data?.products, sortField, sortDir])

  const topProductsChart = useMemo(() => {
    if (!data?.products) return []
    return [...data.products]
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 10)
      .map((p) => ({
        name: p.product_title.length > 18 ? p.product_title.slice(0, 18) + "..." : p.product_title,
        engagement: p.engagement_score,
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
    if (field !== sortField) return <span className="text-gray-300 ml-1">&#8645;</span>
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
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        {isError && (
          <Card>
            <CardContent className="p-6 text-center text-red-500">
              Error al cargar datos de Inspirate. Verifica que el servicio de analytics este funcionando.
            </CardContent>
          </Card>
        )}

        {/* Row 1: Session KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
            ))}
          </div>
        ) : sm ? (
          <>
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
                subtitle={`${formatNumber(sm.total_likes)} likes totales`}
              />
              <MetricCard
                title="Carritos/sesion"
                value={sm.avg_carts_per_session.toFixed(1)}
                subtitle={`${formatNumber(sm.total_carts)} agregados totales`}
              />
            </div>

            {/* Row 2: Conversion KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total likes"
                value={formatNumber(sm.total_likes)}
                subtitle="Productos que gustaron"
              />
              <MetricCard
                title="Total al carrito"
                value={formatNumber(sm.total_carts)}
                subtitle="Agregados desde el feed"
              />
              <MetricCard
                title="Like → Carrito"
                value={sm.like_to_cart_rate}
                subtitle="De los que likean, cuantos compran"
              />
              <MetricCard
                title="Clicks a detalle"
                value={formatNumber(sm.total_detail_clicks)}
                subtitle="Navegaron al producto completo"
              />
            </div>
          </>
        ) : null}

        {/* Daily trend chart */}
        {!isLoading && data?.daily_metrics && data.daily_metrics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendencia diaria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.daily_metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" stroke="#6b7280" name="Sesiones" strokeWidth={2} />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Vistas" strokeWidth={2} />
                  <Line type="monotone" dataKey="likes" stroke="#ef4444" name="Likes" strokeWidth={2} />
                  <Line type="monotone" dataKey="carts" stroke="#10b981" name="Carritos" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
                      formatter={(value, name) => {
                        const v = Number(value) || 0
                        if (name === "dwell_s") return [`${v.toFixed(1)}s`, "Dwell time"]
                        return [`${v.toFixed(1)}%`, name === "like_rate" ? "Like rate" : "Cart rate"]
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="like_rate" stroke="#ef4444" name="Like rate" strokeWidth={2} />
                    <Line type="monotone" dataKey="cart_rate" stroke="#3b82f6" name="Cart rate" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-sm text-center py-12">Sin datos de posicion. Necesita mas sesiones con scroll vertical.</p>
              )}
            </CardContent>
          </Card>

          {/* Top products by engagement score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 productos por engagement score</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : topProductsChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsChart} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(value) => (Number(value) || 0).toFixed(1)} />
                    <Legend />
                    <Bar dataKey="engagement" fill="#8b5cf6" name="Engagement score" />
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
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("engagement_score")}>
                        Score <SortIcon field="engagement_score" />
                      </TableHead>
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
                      <TableHead>Imgs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((p) => (
                      <TableRow key={p.product_id}>
                        <TableCell className="font-medium max-w-[250px] truncate" title={p.product_title}>
                          {p.product_title}
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${p.engagement_score > 10 ? "text-green-600" : p.engagement_score > 5 ? "text-yellow-600" : "text-gray-500"}`}>
                            {p.engagement_score}
                          </span>
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
