"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/format"
import { RANKING_SEGMENT_BADGE } from "@/types/ranking-agent"
import type {
  RankingItem,
  RankingProductInfo,
  RankingSegment,
} from "@/types/ranking-agent"

export function RankingDetailDialog({
  ranking,
  productsById,
  open,
  onOpenChange,
}: {
  ranking: RankingItem | null
  productsById: Record<string, RankingProductInfo>
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  if (!ranking) return null

  const segmentByProduct = new Map<string, RankingSegment>()
  for (const s of ranking.segments ?? []) {
    segmentByProduct.set(s.product_id, s.segment)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ranking.entity_name}
            <Badge variant={ranking.type === "personalized" ? "default" : "secondary"}>
              {ranking.type === "personalized" ? "Personalizado" : "General"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {ranking.total_products} productos · generado {formatDateTime(ranking.generated_at)}
            {ranking.model_used ? ` · ${ranking.model_used}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          {ranking.product_ids.map((pid, idx) => {
            const info = productsById[pid]
            const segment = segmentByProduct.get(pid)
            return (
              <div
                key={pid}
                className="flex items-center gap-3 rounded-md border border-gray-100 px-3 py-2"
              >
                <span className="w-8 shrink-0 text-center text-sm font-semibold text-gray-400">
                  {idx + 1}
                </span>
                {info?.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={info.thumbnail}
                    alt={info.title ?? pid}
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{info?.title ?? pid}</p>
                  {info?.handle && (
                    <p className="truncate text-xs text-gray-400">{info.handle}</p>
                  )}
                </div>
                {segment && (
                  <Badge variant={RANKING_SEGMENT_BADGE[segment].variant}>
                    {RANKING_SEGMENT_BADGE[segment].label}
                  </Badge>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
