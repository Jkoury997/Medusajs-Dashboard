"use client"

import { useState } from "react"
import {
  Brain,
  User,
  Tag,
  Package,
  Search,
  Sparkles,
  Loader2,
  CircleDollarSign,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useAIScore,
  useAIDiscountHistory,
  useAIPriceAnalysis,
} from "@/hooks/use-events"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

const SEGMENT_COLOR: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border-red-200",
  warm: "bg-orange-100 text-orange-700 border-orange-200",
  cold: "bg-blue-100 text-blue-700 border-blue-200",
  lost: "bg-gray-100 text-gray-700 border-gray-200",
}

const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  used: "bg-blue-100 text-blue-700 border-blue-200",
  expired: "bg-gray-100 text-gray-700 border-gray-200",
  canceled: "bg-red-100 text-red-700 border-red-200",
}

const DEMAND_LABEL: Record<string, { label: string; color: string }> = {
  rising: { label: "Subiendo", color: "text-green-600" },
  stable: { label: "Estable", color: "text-gray-600" },
  declining: { label: "Bajando", color: "text-red-600" },
}

function ReasoningBlock({ text }: { text: string | null | undefined }) {
  if (!text) {
    return (
      <p className="italic text-sm text-gray-400">
        Sin razonamiento generado por IA.
      </p>
    )
  }
  return (
    <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-700">
        <Sparkles className="h-3.5 w-3.5" />
        Razonamiento de la IA
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  )
}

// ────────────────────────────────────────────
// Score lookup
// ────────────────────────────────────────────

