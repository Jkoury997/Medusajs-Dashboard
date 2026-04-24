"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  CostTimeseriesResponse,
  CostSummaryResponse,
  RankingPerformanceListResponse,
  RankingPerformanceDetailResponse,
} from "@/types/ranking"

const BASE = "/api/ranking-proxy"

function toIso(value: string | Date | undefined): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  // Accept YYYY-MM-DD or full ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`).toISOString()
  }
  return new Date(value).toISOString()
}

function buildRangeQuery(from?: string | Date, to?: string | Date): string {
  const params = new URLSearchParams()
  const fromIso = toIso(from)
  const toIsoStr = toIso(to)
  if (fromIso) params.set("from", fromIso)
  if (toIsoStr) params.set("to", toIsoStr)
  const qs = params.toString()
  return qs ? `?${qs}` : ""
}

export function useAiCostTimeseries(
  from?: string | Date,
  to?: string | Date,
  granularity: "hour" | "day" | "month" = "day"
) {
  const params = new URLSearchParams()
  const fromIso = toIso(from)
  const toIsoStr = toIso(to)
  if (fromIso) params.set("from", fromIso)
  if (toIsoStr) params.set("to", toIsoStr)
  params.set("granularity", granularity)

  return useQuery({
    queryKey: ["ranking-metrics", "costs", "timeseries", fromIso, toIsoStr, granularity],
    queryFn: async () => {
      const res = await fetch(`${BASE}/metrics/costs/timeseries?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener costos por tiempo")
      return res.json() as Promise<CostTimeseriesResponse>
    },
  })
}

export function useAiCostSummary(from?: string | Date, to?: string | Date) {
  const qs = buildRangeQuery(from, to)
  return useQuery({
    queryKey: ["ranking-metrics", "costs", "summary", toIso(from), toIso(to)],
    queryFn: async () => {
      const res = await fetch(`${BASE}/metrics/costs/summary${qs}`)
      if (!res.ok) throw new Error("Error al obtener resumen de costos")
      return res.json() as Promise<CostSummaryResponse>
    },
  })
}

export function useRankingPerformance(from?: string | Date, to?: string | Date) {
  const qs = buildRangeQuery(from, to)
  return useQuery({
    queryKey: ["ranking-metrics", "performance", toIso(from), toIso(to)],
    queryFn: async () => {
      const res = await fetch(`${BASE}/metrics/performance${qs}`)
      if (!res.ok) throw new Error("Error al obtener performance de rankings")
      return res.json() as Promise<RankingPerformanceListResponse>
    },
  })
}

export function useRankingPerformanceDetail(rankingId: string | null) {
  return useQuery({
    queryKey: ["ranking-metrics", "performance", "detail", rankingId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/metrics/performance/${rankingId}`)
      if (!res.ok) throw new Error("Error al obtener detalle de performance")
      return res.json() as Promise<RankingPerformanceDetailResponse>
    },
    enabled: !!rankingId,
  })
}

export function useTriggerPerformanceMeasure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/metrics/performance/measure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al disparar medicion")
      }
      return res.json() as Promise<{ message: string }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ranking-metrics", "performance"] })
    },
  })
}
