"use client"

import Link from "next/link"
import { useState } from "react"

import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSessionsList, useSessionsOverview, useTopPagesWithDuration } from "@/hooks/use-sessions"
import { formatCurrency, formatNumber } from "@/lib/format"

function formatDuration(ms: number) {
  if (!ms) return "0s"
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

export default function SesionesPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())
  const [converted, setConverted] = useState<"all" | "true" | "false">("all")
  const [device, setDevice] = useState<string>("all")
  const [page, setPage] = useState(0)
  const limit = 50

  const { data: overview } = useSessionsOverview(dateRange)
  const { data: topPages } = useTopPagesWithDuration(dateRange, 10)
  const { data, isLoading } = useSessionsList(dateRange, {
    converted: converted === "all" ? undefined : converted,
    device: device === "all" ? undefined : device,
    limit,
    offset: page * limit,
  })

  const totalPages = data ? Math.ceil(data.count / limit) : 0

  return (
    <div>
      <Header
        description="Cada visita del sitio: UTM, device, país, tiempo, journey y conversión"
        title="Sesiones"
      />
      <div className="p-6 space-y-6">
        <DateRangePicker onChange={setDateRange} value={dateRange} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon="👥"
            title="Sesiones"
            value={formatNumber(overview?.overview.sessions ?? 0)}
          />
          <MetricCard
            icon="📈"
            subtitle={`${formatNumber(overview?.overview.converted_sessions ?? 0)} convertidas · ${formatCurrency(overview?.overview.revenue_total ?? 0)}`}
            title="Conversión"
            value={`${((overview?.overview.conversion_rate ?? 0) * 100).toFixed(1)}%`}
          />
          <MetricCard
            icon="⏱️"
            title="Tiempo promedio"
            value={formatDuration(overview?.overview.avg_duration_ms ?? 0)}
          />
          <MetricCard
            icon="🚪"
            title="Bounce rate"
            value={`${((overview?.overview.bounce_rate ?? 0) * 100).toFixed(1)}%`}
          />
        </div>

        {topPages?.pages?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top páginas por tiempo en página</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Path</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Vistas</TableHead>
                    <TableHead className="text-right">Tiempo prom.</TableHead>
                    <TableHead className="text-right">Scroll prom.</TableHead>
                    <TableHead className="text-right">Clicks prom.</TableHead>
                    <TableHead className="text-right">Bounce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.pages.map((p) => (
                    <TableRow key={p.path}>
                      <TableCell className="max-w-[320px] truncate font-medium">{p.path}</TableCell>
                      <TableCell>{p.page_type ?? "-"}</TableCell>
                      <TableCell className="text-right">{formatNumber(p.views)}</TableCell>
                      <TableCell className="text-right">{formatDuration(p.avg_duration_ms)}</TableCell>
                      <TableCell className="text-right">{p.avg_scroll_depth}%</TableCell>
                      <TableCell className="text-right">{p.avg_clicks}</TableCell>
                      <TableCell className="text-right">{(p.bounce_rate * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex flex-wrap gap-3 items-center">
          <Select onValueChange={(v) => { setConverted(v as typeof converted); setPage(0) }} value={converted}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="true">Convertidas</SelectItem>
              <SelectItem value="false">No convertidas</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => { setDevice(v); setPage(0) }} value={device}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los dispositivos</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="desktop">Desktop</SelectItem>
              <SelectItem value="tablet">Tablet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : data?.sessions?.length ? (
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Landing</TableHead>
                    <TableHead>UTM</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead className="text-right">Vistas</TableHead>
                    <TableHead className="text-right">Duración</TableHead>
                    <TableHead className="text-right">Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.sessions.map((s) => (
                    <TableRow key={s.session_id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        <Link className="hover:underline text-pink-600" href={`/dashboard/analytics/sesiones/${encodeURIComponent(s.session_id)}`}>
                          {new Date(s.first_seen_at).toLocaleString("es-AR")}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.customer_id ? (
                          <span className="font-mono">{s.customer_id.slice(0, 10)}…</span>
                        ) : (
                          <Badge variant="outline">Invitado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">
                        {s.landing_page ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.utm_source ? `${s.utm_source}/${s.utm_medium ?? "-"}` : <span className="text-gray-400">(direct)</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {s.device_type ?? "-"} · {s.browser ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs">{s.country ?? "-"}</TableCell>
                      <TableCell className="text-right">{s.total_pageviews}</TableCell>
                      <TableCell className="text-right text-xs">{formatDuration(s.total_duration_ms)}</TableCell>
                      <TableCell className="text-right">
                        {s.converted_at ? (
                          <Badge className="bg-green-600">{formatCurrency(s.revenue)}</Badge>
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                  {formatNumber(data.count)} sesiones · Página {page + 1} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    size="sm"
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <Button
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    size="sm"
                    variant="outline"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              No hay sesiones en este período.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
