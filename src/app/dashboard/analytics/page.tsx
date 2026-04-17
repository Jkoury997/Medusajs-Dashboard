"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DoorClosed,
  DoorOpen,
  Flame,
  MousePointer,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Header } from "@/components/dashboard/header"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { ConversionFunnel } from "@/components/charts/conversion-funnel"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEventFunnel, useEvents, useEventStats } from "@/hooks/use-events"
import {
  useBouncePages,
  useExitPages,
  useLandingPages,
  useSessionsOverview,
  useTopPagesWithDuration,
} from "@/hooks/use-sessions"
import { formatCurrency, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────

function formatDuration(ms: number) {
  if (!ms || ms < 1000) return `${ms || 0}ms`
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}

function percent(n: number, digits = 1): string {
  return `${(n * 100).toFixed(digits)}%`
}

function ratingFor(metric: "bounce" | "conversion" | "exit", value: number): {
  label: string
  color: string
  icon: typeof TrendingUp
} {
  if (metric === "bounce") {
    if (value < 0.4) return { label: "Excelente", color: "text-green-600 bg-green-50 border-green-200", icon: TrendingDown }
    if (value < 0.6) return { label: "Aceptable", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: AlertTriangle }
    return { label: "Alto", color: "text-red-600 bg-red-50 border-red-200", icon: TrendingUp }
  }
  if (metric === "conversion") {
    if (value > 0.03) return { label: "Excelente", color: "text-green-600 bg-green-50 border-green-200", icon: TrendingUp }
    if (value > 0.01) return { label: "Aceptable", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: TrendingUp }
    return { label: "Bajo", color: "text-red-600 bg-red-50 border-red-200", icon: TrendingDown }
  }
  // exit
  if (value < 0.3) return { label: "Normal", color: "text-green-600 bg-green-50 border-green-200", icon: ArrowDownRight }
  if (value < 0.6) return { label: "Revisar", color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: AlertTriangle }
  return { label: "Crítico", color: "text-red-600 bg-red-50 border-red-200", icon: ArrowUpRight }
}

// ────────────────────────────────────────────
// KPI Card with status
// ────────────────────────────────────────────

function KPI({
  label,
  value,
  sub,
  status,
  icon: Icon,
}: {
  label: string
  value: string
  sub?: string
  status?: { label: string; color: string; icon: typeof TrendingUp }
  icon: typeof TrendingUp
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
            <Icon className="h-3.5 w-3.5" />
            {label}
          </div>
          {status ? (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", status.color)}>
              {status.label}
            </span>
          ) : null}
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {sub ? <div className="text-xs text-gray-500">{sub}</div> : null}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────
// Page
// ────────────────────────────────────────────

export default function AnalyticsGeneralPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const overviewQ = useSessionsOverview(dateRange)
  const topPagesQ = useTopPagesWithDuration(dateRange, 10)
  const landingQ = useLandingPages(dateRange, 10)
  const exitQ = useExitPages(dateRange, 10)
  const bounceQ = useBouncePages(dateRange, 10)
  const funnelQ = useEventFunnel(dateRange.from, dateRange.to)
  const statsQ = useEventStats(dateRange.from, dateRange.to)

  const abandonedQ = useEvents(
    useMemo(() => {
      const toNext = new Date(dateRange.to)
      toNext.setDate(toNext.getDate() + 1)
      return {
        event: "checkout.abandoned",
        from: dateRange.from.toISOString().split("T")[0],
        to: toNext.toISOString().split("T")[0],
        limit: 100,
        sort: "desc" as const,
      }
    }, [dateRange])
  )

  const overview = overviewQ.data?.overview
  const series = overviewQ.data?.series ?? []

  const abandonedCount = statsQ.data?.by_type?.["checkout.abandoned"] ?? 0
  const checkoutStarted = statsQ.data?.by_type?.["checkout.started"] ?? 0
  const abandonRate = checkoutStarted > 0 ? abandonedCount / checkoutStarted : 0
  const lostValue = useMemo(() => {
    if (!abandonedQ.data?.events?.length) return 0
    return abandonedQ.data.events.reduce((sum, ev) => sum + (Number(ev.data?.total) || 0), 0)
  }, [abandonedQ.data])

  const abandonedByStep = useMemo(() => {
    if (!abandonedQ.data?.events?.length) return []
    const byStep = new Map<string, number>()
    for (const ev of abandonedQ.data.events) {
      const step = (ev.data?.last_step as string) || (ev.data?.current_step as string) || "unknown"
      byStep.set(step, (byStep.get(step) || 0) + 1)
    }
    return Array.from(byStep.entries())
      .map(([step, count]) => ({ step, count }))
      .sort((a, b) => b.count - a.count)
  }, [abandonedQ.data])

  const bounceStatus = ratingFor("bounce", overview?.bounce_rate ?? 0)
  const conversionStatus = ratingFor("conversion", overview?.conversion_rate ?? 0)

  return (
    <div>
      <Header
        description="Entendé por qué los usuarios se van: landing pages, exit pages, funnel de conversión y abandono"
        title="Comportamiento de usuarios"
      />

      <div className="p-6 space-y-8">
        <DateRangePicker onChange={setDateRange} value={dateRange} />

        {/* ─────────────────────────────── KPIs ─────────────────────────────── */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KPI
              icon={Users}
              label="Sesiones"
              sub={overview ? `${formatNumber(overview.pageviews)} pageviews` : undefined}
              value={formatNumber(overview?.sessions ?? 0)}
            />
            <KPI
              icon={TrendingUp}
              label="Conversión"
              status={conversionStatus}
              sub={overview ? `${formatNumber(overview.converted_sessions)} ventas` : undefined}
              value={percent(overview?.conversion_rate ?? 0)}
            />
            <KPI
              icon={DoorClosed}
              label="Tasa de rebote"
              status={bounceStatus}
              sub="Sesiones de 1 sola página"
              value={percent(overview?.bounce_rate ?? 0)}
            />
            <KPI
              icon={MousePointer}
              label="Tiempo promedio"
              sub="En el sitio"
              value={formatDuration(overview?.avg_duration_ms ?? 0)}
            />
            <KPI
              icon={ShoppingCart}
              label="Checkouts abandonados"
              status={ratingFor("exit", abandonRate)}
              sub={`${percent(abandonRate)} de ${formatNumber(checkoutStarted)}`}
              value={formatNumber(abandonedCount)}
            />
            <KPI
              icon={Flame}
              label="Revenue atribuido"
              sub={lostValue > 0 ? `${formatCurrency(lostValue)} perdidos` : undefined}
              value={formatCurrency(overview?.revenue_total ?? 0)}
            />
          </div>
        </section>

        {/* ─────────────────────────────── Trend ─────────────────────────────── */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tendencia de sesiones y conversiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overviewQ.isLoading ? (
                <Skeleton className="h-[240px]" />
              ) : series.length > 0 ? (
                <ResponsiveContainer height={240} width="100%">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="colSessions" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colConv" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f3f4f6" strokeDasharray="3 3" />
                    <XAxis dataKey="ts" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Area
                      dataKey="sessions"
                      fill="url(#colSessions)"
                      name="Sesiones"
                      stroke="#ec4899"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Area
                      dataKey="converted"
                      fill="url(#colConv)"
                      name="Convertidas"
                      stroke="#16a34a"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="py-12 text-center text-gray-500 text-sm">
                  Aún no hay datos. Empezá a navegar la tienda para ver sesiones.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─────────────────────── Entry vs Exit ─────────────────────── */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-lg font-semibold">Dónde entran vs dónde se van</h2>
              <p className="text-sm text-gray-500">
                Si una página tiene alto exit rate pero no es el checkout, algo está expulsando gente
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Landing pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <DoorOpen className="h-4 w-4" />
                  Landing pages · por dónde entran
                </CardTitle>
              </CardHeader>
              <CardContent>
                {landingQ.isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : landingQ.data?.pages.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead className="text-right">Sesiones</TableHead>
                        <TableHead className="text-right">Rebote</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {landingQ.data.pages.map((p) => {
                        const st = ratingFor("bounce", p.bounce_rate)
                        return (
                          <TableRow key={p.path}>
                            <TableCell className="text-xs max-w-[260px] truncate font-medium">
                              {p.path}
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatNumber(p.sessions)}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn("text-xs px-1.5 py-0.5 rounded border", st.color)}>
                                {percent(p.bounce_rate, 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">
                              {percent(p.conversion_rate, 1)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-gray-500 text-sm">Sin datos</div>
                )}
              </CardContent>
            </Card>

            {/* Exit pages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <DoorClosed className="h-4 w-4" />
                  Exit pages · por dónde se van
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exitQ.isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : exitQ.data?.pages.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead className="text-right">Salidas</TableHead>
                        <TableHead className="text-right">Exit rate</TableHead>
                        <TableHead className="text-right">Tiempo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exitQ.data.pages.map((p) => {
                        const st = ratingFor("exit", p.exit_rate)
                        return (
                          <TableRow key={p.path}>
                            <TableCell className="text-xs max-w-[260px] truncate font-medium">
                              {p.path}
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatNumber(p.exits)}</TableCell>
                            <TableCell className="text-right">
                              <span className={cn("text-xs px-1.5 py-0.5 rounded border", st.color)}>
                                {percent(p.exit_rate, 0)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-xs text-gray-600">
                              {formatDuration(p.avg_duration_before_exit)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-gray-500 text-sm">Sin datos</div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─────────────────── Páginas problemáticas (high bounce) ─────────────────── */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Páginas problemáticas
            </h2>
            <p className="text-sm text-gray-500">
              Landing pages donde los usuarios llegan y se van inmediatamente sin ver nada más
            </p>
          </div>

          <Card>
            <CardContent className="pt-4">
              {bounceQ.isLoading ? (
                <Skeleton className="h-[200px]" />
              ) : bounceQ.data?.pages.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Landing page</TableHead>
                      <TableHead className="text-right">Sesiones</TableHead>
                      <TableHead className="text-right">Bounces</TableHead>
                      <TableHead className="text-right">Tasa de rebote</TableHead>
                      <TableHead className="text-right">Tiempo promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bounceQ.data.pages.map((p) => {
                      const st = ratingFor("bounce", p.bounce_rate)
                      return (
                        <TableRow key={p.path}>
                          <TableCell className="text-xs max-w-[360px] truncate font-medium">
                            {p.path}
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(p.sessions)}</TableCell>
                          <TableCell className="text-right">{formatNumber(p.bounces)}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", st.color)}>
                              {percent(p.bounce_rate, 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-600">
                            {formatDuration(p.avg_duration_ms)}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-6 text-center text-gray-500 text-sm">
                  No hay suficiente data todavía. Necesitás sesiones para ver rebote.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ─────────────────── Funnel + Checkout abandonment ─────────────────── */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Embudo de compra y abandono
            </h2>
            <p className="text-sm text-gray-500">
              De los usuarios que ven un producto, cuántos llegan a pagar
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Funnel completo</CardTitle>
              </CardHeader>
              <CardContent>
                {funnelQ.isLoading ? (
                  <Skeleton className="h-[350px]" />
                ) : funnelQ.data ? (
                  <ConversionFunnel data={funnelQ.data} />
                ) : (
                  <div className="py-8 text-center text-gray-500 text-sm">Sin datos</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-700">En qué paso del checkout abandonan</CardTitle>
              </CardHeader>
              <CardContent>
                {abandonedQ.isLoading ? (
                  <Skeleton className="h-[200px]" />
                ) : abandonedByStep.length ? (
                  <div className="space-y-3">
                    {abandonedByStep.map((s) => {
                      const pct = abandonedCount > 0 ? (s.count / abandonedCount) * 100 : 0
                      return (
                        <div className="space-y-1" key={s.step}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium capitalize">{s.step}</span>
                            <span className="text-gray-500">
                              {formatNumber(s.count)} abandonos · {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded overflow-hidden">
                            <div
                              className="h-full bg-red-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                    <div className="pt-3 mt-3 border-t flex justify-between text-sm">
                      <span className="text-gray-600">Valor estimado perdido:</span>
                      <span className="font-bold text-red-700">{formatCurrency(lostValue)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500 text-sm">
                    Sin abandonos en este período.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─────────────────── Top engagement ─────────────────── */}
        <section>
          <Tabs defaultValue="time">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Engagement por página</h2>
                <p className="text-sm text-gray-500">
                  Qué páginas leen de verdad los usuarios
                </p>
              </div>
              <TabsList>
                <TabsTrigger value="time">Tiempo</TabsTrigger>
                <TabsTrigger value="scroll">Scroll</TabsTrigger>
                <TabsTrigger value="clicks">Clicks</TabsTrigger>
              </TabsList>
            </div>

            {(["time", "scroll", "clicks"] as const).map((tab) => (
              <TabsContent className="mt-0" key={tab} value={tab}>
                <Card>
                  <CardContent className="pt-4">
                    {topPagesQ.isLoading ? (
                      <Skeleton className="h-[300px]" />
                    ) : topPagesQ.data?.pages.length ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Path</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Vistas</TableHead>
                            <TableHead className="text-right">Tiempo prom.</TableHead>
                            <TableHead className="text-right">Scroll</TableHead>
                            <TableHead className="text-right">Clicks</TableHead>
                            <TableHead className="text-right">Rebote</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...topPagesQ.data.pages]
                            .sort((a, b) => {
                              if (tab === "time") return b.avg_duration_ms - a.avg_duration_ms
                              if (tab === "scroll") return b.avg_scroll_depth - a.avg_scroll_depth
                              return b.avg_clicks - a.avg_clicks
                            })
                            .map((p) => (
                              <TableRow key={p.path}>
                                <TableCell className="text-xs max-w-[320px] truncate font-medium">
                                  {p.path}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{p.page_type ?? "-"}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatNumber(p.views)}</TableCell>
                                <TableCell className="text-right text-sm">
                                  {formatDuration(p.avg_duration_ms)}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {p.avg_scroll_depth}%
                                </TableCell>
                                <TableCell className="text-right text-sm">{p.avg_clicks}</TableCell>
                                <TableCell className="text-right text-xs text-gray-500">
                                  {percent(p.bounce_rate, 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-6 text-center text-gray-500 text-sm">Sin datos</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* ─────────────────── Navegación rápida ─────────────────── */}
        <section className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">
            Profundizar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { href: "/dashboard/analytics/sesiones", label: "Sesiones", desc: "Ver journey por sesión" },
              { href: "/dashboard/analytics/live", label: "En vivo", desc: "Usuarios activos ahora" },
              { href: "/dashboard/analytics/utm", label: "UTM", desc: "Fuente de tráfico" },
              { href: "/dashboard/analytics/dispositivos", label: "Dispositivos", desc: "Device / OS / browser" },
            ].map((link) => (
              <Link
                className="block border rounded-lg p-3 hover:bg-gray-50 hover:border-pink-300 transition-colors"
                href={link.href}
                key={link.href}
              >
                <div className="font-medium text-sm">{link.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{link.desc}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
