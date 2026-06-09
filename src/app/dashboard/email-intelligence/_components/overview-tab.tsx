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
import { formatCurrency, formatNumber } from "@/lib/format"
import { CAMPAIGN_KIND_LABELS } from "@/types/email-intelligence"
import type { EmailCampaignKind } from "@/types/email-intelligence"
import { Mail, MousePointerClick, ShoppingBag, DollarSign } from "lucide-react"

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Emails enviados"
              value={formatNumber(data!.totals.sends)}
              icon={<Mail className="h-5 w-5 text-blue-500" />}
              subtitle={`Aperturas: ${formatNumber(data!.totals.opens)}`}
            />
            <MetricCard
              title="Clicks (CTR)"
              value={pct(data!.totals.ctr)}
              icon={<MousePointerClick className="h-5 w-5 text-violet-500" />}
              subtitle={`${formatNumber(data!.totals.clicks)} clicks`}
            />
            <MetricCard
              title="Conversiones"
              value={formatNumber(data!.totals.conversions)}
              icon={<ShoppingBag className="h-5 w-5 text-green-500" />}
              subtitle={`Tasa: ${pct(data!.totals.conv_rate)}`}
            />
            <MetricCard
              title="Ingresos atribuidos"
              value={formatCurrency(data!.totals.revenue_ars)}
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              subtitle={`Costo IA: USD ${(
                data!.totals.llm_cost_usd + data!.totals.evolution_cost_usd
              ).toFixed(2)}`}
            />
          </div>

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
                      </TableCell>
                      <TableCell className="text-right">{pct(c.ctr)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(c.conversions)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(c.revenue_ars)}
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
        </>
      )}
    </div>
  )
}