function ScoreLookup() {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)
  const { data, isLoading, error } = useAIScore(submitted)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-pink-500" />
          Score de cliente
        </CardTitle>
        <CardDescription>
          Pegá un <code className="text-xs">customer_id</code> para ver el score, segmento, intent
          y por qué la IA llegó a esa decisión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(input.trim() || null)
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="cus_01ABC..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 font-mono text-xs"
            />
          </div>
          <Button type="submit" disabled={!input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analizar"
            )}
          </Button>
        </form>

        {error ? (
          <p className="text-sm text-red-600">
            Error: {(error as Error).message}
          </p>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-32" />
        ) : data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-gray-500 uppercase">Score</div>
                <div className="text-2xl font-bold">{data.score}</div>
                <div className="text-xs text-gray-400">/100</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Segmento</div>
                <span
                  className={cn(
                    "inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded border capitalize",
                    SEGMENT_COLOR[data.segment]
                  )}
                >
                  {data.segment}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Intent</div>
                <div className="text-sm font-medium mt-1">
                  {data.purchase_intent.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">% sugerido</div>
                <div className="text-sm font-medium mt-1">
                  {data.recommended_discount_pct != null
                    ? `${data.recommended_discount_pct}%`
                    : "—"}
                </div>
                <div className="text-xs text-gray-400">
                  Sensibilidad: {data.price_sensitivity}
                </div>
              </div>
            </div>

            <ReasoningBlock text={data.ai_reasoning} />

            <p className="text-xs text-gray-400">
              {data.cached ? "Resultado cacheado" : "Recién calculado"} ·{" "}
              Costo IA: ${data.ai_cost_usd?.toFixed(5) ?? "0"} USD ·{" "}
              {new Date(data.computed_at).toLocaleString("es-AR")}
            </p>
          </div>
        ) : submitted ? (
          <p className="text-sm text-gray-500">Sin datos para este customer.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────
// Discount history
// ────────────────────────────────────────────

function DiscountHistoryLookup() {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)
  const { data, isLoading, error } = useAIDiscountHistory(submitted, 20)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tag className="h-4 w-4 text-orange-500" />
          Historial de descuentos por cliente
        </CardTitle>
        <CardDescription>
          Cada descuento generado por IA con su razonamiento, estado y conversión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(input.trim() || null)
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="cus_01ABC..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 font-mono text-xs"
            />
          </div>
          <Button type="submit" disabled={!input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Buscar"
            )}
          </Button>
        </form>

        {error ? (
          <p className="text-sm text-red-600">
            Error: {(error as Error).message}
          </p>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-32" />
        ) : data?.discounts?.length ? (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID / fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.discounts.flatMap((d) => {
                  const isOpen = expandedId === d.discount_id
                  const rows = [
                    <TableRow key={d.discount_id}>
                      <TableCell className="font-mono text-xs">
                        {d.discount_id.slice(0, 14)}…
                        <div className="text-[10px] text-gray-400">
                          {new Date(d.created_at).toLocaleString("es-AR")}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs capitalize">
                        {d.discount_type.replace("_", " ")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {d.discount_percent}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded border capitalize",
                            STATUS_COLOR[d.status]
                          )}
                        >
                          {d.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {d.product_ids.length} producto(s)
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(isOpen ? null : d.discount_id)}
                        >
                          {isOpen ? "Ocultar" : "Razón"}
                        </Button>
                      </TableCell>
                    </TableRow>,
                  ]
                  if (isOpen) {
                    rows.push(
                      <TableRow key={`${d.discount_id}-r`}>
                        <TableCell colSpan={6} className="bg-gray-50">
                          <ReasoningBlock text={d.ai_reasoning} />
                        </TableCell>
                      </TableRow>
                    )
                  }
                  return rows
                })}
              </TableBody>
            </Table>
            <p className="text-xs text-gray-400">
              {data.total} descuento(s) · ordenados por fecha descendente
            </p>
          </div>
        ) : submitted ? (
          <p className="text-sm text-gray-500">Sin descuentos para este customer.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────
// Product price analysis
// ────────────────────────────────────────────

function PriceAnalysisLookup() {
  const [input, setInput] = useState("")
  const [submitted, setSubmitted] = useState<string | null>(null)
  const { data, isLoading, error } = useAIPriceAnalysis(submitted)

  const demand = data ? DEMAND_LABEL[data.demand_trend] : null
  const priceDelta =
    data?.suggested_price != null
      ? data.suggested_price - data.current_price
      : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4 text-emerald-500" />
          Análisis de producto
        </CardTitle>
        <CardDescription>
          Pegá un <code className="text-xs">product_id</code> para que la IA analice precio,
          demanda, abandono y recomiende un ajuste.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(input.trim() || null)
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="prod_01ABC..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="pl-9 font-mono text-xs"
            />
          </div>
          <Button type="submit" disabled={!input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analizar"
            )}
          </Button>
        </form>

        {error ? (
          <p className="text-sm text-red-600">
            Error: {(error as Error).message}
          </p>
        ) : null}

        {isLoading ? (
          <Skeleton className="h-40" />
        ) : data ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 uppercase">Producto</div>
              <div className="text-base font-semibold">{data.product_title}</div>
              <div className="text-xs text-gray-400 font-mono">
                {data.product_id}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-gray-500 uppercase">Precio actual</div>
                <div className="text-lg font-bold">
                  {formatCurrency(data.current_price)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Sugerido</div>
                {data.suggested_price != null ? (
                  <>
                    <div
                      className={cn(
                        "text-lg font-bold",
                        priceDelta && priceDelta < 0 ? "text-red-600" : "text-green-600"
                      )}
                    >
                      {formatCurrency(data.suggested_price)}
                    </div>
                    {priceDelta != null && priceDelta !== 0 ? (
                      <div className="text-xs text-gray-400">
                        {priceDelta > 0 ? "+" : ""}
                        {formatCurrency(priceDelta)}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-lg text-gray-400">—</div>
                )}
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Demanda</div>
                <div className={cn("text-sm font-medium mt-1", demand?.color)}>
                  {demand?.label ?? "—"}
                </div>
                <div className="text-xs text-gray-400">
                  Elasticidad: {data.elasticity_score?.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Conversión</div>
                <div className="text-sm font-medium mt-1">
                  {(data.conversion_rate_at_current * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-gray-400">
                  Abandono: {(data.cart_abandonment_rate_for_product * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <ReasoningBlock text={data.ai_reasoning} />

            <p className="text-xs text-gray-400">
              <CircleDollarSign className="inline h-3 w-3 mr-1" />
              Modelo: {data.model_used ?? "—"} · costo:{" "}
              ${data.ai_cost_usd?.toFixed(5) ?? "0"} USD ·{" "}
              {new Date(data.updated_at).toLocaleString("es-AR")}
            </p>
          </div>
        ) : submitted ? (
          <p className="text-sm text-gray-500">Sin datos para este producto.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────
// Tab principal
// ────────────────────────────────────────────

export function AIDecisionsTab() {
  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50/40">
        <CardContent className="flex items-start gap-3 p-4">
          <Brain className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">¿Qué pensó la IA?</p>
            <p className="text-xs text-gray-600">
              Acá ves las decisiones individuales que toma la IA: por qué le pone tal score
              a un cliente, por qué le ofreció tal descuento, y por qué recomienda subir o
              bajar el precio de un producto. Útil para auditar antes de activar emisión
              automática.
            </p>
          </div>
        </CardContent>
      </Card>

      <ScoreLookup />
      <DiscountHistoryLookup />
      <PriceAnalysisLookup />
    </div>
  )
}
