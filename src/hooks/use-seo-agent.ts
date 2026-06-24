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
  EntityKind,
  CategorySearchItem,
  SearchInsightKind,
  SearchInsightsResponse,
  SynonymsResponse,
  SynonymSuggestionsResponse,
  SynonymType,
  BulkRegenerateMode,
  BulkRegenerateDryRun,
  BulkRegenerateChunk,
  BulkRegenerateSummary,
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

export function useSeoProposals(
  status: string = "proposed",
  salesChannelId?: string,
  limit: number = 50,
  offset: number = 0,
) {
  return useQuery({
    queryKey: ["seo", "proposals", status, salesChannelId || "all", limit, offset],
    queryFn: async (): Promise<ProposalsResponse> => {
      const params = new URLSearchParams({
        status,
        limit: String(limit),
        offset: String(offset),
      })
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
          // Fire-and-forget en el backend: responde 202 al toque y genera en
          // background. Evita el 502 del proxy /medusa ante la llamada lenta al LLM.
          async: true,
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

// ============================================================
// Categorías (mismo shape de propuesta que productos)
// ============================================================

export function useCategorySeoProposals(
  status: string = "proposed",
  salesChannelId?: string,
  limit: number = 50,
  offset: number = 0,
) {
  return useQuery({
    queryKey: ["seo", "category-proposals", status, salesChannelId || "all", limit, offset],
    queryFn: async (): Promise<ProposalsResponse> => {
      const params = new URLSearchParams({
        status,
        limit: String(limit),
        offset: String(offset),
      })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${SEO_BASE}/categories/proposals?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener propuestas de categorías`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

export function useApproveCategorySeoProposal() {
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
      const res = await fetch(`${SEO_BASE}/categories/proposals/${id}/approve`, {
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

export function useRegenerateCategorySeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      categoryId,
      mode,
      force,
      salesChannelId,
    }: {
      categoryId: string
      mode?: "create" | "regenerate"
      force?: boolean
      salesChannelId?: string
    }) => {
      const res = await fetch(`${SEO_BASE}/categories/regenerate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          category_id: categoryId,
          mode: mode ?? "create",
          force: force ?? false,
          sales_channel_id: salesChannelId,
          // Fire-and-forget en el backend (202) para evitar el 502 del proxy.
          async: true,
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

export function useCategorySearch(q: string) {
  return useQuery({
    queryKey: ["seo", "category-search", q],
    queryFn: async (): Promise<CategorySearchItem[]> => {
      const res = await fetch(
        `${SEO_BASE}/categories/search?q=${encodeURIComponent(q)}`,
        { headers: authHeaders() },
      )
      if (!res.ok) throw new Error(`${res.status} - Error al buscar categorías`)
      const data = await res.json()
      return (data.categories ?? []) as CategorySearchItem[]
    },
    enabled: q.trim().length >= 2,
    retry: shouldRetry,
  })
}

// ============================================================
// Regeneración masiva (cursor-based, productos o categorías)
// ============================================================

function bulkUrl(entity: EntityKind): string {
  return entity === "category"
    ? `${SEO_BASE}/categories/bulk-regenerate`
    : `${SEO_BASE}/bulk-regenerate`
}

/** Dry run: cuántos faltan + costo estimado + estado del presupuesto. */
export function useBulkRegeneratePreview(entity: EntityKind) {
  return useMutation({
    mutationFn: async ({
      mode,
      salesChannelId,
    }: {
      mode: BulkRegenerateMode
      salesChannelId?: string
    }): Promise<BulkRegenerateDryRun> => {
      const res = await fetch(bulkUrl(entity), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ mode, dry_run: true, sales_channel_id: salesChannelId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || body.message || `${res.status} - Error en el preview`)
      }
      return res.json()
    },
  })
}

/**
 * Corre la regeneración masiva en loop: el backend procesa por chunks con
 * cursor, así que iteramos hasta `done` (o hasta que se agote el presupuesto).
 */
export function useBulkRegenerate(entity: EntityKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      mode,
      salesChannelId,
      chunkSize = 5,
      onProgress,
    }: {
      mode: BulkRegenerateMode
      salesChannelId?: string
      chunkSize?: number
      onProgress?: (p: { processed: number; total: number }) => void
    }): Promise<BulkRegenerateSummary> => {
      let cursor = 0
      let total = 0
      let success = 0
      let failure = 0
      let budgetExhausted = false
      let budgetRemaining = 0
      const MAX_ITERATIONS = 500 // backstop anti-loop infinito

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const res = await fetch(bulkUrl(entity), {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            mode,
            chunk_size: chunkSize,
            cursor,
            sales_channel_id: salesChannelId,
          }),
        })
        if (res.status === 429) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message || "Presupuesto mensual agotado.")
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(
            body.error || body.message || `${res.status} - Error en regeneración masiva`,
          )
        }
        const chunk = (await res.json()) as BulkRegenerateChunk
        total = chunk.total
        success += chunk.success_count
        failure += chunk.failure_count
        cursor = chunk.next_cursor
        budgetExhausted = chunk.budget_exhausted
        budgetRemaining = chunk.budget_remaining_usd
        onProgress?.({ processed: chunk.processed, total })
        if (chunk.done) break
      }

      return {
        total,
        processed: cursor,
        success_count: success,
        failure_count: failure,
        budget_exhausted: budgetExhausted,
        budget_remaining_usd: budgetRemaining,
      }
    },
    onSuccess: () => invalidateSeo(qc),
  })
}

