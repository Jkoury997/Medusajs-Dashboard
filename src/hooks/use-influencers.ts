"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  InfluencerStatsResponse,
  InfluencerDetailResponse,
} from "@/types/reseller"

const BASE = "/api/reseller-proxy"

// ============================================================
// STATS
// ============================================================

export function useInfluencerStats() {
  return useQuery({
    queryKey: ["influencers", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/influencer-stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de influencers")
      const data = await res.json()
      return data as InfluencerStatsResponse
    },
  })
}

// ============================================================
// LIST
// ============================================================

export function useInfluencers(filters: { status?: string; platform?: string; campaign?: string } = {}) {
  return useQuery({
    queryKey: ["influencers", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.platform) params.set("platform", filters.platform)
      if (filters.campaign) params.set("campaign", filters.campaign)
      params.set("limit", "100")

      const res = await fetch(`${BASE}/admin/influencers?${params}`)
      if (!res.ok) throw new Error("Error al obtener lista de influencers")
      return res.json() as Promise<{ influencers: any[]; count: number }>
    },
  })
}

// ============================================================
// DETAIL
// ============================================================

export function useInfluencerDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["influencers", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/influencer-stats/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle del influencer")
      return res.json() as Promise<InfluencerDetailResponse>
    },
    enabled: !!id,
  })
}

// ============================================================
// CAMPAIGNS
// ============================================================

export function useInfluencerCampaigns() {
  return useQuery({
    queryKey: ["influencers", "campaigns"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/influencers/campaigns`)
      if (!res.ok) throw new Error("Error al obtener campañas")
      return res.json() as Promise<{ campaigns: string[] }>
    },
  })
}

// ============================================================
// MUTATIONS
// ============================================================

export function useCreateInfluencer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch(`${BASE}/admin/influencers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Error al crear influencer")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["influencers"] })
    },
  })
}

export function useUpdateInfluencer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const res = await fetch(`${BASE}/admin/influencers/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Error al actualizar influencer")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["influencers"] })
    },
  })
}

export function useDeleteInfluencer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/influencers/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al eliminar influencer")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["influencers"] })
    },
  })
}
