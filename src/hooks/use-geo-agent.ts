"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  GeoProposalsResponse,
  GenerateGeoInput,
  GenerateGeoResult,
  GeoGuideEdits,
  Guardrail,
  GuardrailsResponse,
  GeoGuardrailValue,
} from "@/types/geo-agent"
import { GEO_GUARDRAIL_KEY, GEO_GUARDRAIL_DOMAIN } from "@/types/geo-agent"

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

const GEO_BASE = `${BACKEND_URL}/admin/ai-agents/geo`
const GUARDRAILS_URL = `${BACKEND_URL}/admin/ai-agents/guardrails`

function invalidateGeo(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["geo", "proposals"] })
}

// ============================================================
// Proposals (guías)
// ============================================================

export function useGeoProposals(status: string = "proposed", salesChannelId?: string) {
  return useQuery({
    queryKey: ["geo", "proposals", status, salesChannelId || "all"],
    queryFn: async (): Promise<GeoProposalsResponse> => {
      const params = new URLSearchParams({ status, limit: "100" })
      if (salesChannelId) params.set("sales_channel_id", salesChannelId)
      const res = await fetch(`${GEO_BASE}/proposals?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener guías`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Generar
// ============================================================

export function useGenerateGeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GenerateGeoInput): Promise<GenerateGeoResult> => {
      const res = await fetch(`${GEO_BASE}/generate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(input),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || body.message || `${res.status} - Error al generar`)
      return body
    },
    onSuccess: () => invalidateGeo(qc),
  })
}

// ============================================================
// Editar / aprobar / rechazar / borrar
// ============================================================

export function usePatchGeoGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, edits }: { id: string; edits: GeoGuideEdits }) => {
      const res = await fetch(`${GEO_BASE}/proposals/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(edits),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `${res.status} - Error al guardar`)
      return body
    },
    onSuccess: () => invalidateGeo(qc),
  })
}

export function useApproveGeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      publish,
      note,
      edits,
    }: {
      id: string
      publish?: boolean
      note?: string
      edits?: GeoGuideEdits
    }): Promise<{ ok: boolean; published: boolean }> => {
      const res = await fetch(`${GEO_BASE}/proposals/${id}/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ publish, note, edits }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `${res.status} - Error al aprobar`)
      return body
    },
    onSuccess: () => invalidateGeo(qc),
  })
}

export function useRejectGeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const res = await fetch(`${GEO_BASE}/proposals/${id}/reject`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ note }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `${res.status} - Error al rechazar`)
      return body
    },
    onSuccess: () => invalidateGeo(qc),
  })
}

export function useDeleteGeo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${GEO_BASE}/proposals/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || `${res.status} - Error al borrar`)
      return body
    },
    onSuccess: () => invalidateGeo(qc),
  })
}

// ============================================================
// Guardrail geo-content
// ============================================================

export function useGeoGuardrail() {
  return useQuery({
    queryKey: ["geo", "guardrail"],
    queryFn: async (): Promise<Guardrail | null> => {
      const res = await fetch(`${GUARDRAILS_URL}?domain=${GEO_GUARDRAIL_DOMAIN}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener configuración`)
      const data: GuardrailsResponse = await res.json()
      return (data.guardrails ?? []).find((g) => g.key === GEO_GUARDRAIL_KEY) ?? null
    },
    retry: shouldRetry,
  })
}

export function useUpdateGeoGuardrail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      value,
      description,
    }: {
      value: Partial<GeoGuardrailValue>
      description?: string
    }) => {
      const res = await fetch(GUARDRAILS_URL, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          domain: GEO_GUARDRAIL_DOMAIN,
          key: GEO_GUARDRAIL_KEY,
          value,
          description,
        }),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al guardar la configuración`)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geo", "guardrail"] })
    },
  })
}
