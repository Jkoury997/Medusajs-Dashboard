"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"
import type {
  CampaignsResponse,
  EmailCampaign,
  EmailCampaignPatch,
  OverviewResponse,
  TimeseriesResponse,
  AlertsResponse,
  EmailAlert,
  VariantsResponse,
  VariantPreviewResponse,
  SendsResponse,
  EmailSend,
  SalesChannel,
} from "@/types/email-intelligence"
import type { EmailVariantAnalysisInput } from "@/lib/ai-client"

const ROOT = "/admin/ai-agents/email-intelligence"

// No reintentar en 4xx (auth / endpoint inexistente).
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error instanceof Error && /4\d{2}|not found|bad request|unauthorized/i.test(error.message))
    return false
  return true
}

// ============================================================
// Análisis IA de una variante (¿rinde o conviene cambiarla?)
// ============================================================

export function useAnalyzeVariant() {
  return useMutation({
    mutationFn: async (input: EmailVariantAnalysisInput): Promise<string> => {
      const res = await fetch("/api/ai/email-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error" }))
        throw new Error(err.error || "No se pudo analizar la plantilla")
      }
      const data = await res.json()
      return (data.analysis as string) ?? ""
    },
  })
}

// ============================================================
// Campañas (config)
// ============================================================

export function useEmailCampaigns() {
  return useQuery({
    queryKey: ["email-intelligence", "campaigns"],
    queryFn: () => sdk.client.fetch<CampaignsResponse>(`${ROOT}/campaigns`),
    retry: shouldRetry,
  })
}

export function useUpdateEmailCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EmailCampaignPatch }) =>
      sdk.client.fetch<{ ok: boolean; campaign: EmailCampaign }>(`${ROOT}/campaigns/${id}`, {
        method: "PATCH",
        body: patch,
      }),
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
    queryFn: () =>
      sdk.client.fetch<OverviewResponse>(`${ROOT}/overview`, { query: { days } }),
    retry: shouldRetry,
  })
}

export function useEmailTimeseries(days: number = 30) {
  return useQuery({
    queryKey: ["email-intelligence", "timeseries", days],
    queryFn: () =>
      sdk.client.fetch<TimeseriesResponse>(`${ROOT}/overview/timeseries`, {
        query: { days },
      }),
    retry: shouldRetry,
  })
}

// ============================================================
// Alertas operativas
// ============================================================

export function useEmailAlerts(resolved?: boolean) {
  return useQuery({
    queryKey: ["email-intelligence", "alerts", resolved ?? "all"],
    queryFn: () => {
      const query: Record<string, string | number> = { limit: 50 }
      if (resolved !== undefined) query.resolved = String(resolved)
      return sdk.client.fetch<AlertsResponse>(`${ROOT}/alerts`, { query })
    },
    retry: shouldRetry,
  })
}

export function useResolveAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resolved }: { id: string; resolved: boolean }) =>
      sdk.client.fetch<{ ok: boolean; alert: EmailAlert }>(`${ROOT}/alerts/${id}`, {
        method: "PATCH",
        body: { resolved },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["email-intelligence", "alerts"] })
    },
  })
}

// ============================================================
// Variantes
// ============================================================

export function useEmailVariants(campaignId?: string, status?: string) {
  return useQuery({
    queryKey: ["email-intelligence", "variants", campaignId || "all", status || "all"],
    queryFn: () => {
      const query: Record<string, string | number> = { limit: 200 }
      if (campaignId) query.campaign_id = campaignId
      if (status) query.status = status
      return sdk.client.fetch<VariantsResponse>(`${ROOT}/variants`, { query })
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
    queryFn: () => {
      const query: Record<string, string | number> = { limit, offset }
      if (campaignId) query.campaign_id = campaignId
      if (status) query.status = status
      return sdk.client.fetch<SendsResponse>(`${ROOT}/sends`, { query })
    },
    retry: shouldRetry,
  })
}

// ============================================================
// Último envío REAL de una variante (para ver el email tal cual se mandó)
// ============================================================

export function useVariantLatestSend(variantId: string | null) {
  return useQuery({
    queryKey: ["email-intelligence", "variant-sample", variantId],
    queryFn: async (): Promise<EmailSend | null> => {
      const data = await sdk.client.fetch<SendsResponse>(`${ROOT}/sends`, {
        query: { variant_id: variantId!, status: "sent", limit: 1 },
      })
      return data.sends?.[0] ?? null
    },
    enabled: !!variantId,
    retry: shouldRetry,
  })
}

// ============================================================
// Preview HTML del email renderizado de una variante
// ============================================================

export function useVariantPreview(variantId: string | null) {
  return useQuery({
    queryKey: ["email-intelligence", "variant-preview", variantId],
    queryFn: () =>
      sdk.client.fetch<VariantPreviewResponse>(
        `${ROOT}/variants/${variantId}/preview`,
      ),
    enabled: !!variantId,
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
      const data = await sdk.client.fetch<{ sales_channels: SalesChannel[] }>(
        "/admin/sales-channels",
        { query: { limit: 100 } }
      )
      return data.sales_channels ?? []
    },
    staleTime: 30 * 60 * 1000,
    retry: shouldRetry,
  })
}