// ============================================================
// Search insights
// ============================================================

export function useSearchInsights(kind: SearchInsightKind, salesChannelId?: string) {
  return useQuery({
    queryKey: ["seo", "search-insights", kind, salesChannelId || "all"],
    queryFn: async (): Promise<SearchInsightsResponse> => {
      const params = new URLSearchParams({ kind, limit: "50" })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${SEO_BASE}/search-insights?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener insights de búsqueda`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

export function useRefreshSearchInsights() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${SEO_BASE}/search-insights/refresh`, {
        method: "POST",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `${res.status} - Error al refrescar desde Algolia`)
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seo", "search-insights"] }),
  })
}

// ============================================================
// Synonyms (Algolia)
// ============================================================

export function useSynonyms(query: string = "") {
  return useQuery({
    queryKey: ["seo", "synonyms", query],
    queryFn: async (): Promise<SynonymsResponse> => {
      const params = new URLSearchParams({ limit: "200" })
      if (query) params.set("query", query)
      const res = await fetch(`${SEO_BASE}/synonyms?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener synonyms`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

export function useCreateSynonym() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      synonyms,
      type,
      input,
    }: {
      synonyms: string[]
      type: SynonymType
      input?: string
    }) => {
      const res = await fetch(`${SEO_BASE}/synonyms`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ synonyms, type, input }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || body.error || `${res.status} - Error al crear synonym`)
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["seo", "synonyms"] })
      qc.invalidateQueries({ queryKey: ["seo", "synonym-suggestions"] })
    },
  })
}

export function useDeleteSynonym() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (objectID: string) => {
      const res = await fetch(`${SEO_BASE}/synonyms/${encodeURIComponent(objectID)}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || body.error || `${res.status} - Error al borrar synonym`)
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seo", "synonyms"] }),
  })
}

export function useSynonymSuggestions(salesChannelId?: string) {
  return useQuery({
    queryKey: ["seo", "synonym-suggestions", salesChannelId || "all"],
    queryFn: async (): Promise<SynonymSuggestionsResponse> => {
      const params = new URLSearchParams()
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${SEO_BASE}/synonym-suggestions?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener sugerencias`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

function invalidateSeo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["seo", "proposals"] })
  qc.invalidateQueries({ queryKey: ["seo", "category-proposals"] })
  qc.invalidateQueries({ queryKey: ["seo", "stats"] })
}

export type { SeoProposal }
