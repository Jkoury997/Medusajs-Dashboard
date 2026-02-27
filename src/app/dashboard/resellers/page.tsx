"use client"

import { useResellerStats } from "@/hooks/use-resellers"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Clock, Ban, DollarSign, Wallet, ShoppingCart, TrendingUp } from "lucide-react"

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function ResellersResumenPage() {
  const { data: stats, isLoading, error } = useResellerStats()

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Revendedoras — Resumen</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar estadísticas. Verificá que la API de revendedoras esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revendedoras — Resumen</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Row 1: Resellers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Revendedoras"
              value={String(stats.total_resellers)}
              icon={<Users className="w-5 h-5 text-gray-400" />}
            />
            <MetricCard
              title="Activas"
              value={String(stats.active_resellers)}
              icon={<UserCheck className="w-5 h-5 text-green-500" />}
            />
            <MetricCard
              title="Pendientes"
              value={String(stats.pending_resellers)}
              icon={<Clock className="w-5 h-5 text-yellow-500" />}
            />
            <MetricCard
              title="Suspendidas"
              value={String(stats.suspended_resellers)}
              icon={<Ban className="w-5 h-5 text-red-500" />}
            />
          </div>

          {/* Row 2: Money */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ventas Totales"
              value={formatCentavos(stats.total_sales_amount)}
              icon={<DollarSign className="w-5 h-5 text-green-500" />}
            />
            <MetricCard
              title="Comisiones Ganadas"
              value={formatCentavos(stats.total_commissions_earned)}
              icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Comisiones Pagadas"
              value={formatCentavos(stats.total_commissions_paid)}
              icon={<Wallet className="w-5 h-5 text-purple-500" />}
            />
            <MetricCard
              title="Comisiones Pendientes"
              value={formatCentavos(stats.total_commissions_pending)}
              icon={<Clock className="w-5 h-5 text-yellow-500" />}
            />
          </div>

          {/* Row 3: Withdrawals & Customers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Retiros Pendientes"
              value={String(stats.total_withdrawals_pending)}
              subtitle={formatCentavos(stats.total_withdrawals_pending_amount)}
              icon={<Wallet className="w-5 h-5 text-orange-500" />}
            />
            <MetricCard
              title="Total Pedidos"
              value={String(stats.total_orders)}
              icon={<ShoppingCart className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Clientes Totales"
              value={String(stats.total_customers)}
              icon={<Users className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Clientes Activos"
              value={String(stats.active_customers)}
              subtitle={`${stats.inactive_customers} inactivos`}
              icon={<UserCheck className="w-5 h-5 text-green-500" />}
            />
          </div>

          {/* By Type breakdown */}
          {stats.by_type && stats.by_type.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Por Tipo de Revendedora</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.by_type.map((t) => (
                    <div
                      key={t.type_id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <p className="font-medium text-gray-900">{t.type_name}</p>
                      <div className="flex gap-3 text-sm">
                        <span className="text-gray-500">
                          Total: <span className="font-medium text-gray-900">{t.count}</span>
                        </span>
                        <span className="text-green-600">
                          Activas: {t.active}
                        </span>
                        <span className="text-yellow-600">
                          Pendientes: {t.pending}
                        </span>
                        <span className="text-red-600">
                          Suspendidas: {t.suspended}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
