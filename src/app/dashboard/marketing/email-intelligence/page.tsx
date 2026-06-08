"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatNumber } from "@/lib/format"
import {
  useEmailOverview,
  useEmailCampaigns,
  useEmailVariants,
  useAnalyzeVariant,
  CAMPAIGN_KIND_LABELS,
  type EmailVariant,
  type EmailCampaign,
} from "@/hooks/use-email-intelligence"
import { Eye, Sparkles, Mail } from "lucide-react"

const pct = (frac: number) => `${(frac * 100).toFixed(1)}%`

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>
  if (status === "drafted") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Borrador</Badge>
  return <Badge variant="secondary" className="text-gray-500">Retirada</Badge>
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function EmailIntelligencePage() {
  const { data: overview, isLoading: ovLoading } = useEmailOverview(30)
  const { data: campaigns, isLoading: campLoading } = useEmailCampaigns()
  const [campaignId, setCampaignId] = useState<string | null>(null)
  // Campaña efectiva: la elegida, o la primera por defecto (sin setState-in-effect)
  const effectiveCampaignId = campaignId ?? campaigns?.[0]?.id ?? null

  const { data: variants, isLoading: varLoading } = useEmailVariants(effectiveCampaignId)
  const selectedCampaign = useMemo(
    () => campaigns?.find((c) => c.id === effectiveCampaignId) ?? null,
    [campaigns, effectiveCampaignId]
  )

  // Dialogs
  const [viewVariant, setViewVariant] = useState<EmailVariant | null>(null)
  const [analyzeVariant, setAnalyzeVariant] = useState<EmailVariant | null>(null)

  return (
    <div>
      <Header
        title="Email Intelligence"
        description="Plantillas de email automático, su rendimiento y análisis con IA"
      />
      <div className="p-6 space-y-6">
        {/* KPIs (últimos 30 días) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {ovLoading || !overview ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[76px] rounded-xl" />)
          ) : (
            <>
              <KpiCard label="Enviados (30d)" value={formatNumber(overview.totals.sends)} />
              <KpiCard label="Aperturas" value={formatNumber(overview.totals.opens)} />
              <KpiCard label="Clicks" value={formatNumber(overview.totals.clicks)} sub={`CTR ${pct(overview.totals.ctr)}`} />
              <KpiCard label="Conversiones" value={formatNumber(overview.totals.conversions)} sub={`Conv. ${pct(overview.totals.conv_rate)}`} />
              <KpiCard label="Revenue" value={formatCurrency(overview.totals.revenue_ars)} />
              <KpiCard label="Costo IA" value={`U$D ${overview.totals.llm_cost_usd.toFixed(2)}`} />
            </>
          )}
        </div>

        {/* Selector de campaña */}
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Campaña:</span>
            {campLoading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              <Select value={effectiveCampaignId ?? ""} onValueChange={setCampaignId}>
                <SelectTrigger className="w-72"><SelectValue placeholder="Elegí una campaña" /></SelectTrigger>
                <SelectContent>
                  {(campaigns ?? []).map((c: EmailCampaign) => (
                    <SelectItem key={c.id} value={c.id}>
                      {CAMPAIGN_KIND_LABELS[c.kind] ?? c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedCampaign && (
              <div className="flex items-center gap-2 ml-auto text-sm text-gray-500">
                {selectedCampaign.enabled ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activa</Badge>
                ) : (
                  <Badge variant="secondary" className="text-gray-500">Pausada</Badge>
                )}
                <span>{selectedCampaign.variant_counts.active} plantillas activas</span>
                <span className="text-gray-300">·</span>
                <span>CTR mín. {pct(selectedCampaign.min_ctr_threshold)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plantillas (variantes) */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plantilla</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Envíos</TableHead>
                  <TableHead className="text-right">Apert.</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {varLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !variants || variants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      Esta campaña no tiene plantillas todavía
                    </TableCell>
                  </TableRow>
                ) : (
                  variants.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium max-w-[220px] truncate" title={v.label}>{v.label}</TableCell>
                      <TableCell><StatusBadge status={v.status} /></TableCell>
                      <TableCell className="text-right">{formatNumber(v.sends_count)}</TableCell>
                      <TableCell className="text-right text-gray-600">{v.sends_count ? pct(v.open_rate) : "—"}</TableCell>
                      <TableCell className="text-right text-gray-600">{v.sends_count ? pct(v.ctr) : "—"}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatNumber(v.conversions_count)}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {v.conversions_revenue_ars ? formatCurrency(v.conversions_revenue_ars) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setViewVariant(v)}>
                            <Eye className="w-4 h-4" />Ver
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAnalyzeVariant(v)}>
                            <Sparkles className="w-4 h-4" />Analizar IA
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
      </div>

      {/* Dialog: ver plantilla */}
      <Dialog open={viewVariant !== null} onOpenChange={(o) => { if (!o) setViewVariant(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewVariant?.label}</DialogTitle>
          </DialogHeader>
          {viewVariant && (
            <div className="space-y-3 text-sm">
              <Field label="Asunto" value={viewVariant.subject_template} />
              <Field label="Título" value={viewVariant.headline_template} />
              <Field label="Cuerpo / estilo" value={viewVariant.body_template} mono />
              <Field label="Botón (CTA)" value={viewVariant.cta_label || "—"} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: análisis IA */}
      <AnalyzeDialog
        variant={analyzeVariant}
        campaign={selectedCampaign}
        onClose={() => setAnalyzeVariant(null)}
      />
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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

  // Disparar el análisis al abrir (cuando cambia la variante)
  useEffect(() => {
    if (variant && campaign) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant?.id])

  return (
    <Dialog open={variant !== null} onOpenChange={(o) => { if (!o) { analyze.reset(); onClose() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-mk-pink" />
            Análisis IA — {variant?.label}
          </DialogTitle>
        </DialogHeader>
        <div className="py-1">
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
          ) : null}
        </div>
        {!analyze.isPending && (
          <Button variant="outline" size="sm" onClick={run} className="gap-1.5 w-fit">
            <Sparkles className="w-4 h-4" />
            Volver a analizar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
