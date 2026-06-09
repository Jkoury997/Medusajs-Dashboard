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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  useEmailIntelligenceOverview,
  type EmailSegmentRow,
} from "@/hooks/use-email-intelligence"
import { formatCurrency, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const DAYS_OPTIONS = [7, 30, 90] as const

const pct = (n: number) => `${(n * 100).toFixed(2)}%`
const usd = (n: number) => `$${n.toFixed(4)}`

const CAMPAIGN_LABEL: Record<string, string> = {
  cart_recovery: "Cart Recovery",
  browse_abandon: "Browse Abandon",
  winback: "Winback",
  price_drop: "Price Drop",
  post_purchase_upsell: "Post-purchase Upsell",
  back_in_stock: "Back in Stock",
}

export default function EmailIntelligencePage() {
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const { data, isLoading, isError, error } = useEmailIntelligenceOverview(days)

  return (
    <div>
      <Header
        title="Email Intelligence"
        description="KPIs de campañas AI por marca/canal y grupo de cliente"
      />
      <div className="p-6 space-y-6">
        {/* Selector de ventana */}
        <div className="flex gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                days === d
                  ? "bg-mk-pink-light text-mk-pink-dark"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {d} días
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-8 text-center text-red-600">
              Error: {(error as Error)?.message}. Verificá que el backend de
              Medusa esté disponible y que tengas sesión iniciada.
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Envíos"
                value={formatNumber(data.totals.sends)}
                icon="📧"
              />
              <MetricCard
                title="Open rate"
                value={pct(data.totals.opens / (data.totals.sends || 1))}
                subtitle={`${formatNumber(data.totals.opens)} opens`}
                icon="👁️"
              />
              <MetricCard
                title="CTR"
                value={pct(data.totals.ctr)}
                subtitle={`${formatNumber(data.totals.clicks)} clicks`}
                icon="🖱️"
              />
              <MetricCard
                title="Conv. rate"
                value={pct(data.totals.conv_rate)}
                subtitle={`${formatNumber(data.totals.conversions)} conversiones`}
                icon="🎯"
              />
              <MetricCard
                title="Revenue atribuido"
                value={formatCurrency(data.totals.revenue_ars)}
                icon="💰"
              />
              <MetricCard
                title="Costo LLM (compose)"
                value={usd(data.totals.llm_cost_usd)}
                icon="🤖"
              />
              <MetricCard
                title="Costo LLM (evolution)"
                value={usd(data.totals.evolution_cost_usd)}
                icon="🧬"
              />
              <MetricCard
                title="Conversiones"
                value={formatNumber(data.totals.conversions)}
                icon="✅"
              />
            </div>

            {/* Por marca / canal */}
            <SegmentCard
              title="Por marca / canal"
              segmentLabel="Canal"
              rows={data.by_sales_channel}
            />

            {/* Por grupo de cliente */}
            <SegmentCard
              title="Por grupo de cliente"
              segmentLabel="Grupo"
              rows={data.by_customer_group}
            />

            {/* Por campaña */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por campaña</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaña</TableHead>
                      <TableHead className="text-right">Envíos</TableHead>
                      <TableHead className="text-right">Opens</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Conv</TableHead>
                      <TableHead className="text-right">Conv rate</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Costo LLM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.per_campaign.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-gray-500 py-6"
                        >
                          Sin datos en el período.
                        </TableCell>
                      </TableRow>
                    )}
                    {data.per_campaign.map((c) => (
                      <TableRow key={c.campaign_id}>
                        <TableCell className="font-medium">
                          {CAMPAIGN_LABEL[c.kind] ?? c.name}
                          {!c.enabled && (
                            <Badge variant="secondary" className="ml-2">
                              pausada
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(c.sends)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(c.opens)}
                        </TableCell>
                        <TableCell className="text-right">{pct(c.ctr)}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(c.conversions)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pct(c.conv_rate)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(c.revenue_ars)}
                        </TableCell>
                        <TableCell className="text-right">
                          {usd(c.llm_cost_usd + c.evolution_cost_usd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}

function SegmentCard({
  title,
  segmentLabel,
  rows,
}: {
  title: string
  segmentLabel: string
  rows: EmailSegmentRow[]
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
              <TableHead className="text-right">Envíos</TableHead>
              <TableHead className="text-right">Opens</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Conv</TableHead>
              <TableHead className="text-right">Conv rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Costo LLM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-gray-500 py-6"
                >
                  Sin datos en el período.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.key}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.sends)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.opens)}
                </TableCell>
                <TableCell className="text-right">{pct(r.ctr)}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(r.conversions)}
                </TableCell>
                <TableCell className="text-right">{pct(r.conv_rate)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(r.revenue_ars)}
                </TableCell>
                <TableCell className="text-right">{usd(r.llm_cost_usd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
