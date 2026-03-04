"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCampaignStats,
  useCampaignRecent,
  useProcessCampaigns,
  useCampaignForceSend,
} from "@/hooks/use-campaigns"
import { formatNumber } from "@/lib/format"
import type { CampaignType, CampaignEmailRecord } from "@/types/email-marketing"

const GROUP_LABELS: Record<string, string> = {
  minorista: "Minorista",
  mayorista: "Mayorista",
  revendedora: "Revendedora",
}

const GROUP_COLORS: Record<string, string> = {
  minorista: "bg-blue-100 text-blue-700",
  mayorista: "bg-purple-100 text-purple-700",
  revendedora: "bg-amber-100 text-amber-700",
}

const CAMPAIGN_LABELS: Record<string, string> = {
  post_purchase: "Post-Compra",
  welcome_1: "Bienvenida 1",
  welcome_2: "Bienvenida 2 (Descuento)",
  welcome_3: "Bienvenida 3 (IA)",
  browse_abandonment: "Browse Abandonment",
  newsletter: "Newsletter",
  win_back: "Win-Back",
}

const CAMPAIGN_COLORS: Record<string, string> = {
  post_purchase: "bg-green-100 text-green-700",
  welcome_1: "bg-blue-100 text-blue-700",
  welcome_2: "bg-pink-100 text-pink-700",
  welcome_3: "bg-purple-100 text-purple-700",
  browse_abandonment: "bg-orange-100 text-orange-700",
  newsletter: "bg-teal-100 text-teal-700",
  win_back: "bg-rose-100 text-rose-700",
}

function buildForceSendData(
  type: CampaignType,
  record: CampaignEmailRecord
): Record<string, unknown> | null {
  switch (type) {
    case "post_purchase":
      return {
        customer_id: record.customer_id,
        ...(record.trigger_data?.order_id ? { order_id: record.trigger_data.order_id } : {}),
      }
    case "welcome_1":
    case "welcome_2":
    case "welcome_3":
    case "win_back":
      return { customer_id: record.customer_id }
    case "browse_abandonment":
      return {
        customer_id: record.customer_id,
        product_id: (record.trigger_data?.product_id as string) || "",
      }
    case "newsletter":
      return {
        customer_id: record.customer_id,
        ...(record.trigger_data?.theme ? { theme: record.trigger_data.theme } : {}),
      }
    default:
      return null
  }
}

function EmailStatusBadge({
  sent,
  delivered,
  opened,
  clicked,
  bounced,
}: {
  sent: boolean
  delivered: boolean
  opened: boolean
  clicked: boolean
  bounced: boolean
}) {
  if (bounced) return <Badge className="bg-red-100 text-red-700 text-[10px]">Rebotó</Badge>
  if (clicked) return <Badge className="bg-green-100 text-green-700 text-[10px]">Click</Badge>
  if (opened) return <Badge className="bg-blue-100 text-blue-700 text-[10px]">Abierto</Badge>
  if (delivered) return <Badge className="bg-gray-100 text-gray-700 text-[10px]">Entregado</Badge>
  if (sent) return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">Enviado</Badge>
  return <Badge className="bg-gray-50 text-gray-400 text-[10px]">Pendiente</Badge>
}

