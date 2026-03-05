"use client"

import { usePhysicalResellerStats } from "@/hooks/use-resellers-fisicas"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  UserCheck,
  Clock,
  Package,
  ShoppingCart,
  DollarSign,
  Boxes,
  MapPin,
  Store,
  Smartphone,
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
          {/* Row 1: Resellers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Revendedoras"
              value={String(stats.total_resellers)}
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

          {/* Row 2: Stock & Sales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Stock Distribuido"
              value={String(stats.total_stock_distributed)}
              subtitle="unidades en revendedoras"
              icon={<Boxes className="w-5 h-5 text-indigo-500" />}
            />
            <MetricCard
              title="Ventas del Mes"
              value={String(stats.sales_this_month)}
              icon={<ShoppingCart className="w-5 h-5 text-green-500" />}
            />
            <MetricCard
              title="Facturación del Mes"
              value={formatCurrency(stats.revenue_this_month)}
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
            />
            <MetricCard
              title="Ventas Pendientes"
              value={String(stats.pending_sales)}
              subtitle="del localizador"
              icon={<MapPin className="w-5 h-5 text-orange-500" />}
            />
          </div>

          {/* Row 3: Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Pedidos Pendientes"
              value={String(stats.pending_orders)}
              subtitle="pagados o enviados"
              icon={<Package className="w-5 h-5 text-blue-500" />}
            />
          </div>
        </>
      ) : null}
    </div>
  )
}
