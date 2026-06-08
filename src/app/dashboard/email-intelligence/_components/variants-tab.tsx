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
  useEmailVariants,
} from "@/hooks/use-email-intelligence"
import { formatNumber } from "@/lib/format"
import { CAMPAIGN_KIND_LABELS } from "@/types/email-intelligence"
import type { VariantStatus } from "@/types/email-intelligence"

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

const STATUS_VARIANT: Record<VariantStatus, "default" | "secondary" | "outline"> = {
  active: "default",
  drafted: "outline",
  retired: "secondary",
}

const STATUS_LABEL: Record<VariantStatus, string> = {
  active: "Activa",
  drafted: "Borrador",
  retired: "Retirada",
}

export function VariantsTab() {
  const [campaignId, setCampaignId] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")
  const { data: campaignsData } = useEmailCampaigns()
  const { data, isLoading, error } = useEmailVariants(
    campaignId === "all" ? undefined : campaignId,
    status === "all" ? undefined : status,
  )

  const campaigns = campaignsData?.campaigns ?? []

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
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="drafted">Borrador</SelectItem>
            <SelectItem value="retired">Retiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar las variantes. {(error as Error).message}
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
                  <TableHead>Variante / Asunto</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Envíos</TableHead>
                  <TableHead className="text-right">Apertura</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.variants ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-gray-400 py-8">
                      No hay variantes para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  data!.variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{v.label}</div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {v.subject_template}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={STATUS_VARIANT[v.status]}>
                          {STATUS_LABEL[v.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(v.sends_count)}
                      </TableCell>
                      <TableCell className="text-right">{pct(v.open_rate)}</TableCell>
                      <TableCell className="text-right">{pct(v.ctr)}</TableCell>
                      <TableCell className="text-right">{pct(v.conv_rate)}</TableCell>
                      <TableCell className="text-right text-gray-500">
                        {v.score.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
