"use client"

import { useMemo, useState } from "react"
import {
  Flame,
  ShoppingCart,
  Search,
  RefreshCw,
  Filter,
  Clock,
} from "lucide-react"

import { Header } from "@/components/dashboard/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { useAIHotLeads } from "@/hooks/use-events"
import type { HotLead, PurchaseIntent } from "@/types/events"
import { formatCurrency, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

const INTENT_LABEL: Record<PurchaseIntent, string> = {
  ready_to_buy: "Listo para comprar",
  cart_abandoner: "Abandonó carrito",
  comparing: "Comparando",
  price_watcher: "Esperando precio",
  browsing: "Navegando",
}

const INTENT_COLOR: Record<PurchaseIntent, string> = {
  ready_to_buy: "bg-red-100 text-red-700 border-red-200",
  cart_abandoner: "bg-orange-100 text-orange-700 border-orange-200",
  comparing: "bg-yellow-100 text-yellow-700 border-yellow-200",
  price_watcher: "bg-blue-100 text-blue-700 border-blue-200",
  browsing: "bg-gray-100 text-gray-700 border-gray-200",
}

const INTENT_PRIORITY: Record<PurchaseIntent, number> = {
  ready_to_buy: 5,
  cart_abandoner: 4,
  comparing: 3,
  price_watcher: 2,
  browsing: 1,
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return "—"
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "ahora"
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  return `hace ${d}d`
}

function confidenceBar(confidence: number) {
  const pct = Math.max(0, Math.min(1, confidence)) * 100
  const color =
    pct >= 75 ? "bg-red-500" : pct >= 50 ? "bg-orange-500" : "bg-yellow-500"
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-1.5 flex-1 bg-gray-100 rounded overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 tabular-nums w-9 text-right">
        {pct.toFixed(0)}%
      </span>
    </div>
  )
}

export default function HotLeadsPage() {
  const [limit, setLimit] = useState(50)
  const [intentFilter, setIntentFilter] = useState<PurchaseIntent | "all">("all")
  const [search, setSearch] = useState("")

  const { data, isLoading, isFetching, refetch, error } = useAIHotLeads(limit)

  const leads: HotLead[] = data?.leads ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads
      .filter((l) => intentFilter === "all" || l.purchase_intent === intentFilter)
      .filter((l) => {
        if (!q) return true
        return (
          l.customer_id?.toLowerCase().includes(q) ||
          l.session_id?.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const intentDiff =
          INTENT_PRIORITY[b.purchase_intent] - INTENT_PRIORITY[a.purchase_intent]
        if (intentDiff !== 0) return intentDiff
        if (b.cart_value !== a.cart_value) return b.cart_value - a.cart_value
        return b.confidence - a.confidence
      })
  }, [leads, intentFilter, search])

  const totals = useMemo(() => {
    const ready = leads.filter((l) => l.purchase_intent === "ready_to_buy").length
    const abandoners = leads.filter((l) => l.purchase_intent === "cart_abandoner").length
    const cartValueTotal = leads.reduce((sum, l) => sum + (l.cart_value || 0), 0)
    return { ready, abandoners, cartValueTotal }
  }, [leads])

  return (
    <div>
      <Header
        title="Hot Leads"
        description="Usuarios con mayor intención de compra en las últimas 24 horas"
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                <Flame className="h-3.5 w-3.5" />
                Total leads
              </div>
              <div className="text-2xl font-bold">{formatNumber(leads.length)}</div>
              <div className="text-xs text-gray-500">Últimas 24 hs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                <ShoppingCart className="h-3.5 w-3.5" />
                Listos para comprar
              </div>
              <div className="text-2xl font-bold text-red-700">
                {formatNumber(totals.ready)}
              </div>
              <div className="text-xs text-gray-500">Máxima prioridad</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                <Clock className="h-3.5 w-3.5" />
                Abandonaron carrito
              </div>
              <div className="text-2xl font-bold text-orange-700">
                {formatNumber(totals.abandoners)}
              </div>
              <div className="text-xs text-gray-500">Recuperables</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                Valor en carrito
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(totals.cartValueTotal)}
              </div>
              <div className="text-xs text-gray-500">Suma de carritos activos</div>
            </CardContent>
          </Card>
        </section>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")}
                />
                Actualizar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar customer / session id..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select
                value={intentFilter}
                onValueChange={(v) => setIntentFilter(v as PurchaseIntent | "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los intents</SelectItem>
                  <SelectItem value="ready_to_buy">Listo para comprar</SelectItem>
                  <SelectItem value="cart_abandoner">Abandonó carrito</SelectItem>
                  <SelectItem value="comparing">Comparando</SelectItem>
                  <SelectItem value="price_watcher">Esperando precio</SelectItem>
                  <SelectItem value="browsing">Navegando</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Límite" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                  <SelectItem value="200">Top 200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Leads ({formatNumber(filtered.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="py-10 text-center text-red-600 text-sm">
                Error al cargar hot leads: {(error as Error).message}
              </div>
            ) : isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                No hay leads que coincidan con los filtros.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identificador</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead className="w-[180px]">Confianza</TableHead>
                    <TableHead className="text-right">Carrito</TableHead>
                    <TableHead className="text-right">Última actividad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => {
                    const id = lead.customer_id ?? lead.session_id ?? "—"
                    const isAnon = !lead.customer_id
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-xs max-w-[260px] truncate">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{id}</span>
                            {isAnon && (
                              <Badge variant="outline" className="text-[10px]">
                                anon
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded border font-medium",
                              INTENT_COLOR[lead.purchase_intent]
                            )}
                          >
                            {INTENT_LABEL[lead.purchase_intent]}
                          </span>
                        </TableCell>
                        <TableCell>{confidenceBar(lead.confidence)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {lead.cart_value > 0 ? (
                            <span className="font-medium">
                              {formatCurrency(lead.cart_value)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-gray-500">
                          {timeAgo(lead.last_activity)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-gray-400">
          Datos del backend de eventos, recalculados cada 30 minutos. Se refrescan
          automáticamente cada minuto.
        </p>
      </div>
    </div>
  )
}
