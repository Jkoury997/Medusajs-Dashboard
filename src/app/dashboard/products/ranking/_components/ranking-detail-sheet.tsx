"use client"

import { useMemo } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRankingPerformanceDetail } from "@/hooks/use-ranking-metrics"
import { useProductsByIds, type ProductInfo } from "@/hooks/use-products-by-ids"
import { formatDate, formatNumber } from "@/lib/format"
import { ArrowDown, ArrowUp, Minus, Sparkles, Package } from "lucide-react"
import type { RankingPerformanceProduct } from "@/types/ranking"

function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

function entityLabel(entityType: "collection" | "category"): string {
  return entityType === "collection" ? "Coleccion" : "Categoria"
}

function RankCell({ product }: { product: RankingPerformanceProduct }) {
  const prev = product.previous_rank_position
  const curr = product.rank_position
  if (prev === null) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span className="font-medium">#{curr}</span>
        <span className="text-gray-400">nuevo</span>
      </div>
    )
  }
  const delta = prev - curr
  const Icon = delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus
  const color =
    delta > 0
      ? "text-green-600"
      : delta < 0
        ? "text-red-600"
        : "text-gray-400"
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-400">#{prev}</span>
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <span className="font-medium">#{curr}</span>
      {delta !== 0 && (
        <span className={`${color} font-medium`}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  )
}

interface Props {
  rankingId: string | null
  onClose: () => void
}

export function RankingDetailSheet({ rankingId, onClose }: Props) {
  const open = !!rankingId
  const { data: detail, isLoading } = useRankingPerformanceDetail(rankingId)

  const productIds = useMemo(
    () => detail?.products.map((p) => p.product_id) ?? [],
    [detail]
  )
  const { data: productMap } = useProductsByIds(productIds)

  const rows = useMemo(() => {
    if (!detail) return []
    const sorted = [...detail.products].sort((a, b) => {
      const ar = a.delta_revenue_pct ?? -Infinity
      const br = b.delta_revenue_pct ?? -Infinity
      return br - ar
    })
    return sorted
  }, [detail])

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl"
      >
        <SheetHeader>
          <SheetTitle>
            {detail
              ? `${detail.entity_name} (${entityLabel(detail.entity_type)})`
              : "Detalle del ranking"}
          </SheetTitle>
          <SheetDescription>
            {detail ? (
              <>
                Pre: {formatDate(detail.pre_window_start)} →{" "}
                {formatDate(detail.pre_window_end)} · Activo:{" "}
                {formatDate(detail.active_window_start)} →{" "}
                {formatDate(detail.active_window_end)}
              </>
            ) : (
              "Cargando..."
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto px-4 pb-6">
          {isLoading || !detail ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Posicion</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Δ ventas</TableHead>
                  <TableHead className="text-right">Δ revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const product: ProductInfo | undefined = productMap?.get(
                    p.product_id
                  )
                  const deltaRev = p.delta_revenue_pct
                  const positive = deltaRev !== null && deltaRev >= 0
                  return (
                    <TableRow key={p.product_id}>
                      <TableCell className="max-w-[260px]">
                        <div className="flex items-center gap-2">
                          {product?.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.thumbnail}
                              alt={product.title}
                              className="h-9 w-9 flex-shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded bg-gray-100">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {product?.title || p.product_id}
                            </div>
                            {product?.external_id && (
                              <div className="truncate font-mono text-[10px] text-gray-400">
                                {product.external_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RankCell product={p} />
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500">
                        {formatNumber(p.pre_sales)} → {formatNumber(p.active_sales)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            (p.delta_sales_pct ?? 0) >= 0
                              ? "font-medium text-green-600"
                              : "font-medium text-red-600"
                          }
                        >
                          {formatPct(p.delta_sales_pct)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            positive
                              ? "font-medium text-green-600"
                              : "font-medium text-red-600"
                          }
                        >
                          {formatPct(deltaRev)}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { entityLabel }

// Re-export Badge so consumers can render the entity badge inline
export function EntityTypeBadge({
  entityType,
}: {
  entityType: "collection" | "category"
}) {
  return (
    <Badge
      variant="outline"
      className={
        entityType === "collection"
          ? "border-purple-200 bg-purple-50 text-purple-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      }
    >
      {entityLabel(entityType)}
    </Badge>
  )
}
