"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { useSalesChannels } from "@/hooks/use-email-intelligence"
import {
  useCheckoutDropoff,
  useShippingCostStats,
  useFreeShippingStatus,
  useSetFreeShipping,
  useToggleFreeShippingGuardrail,
  useDeactivateFreeShipping,
  type CheckoutDropoff,
} from "@/hooks/use-free-shipping"
import { formatCurrency, formatNumber } from "@/lib/format"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"
import { Truck } from "lucide-react"

const pct = (n: number) => `${n.toFixed(0)}%`

export default function FreeShippingPage() {
  const [channel, setChannel] = useState<string>("all")
  const channelId = channel === "all" ? undefined : channel

  const { data: channels = [] } = useSalesChannels()
  const { data: dropoff, isLoading: dropoffLoading } = useCheckoutDropoff(channelId, 90)
  const { data: costs, isLoading: costsLoading } = useShippingCostStats(channelId, 90)

  return (
    <div>
      <Header
        title="Envío gratis"
        description="Recomendación de umbral por marca/grupo, costos reales y activación de la promo"
      />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Marca / canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las marcas</SelectItem>
              {channels.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400">Últimos 90 días</span>
        </div>

        {/* Recomendación + embudo */}
        {dropoffLoading ? (
          <Skeleton className="h-[180px] w-full" />
        ) : dropoff ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Umbral recomendado"
                value={formatCurrency(dropoff.free_shipping_recommendation.recommended_threshold_ars)}
                icon="🎯"
                subtitle={dropoff.free_shipping_recommendation.cohorts}
              />
              <MetricCard
                title="Ticket mediano (retail)"
                value={formatCurrency(dropoff.ticket.p50)}
                icon="🧾"
                subtitle={`n=${formatNumber(dropoff.ticket.count)}`}
              />
              <MetricCard
                title="Envío a domicilio"
                value={formatCurrency(dropoff.shipping.representative_home_delivery_ars)}
                icon="🚚"
                subtitle="mediana del método principal"
              />
              <MetricCard
                title="Conversión checkout→orden"
                value={`${dropoff.funnel.completion_pct}%`}
                icon="🛒"
                subtitle={`${formatNumber(dropoff.funnel.checkout_started)} → ${formatNumber(
                  dropoff.funnel.order_placed,
                )}`}
              />
            </div>

            <FunnelCard funnel={dropoff.funnel} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Escenarios de umbral</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Umbral</TableHead>
                      <TableHead className="text-right">Ya califican</TableHead>
                      <TableHead className="text-right">Carritos en zona de empuje</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dropoff.free_shipping_recommendation.scenarios.map((s) => (
                      <TableRow key={s.threshold_ars}>
                        <TableCell className="font-medium">
                          {formatCurrency(s.threshold_ars)}
                          {s.threshold_ars ===
                            dropoff.free_shipping_recommendation.recommended_threshold_ars && (
                            <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                              recomendado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{pct(s.pct_already_qualify)}</TableCell>
                        <TableCell className="text-right">{formatNumber(s.nudge_zone_count)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <p className="mt-3 text-xs text-gray-500">
                  {dropoff.free_shipping_recommendation.rationale}
                </p>
              </CardContent>
            </Card>

            {/* Recomendación por grupo de cliente */}
            {dropoff.by_cohort && dropoff.by_cohort.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Por grupo de cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="text-right">Carritos</TableHead>
                        <TableHead className="text-right">Ticket mediano</TableHead>
                        <TableHead className="text-right">Umbral sugerido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dropoff.by_cohort.map((c) => (
                        <TableRow key={c.cohort}>
                          <TableCell className="font-medium">{c.cohort}</TableCell>
                          <TableCell className="text-right">{formatNumber(c.count)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.ticket_p50)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(c.recommended_threshold_ars)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="mt-2 text-xs text-gray-400">
                    El grupo sale del evento de checkout (puede caer a “invitado” si el storefront no
                    lo setea). Cruzá con la tabla de costos de envío de abajo, que usa el grupo real
                    de la orden.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Conclusión IA: recomendación por grupo + canal */}
            <AIInsightWidget
              pageContext="free-shipping"
              isDataLoading={dropoffLoading || costsLoading}
              metricsBuilder={() =>
                dropoff
                  ? {
                      canal: channel === "all" ? "todas las marcas" : channel,
                      embudo: dropoff.funnel,
                      ticket_retail: dropoff.ticket,
                      envio_a_domicilio_ars: dropoff.shipping.representative_home_delivery_ars,
                      recomendacion_retail: dropoff.free_shipping_recommendation,
                      por_grupo_ticket: dropoff.by_cohort ?? [],
                      costo_envio_por_grupo: (costs?.buckets ?? []).map((b) => ({
                        marca: b.sales_channel_name,
                        grupo: b.customer_group,
                        metodo: b.shipping_method,
                        ordenes: b.orders,
                        envio_mediano_ars: b.median_shipping_ars,
                        pct_gratis: b.free_pct,
                      })),
                    }
                  : null
              }
            />
          </>
        ) : null}

        {/* Activación de la promo */}
        <SetFreeShippingCard
          channels={channels}
          defaultChannelId={channelId ?? channels[0]?.id ?? ""}
          recommended={dropoff?.free_shipping_recommendation.recommended_threshold_ars}
        />

        {/* Costo de envío por canal × grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Costo de envío por marca × grupo</CardTitle>
          </CardHeader>
          <CardContent>
            {costsLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Órdenes</TableHead>
                    <TableHead className="text-right">Mediana</TableHead>
                    <TableHead className="text-right">% gratis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(costs?.buckets ?? [])
                    .filter((b) => b.median_shipping_ars > 0)
                    .slice(0, 20)
                    .map((b, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{b.sales_channel_name}</TableCell>
                        <TableCell className="text-sm">{b.customer_group}</TableCell>
                        <TableCell className="text-sm text-gray-500">{b.shipping_method}</TableCell>
                        <TableCell className="text-right">{formatNumber(b.orders)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(b.median_shipping_ars)}
                        </TableCell>
                        <TableCell className="text-right">{b.free_pct}%</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SetFreeShippingCard({
  channels,
  defaultChannelId,
  recommended,
}: {
  channels: Array<{ id: string; name: string }>
  defaultChannelId: string
  recommended?: number
}) {
  // Estado "override": "" = usar el default derivado (canal de la página /
  // recomendación). Así evitamos efectos que sincronicen estado desde props.
  const [channelOverride, setChannelOverride] = useState<string>("")
  const [thresholdOverride, setThresholdOverride] = useState<string>("")

  const effectiveChannelId = channelOverride || defaultChannelId
  const thresholdValue =
    thresholdOverride !== "" ? thresholdOverride : recommended ? String(recommended) : ""
  const thresholdNum = Number(thresholdValue) || 0

  const { data: status } = useFreeShippingStatus(effectiveChannelId || undefined)
  const setMut = useSetFreeShipping()
  const toggleMut = useToggleFreeShippingGuardrail()
  const deactivateMut = useDeactivateFreeShipping()

  const guardrail = status?.guardrail
  const promotions = status?.promotions ?? []

  const handleActivate = () => {
    if (!effectiveChannelId || thresholdNum <= 0) return
    setMut.mutate({ threshold_ars: thresholdNum, sales_channel_id: effectiveChannelId })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4 text-mk-pink" />
          Activar envío gratis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guardrail */}
        <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
          <div>
            <p className="text-sm font-medium">Permitir crear promos</p>
            <p className="text-xs text-gray-500">
              {guardrail
                ? `Piso de umbral: ${formatCurrency(guardrail.min_threshold_ars)}`
                : "Cargando…"}
            </p>
          </div>
          <Switch
            checked={guardrail?.allow_writes ?? false}
            onCheckedChange={(v) => toggleMut.mutate({ allow_writes: v })}
            disabled={toggleMut.isPending || !guardrail}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Marca / canal</Label>
            <Select value={effectiveChannelId} onValueChange={setChannelOverride}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Elegí canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Umbral (ARS)</Label>
            <Input
              type="number"
              value={thresholdValue}
              onChange={(e) => setThresholdOverride(e.target.value)}
              className="mt-1"
              placeholder={recommended ? String(recommended) : "70000"}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleActivate}
              disabled={setMut.isPending || !effectiveChannelId || thresholdNum <= 0}
              className="w-full"
            >
              {setMut.isPending ? "Aplicando…" : "Activar / Vista previa"}
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Aplica a <strong>invitados + consumidor final</strong> (excluye mayorista/revendedora). Si
          el switch de arriba está apagado, solo devuelve una vista previa.
        </p>

        {/* Resultado */}
        {setMut.data && (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              setMut.data.applied
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {setMut.data.applied
              ? `✅ Activado: envío gratis ≥ ${formatCurrency(
                  setMut.data.preview.threshold_ars,
                )} en ${setMut.data.preview.scope}. (code ${setMut.data.code})`
              : `⏸️ No aplicado — ${setMut.data.reason} · Vista previa: ≥ ${formatCurrency(
                  setMut.data.preview.threshold_ars,
                )} (${setMut.data.preview.scope})`}
          </div>
        )}

        {/* Promos activas */}
        {promotions.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 mb-2">Promos activas</p>
            <div className="space-y-2">
              {promotions.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
                >
                  <span>
                    Envío gratis ≥{" "}
                    {p.threshold_ars != null ? formatCurrency(p.threshold_ars) : "—"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deactivateMut.mutate(p.sales_channel_id)}
                    disabled={deactivateMut.isPending}
                  >
                    Desactivar
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FunnelCard({ funnel }: { funnel: CheckoutDropoff["funnel"] }) {
  const steps: Array<{ key: string; label: string; count: number }> = [
    { key: "checkout", label: "Checkout iniciado", count: funnel.checkout_started },
    { key: "contact", label: "Contacto", count: funnel.steps.contact },
    { key: "delivery", label: "Envío", count: funnel.steps.delivery },
    { key: "payment", label: "Pago", count: funnel.steps.payment },
    { key: "order_placed", label: "Orden completada", count: funnel.order_placed },
  ]
  const max = funnel.checkout_started || 1
  const leakTo = funnel.biggest_leak?.to ?? null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Embudo de checkout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].count : null
          const drop = prev && prev > 0 ? Math.round((1 - s.count / prev) * 100) : null
          const isLeak = leakTo !== null && s.key === leakTo
          const widthPct = Math.max(3, Math.round((s.count / max) * 100))
          return (
            <div key={s.key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{s.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">{formatNumber(s.count)}</span>
                  {drop != null && drop > 0 && (
                    <span
                      className={`text-xs ${
                        isLeak ? "font-semibold text-red-600" : "text-gray-400"
                      }`}
                    >
                      ▼ {drop}%{isLeak ? " ← mayor fuga" : ""}
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded bg-gray-100">
                <div
                  className={`h-full rounded ${isLeak ? "bg-red-400" : "bg-mk-pink"}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          )
        })}
        <p className="pt-1 text-xs text-gray-500">
          Conversión checkout→orden: <strong>{funnel.completion_pct}%</strong>. Los pasos
          intermedios pueden verse altos porque clientes con dirección/pago guardado los saltean —
          lo accionable es la mayor fuga (en rojo).
        </p>
      </CardContent>
    </Card>
  )
}
