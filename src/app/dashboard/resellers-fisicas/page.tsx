"use client"

import { usePhysicalResellerStats } from "@/hooks/use-resellers-fisicas"
import { useDistributorGlobalMetrics } from "@/hooks/use-distributors"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Users,
  Clock,
  Package,
  ShoppingCart,
  DollarSign,
  Boxes,
  MapPin,
  Store,
  Smartphone,
  Warehouse,
  Building2,
  Eye,
  MessageCircle,
  MapPinned,
  EyeOff,
  Truck,
  TrendingUp,
  MousePointerClick,
} from "lucide-react"

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function ResellersFisicasResumenPage() {
  const { data: stats, isLoading, error } = usePhysicalResellerStats()
  const { data: distMetrics, isLoading: distLoading } = useDistributorGlobalMetrics()

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Revendedoras Físicas — Resumen</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar estadísticas. Verificá que la API de revendedoras físicas esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revendedoras Físicas — Resumen</h1>

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
          {/* Row 1: Spend + engagement headlines (last 30 days) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Compras de la Red (30d)"
              value={formatCurrency(stats.total_purchases_30d)}
              subtitle={`${stats.total_purchase_orders_30d} pedidos`}
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
            />
            <MetricCard
              title="Clicks Totales (30d)"
              value={String(stats.total_clicks_30d)}
              subtitle={`${stats.clicks_30d_by_type?.whatsapp_clicks ?? 0} a WhatsApp`}
              icon={<MousePointerClick className="w-5 h-5 text-purple-500" />}
            />
            <MetricCard
              title="Visibles en el Mapa"
              value={String(stats.visible_on_map)}
              subtitle={`de ${stats.total_resellers} activas`}
              icon={<MapPinned className="w-5 h-5 text-green-500" />}
            />
            <MetricCard
              title="Elegibles por Compras"
              value={String(stats.purchase_eligible_resellers)}
              subtitle="≥ $150.000 en 30 días"
              icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            />
          </div>

          {/* Row 2: Resellers overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Revendedoras"
              value={String(stats.total_resellers)}
              subtitle="aprobadas y activas"
              icon={<Users className="w-5 h-5 text-gray-400" />}
            />
            <MetricCard
              title="Pendientes de Aprobación"
              value={String(stats.pending_resellers)}
              icon={<Clock className="w-5 h-5 text-yellow-500" />}
            />
            <MetricCard
              title="Tiendas Físicas"
              value={String(stats.resellers_by_type?.tienda_fisica ?? 0)}
              icon={<Store className="w-5 h-5 text-blue-500" />}
            />
            <MetricCard
              title="Solo Redes"
              value={String(stats.resellers_by_type?.redes ?? 0)}
              icon={<Smartphone className="w-5 h-5 text-purple-500" />}
            />
          </div>

          {/* Row 3: Map visibility detail */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Con Ubicación"
              value={String(stats.resellers_with_location)}
              subtitle="aprobadas con coordenadas"
              icon={<MapPin className="w-5 h-5 text-orange-500" />}
            />
            <MetricCard
              title="Deshabilitadas por Admin"
              value={String(stats.map_disabled_count)}
              subtitle="ocultas manualmente"
              icon={<EyeOff className="w-5 h-5 text-orange-500" />}
            />
            <MetricCard
              title="Ventas del Mes"
              value={String(stats.sales_this_month)}
              subtitle={formatCurrency(stats.revenue_this_month)}
              icon={<ShoppingCart className="w-5 h-5 text-green-500" />}
            />
            <MetricCard
              title="Pedidos Pendientes"
              value={String(stats.pending_orders)}
              subtitle="pagados o enviados"
              icon={<Package className="w-5 h-5 text-blue-500" />}
            />
          </div>

          {/* Top spenders + Top clicked (last 30 days) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Top 5 revendedoras por compras (30d)
                  </h3>
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                {stats.top_spenders_30d?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 font-medium">Revendedora</th>
                          <th className="pb-2 font-medium text-center">Pedidos</th>
                          <th className="pb-2 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.top_spenders_30d.map((r, idx) => (
                          <tr key={r.reseller_id} className="border-b last:border-0">
                            <td className="py-2 font-medium text-gray-900">
                              <span className="text-gray-400 mr-2">{idx + 1}.</span>
                              <Link
                                href={`/dashboard/resellers-fisicas/lista/${r.reseller_id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {r.business_name}
                              </Link>
                            </td>
                            <td className="py-2 text-center text-gray-600">
                              {r.order_count}
                            </td>
                            <td className="py-2 text-right font-semibold font-mono">
                              {formatCurrency(r.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin compras registradas en 30 días.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Top 5 revendedoras por clicks (30d)
                  </h3>
                  <MousePointerClick className="w-4 h-4 text-purple-500" />
                </div>
                {stats.top_clicked_30d?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 font-medium">Revendedora</th>
                          <th className="pb-2 font-medium text-center">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Vistas
                            </span>
                          </th>
                          <th className="pb-2 font-medium text-center">
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5" /> WA
                            </span>
                          </th>
                          <th className="pb-2 font-medium text-center">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.top_clicked_30d.map((r, idx) => (
                          <tr key={r.reseller_id} className="border-b last:border-0">
                            <td className="py-2 font-medium text-gray-900">
                              <span className="text-gray-400 mr-2">{idx + 1}.</span>
                              <Link
                                href={`/dashboard/resellers-fisicas/lista/${r.reseller_id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {r.business_name}
                              </Link>
                            </td>
                            <td className="py-2 text-center text-gray-600">
                              {r.card_views}
                            </td>
                            <td className="py-2 text-center text-gray-600">
                              {r.whatsapp_clicks}
                            </td>
                            <td className="py-2 text-center font-semibold">
                              {r.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sin clicks registrados en 30 días.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {stats.resellers_by_type?.distribuidor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Distribuidores"
                value={String(stats.resellers_by_type.distribuidor)}
                icon={<Truck className="w-5 h-5 text-emerald-500" />}
              />
              <MetricCard
                title="Stock Distribuido"
                value={String(stats.total_stock_distributed)}
                subtitle="unidades en revendedoras"
                icon={<Boxes className="w-5 h-5 text-indigo-500" />}
              />
            </div>
          ) : null}
        </>
      ) : null}

      {/* Distributors Section */}
      <h2 className="text-lg font-semibold text-gray-900 pt-2">Distribuidoras</h2>

      {distLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : distMetrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Total Distribuidoras"
              value={String(distMetrics.total_distributors)}
              icon={<Warehouse className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Distribuidoras Activas"
              value={String(distMetrics.active_distributors)}
              icon={<Building2 className="w-5 h-5 text-green-500" />}
            />
            <MetricCard
              title="Sucursales Activas"
              value={String(distMetrics.total_branches)}
              icon={<MapPin className="w-5 h-5 text-orange-500" />}
            />
          </div>

          {/* Top distributors ranking */}
          {distMetrics.ranking.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Distribuidoras (últimos 30 días)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="pb-2 font-medium">Distribuidora</th>
                        <th className="pb-2 font-medium text-center">
                          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Vistas</span>
                        </th>
                        <th className="pb-2 font-medium text-center">
                          <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</span>
                        </th>
                        <th className="pb-2 font-medium text-center">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distMetrics.ranking.map((item, idx) => (
                        <tr key={item.distributor_id} className="border-b last:border-0">
                          <td className="py-2 font-medium text-gray-900">
                            <span className="text-gray-400 mr-2">{idx + 1}.</span>
                            {item.business_name}
                          </td>
                          <td className="py-2 text-center text-gray-600">{item.card_views}</td>
                          <td className="py-2 text-center text-gray-600">{item.whatsapp_clicks}</td>
                          <td className="py-2 text-center font-semibold text-gray-900">{item.total_clicks}</td>
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
    </div>
  )
}
