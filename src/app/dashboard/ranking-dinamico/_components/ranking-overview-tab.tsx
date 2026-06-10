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
import { useRankingStats, useRankingPerformance } from "@/hooks/use-ranking-agent"
import { formatNumber, formatCurrency, formatDateTime } from "@/lib/format"
import type { RankingRange } from "@/types/ranking-agent"
import { Trophy, Users, DollarSign, TrendingUp, MousePointerClick } from "lucide-react"

const pct = (fraction: number): string => `${(fraction * 100).toFixed(1)}%`

export function RankingOverviewTab({
  salesChannelId,
  channelName,
}: {
  salesChannelId?: string
  channelName: (id: string) => string
}) {
  const [range, setRange] = useState<RankingRange>("30d")
  const stats = useRankingStats()
  const perf = useRankingPerformance(range, salesChannelId)

  const t = stats.data?.totals
  const p = perf.data?.totals
  const loading = stats.isLoading || perf.isLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Cobertura del ranking dinámico y revenue atribuido por IA.
        </p>
        <Select value={range} onValueChange={(v) => setRange(v as RankingRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {stats.error || perf.error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar las métricas.{" "}
            {((stats.error || perf.error) as Error)?.message}
          </CardContent>
        </Card>
      ) : loading || !t || !p ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Rankings activos"
              value={formatNumber(t.rankings_active)}
              icon={<Trophy className="h-5 w-5 text-amber-500" />}
              subtitle={`${formatNumber(t.rankings_personalized_active)} personalizados`}
            />
            <MetricCard
              title="Clientes personalizados"
              value={formatNumber(t.customers_with_personalized)}
              icon={<Users className="h-5 w-5 text-blue-500" />}
              subtitle={`${formatNumber(t.runs_30d)} runs en 30d`}
            />
            <MetricCard
              title="Revenue atribuido"
              value={`USD ${p.attributed_revenue_usd.toFixed(2)}`}
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              subtitle={
                p.attributed_revenue_amount > 0
                  ? `${formatCurrency(p.attributed_revenue_amount)} ${p.attributed_revenue_currency ?? ""}`
                  : "Sin atribución en el período"
              }
            />
            <MetricCard
              title="ROI"
              value={p.roi_multiplier != null ? `${p.roi_multiplier.toFixed(1)}x` : "—"}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              subtitle={`Costo LLM 30d: USD ${t.llm_cost_30d.toFixed(2)}`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Clicks en ranking"
              value={formatNumber(p.clicks)}
              icon={<MousePointerClick className="h-5 w-5 text-indigo-500" />}
              subtitle={`${formatNumber(p.attributions_count)} atribuciones · ${formatNumber(p.unique_orders)} órdenes`}
            />
            <MetricCard
              title="Click → compra"
              value={pct(p.click_to_purchase_pct)}
              subtitle={`Cotización USD/ARS: ${formatNumber(p.usd_ars_rate)} (${p.usd_ars_rate_type})`}
            />
            <MetricCard
              title="Última corrida"
              value={t.last_run_at ? formatDateTime(t.last_run_at) : "—"}
              subtitle={`Costo LLM 90d: USD ${t.llm_cost_90d.toFixed(2)}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rankings por marca</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Rankings</TableHead>
                      <TableHead className="text-right">Última corrida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stats.data?.by_channel ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-gray-400 py-4">
                          Sin rankings todavía.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stats.data!.by_channel.map((c) => (
                        <TableRow key={c.sales_channel_id}>
                          <TableCell className="font-medium">
                            {channelName(c.sales_channel_id)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(c.rankings_count)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-500">
                            {c.last_run_at ? formatDateTime(c.last_run_at) : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue por posición</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Posición</TableHead>
                      <TableHead className="text-right">Atribuciones</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(perf.data?.by_position ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-sm text-gray-400 py-4">
                          Sin atribución en el período.
                        </TableCell>
                      </TableRow>
                    ) : (
                      perf.data!.by_position.map((b) => (
                        <TableRow key={b.position_bucket}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">P{b.position_bucket}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(b.attributions_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(b.attributed_revenue_amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top productos por revenue atribuido</CardTitle>
            </CardHeader>
            <CardContent>
              {(perf.data?.top_performers ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 py-2">Sin datos en el período.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Atribuciones</TableHead>
                      <TableHead className="text-right">Pos. media</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perf.data!.top_performers.map((tp) => (
                      <TableRow key={tp.product_id}>
                        <TableCell className="font-medium max-w-[260px] truncate">
                          {tp.product_title ?? tp.product_id}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(tp.attributions_count)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {tp.avg_position_at_click.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(tp.attributed_revenue_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
