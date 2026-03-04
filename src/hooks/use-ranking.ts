"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  RankingHealthResponse,
  EntityRankingResponse,
  RankingJobStatus,
  RankingStatsSummary,
  RankingTriggerResponse,
} from "@/types/ranking"

const BASE = "/api/ranking-proxy"

export function useRankingHealth() {
  return useQuery({
    queryKey: ["ranking", "health"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/health`)
      if (!res.ok) throw new Error("Error al verificar estado del servicio de ranking")
      return res.json() as Promise<RankingHealthResponse>
    },
    refetchInterval: 60_000,
  })
}

export function useRankingStatsSummary() {
  return useQuery({
    queryKey: ["ranking", "stats", "summary"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/rankings/stats/summary`)
      if (!res.ok) throw new Error("Error al obtener resumen de rankings")
      return res.json() as Promise<RankingStatsSummary>
    },
  })
}

export function useRankingLastJobStatus() {
  return useQuery({
    queryKey: ["ranking", "status", "last"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/rankings/status/last`)
      if (!res.ok) throw new Error("Error al obtener estado del último job")
      return res.json() as Promise<RankingJobStatus>
    },
    refetchInterval: 30_000,
  })
}

export function useEntityRankings(entityId: string | null, customerId?: string) {
  return useQuery({
    queryKey: ["ranking", "entity", entityId, customerId],
    queryFn: async () => {
      const params = customerId ? `?customer_id=${encodeURIComponent(customerId)}` : ""
      const res = await fetch(`${BASE}/rankings/${entityId}${params}`)
      if (!res.ok) throw new Error("Error al obtener rankings de la entidad")
      return res.json() as Promise<EntityRankingResponse>
    },
    enabled: !!entityId,
  })
}

export function useTriggerRankingCycle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/rankings/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al disparar ciclo de ranking")
      }
      return res.json() as Promise<RankingTriggerResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ranking", "status"] })
      qc.invalidateQueries({ queryKey: ["ranking", "stats"] })
    },
  })
}
