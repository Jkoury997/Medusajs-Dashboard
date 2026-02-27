"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  usePickingStats,
  useOrderStats,
  useFaltantesStats,
  useActivityStats,
} from "@/hooks/use-picking"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  PackageCheck,
  Clock,
  Package,
  CalendarDays,
  AlertTriangle,
  Activity,
  Users,
  Truck,
} from "lucide-react"

// ============================================================
// HELPERS
// ============================================================

function fmtTime(seconds: number): string {
  if (!seconds) return "—"
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function startOfMonth(): Date {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

const CHART_COLORS = [
  "#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
]

// ============================================================
// PAGE
// ============================================================

export default function PickingStatsPage() {
  const [from, setFrom] = useState<Date>(startOfMonth)
  const [to, setTo] = useState<Date>(() => new Date())

  const pickingStats = usePickingStats(from, to)
  const orderStats = useOrderStats()
  const faltantesStats = useFaltantesStats(from, to)
  const activityStats = useActivityStats(from, to)

  // Prepare fulfillment chart data
  const fulfillmentData = useMemo(() => {
    if (!orderStats.data?.by_fulfillment) return []
    return Object.entries(orderStats.data.by_fulfillment).map(([name, value]) => ({
      name,
      value,
    }))
  }, [orderStats.data])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Picking — Estadísticas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Rendimiento, pedidos, faltantes y actividad del sistema de picking
          </p>
        </div>
        <div className="flex gap-2 ml-auto">
          <input
            type="date"
            className="border rounded-md px-3 py-1.5 text-sm"
            value={from.toISOString().split("T")[0]}
            onChange={(e) => setFrom(new Date(e.target.value + "T00:00:00"))}
          />
          <input
            type="date"
            className="border rounded-md px-3 py-1.5 text-sm"
            value={to.toISOString().split("T")[0]}
            onChange={(e) => setTo(new Date(e.target.value + "T00:00:00"))}
          />
        </div>
      </div>

      {/* ========== RENDIMIENTO ========== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Rendimiento de Picking</h2>

        {pickingStats.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : pickingStats.data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Pedidos Pickeados"
                value={String(pickingStats.data.global.total_orders_picked)}
                icon={<PackageCheck className="w-5 h-5 text-pink-500" />}
              />
              <MetricCard
                title="Tiempo Promedio"
                value={fmtTime(pickingStats.data.global.avg_pick_time_seconds)}
                icon={<Clock className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Items Pickeados"
                value={String(pickingStats.data.global.total_items_picked)}
                icon={<Package className="w-5 h-5 text-green-500" />}
              />
              <MetricCard
                title="Pedidos Hoy"
                value={String(pickingStats.data.today?.orders_picked ?? 0)}
                icon={<CalendarDays className="w-5 h-5 text-purple-500" />}
                subtitle={`${pickingStats.data.today?.items_picked ?? 0} items | ${fmtTime(pickingStats.data.today?.avg_pick_time_seconds ?? 0)}`}
              />
            </div>

            {/* By Picker Table */}
            {(pickingStats.data.by_picker?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Rendimiento por Picker</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 font-medium">Picker</th>
                          <th className="pb-2 font-medium text-right">Pedidos</th>
                          <th className="pb-2 font-medium text-right">Items</th>
                          <th className="pb-2 font-medium text-right">Tiempo Prom.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickingStats.data.by_picker?.map((p) => (
                          <tr key={p.user_id} className="border-b last:border-0">
                            <td className="py-2 font-medium">{p.user_name}</td>
                            <td className="py-2 text-right">{p.orders_picked}</td>
                            <td className="py-2 text-right">{p.items_picked}</td>
                            <td className="py-2 text-right">{fmtTime(p.avg_pick_time_seconds)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </section>

      {/* ========== ESTADO DE PEDIDOS ========== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Estado de Pedidos</h2>

        {orderStats.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        ) : orderStats.data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Pendientes"
                value={String(orderStats.data.pending)}
                icon={<Clock className="w-5 h-5 text-amber-500" />}
              />
              <MetricCard
                title="Total Pedidos"
                value={String(orderStats.data.total)}
                icon={<Package className="w-5 h-5 text-blue-500" />}
              />
            </div>

            {fulfillmentData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Pedidos por Estado de Fulfillment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fulfillmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {fulfillmentData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </section>

      {/* ========== FALTANTES ========== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Faltantes</h2>

        {faltantesStats.isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : faltantesStats.data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Total Faltantes"
                value={String(faltantesStats.data.total_faltantes)}
                icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ranking productos */}
              {(faltantesStats.data.ranking_products?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Ranking de Productos Faltantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 font-medium">Producto</th>
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium text-right">Veces</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faltantesStats.data.ranking_products?.slice(0, 10).map((p) => (
                            <tr key={p.product_id} className="border-b last:border-0">
                              <td className="py-2 font-medium truncate max-w-[200px]">{p.product_title}</td>
                              <td className="py-2 text-gray-500">{p.sku}</td>
                              <td className="py-2 text-right text-red-600 font-semibold">{p.times_missing}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By picker */}
              {(faltantesStats.data.by_picker?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Faltantes por Picker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 font-medium">Picker</th>
                            <th className="pb-2 font-medium text-right">Faltantes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faltantesStats.data.by_picker?.map((p) => (
                            <tr key={p.user_id} className="border-b last:border-0">
                              <td className="py-2 font-medium">{p.user_name}</td>
                              <td className="py-2 text-right text-red-600 font-semibold">{p.total_faltantes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Daily trend */}
            {(faltantesStats.data.daily_trend?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tendencia Diaria de Faltantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={faltantesStats.data.daily_trend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </section>

      {/* ========== ACTIVIDAD ========== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Actividad</h2>

        {activityStats.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : activityStats.data ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Entradas de Auditoría"
                value={String(activityStats.data.audit_entries)}
                icon={<Activity className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Entregas"
                value={String(activityStats.data.deliveries)}
                icon={<Truck className="w-5 h-5 text-green-500" />}
              />
              <MetricCard
                title="Usuarios Activos"
                value={String(activityStats.data.active_users)}
                icon={<Users className="w-5 h-5 text-purple-500" />}
              />
            </div>

            {/* Recent activity */}
            {(activityStats.data.recent_activity?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 font-medium">Fecha</th>
                          <th className="pb-2 font-medium">Acción</th>
                          <th className="pb-2 font-medium">Usuario</th>
                          <th className="pb-2 font-medium">Pedido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityStats.data.recent_activity?.slice(0, 15).map((a, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 text-gray-500">
                              {new Date(a.timestamp).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                                {a.action}
                              </span>
                            </td>
                            <td className="py-2">{a.user_name}</td>
                            <td className="py-2 text-gray-500 font-mono text-xs">{a.order_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </section>
    </div>
  )
}