export default function CampanasAIPage() {
  const { data: campaignStats, isLoading: campaignStatsLoading } = useCampaignStats()
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType | null>(null)
  const { data: campaignRecent, isLoading: recentLoading } = useCampaignRecent(selectedCampaignType)
  const processCampaignsMutation = useProcessCampaigns()
  const campaignForceSendMutation = useCampaignForceSend()

  return (
    <div>
      <Header
        title="Campañas AI"
        description="Campañas automáticas con inteligencia artificial: post-compra, bienvenida, browse abandonment, newsletter y win-back"
      />

      <div className="p-6 space-y-6">
        {campaignStatsLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
            </div>
            <Skeleton className="h-[300px]" />
          </div>
        ) : campaignStats ? (
          <>
            {/* KPIs globales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Emails Enviados"
                value={formatNumber(campaignStats.totals.sent)}
                subtitle={`${formatNumber(campaignStats.totals.total)} programados`}
                icon="📧"
              />
              <MetricCard
                title="Open Rate"
                value={campaignStats.totals.open_rate}
                subtitle={`${formatNumber(campaignStats.totals.opened)} abiertos`}
                changeType={parseFloat(campaignStats.totals.open_rate) >= 40 ? "positive" : "neutral"}
                icon="👀"
              />
              <MetricCard
                title="Click Rate"
                value={campaignStats.totals.click_rate}
                subtitle={`${formatNumber(campaignStats.totals.clicked)} clicks`}
                changeType={parseFloat(campaignStats.totals.click_rate) >= 20 ? "positive" : "neutral"}
                icon="🖱️"
              />
              <MetricCard
                title="Rebotados"
                value={formatNumber(campaignStats.totals.bounced)}
                subtitle={campaignStats.ai_enabled ? `IA: ${campaignStats.ai_model}` : "IA desactivada"}
                changeType={campaignStats.totals.bounced > 0 ? "negative" : "neutral"}
                icon="💥"
              />
            </div>

            {/* Botón procesar campañas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Procesar Campañas</p>
                    <p className="text-sm text-gray-500">
                      Ejecutar manualmente el procesamiento de todas las campañas
                    </p>
                  </div>
                  <Button
                    onClick={() => processCampaignsMutation.mutate()}
                    disabled={processCampaignsMutation.isPending}
                    variant="outline"
                  >
                    {processCampaignsMutation.isPending ? "Procesando..." : "Ejecutar"}
                  </Button>
                </div>
                {processCampaignsMutation.isSuccess && processCampaignsMutation.data && (
                  <div className="mt-3 p-3 bg-green-50 rounded-md text-sm text-green-700">
                    Post-compra: {processCampaignsMutation.data.post_purchase} · Bienvenida: W1={processCampaignsMutation.data.welcome.w1} W2={processCampaignsMutation.data.welcome.w2} W3={processCampaignsMutation.data.welcome.w3} · Browse: {processCampaignsMutation.data.browse_abandonment} · Win-Back: {processCampaignsMutation.data.win_back ?? 0} · Tiempo: {processCampaignsMutation.data.elapsed_seconds.toFixed(1)}s
                  </div>
                )}
                {processCampaignsMutation.isError && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
                    {processCampaignsMutation.error?.message}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabla por tipo de campaña */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rendimiento por Tipo de Campaña</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaña</TableHead>
                      <TableHead className="text-right">Enviados</TableHead>
                      <TableHead className="text-right">Entregados</TableHead>
                      <TableHead className="text-right">Abiertos</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">Open Rate</TableHead>
                      <TableHead className="text-right">Click Rate</TableHead>
                      <TableHead className="text-right">Con IA</TableHead>
                      <TableHead>Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignStats.campaigns.map((c) => (
                      <TableRow key={c.campaign_type}>
                        <TableCell>
                          <Badge className={CAMPAIGN_COLORS[c.campaign_type] || "bg-gray-100 text-gray-700"}>
                            {CAMPAIGN_LABELS[c.campaign_type] || c.campaign_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatNumber(c.sent)}</TableCell>
                        <TableCell className="text-right">{formatNumber(c.delivered)}</TableCell>
                        <TableCell className="text-right">{formatNumber(c.opened)}</TableCell>
                        <TableCell className="text-right">{formatNumber(c.clicked)}</TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(c.open_rate) >= 40 ? "text-green-600 font-semibold" : ""}>
                            {c.open_rate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={parseFloat(c.click_rate) >= 20 ? "text-green-600 font-semibold" : ""}>
                            {c.click_rate}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {c.with_ai > 0 ? (
                            <span className="text-purple-600">{formatNumber(c.with_ai)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => setSelectedCampaignType(
                              selectedCampaignType === c.campaign_type ? null : c.campaign_type as CampaignType
                            )}
                          >
                            {selectedCampaignType === c.campaign_type ? "Cerrar" : "Ver emails"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Detalle: emails recientes de la campaña seleccionada */}
            {selectedCampaignType && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Emails recientes: {CAMPAIGN_LABELS[selectedCampaignType] || selectedCampaignType}
                    </CardTitle>
                    <Badge className={CAMPAIGN_COLORS[selectedCampaignType] || ""}>
                      {campaignRecent?.count ?? 0} registros
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentLoading ? (
                    <Skeleton className="h-[200px]" />
                  ) : campaignRecent?.records?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Grupo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>AI Subject</TableHead>
                          <TableHead>Cupón</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignRecent.records.map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {r.sent_at ? new Date(r.sent_at).toLocaleString("es-AR") : "Pendiente"}
                            </TableCell>
                            <TableCell className="text-xs max-w-[180px] truncate">
                              {r.customer_name || r.email}
                            </TableCell>
                            <TableCell>
                              {r.customer_group && (
                                <Badge className={`text-xs ${GROUP_COLORS[r.customer_group] || "bg-gray-100 text-gray-700"}`}>
                                  {GROUP_LABELS[r.customer_group] || r.customer_group}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <EmailStatusBadge
                                sent={!!r.sent_at}
                                delivered={!!r.delivered_at}
                                opened={!!r.opened_at}
                                clicked={!!r.clicked_at}
                                bounced={r.bounced}
                              />
                            </TableCell>
                            <TableCell className="text-xs max-w-[250px] truncate text-purple-600">
                              {r.ai_subject || <span className="text-gray-400">Template</span>}
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.coupon_code ? (
                                <Badge className="bg-pink-100 text-pink-700 text-[10px]">{r.coupon_code}</Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                disabled={campaignForceSendMutation.isPending}
                                onClick={() => {
                                  const data = buildForceSendData(selectedCampaignType!, r)
                                  if (data) {
                                    campaignForceSendMutation.mutate({
                                      type: selectedCampaignType!,
                                      data,
                                    })
                                  }
                                }}
                              >
                                {campaignForceSendMutation.isPending ? "..." : "Reenviar"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay emails recientes para esta campaña
                    </p>
                  )}
                  {campaignForceSendMutation.isSuccess && (
                    <p className="text-sm text-green-600 mt-2">
                      Email reenviado a {campaignForceSendMutation.data?.email}
                    </p>
                  )}
                  {campaignForceSendMutation.isError && (
                    <p className="text-sm text-red-600 mt-2">
                      Error: {campaignForceSendMutation.error?.message}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No se pudieron cargar las estadísticas de campañas.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
