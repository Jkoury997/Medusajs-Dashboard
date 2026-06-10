"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  RankingStatsResponse,
  RankingPerformanceResponse,
  RankingListResponse,
  RankingListFilters,
  RankingRunsResponse,
  RankingRange,
  TriggerRankingInput,
  TriggerRankingDryRun,
  TriggerRankingStarted,
  Guardrail,
  GuardrailsResponse,
  RankingGuardrailValue,
} from "@/types/ranking-agent"
import { RANKING_GUARDRAIL_KEY, RANKING_GUARDRAIL_DOMAIN } from "@/types/ranking-agent"

const BACKEND_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/medusa`
    : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!

const SDK_JWT_KEY = "medusa_auth_token"

function getToken(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(SDK_JWT_KEY) || ""
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  }
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error instanceof Error && /4\d{2}|not found|bad request/i.test(error.message))
    return false
  return true
}

const RANKING_BASE = `${BACKEND_URL}/admin/ai-agents/ranking`
const GUARDRAILS_URL = `${BACKEND_URL}/admin/ai-agents/guardrails`

// ============================================================
// Stats
// ============================================================

export function useRankingStats() {
  return useQuery({
    queryKey: ["ranking", "stats"],
    queryFn: async (): Promise<RankingStatsResponse> => {
      const res = await fetch(`${RANKING_BASE}/stats`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener stats de ranking`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Performance / uplift
// ============================================================

export function useRankingPerformance(
  range: RankingRange = "30d",
  salesChannelId?: string,
) {
  return useQuery({
    queryKey: ["ranking", "performance", range, salesChannelId || "all"],
    queryFn: async (): Promise<RankingPerformanceResponse> => {
      const params = new URLSearchParams({ range })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${RANKING_BASE}/performance?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener performance`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Rankings activos
// ============================================================

export function useRankingList(filters: RankingListFilters = {}) {
  const { salesChannelId, customerGroupId, type = "all", entityType = "all", limit = 100 } =
    filters
  return useQuery({
    queryKey: [
      "ranking",
      "list",
      salesChannelId || "all",
      customerGroupId || "all",
      type,
      entityType,
      limit,
    ],
    queryFn: async (): Promise<RankingListResponse> => {
      const params = new URLSearchParams({ limit: String(limit) })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      if (customerGroupId) params.set("customer_group_id", customerGroupId)
      if (type !== "all") params.set("type", type)
      if (entityType !== "all") params.set("entity_type", entityType)
      const res = await fetch(`${RANKING_BASE}/rankings?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener rankings`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Runs (historial)
// ============================================================

export function useRankingRuns(limit: number = 50) {
  return useQuery({
    queryKey: ["ranking", "runs", limit],
    queryFn: async (): Promise<RankingRunsResponse> => {
      const res = await fetch(`${RANKING_BASE}/runs?limit=${limit}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener historial de runs`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Trigger (recompute manual)
// ============================================================

export function useTriggerRankingPreview() {
  return useMutation({
    mutationFn: async (input: TriggerRankingInput): Promise<TriggerRankingDryRun> => {
      const res = await fetch(`${RANKING_BASE}/trigger`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...input, dry_run: true }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || body.error || `${res.status} - Error en el estimado`)
      return body
    },
  })
}

export function useTriggerRanking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TriggerRankingInput): Promise<TriggerRankingStarted> => {
      const res = await fetch(`${RANKING_BASE}/trigger`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...input, dry_run: false }),
      })
      const body = await res.json().catch(() => ({}))
      // 409 = guardrail apagado; 400 = ningún scope matchea.
      if (!res.ok) throw new Error(body.message || body.error || `${res.status} - Error al disparar el recompute`)
      return body
    },
    onSuccess: () => {
      // El run aparece en /runs (y eventualmente actualiza stats).
      qc.invalidateQueries({ queryKey: ["ranking", "runs"] })
      qc.invalidateQueries({ queryKey: ["ranking", "stats"] })
    },
  })
}

// ============================================================
// Guardrail dynamic-ranking (kill-switch + config)
// ============================================================

export function useRankingGuardrail() {
  return useQuery({
    queryKey: ["ranking", "guardrail"],
    queryFn: async (): Promise<Guardrail | null> => {
      const res = await fetch(`${GUARDRAILS_URL}?domain=${RANKING_GUARDRAIL_DOMAIN}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener configuración`)
      const data: GuardrailsResponse = await res.json()
      return (data.guardrails ?? []).find((g) => g.key === RANKING_GUARDRAIL_KEY) ?? null
    },
    retry: shouldRetry,
  })
}

export function useUpdateRankingGuardrail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      value,
      description,
    }: {
      value: Partial<RankingGuardrailValue>
      description?: string
    }) => {
      const res = await fetch(GUARDRAILS_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          domain: RANKING_GUARDRAIL_DOMAIN,
          key: RANKING_GUARDRAIL_KEY,
          value,
          description,
        }),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al guardar la configuración`)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ranking", "guardrail"] })
    },
  })
}
