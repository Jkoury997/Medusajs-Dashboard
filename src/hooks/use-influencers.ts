"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  InfluencerStatsResponse,
  InfluencerDetailResponse,
} from "@/types/reseller"

// Pega al backend de Medusa (mismo patrón que empleados/GEO): proxy /medusa + JWT.
// Reemplaza la versión anterior que pegaba al reseller-api (se da de baja).
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

const BASE = `${BACKEND_URL}/admin/ai-agents/influencers`

// ============================================================
// STATS
// ============================================================

export function useInfluencerStats() {
  return useQuery({
    queryKey: ["influencers", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/stats`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error al obtener estadísticas de influencers")
      return res.json() as Promise<InfluencerStatsResponse>
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

      const res = await fetch(`${BASE}?${params}`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error al obtener lista de influencers")
      return res.json() as Promise<{ influencers: unknown[]; count: number }>
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
      const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() })
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
      const res = await fetch(`${BASE}/campaigns`, { headers: authHeaders() })
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
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || body.message || "Error al crear influencer")
      return body
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["influencers"] })
    },
  })
}

export function useUpdateInfluencer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await fetch(`${BASE}/${id}`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || body.message || "Error al actualizar influencer")
      return body
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
      const res = await fetch(`${BASE}/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Error al eliminar influencer")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["influencers"] })
    },
  })
}
