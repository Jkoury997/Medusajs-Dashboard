"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ManualCampaign,
  ManualCampaignListResponse,
  ManualCampaignStats,
  CampaignRecipientsResponse,
  CampaignListFilters,
  CreateCampaignData,
  UpdateCampaignData,
  SendCampaignData,
  AudiencePreviewResponse,
  EmailPreviewResponse,
  GenerateContentData,
  GenerateContentResponse,
  SegmentEstimateData,
  SegmentEstimateResponse,
  SegmentGroup,
  ContentPreset,
  ProductSearchResult,
  ManualCampaignContent,
  ManualCampaignDiscount,
} from "@/types/campaigns"

const BASE = "/api/campaigns-proxy"

// --- Queries ---

export function useManualCampaignList(filters: CampaignListFilters = {}) {
  return useQuery({
    queryKey: ["manual-campaigns", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener lista de campañas")
      return res.json() as Promise<ManualCampaignListResponse>
    },
  })
}

export function useManualCampaignDetail(id: string | null) {
  return useQuery({
    queryKey: ["manual-campaigns", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle de campaña")
      return res.json() as Promise<ManualCampaign>
    },
    enabled: !!id,
  })
}

export function useManualCampaignStats(id: string | null) {
  return useQuery({
    queryKey: ["manual-campaigns", "stats", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/${id}/stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de campaña")
      return res.json() as Promise<ManualCampaignStats>
    },
    enabled: !!id,
  })
}

export function useManualCampaignRecipients(id: string | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["manual-campaigns", "recipients", id, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      const res = await fetch(`${BASE}/${id}/recipients?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener destinatarios")
      return res.json() as Promise<CampaignRecipientsResponse>
    },
    enabled: !!id,
  })
}

export function useSegmentGroups() {
  return useQuery({
    queryKey: ["manual-campaigns", "segment-groups"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/segments/groups`)
      if (!res.ok) throw new Error("Error al obtener grupos de segmento")
      const data = await res.json()
      return (data.groups ?? data) as SegmentGroup[]
    },
  })
}

// --- Mutations ---

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear campaña")
      }
      return res.json() as Promise<ManualCampaign>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns", "list"] })
    },
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCampaignData }) => {
      const res = await fetch(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar campaña")
      }
      return res.json() as Promise<ManualCampaign>
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns", "list"] })
      qc.invalidateQueries({ queryKey: ["manual-campaigns", "detail", vars.id] })
    },
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar campaña")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns", "list"] })
    },
  })
}

export function useSendCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data?: SendCampaignData }) => {
      const res = await fetch(`${BASE}/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data ?? {}),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al enviar campaña")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns"] })
    },
  })
}

export function usePauseCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}/pause`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al pausar campaña")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns"] })
    },
  })
}

export function useResumeCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}/resume`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al reanudar campaña")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns"] })
    },
  })
}

export function useCancelCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}/cancel`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al cancelar campaña")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns"] })
    },
  })
}

export function useDuplicateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}/duplicate`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al duplicar campaña")
      }
      return res.json() as Promise<ManualCampaign>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-campaigns", "list"] })
    },
  })
}

export function useTestSendCampaign() {
  return useMutation({
    mutationFn: async ({ id, email }: { id: string; email: string }) => {
      const res = await fetch(`${BASE}/${id}/test-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al enviar test")
      }
      return res.json()
    },
  })
}

export function usePreviewAudience() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}/preview-audience`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al previsualizar audiencia")
      }
      return res.json() as Promise<AudiencePreviewResponse>
    },
  })
}

export function usePreviewEmail() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}/preview-email`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al previsualizar email")
      }
      return res.json() as Promise<EmailPreviewResponse>
    },
  })
}

export function useGenerateContent() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GenerateContentData }) => {
      const res = await fetch(`${BASE}/${id}/generate-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al generar contenido AI")
      }
      return res.json() as Promise<GenerateContentResponse>
    },
  })
}

export function useEstimateSegment() {
  return useMutation({
    mutationFn: async (data: SegmentEstimateData) => {
      const res = await fetch(`${BASE}/segments/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al estimar audiencia")
      }
      return res.json() as Promise<SegmentEstimateResponse>
    },
  })
}

// --- Product Search ---

export function useProductSearch(query: string, customerGroup?: string) {
  return useQuery({
    queryKey: ["products", "search", query, customerGroup],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (query) params.set("q", query)
      if (customerGroup) params.set("group", customerGroup)
      params.set("limit", "20")
      const res = await fetch(`${BASE}/products?${params.toString()}`)
      if (!res.ok) throw new Error("Error al buscar productos")
      return res.json() as Promise<{ products: ProductSearchResult[]; total: number }>
    },
    staleTime: 30_000,
  })
}

// --- Content Presets ---

export function useContentPresets() {
  return useQuery({
    queryKey: ["content-presets"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/presets`)
      if (!res.ok) throw new Error("Error al obtener presets")
      const data = await res.json()
      return (data.presets ?? []) as ContentPreset[]
    },
  })
}

export function useSaveAsPreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      campaignId,
      name,
      description,
    }: {
      campaignId: string
      name: string
      description?: string
    }) => {
      const res = await fetch(`${BASE}/${campaignId}/save-as-preset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      if (!res.ok) throw new Error("Error al guardar preset")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-presets"] })
    },
  })
}

export function useCreatePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      content: ManualCampaignContent
      discount?: ManualCampaignDiscount | null
    }) => {
      const res = await fetch(`${BASE}/presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al crear preset")
      return res.json() as Promise<ContentPreset>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-presets"] })
    },
  })
}

export function useUpdatePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`${BASE}/presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar preset")
      return res.json() as Promise<ContentPreset>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-presets"] })
    },
  })
}

export function useDeletePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/presets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar preset")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["content-presets"] })
    },
  })
}
