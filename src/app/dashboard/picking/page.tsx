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
  Target,
  TrendingUp,
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
    if (!orderStats.data?.orders?.byFulfillmentStatus) return []
    return Object.entries(orderStats.data.orders.byFulfillmentStatus).map(([name, value]) => ({
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Sesiones Completadas"
                value={String(pickingStats.data.global.sessionsCompleted)}
                icon={<PackageCheck className="w-5 h-5 text-pink-500" />}
              />
              <MetricCard
                title="Tiempo Promedio"
                value={fmtTime(pickingStats.data.global.avgDurationSeconds)}
                icon={<Clock className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Items Pickeados"
                value={String(pickingStats.data.global.totalItemsPicked)}
                icon={<Package className="w-5 h-5 text-green-500" />}
              />
              <MetricCard
                title="Precisión"
                value={`${pickingStats.data.global.pickAccuracy}%`}
                icon={<Target className="w-5 h-5 text-purple-500" />}
              />
              <MetricCard
                title="Hoy"
                value={String(pickingStats.data.today?.completed ?? 0)}
                icon={<CalendarDays className="w-5 h-5 text-amber-500" />}
                subtitle={`${pickingStats.data.today?.itemsPicked ?? 0} items | ${pickingStats.data.today?.cancelled ?? 0} canceladas`}
              />
            </div>

            {/* By Picker Table */}
            {(pickingStats.data.perPicker?.length ?? 0) > 0 && (
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
                          <th className="pb-2 font-medium text-right">Completadas</th>
                          <th className="pb-2 font-medium text-right">Canceladas</th>
                          <th className="pb-2 font-medium text-right">Items</th>
                          <th className="pb-2 font-medium text-right">Precisión</th>
                          <th className="pb-2 font-medium text-right">Tiempo Prom.</th>
                          <th className="pb-2 font-medium text-right">Seg/Item</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pickingStats.data.perPicker?.map((p) => (
                          <tr key={p.userId} className="border-b last:border-0">
                            <td className="py-2 font-medium">{p.userName}</td>
                            <td className="py-2 text-right">{p.completedOrders}</td>
                            <td className="py-2 text-right text-red-500">
                              {p.cancelledOrders > 0 ? p.cancelledOrders : "—"}
                            </td>
                            <td className="py-2 text-right">{p.totalItemsPicked}</td>
                            <td className="py-2 text-right">
                              <span className={p.accuracy >= 95 ? "text-green-600" : "text-red-600"}>
                                {p.accuracy}%
                              </span>
                            </td>
                            <td className="py-2 text-right">{fmtTime(p.avgDurationSeconds)}</td>
                            <td className="py-2 text-right">{p.avgSecondsPerItem}s</td>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Total Pagados"
                value={String(orderStats.data.orders.totalPaid)}
                icon={<Package className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Pendientes Picking"
                value={String(orderStats.data.orders.pendingPicking)}
                icon={<Clock className="w-5 h-5 text-amber-500" />}
              />
              <MetricCard
                title="Listos p/ Enviar"
                value={String(orderStats.data.orders.readyToShip)}
                icon={<PackageCheck className="w-5 h-5 text-green-500" />}
              />
              <MetricCard
                title="Enviados"
                value={String(orderStats.data.orders.shipped)}
                icon={<Truck className="w-5 h-5 text-purple-500" />}
              />
              <MetricCard
                title="Entregados"
                value={String(orderStats.data.orders.delivered)}
                icon={<TrendingUp className="w-5 h-5 text-pink-500" />}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Faltantes"
                value={String(faltantesStats.data.global.totalMissing)}
                icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
              />
              <MetricCard
                title="Tasa de Faltantes"
                value={`${faltantesStats.data.global.missingRate}%`}
                icon={<Target className="w-5 h-5 text-amber-500" />}
              />
              <MetricCard
                title="Sesiones con Faltantes"
                value={String(faltantesStats.data.global.sessionsWithMissing)}
                icon={<Activity className="w-5 h-5 text-orange-500" />}
                subtitle={`de ${faltantesStats.data.global.totalSessions} sesiones`}
              />
              <MetricCard
                title="Faltantes Hoy"
                value={String(faltantesStats.data.today?.totalMissing ?? 0)}
                icon={<CalendarDays className="w-5 h-5 text-red-400" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ranking productos */}
              {(faltantesStats.data.productRanking?.length ?? 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Ranking de Productos Faltantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="pb-2 font-medium">SKU</th>
                            <th className="pb-2 font-medium">Código</th>
                            <th className="pb-2 font-medium text-right">Faltantes</th>
                            <th className="pb-2 font-medium text-right">Pedidos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faltantesStats.data.productRanking?.slice(0, 10).map((p) => (
                            <tr key={p.sku} className="border-b last:border-0">
                              <td className="py-2 font-medium font-mono">{p.sku}</td>
                              <td className="py-2 text-gray-500 font-mono text-xs">{p.barcode}</td>
                              <td className="py-2 text-right text-red-600 font-semibold">{p.totalMissing}</td>
                              <td className="py-2 text-right">{p.orderCount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* By picker */}
              {(faltantesStats.data.perPicker?.length ?? 0) > 0 && (
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
                            <th className="pb-2 font-medium text-right">Pedidos Afect.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faltantesStats.data.perPicker?.map((p) => (
                            <tr key={p.userId} className="border-b last:border-0">
                              <td className="py-2 font-medium">{p.userName}</td>
                              <td className="py-2 text-right text-red-600 font-semibold">{p.totalMissing}</td>
                              <td className="py-2 text-right">{p.ordersWithMissing}</td>
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
            {(faltantesStats.data.dailyTrend?.length ?? 0) > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Tendencia Diaria de Faltantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={faltantesStats.data.dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="totalMissing"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Faltantes"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Acciones de Auditoría"
                value={String(activityStats.data.audit?.totalActions ?? 0)}
                icon={<Activity className="w-5 h-5 text-blue-500" />}
              />
              <MetricCard
                title="Entregas"
                value={String(activityStats.data.deliveries?.totalDeliveries ?? 0)}
                icon={<Truck className="w-5 h-5 text-green-500" />}
              />
              <MetricCard
                title="Usuarios Activos"
                value={String(activityStats.data.users?.totalActive ?? 0)}
                icon={<Users className="w-5 h-5 text-purple-500" />}
                subtitle={`${activityStats.data.users?.pickers ?? 0} pickers | ${activityStats.data.users?.storeUsers ?? 0} tiendas`}
              />
            </div>

            {/* Recent activity */}
            {(activityStats.data.audit?.recentActions?.length ?? 0) > 0 && (
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
                          <th className="pb-2 font-medium">Detalle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityStats.data.audit?.recentActions?.slice(0, 15).map((a) => (
                          <tr key={a._id} className="border-b last:border-0">
                            <td className="py-2 text-gray-500 whitespace-nowrap">
                              {new Date(a.createdAt).toLocaleString("es-AR", {
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
                            <td className="py-2">{a.userName}</td>
                            <td className="py-2 text-gray-500 font-mono text-xs">
                              {a.orderDisplayId ? `#${a.orderDisplayId}` : "—"}
                            </td>
                            <td className="py-2 text-xs text-gray-500 max-w-xs truncate">
                              {a.details ?? "—"}
                            </td>
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
