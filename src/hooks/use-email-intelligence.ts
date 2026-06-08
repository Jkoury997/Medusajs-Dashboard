"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"
import type { EmailVariantAnalysisInput } from "@/lib/ai-client"

const ROOT = "/admin/ai-agents/email-intelligence"

// Etiquetas legibles por tipo de campaña (kind)
export const CAMPAIGN_KIND_LABELS: Record<string, string> = {
  cart_recovery: "Carrito abandonado",
  browse_abandon: "Navegó sin comprar",
  winback: "Reactivación (winback)",
  price_drop: "Bajó de precio",
  post_purchase_upsell: "Post-compra (cross-sell)",
  back_in_stock: "Volvió el stock",
}

export interface EmailOverview {
  range: { days: number; from: string; to: string }
  totals: {
    sends: number
    opens: number
    clicks: number
    conversions: number
    revenue_ars: number
    llm_cost_usd: number
    evolution_cost_usd: number
    ctr: number
    conv_rate: number
  }
  per_campaign: EmailCampaignBreakdown[]
}

export interface EmailCampaignBreakdown {
  campaign_id: string
  kind: string
  name: string
  enabled: boolean
  sends: number
  opens: number
  clicks: number
  conversions: number
  revenue_ars: number
  ctr: number
  conv_rate: number
}

export interface EmailCampaign {
  id: string
  kind: string
  name: string
  enabled: boolean
  min_ctr_threshold: number
  target_active_variants: number
  evolution_model: string | null
  variant_counts: { active: number; retired: number; drafted: number }
}

export interface EmailVariant {
  id: string
  campaign_id: string
  label: string
  status: "drafted" | "active" | "retired"
  subject_template: string
  headline_template: string
  body_template: string
  cta_label: string | null
  sends_count: number
  opens_count: number
  clicks_count: number
  conversions_count: number
  conversions_revenue_ars: number
  score: number
  ctr: number
  open_rate: number
  conv_rate: number
}

export function useEmailOverview(days = 30) {
  return useQuery({
    queryKey: ["email-intel", "overview", days],
    queryFn: () =>
      sdk.client.fetch<EmailOverview>(`${ROOT}/overview`, { query: { days } }),
  })
}

export function useEmailCampaigns() {
  return useQuery({
    queryKey: ["email-intel", "campaigns"],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ campaigns: EmailCampaign[] }>(`${ROOT}/campaigns`)
      return res.campaigns ?? []
    },
  })
}

export function useEmailVariants(campaignId: string | null) {
  return useQuery({
    queryKey: ["email-intel", "variants", campaignId],
    queryFn: async () => {
      const res = await sdk.client.fetch<{ variants: EmailVariant[] }>(`${ROOT}/variants`, {
        query: campaignId ? { campaign_id: campaignId, limit: 200 } : { limit: 200 },
      })
      return res.variants ?? []
    },
    enabled: campaignId !== null,
  })
}

export function useAnalyzeVariant() {
  return useMutation({
    mutationFn: async (input: EmailVariantAnalysisInput) => {
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
