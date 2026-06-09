"use client"

import { useState, useMemo } from "react"
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
  useVariantLatestSend,
  useVariantPreview,
} from "@/hooks/use-email-intelligence"
import { formatNumber } from "@/lib/format"
import { CAMPAIGN_KIND_LABELS } from "@/types/email-intelligence"
import type { VariantStatus, EmailVariant, EmailCampaign } from "@/types/email-intelligence"
import { Sparkles, Eye } from "lucide-react"

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
  const [viewV, setViewV] = useState<EmailVariant | null>(null)
  const analyzeCampaign = campaigns.find((c) => c.id === analyzeV?.campaign_id) ?? null

  // Ganadora por campaña: la variante activa con mayor score (con envíos > 0).
  const winnerIds = useMemo(() => {
    const best = new Map<string, EmailVariant>()
    for (const v of data?.variants ?? []) {
      if (v.status !== "active" || v.sends_count <= 0) continue
      const cur = best.get(v.campaign_id)
      if (!cur || v.score > cur.score) best.set(v.campaign_id, v)
    }
    return new Set(Array.from(best.values()).map((v) => v.id))
  }, [data])

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
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-center">Layout</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Envíos</TableHead>
                  <TableHead className="text-right">Apertura</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.variants ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-sm text-gray-400 py-8">
                      No hay variantes para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  data!.variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{v.label}</span>
                          {winnerIds.has(v.id) && (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              ★ ganadora
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {v.subject_template}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {v.sales_channel_name ?? (v.sales_channel_id ? "—" : "Global")}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{v.template_key}</Badge>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setViewV(v)}
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setAnalyzeV(v)}
                          >
                            <Sparkles className="w-4 h-4" />
                            Analizar
                          </Button>
                        </div>
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

      <ViewVariantDialog variant={viewV} onClose={() => setViewV(null)} />
    </div>
  )
}

function ViewVariantDialog({
  variant,
  onClose,
}: {
  variant: EmailVariant | null
  onClose: () => void
}) {
  const { data: sample, isLoading } = useVariantLatestSend(variant?.id ?? null)
  const { data: preview, isLoading: previewLoading } = useVariantPreview(
    variant?.id ?? null,
  )

  return (
    <Dialog open={variant !== null} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variant?.label}</DialogTitle>
        </DialogHeader>
        {variant && (
          <div className="space-y-4 text-sm">
            {/* Preview renderizado del email */}
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Vista previa del email
              </p>
              {previewLoading ? (
                <Skeleton className="h-[420px] w-full" />
              ) : preview?.html ? (
                <div className="overflow-hidden rounded-md border border-gray-200">
                  <iframe
                    title="Vista previa del email"
                    srcDoc={preview.html}
                    className="h-[480px] w-full bg-white"
                    sandbox=""
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  No se pudo renderizar esta plantilla.
                </p>
              )}
              {preview?.source === "template" && (
                <p className="mt-1 text-xs text-gray-400">
                  Mostrando el copy guardado (todavía no se envió un email real con
                  esta variante).
                </p>
              )}
            </div>

            {/* Email real */}
            <div>
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Último email real enviado
              </p>
              {isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : sample ? (
                <div className="rounded-md border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-100">
                    <p className="text-xs text-gray-400">Asunto</p>
                    <p className="font-medium text-gray-900">{sample.composed_subject || "—"}</p>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    {sample.composed_headline && (
                      <p className="font-semibold text-gray-900">{sample.composed_headline}</p>
                    )}
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {sample.composed_body || "(sin cuerpo guardado)"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Todavía no se envió ningún email con esta plantilla.
                </p>
              )}
            </div>

            {/* Receta */}
            <div className="border-t border-gray-100 pt-3 space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Abajo está la <strong>receta de IA</strong> (el estilo que sigue la inteligencia
                para generar cada email). El asunto y el texto final se crean por cliente, por eso
                pueden no tener un valor fijo.
              </div>
              <PlantillaField label="Asunto fijo (si hay)" value={variant.subject_template} />
              <PlantillaField label="Estilo / instrucción para la IA" value={variant.body_template} mono />
              <PlantillaField label="Botón (CTA)" value={variant.cta_label || "—"} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PlantillaField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={mono ? "mt-1 rounded-md bg-gray-50 p-2 text-xs text-gray-700 whitespace-pre-wrap" : "mt-0.5 text-gray-900"}>
        {value || "—"}
      </p>
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
