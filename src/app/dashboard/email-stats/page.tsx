"use client"

import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAggregatedEmailStats } from "@/hooks/use-email-stats"
import { useCampaignStats } from "@/hooks/use-campaigns"
import { useAbandonedCartStats } from "@/hooks/use-email-marketing"
import {
  Send,
  MailOpen,
  MousePointerClick,
  AlertTriangle,
  Megaphone,
  ShoppingCart,
  RotateCcw,
  Ticket,
  Zap,
  Mail,
  MailCheck,
  Ban,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Borrador", className: "bg-gray-100 text-gray-700" },
    scheduled: { label: "Programada", className: "bg-blue-100 text-blue-700" },
    sending: { label: "Enviando", className: "bg-yellow-100 text-yellow-700" },
    sent: { label: "Enviada", className: "bg-green-100 text-green-700" },
    paused: { label: "Pausada", className: "bg-orange-100 text-orange-700" },
    cancelled: { label: "Cancelada", className: "bg-red-100 text-red-700" },
  }
  const s = map[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  return <Badge className={s.className}>{s.label}</Badge>
}

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-7 bg-gray-200 rounded w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function EmailStatsPage() {
  const { data: manualStats, isLoading: loadingManual } = useAggregatedEmailStats()
  const { data: autoStats, isLoading: loadingAuto } = useCampaignStats()
  const { data: cartStats, isLoading: loadingCarts } = useAbandonedCartStats()

  // Prepare chart data from recent campaigns
  const chartData = (manualStats?.recent_campaigns || [])
    .filter((c) => c.total_sent > 0)
    .slice(0, 10)
    .map((c) => ({
      name: c.name.length > 18 ? c.name.slice(0, 18) + "..." : c.name,
      open_rate: parseFloat(c.open_rate) || 0,
      click_rate: parseFloat(c.click_rate) || 0,
    }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Estadísticas de Email Marketing
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Métricas globales de campañas manuales, automáticas y carritos abandonados
        </p>
      </div>

      {/* =====================================================
          SECCION 1: CAMPAÑAS MANUALES
         ===================================================== */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-[#ff75a8]" />
          Campañas Manuales
        </h2>

        {loadingManual ? (
          <SkeletonCards />
        ) : manualStats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Enviados"
                value={manualStats.total_sent.toLocaleString("es-AR")}
                icon={<Send className="w-5 h-5 text-[#ff75a8]" />}
                subtitle={`${manualStats.total_campaigns} campañas en total`}
              />
              <MetricCard
                title="Tasa de Apertura"
                value={manualStats.avg_open_rate}
                icon={<MailOpen className="w-5 h-5 text-blue-500" />}
                changeType={parseFloat(manualStats.avg_open_rate) >= 30 ? "positive" : "neutral"}
                subtitle={`${manualStats.total_opened.toLocaleString("es-AR")} abiertos`}
              />
              <MetricCard
                title="Tasa de Click"
                value={manualStats.avg_click_rate}
                icon={<MousePointerClick className="w-5 h-5 text-purple-500" />}
                changeType={parseFloat(manualStats.avg_click_rate) >= 10 ? "positive" : "neutral"}
                subtitle={`${manualStats.total_clicked.toLocaleString("es-AR")} clicks`}
              />
              <MetricCard
                title="Tasa de Rebote"
                value={manualStats.avg_bounce_rate}
                icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
                changeType={parseFloat(manualStats.avg_bounce_rate) > 5 ? "negative" : "positive"}
                subtitle={`${manualStats.total_bounced.toLocaleString("es-AR")} rebotados`}
              />
            </div>

            {/* Status breakdown */}
            {Object.keys(manualStats.campaigns_by_status).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(manualStats.campaigns_by_status).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    <StatusBadge status={status} /> <span className="ml-1 font-bold">{count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400">No hay datos disponibles</p>
        )}
      </div>

      {/* =====================================================
          SECCION 2: CAMPAÑAS AUTOMATICAS
         ===================================================== */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#ff75a8]" />
          Campañas Automáticas
        </h2>

        {loadingAuto ? (
          <SkeletonCards />
        ) : autoStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Enviados"
              value={autoStats.totals.sent.toLocaleString("es-AR")}
              icon={<Mail className="w-5 h-5 text-[#ff75a8]" />}
              subtitle={`${autoStats.totals.total} emails creados`}
            />
            <MetricCard
              title="Tasa de Apertura"
              value={autoStats.totals.open_rate}
              icon={<MailOpen className="w-5 h-5 text-blue-500" />}
              subtitle={`${autoStats.totals.opened.toLocaleString("es-AR")} abiertos`}
            />
            <MetricCard
              title="Tasa de Click"
              value={autoStats.totals.click_rate}
              icon={<MousePointerClick className="w-5 h-5 text-purple-500" />}
              subtitle={`${autoStats.totals.clicked.toLocaleString("es-AR")} clicks`}
            />
            <MetricCard
              title="Rebotados"
              value={autoStats.totals.bounced.toLocaleString("es-AR")}
              icon={<Ban className="w-5 h-5 text-orange-500" />}
              subtitle={`de ${autoStats.totals.delivered.toLocaleString("es-AR")} entregados`}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hay datos disponibles</p>
        )}

        {/* Automated campaigns breakdown table */}
        {autoStats && autoStats.campaigns.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Desglose por Tipo de Campaña
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead className="text-right">Open Rate</TableHead>
                    <TableHead className="text-right">Click Rate</TableHead>
                    <TableHead className="text-right">Con IA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {autoStats.campaigns.map((c) => {
                    const labels: Record<string, string> = {
                      post_purchase: "Post Compra",
                      welcome_1: "Bienvenida 1",
                      welcome_2: "Bienvenida 2",
                      welcome_3: "Bienvenida 3",
                      browse_abandonment: "Browse Abandon.",
                    }
                    return (
                      <TableRow key={c.campaign_type}>
                        <TableCell className="font-medium">
                          {labels[c.campaign_type] || c.campaign_type}
                        </TableCell>
                        <TableCell className="text-right">{c.sent}</TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(c.open_rate) >= 30 ? "text-green-600 font-medium" : ""}>
                            {c.open_rate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(c.click_rate) >= 10 ? "text-green-600 font-medium" : ""}>
                            {c.click_rate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{c.with_ai}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* =====================================================
          SECCION 3: CARRITOS ABANDONADOS
         ===================================================== */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#ff75a8]" />
          Carritos Abandonados
        </h2>

        {loadingCarts ? (
          <SkeletonCards />
        ) : cartStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Carritos"
              value={cartStats.total.toLocaleString("es-AR")}
              icon={<ShoppingCart className="w-5 h-5 text-[#ff75a8]" />}
              subtitle={`${cartStats.email_1_sent + cartStats.email_2_sent} emails enviados`}
            />
            <MetricCard
              title="Recuperados"
              value={cartStats.recovered.toLocaleString("es-AR")}
              icon={<RotateCcw className="w-5 h-5 text-green-500" />}
              changeType="positive"
              subtitle="carritos recuperados"
            />
            <MetricCard
              title="Tasa de Recuperación"
              value={cartStats.recovery_rate}
              icon={<MailCheck className="w-5 h-5 text-blue-500" />}
              changeType={parseFloat(cartStats.recovery_rate) >= 10 ? "positive" : "neutral"}
            />
            <MetricCard
              title="Con Cupón"
              value={cartStats.with_coupon.toLocaleString("es-AR")}
              icon={<Ticket className="w-5 h-5 text-purple-500" />}
              subtitle="cupones generados"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hay datos disponibles</p>
        )}

        {/* Cart email engagement */}
        {cartStats && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Engagement de Emails de Carrito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email 1 (Recordatorio)</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Open Rate</span>
                    <span className="font-medium">{cartStats.engagement.email_1_open_rate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Click Rate</span>
                    <span className="font-medium">{cartStats.engagement.email_1_click_rate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Entregados</span>
                    <span className="font-medium">{cartStats.engagement.email_1_delivered}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Email 2 (Cupón)</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Open Rate</span>
                    <span className="font-medium">{cartStats.engagement.email_2_open_rate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Click Rate</span>
                    <span className="font-medium">{cartStats.engagement.email_2_click_rate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Entregados</span>
                    <span className="font-medium">{cartStats.engagement.email_2_delivered}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* =====================================================
          SECCION 4: CAMPAÑAS RECIENTES + GRAFICO
         ===================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent campaigns table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Campañas Manuales Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingManual ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : manualStats && manualStats.recent_campaigns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead className="text-right">Apertura</TableHead>
                    <TableHead className="text-right">Click</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualStats.recent_campaigns.slice(0, 10).map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium text-sm max-w-[160px] truncate">
                        {c.name}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {c.total_sent.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={parseFloat(c.open_rate) >= 30 ? "text-green-600 font-medium" : ""}>
                          {c.open_rate}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className={parseFloat(c.click_rate) >= 10 ? "text-green-600 font-medium" : ""}>
                          {c.click_rate}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-gray-400 py-6 text-center">
                No hay campañas enviadas todavía
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Comparación de Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toFixed(1)}%`,
                      ]}
                    />
                    <Bar dataKey="open_rate" name="Apertura" fill="#ff75a8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="click_rate" name="Click" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-12 text-center">
                No hay datos suficientes para el gráfico
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
