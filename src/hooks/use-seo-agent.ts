"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ProposalsResponse,
  SeoProposal,
  SeoStatsResponse,
  ProductSearchItem,
  GuardrailsResponse,
  Guardrail,
  AiDescriptionResult,
} from "@/types/seo-agent"

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

const SEO_BASE = `${BACKEND_URL}/admin/ai-agents/seo`
const GUARDRAILS_URL = `${BACKEND_URL}/admin/ai-agents/guardrails`

// ============================================================
// Stats
// ============================================================

export function useSeoStats(range: "7d" | "30d" | "90d" = "30d", salesChannelId?: string) {
  return useQuery({
    queryKey: ["seo", "stats", range, salesChannelId || "all"],
    queryFn: async (): Promise<SeoStatsResponse> => {
      const params = new URLSearchParams({ range })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${SEO_BASE}/stats?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener stats de SEO`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Propuestas
// ============================================================

export function useSeoProposals(status: string = "proposed", salesChannelId?: string) {
  return useQuery({
    queryKey: ["seo", "proposals", status, salesChannelId || "all"],
    queryFn: async (): Promise<ProposalsResponse> => {
      const params = new URLSearchParams({ status, limit: "100" })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${SEO_BASE}/proposals?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener propuestas`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

export function useApproveSeoProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      note,
      edits,
    }: {
      id: string
      note?: string
      edits?: Partial<AiDescriptionResult>
    }) => {
      const res = await fetch(`${SEO_BASE}/proposals/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ note, edits }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `${res.status} - Error al aprobar`)
      }
      return res.json()
    },
    onSuccess: () => invalidateSeo(qc),
  })
}

export function useRejectSeoProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const res = await fetch(`${SEO_BASE}/proposals/${id}/reject`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ note }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `${res.status} - Error al rechazar`)
      }
      return res.json()
    },
    onSuccess: () => invalidateSeo(qc),
  })
}

export function useBulkApproveSeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, note }: { ids: string[]; note?: string }) => {
      const res = await fetch(`${SEO_BASE}/proposals/bulk-approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ids, note }),
      })
      if (!res.ok) throw new Error(`${res.status} - Error en aprobación masiva`)
      return res.json() as Promise<{
        ok: boolean
        total: number
        success_count: number
        failure_count: number
      }>
    },
    onSuccess: () => invalidateSeo(qc),
  })
}

// ============================================================
// Regeneración manual
// ============================================================

export function useProductSearch(q: string) {
  return useQuery({
    queryKey: ["seo", "product-search", q],
    queryFn: async (): Promise<ProductSearchItem[]> => {
      const res = await fetch(
        `${SEO_BASE}/products-search?q=${encodeURIComponent(q)}`,
        { headers: authHeaders() },
      )
      if (!res.ok) throw new Error(`${res.status} - Error al buscar productos`)
      const data = await res.json()
      return (data.products ?? []) as ProductSearchItem[]
    },
    enabled: q.trim().length >= 2,
    retry: shouldRetry,
  })
}

export function useRegenerateSeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      mode,
      force,
    }: {
      productId: string
      mode?: "create" | "regenerate"
      force?: boolean
    }) => {
      const res = await fetch(`${SEO_BASE}/regenerate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          product_id: productId,
          mode: mode ?? "regenerate",
          force: force ?? false,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `${res.status} - Error al regenerar`)
      }
      return res.json()
    },
    onSuccess: () => invalidateSeo(qc),
  })
}

// ============================================================
// Guardrails (config)
// ============================================================

export function useSeoGuardrails() {
  return useQuery({
    queryKey: ["seo", "guardrails"],
    queryFn: async (): Promise<Guardrail[]> => {
      const res = await fetch(`${GUARDRAILS_URL}?domain=content`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener configuración`)
      const data: GuardrailsResponse = await res.json()
      return data.guardrails ?? []
    },
    retry: shouldRetry,
  })
}

export function useUpdateGuardrail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      key,
      value,
      description,
    }: {
      key: string
      value: Record<string, unknown>
      description?: string
    }) => {
      const res = await fetch(GUARDRAILS_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ domain: "content", key, value, description }),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al guardar la configuración`)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo", "guardrails"] })
    },
  })
}

function invalidateSeo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["seo", "proposals"] })
  qc.invalidateQueries({ queryKey: ["seo", "stats"] })
}

export type { SeoProposal }
