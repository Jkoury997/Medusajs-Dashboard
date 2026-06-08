"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  CampaignsResponse,
  EmailCampaign,
  EmailCampaignPatch,
  OverviewResponse,
  VariantsResponse,
  SendsResponse,
  SalesChannel,
} from "@/types/email-intelligence"

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

// No reintentar en 4xx (auth / endpoint inexistente).
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error instanceof Error && /4\d{2}|not found|bad request/i.test(error.message))
    return false
  return true
}

const EI_BASE = `${BACKEND_URL}/admin/ai-agents/email-intelligence`

// ============================================================
// Campañas (config)
// ============================================================

export function useEmailCampaigns() {
  return useQuery({
    queryKey: ["email-intelligence", "campaigns"],
    queryFn: async (): Promise<CampaignsResponse> => {
      const res = await fetch(`${EI_BASE}/campaigns`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener campañas`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

export function useUpdateEmailCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: EmailCampaignPatch
    }): Promise<{ ok: boolean; campaign: EmailCampaign }> => {
      const res = await fetch(`${EI_BASE}/campaigns/${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al guardar la campaña`)
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-intelligence", "campaigns"] })
      qc.invalidateQueries({ queryKey: ["email-intelligence", "overview"] })
    },
  })
}

// ============================================================
// Overview / KPIs
// ============================================================

export function useEmailOverview(days: number = 30) {
  return useQuery({
    queryKey: ["email-intelligence", "overview", days],
    queryFn: async (): Promise<OverviewResponse> => {
      const res = await fetch(`${EI_BASE}/overview?days=${days}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener métricas`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Variantes
// ============================================================

export function useEmailVariants(campaignId?: string, status?: string) {
  return useQuery({
    queryKey: ["email-intelligence", "variants", campaignId || "all", status || "all"],
    queryFn: async (): Promise<VariantsResponse> => {
      const params = new URLSearchParams({ limit: "200" })
      if (campaignId) params.set("campaign_id", campaignId)
      if (status) params.set("status", status)
      const res = await fetch(`${EI_BASE}/variants?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener variantes`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Envíos (log)
// ============================================================

export function useEmailSends(opts: {
  campaignId?: string
  status?: string
  limit?: number
  offset?: number
}) {
  const { campaignId, status, limit = 100, offset = 0 } = opts
  return useQuery({
    queryKey: [
      "email-intelligence",
      "sends",
      campaignId || "all",
      status || "all",
      limit,
      offset,
    ],
    queryFn: async (): Promise<SendsResponse> => {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })
      if (campaignId) params.set("campaign_id", campaignId)
      if (status) params.set("status", status)
      const res = await fetch(`${EI_BASE}/sends?${params.toString()}`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener envíos`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Sales channels (para overrides por marca)
// ============================================================

export function useSalesChannels() {
  return useQuery({
    queryKey: ["sales-channels"],
    queryFn: async (): Promise<SalesChannel[]> => {
      const res = await fetch(`${BACKEND_URL}/admin/sales-channels?limit=100`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener canales de venta`)
      const data = await res.json()
      return (data.sales_channels ?? []) as SalesChannel[]
    },
    staleTime: 30 * 60 * 1000,
    retry: shouldRetry,
  })
}
