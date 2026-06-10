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
import { useSeoStats } from "@/hooks/use-seo-agent"
import { formatNumber } from "@/lib/format"
import { FileText, CheckCircle2, AlertTriangle, DollarSign } from "lucide-react"

const pct = (n: number): string => `${(n * 100).toFixed(1)}%`

export function SeoOverviewTab({ salesChannelId }: { salesChannelId?: string }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d")
  const { data, isLoading, error } = useSeoStats(range, salesChannelId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Cobertura SEO del catálogo y actividad de los agentes.
        </p>
        <Select value={range} onValueChange={(v) => setRange(v as "7d" | "30d" | "90d")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
            <SelectItem value="90d">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-red-600">
            No se pudieron cargar las stats. {(error as Error).message}
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
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
              title="Cobertura SEO"
              value={pct(data.coverage.coverage_pct)}
              icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
              subtitle={`${formatNumber(data.coverage.with_ai_approved)} de ${formatNumber(
                data.coverage.total_products,
              )} productos`}
            />
            <MetricCard
              title="Propuestas creadas"
              value={formatNumber(data.current.proposals_created)}
              icon={<FileText className="h-5 w-5 text-blue-500" />}
              subtitle={`${data.current.approvals} aprobadas · ${data.current.rejections} rechazadas`}
            />
            <MetricCard
              title="Pendientes de revisión"
              value={formatNumber(data.coverage.with_ai_pending)}
              icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
              subtitle={`${formatNumber(data.coverage.without_ai)} sin SEO`}
            />
            <MetricCard
              title="Gasto del mes"
              value={`USD ${data.budget.usd_spent.toFixed(2)}`}
              icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
              subtitle={
                data.budget.usd_limit > 0
                  ? `${pct(data.budget.utilization)} de USD ${data.budget.usd_limit}`
                  : "Sin límite configurado"
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cobertura por marca</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead className="text-right">Productos</TableHead>
                      <TableHead className="text-right">Con SEO</TableHead>
                      <TableHead className="text-right">Cobertura</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.by_sales_channel.map((c) => (
                      <TableRow key={c.sales_channel_id ?? "none"}>
                        <TableCell className="font-medium">
                          {c.sales_channel_name ?? "Sin canal"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(c.total_products)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(c.with_ai_approved)}
                        </TableCell>
                        <TableCell className="text-right">{pct(c.coverage_pct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top oportunidades</CardTitle>
              </CardHeader>
              <CardContent>
                {data.top_opportunities.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">
                    No hay productos sin SEO. ¡Catálogo cubierto!
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead className="text-right">Prioridad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.top_opportunities.map((o) => (
                        <TableRow key={`${o.product_id}-${o.sales_channel_id ?? ""}`}>
                          <TableCell className="font-medium max-w-[180px] truncate">
                            {o.title}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">{o.reason}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{o.priority_score}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
