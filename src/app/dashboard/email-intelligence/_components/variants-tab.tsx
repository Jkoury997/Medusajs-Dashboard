"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useEmailCampaigns,
  useEmailVariants,
  useAnalyzeVariant,
} from "@/hooks/use-email-intelligence"
import { formatNumber } from "@/lib/format"
import { CAMPAIGN_KIND_LABELS } from "@/types/email-intelligence"
import type { VariantStatus, EmailVariant, EmailCampaign } from "@/types/email-intelligence"
import { Sparkles } from "lucide-react"

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
  const [analyzeV, setAnalyzeV] = useState<EmailVariant | null>(null)
  const analyzeCampaign = campaigns.find((c) => c.id === analyzeV?.campaign_id) ?? null

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
                  <TableHead className="text-right">IA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.variants ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-gray-400 py-8">
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
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setAnalyzeV(v)}
                        >
                          <Sparkles className="w-4 h-4" />
                          Analizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AnalyzeDialog
        variant={analyzeV}
        campaign={analyzeCampaign}
        onClose={() => setAnalyzeV(null)}
      />
    </div>
  )
}

function AnalyzeDialog({
  variant,
  campaign,
  onClose,
}: {
  variant: EmailVariant | null
  campaign: EmailCampaign | null
  onClose: () => void
}) {
  const analyze = useAnalyzeVariant()

  function run() {
    if (!variant || !campaign) return
    analyze.mutate({
      campaignKind: campaign.kind,
      campaignName: campaign.name,
      minCtrThreshold: campaign.min_ctr_threshold,
      variant: {
        label: variant.label,
        status: variant.status,
        subject_template: variant.subject_template,
        headline_template: variant.headline_template,
        body_template: variant.body_template,
        cta_label: variant.cta_label,
        sends_count: variant.sends_count,
        opens_count: variant.opens_count,
        clicks_count: variant.clicks_count,
        conversions_count: variant.conversions_count,
        conversions_revenue_ars: variant.conversions_revenue_ars,
        ctr: variant.ctr,
        open_rate: variant.open_rate,
        conv_rate: variant.conv_rate,
        score: variant.score,
      },
    })
  }

  return (
    <Dialog
      open={variant !== null}
      onOpenChange={(o) => {
        if (!o) {
          analyze.reset()
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-mk-pink" />
            Análisis IA — {variant?.label}
          </DialogTitle>
        </DialogHeader>
        <div className="py-1 min-h-[120px]">
          {analyze.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : analyze.isError ? (
            <p className="text-sm text-red-600">
              {analyze.error instanceof Error ? analyze.error.message : "Error al analizar"}
            </p>
          ) : analyze.data ? (
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {analyze.data}
            </div>
          ) : (
            <div className="flex justify-center pt-6">
              <Button onClick={run} className="gap-1.5">
                <Sparkles className="w-4 h-4" />
                Analizar con IA
              </Button>
            </div>
          )}
        </div>
        {(analyze.data || analyze.isError) && !analyze.isPending && (
          <Button variant="outline" size="sm" onClick={run} className="gap-1.5 w-fit">
            <Sparkles className="w-4 h-4" />
            Volver a analizar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
