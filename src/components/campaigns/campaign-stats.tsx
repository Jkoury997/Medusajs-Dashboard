"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
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
import { MetricCard } from "@/components/dashboard/metric-card"
import { CampaignStatusBadge } from "./campaign-status-badge"
import {
  useManualCampaignDetail,
  useManualCampaignStats,
  useManualCampaignRecipients,
} from "@/hooks/use-manual-campaigns"
import { formatNumber } from "@/lib/format"

interface CampaignStatsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  campaignName: string
}

export function CampaignStatsDialog({ open, onOpenChange, campaignId, campaignName }: CampaignStatsProps) {
  const [recipientPage, setRecipientPage] = useState(1)
  const recipientLimit = 20

  const { data: detail } = useManualCampaignDetail(open ? campaignId : null)
  const { data: stats, isLoading: statsLoading } = useManualCampaignStats(open ? campaignId : null)
  const { data: recipients, isLoading: recipientsLoading } = useManualCampaignRecipients(
    open ? campaignId : null,
    recipientPage,
    recipientLimit
  )

  const totalRecipientPages = recipients ? Math.ceil(recipients.total / recipientLimit) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{campaignName}</DialogTitle>
            {detail && <CampaignStatusBadge status={detail.status} />}
          </div>
          {(detail?.sending_completed_at || detail?.sending_started_at) && (
            <p className="text-xs text-gray-500">
              Enviada: {new Date((detail.sending_completed_at || detail.sending_started_at)!).toLocaleString("es-AR")}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* KPIs */}
          {statsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-[80px]" />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard
                title="Enviados"
                value={formatNumber(stats.sent)}
                icon="📤"
              />
              <MetricCard
                title="Entregados"
                value={formatNumber(stats.delivered)}
                subtitle={stats.delivery_rate}
                icon="✅"
              />
              <MetricCard
                title="Abiertos"
                value={formatNumber(stats.opened)}
                subtitle={stats.open_rate}
                changeType={parseFloat(stats.open_rate) >= 30 ? "positive" : "neutral"}
                icon="👀"
              />
              <MetricCard
                title="Clicks"
                value={formatNumber(stats.clicked)}
                subtitle={stats.click_rate}
                changeType={parseFloat(stats.click_rate) >= 10 ? "positive" : "neutral"}
                icon="🖱️"
              />
              <MetricCard
                title="Rebotados"
                value={formatNumber(stats.bounced)}
                subtitle={stats.bounce_rate}
                changeType={stats.bounced > 0 ? "negative" : "neutral"}
                icon="💥"
              />
            </div>
          ) : null}

          {/* Recipients table */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-3">
                Destinatarios {recipients ? `(${formatNumber(recipients.total)})` : ""}
              </p>
              {recipientsLoading ? (
                <Skeleton className="h-[200px]" />
              ) : recipients?.recipients?.length ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead>Enviado</TableHead>
                        <TableHead>Entregado</TableHead>
                        <TableHead>Abierto</TableHead>
                        <TableHead>Click</TableHead>
                        <TableHead>Cupón</TableHead>
                        <TableHead>Rebotó</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.recipients.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs max-w-[200px] truncate">{r.email}</TableCell>
                          <TableCell className="text-xs">{r.name || "-"}</TableCell>
                          <TableCell className="text-xs">{r.group || "-"}</TableCell>
                          <TableCell className="text-xs">
                            {r.sent_at ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Si</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.delivered_at ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Si</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.opened_at ? (
                              <Badge className="bg-blue-100 text-blue-700 text-[10px]">Si</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.clicked_at ? (
                              <Badge className="bg-purple-100 text-purple-700 text-[10px]">Si</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.coupon_code ? (
                              <span className="font-mono text-[10px] bg-yellow-50 text-yellow-700 px-1 py-0.5 rounded">{r.coupon_code}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {r.bounced ? (
                              <Badge className="bg-red-100 text-red-700 text-[10px]">Si</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {totalRecipientPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={recipientPage <= 1}
                        onClick={() => setRecipientPage((p) => p - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="text-xs text-gray-500">
                        Página {recipientPage} de {totalRecipientPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        disabled={recipientPage >= totalRecipientPages}
                        onClick={() => setRecipientPage((p) => p + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay destinatarios para mostrar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
