"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  useMLConnection,
  useMLDisconnect,
  useMLOverview,
  useMLListings,
  useMLQuestions,
  useMLReputation,
} from "@/hooks/use-mercadolibre"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Package,
  MessageCircleQuestion,
  Star,
  Link2,
  Unlink,
  AlertCircle,
  CheckCircle2,
  Truck,
} from "lucide-react"

function formatARS(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

const LEVEL_LABELS: Record<string, string> = {
  "1_red": "Rojo",
  "2_orange": "Naranja",
  "3_yellow": "Amarillo",
  "4_light_green": "Verde claro",
  "5_green": "Verde",
  "newbie": "Nuevo",
}

const SHIPPING_LABELS: Record<string, string> = {
  "to_be_agreed": "A acordar",
  "pending": "Pendiente",
  "handling": "Preparando",
  "ready_to_ship": "Listo para enviar",
  "shipped": "Enviado",
  "delivered": "Entregado",
  "not_delivered": "No entregado",
  "cancelled": "Cancelado",
}

export default function MercadoLibrePage() {
  const searchParams = useSearchParams()
  const connected = searchParams.get("connected")
  const error = searchParams.get("error")

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const { data: connection, isLoading: connLoading } = useMLConnection()
  const disconnect = useMLDisconnect()

  const isConnected = connection?.connected === true
  const isConfigured = connection?.configured !== false

  const { data: overview, isLoading: overviewLoading } = useMLOverview(
    dateRange.from,
    dateRange.to,
    isConnected
  )
  const { data: listings } = useMLListings(isConnected)
  const { data: questions } = useMLQuestions(isConnected)
  const { data: reputation } = useMLReputation(isConnected)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mercado Libre</h1>
          <p className="text-sm text-gray-500">Metricas de ventas y cuenta de MercadoLibre</p>
        </div>
        {isConnected && (
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        )}
      </div>

      {/* Success/Error banners */}
      {connected === "true" && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <span>Cuenta de MercadoLibre conectada exitosamente.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {decodeURIComponent(error)}</span>
        </div>
      )}

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Conexion MercadoLibre
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connLoading ? (
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
          ) : !isConfigured ? (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                Variables de entorno no configuradas. Agrega a tu <code className="bg-gray-100 px-1">.env.local</code>:
              </p>
              <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
{`MERCADOLIBRE_APP_ID=tu_app_id
MERCADOLIBRE_CLIENT_SECRET=tu_client_secret
MERCADOLIBRE_REDIRECT_URI=http://localhost:3000/api/mercadolibre/callback`}
              </pre>
              <p className="text-xs text-gray-500">
                Crea tu app en{" "}
                <a href="https://developers.mercadolibre.com.ar/devcenter" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                  ML Developers
                </a>
                . La redirect URI debe coincidir exactamente.
              </p>
            </div>
          ) : !isConnected ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">No hay cuenta conectada.</p>
                <p className="text-xs text-gray-400">
                  Conecta tu cuenta para ver metricas de ventas, publicaciones y reputacion.
                </p>
              </div>
              <a href="/api/mercadolibre/auth">
                <Button>
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar MercadoLibre
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium">{connection.seller_nickname || `User ${connection.user_id}`}</p>
                  <p className="text-xs text-gray-500">User ID: {connection.user_id}</p>
                </div>
                <Badge variant="default" className="bg-green-500">Conectado</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                <Unlink className="h-4 w-4 mr-2" />
                {disconnect.isPending ? "Desconectando..." : "Desconectar"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics - only if connected */}
      {isConnected && (
        <>
          {/* KPI Cards */}
          {overviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-3" />
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : overview ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Ingresos ML"
                  value={formatARS(overview.total_revenue)}
                  icon={<DollarSign className="h-5 w-5" />}
                  subtitle={`${overview.paid_orders} ordenes pagadas`}
                />
                <MetricCard
                  title="Ordenes Totales"
                  value={String(overview.total_orders)}
                  icon={<ShoppingCart className="h-5 w-5" />}
                  subtitle={`${overview.pending_orders} pendientes · ${overview.cancelled_orders} canceladas`}
                />
                <MetricCard
                  title="Ticket Promedio"
                  value={formatARS(overview.avg_ticket)}
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                  title="Compradores Unicos"
                  value={String(overview.unique_buyers)}
                  icon={<Users className="h-5 w-5" />}
                />
              </div>

              {/* Secondary metrics row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Publicaciones Activas"
                  value={String(listings?.total_active ?? "-")}
                  icon={<Package className="h-5 w-5" />}
                />
                <MetricCard
                  title="Preguntas Sin Responder"
                  value={String(questions?.unanswered ?? "-")}
                  icon={<MessageCircleQuestion className="h-5 w-5" />}
                />
                {reputation && (
                  <MetricCard
                    title="Reputacion"
                    value={LEVEL_LABELS[reputation.level_id] || reputation.level_id}
                    icon={<Star className="h-5 w-5" />}
                    subtitle={
                      reputation.power_seller_status
                        ? `MercadoLider ${reputation.power_seller_status}`
                        : `${reputation.transactions_completed} ventas`
                    }
                  />
                )}
              </div>

              {/* Shipping Status */}
              {overview.shipping_status && Object.keys(overview.shipping_status).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Estado de Envios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(overview.shipping_status).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm">{SHIPPING_LABELS[status] || status}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Revenue by Day */}
              {overview.revenue_by_day && Object.keys(overview.revenue_by_day).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ventas por Dia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Ordenes</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(overview.revenue_by_day)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([day, data]) => (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{day}</TableCell>
                              <TableCell className="text-right">{data.orders}</TableCell>
                              <TableCell className="text-right">{formatARS(data.revenue)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Top Products */}
              {overview.top_products && overview.top_products.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Productos ML</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cantidad</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overview.top_products.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium max-w-xs truncate">{p.title}</TableCell>
                            <TableCell className="text-right">{p.quantity}</TableCell>
                            <TableCell className="text-right">{formatARS(p.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Reputation Detail */}
              {reputation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Reputacion Detallada
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Ventas completadas</span>
                        <p className="text-lg font-semibold">{reputation.transactions_completed}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Canceladas</span>
                        <p className="text-lg font-semibold text-red-500">{reputation.transactions_canceled}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Calificaciones positivas</span>
                        <p className="text-lg font-semibold text-green-600">{reputation.ratings_positive}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Negativas</span>
                        <p className="text-lg font-semibold text-red-500">{reputation.ratings_negative}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
