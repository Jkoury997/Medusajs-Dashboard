"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useEmailCampaigns,
  useEmailSends,
} from "@/hooks/use-email-intelligence"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { CAMPAIGN_KIND_LABELS } from "@/types/email-intelligence"
import type { EmailCampaignKind, SendStatus } from "@/types/email-intelligence"

const STATUS_VARIANT: Record<SendStatus, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default",
  queued: "outline",
  failed: "destructive",
  bounced: "destructive",
  complained: "secondary",
}

export function SendsTab() {
  const [campaignId, setCampaignId] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const { data: campaignsData } = useEmailCampaigns()
  const { data, isLoading, error } = useEmailSends({
    campaignId: campaignId === "all" ? undefined : campaignId,
    status: status === "all" ? undefined : status,
    limit: 100,
  })

  const campaigns = campaignsData?.campaigns ?? []
  const kindById = new Map(campaigns.map((c) => [c.id, c.kind]))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Campaña" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las campañas</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {CAMPAIGN_KIND_LABELS[c.kind]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="queued">En cola</SelectItem>
            <SelectItem value="failed">Fallidos</SelectItem>
            <SelectItem value="bounced">Rebotados</SelectItem>
            <SelectItem value="complained">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar los envíos. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email / Asunto</TableHead>
                  <TableHead>Campaña</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Abrió</TableHead>
                  <TableHead className="text-center">Click</TableHead>
                  <TableHead className="text-right">Conversión</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.sends ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-8">
                      No hay envíos para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  data!.sends.map((s) => {
                    const kind = kindById.get(s.campaign_id) as
                      | EmailCampaignKind
                      | undefined
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{s.email}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs">
                            {s.composed_subject ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {kind ? CAMPAIGN_KIND_LABELS[kind] : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={STATUS_VARIANT[s.status]}>{s.status}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {s.opened_at ? "✓" : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.clicked_at ? "✓" : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.converted_at
                            ? formatCurrency(s.conversion_revenue_ars)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-500">
                          {formatDateTime(s.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
