"use client"

import { useState } from "react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useEmailOverview } from "@/hooks/use-email-intelligence"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { CAMPAIGN_KIND_LABELS } from "@/types/email-intelligence"
import type {
  EmailCampaignKind,
  SegmentRow,
  Deliverability,
} from "@/types/email-intelligence"
import { Mail, MousePointerClick, ShoppingBag, DollarSign } from "lucide-react"
import { TrendChart } from "./trend-chart"
import { AlertsPanel } from "./alerts-panel"

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

/** Props de comparación para MetricCard (vacío si no hay base previa). */
const deltaProps = (
  d: number | null | undefined
): { change?: string; changeType?: "positive" | "negative" | "neutral" } =>
  d == null || !Number.isFinite(d)
    ? {}
    : { change: formatPercent(d), changeType: d >= 0 ? "positive" : "negative" }

/** Δ% inline para celdas de tabla (vs período anterior). */
function DeltaInline({ value }: { value?: number | null }) {
  if (value == null || !Number.isFinite(value)) return null
  const up = value >= 0
  return (
    <div className={`text-xs ${up ? "text-green-600" : "text-red-600"}`}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </div>
  )
}

export function OverviewTab() {
  const [days, setDays] = useState(30)
  const { data, isLoading, error } = useEmailOverview(days)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Desempeño de las campañas de email generadas por IA.
        </p>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar las métricas. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <AlertsPanel />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Emails enviados"
              value={formatNumber(data!.totals.sends)}
              icon={<Mail className="h-5 w-5 text-blue-500" />}
              subtitle={`Aperturas: ${formatNumber(data!.totals.opens)}`}
              {...deltaProps(data!.totals_deltas?.sends)}
            />
            <MetricCard
              title="Clicks (CTR)"
              value={pct(data!.totals.ctr)}
              icon={<MousePointerClick className="h-5 w-5 text-violet-500" />}
              subtitle={`${formatNumber(data!.totals.clicks)} clicks`}
              {...deltaProps(data!.totals_deltas?.ctr)}
            />
            <MetricCard
              title="Conversiones"
              value={formatNumber(data!.totals.conversions)}
              icon={<ShoppingBag className="h-5 w-5 text-green-500" />}
              subtitle={`Tasa: ${pct(data!.totals.conv_rate)}`}
              {...deltaProps(data!.totals_deltas?.conversions)}
            />
            <MetricCard
              title="Ingresos atribuidos"
              value={formatCurrency(data!.totals.revenue_ars)}
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              subtitle={`Costo IA: USD ${(
                data!.totals.llm_cost_usd + data!.totals.evolution_cost_usd
              ).toFixed(2)}`}
              {...deltaProps(data!.totals_deltas?.revenue_ars)}
            />
          </div>

          {data!.deliverability && (
            <DeliverabilityCard d={data!.deliverability} />
          )}

          <TrendChart days={days} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle por campaña</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Costo IA</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data!.per_campaign.map((c) => (
                    <TableRow key={c.campaign_id}>
                      <TableCell className="font-medium">
                        {CAMPAIGN_KIND_LABELS[c.kind as EmailCampaignKind] ?? c.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(c.sends)}
                        <DeltaInline value={c.deltas?.sends} />
                      </TableCell>
                      <TableCell className="text-right">{pct(c.ctr)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(c.conversions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(c.revenue_ars)}
                        <DeltaInline value={c.deltas?.revenue_ars} />
                      </TableCell>
                      <TableCell className="text-right text-gray-500">
                        USD {(c.llm_cost_usd + c.evolution_cost_usd).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={c.enabled ? "default" : "secondary"}>
                          {c.enabled ? "Activa" : "Pausada"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <SegmentTable
            title="Por marca / canal"
            segmentLabel="Canal"
            rows={data!.by_sales_channel}
          />

          <SegmentTable
            title="Por grupo de cliente"
            segmentLabel="Grupo"
            rows={data!.by_customer_group}
          />
        </>
      )}
    </div>
  )
}

function SegmentTable({
  title,
  segmentLabel,
  rows,
}: {
  title: string
  segmentLabel: string
  rows: SegmentRow[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{segmentLabel}</TableHead>
              <TableHead className="text-right">Enviados</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Conv.</TableHead>
              <TableHead className="text-right">Tasa conv.</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Costo IA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rows ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-500 py-6">
                  Sin datos en el período.
                </TableCell>
              </TableRow>
            ) : (
              (rows ?? []).map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(r.sends)}
                    <DeltaInline value={r.deltas?.sends} />
                  </TableCell>
                  <TableCell className="text-right">{pct(r.ctr)}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(r.conversions)}
                  </TableCell>
                  <TableCell className="text-right">{pct(r.conv_rate)}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(r.revenue_ars)}
                    <DeltaInline value={r.deltas?.revenue_ars} />
                  </TableCell>
                  <TableCell className="text-right text-gray-500">
                    USD {r.llm_cost_usd.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/** Tarjeta de salud de entregabilidad (bounce / quejas / fallos). */
function DeliverabilityCard({ d }: { d: Deliverability }) {
  const cells: Array<{ label: string; value: string; sub: string; bad: boolean }> = [
    { label: "Procesados", value: formatNumber(d.processed), sub: `${formatNumber(d.sent)} enviados`, bad: false },
    {
      label: "Bounce rate",
      value: pct(d.bounce_rate),
      sub: `${formatNumber(d.bounced)} bounces`,
      bad: d.bounce_rate > 0.02,
    },
    {
      label: "Quejas (spam)",
      value: pct(d.complaint_rate),
      sub: `${formatNumber(d.complained)} quejas`,
      bad: d.complaint_rate > 0.001,
    },
    {
      label: "Fallos",
      value: pct(d.fail_rate),
      sub: `${formatNumber(d.failed)} fallos`,
      bad: d.fail_rate > 0.05,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Entregabilidad</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cells.map((c) => (
            <div key={c.label}>
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className={`text-xl font-bold ${c.bad ? "text-red-600" : "text-gray-900"}`}>
                {c.value}
              </p>
              <p className="text-xs text-gray-400">{c.sub}</p>
            </div>
          ))}
        </div>
        {(d.bounce_rate > 0.02 || d.complaint_rate > 0.001) && (
          <p className="mt-3 text-xs text-red-600">
            ⚠️ Bounce o quejas por encima del umbral recomendado — puede afectar la
            reputación del dominio y la entregabilidad.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
