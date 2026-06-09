"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

export interface EmailSegmentRow {
  key: string
  name: string
  sends: number
  opens: number
  clicks: number
  conversions: number
  revenue_ars: number
  llm_cost_usd: number
  ctr: number
  conv_rate: number
}

export interface EmailCampaignRow {
  campaign_id: string
  kind: string
  name: string
  enabled: boolean
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
  per_campaign: EmailCampaignRow[]
  by_sales_channel: EmailSegmentRow[]
  by_customer_group: EmailSegmentRow[]
}

/**
 * KPIs cross-campaña de Email Intelligence en una ventana de N días,
 * con breakdown por marca/canal y por grupo de cliente.
 *
 * Pega al backend de Medusa (`/admin/ai-agents/email-intelligence/overview`)
 * vía el JS SDK (JWT + proxy /medusa), igual que el resto de los hooks admin.
 */
export function useEmailIntelligenceOverview(days: 7 | 30 | 90) {
  return useQuery({
    queryKey: ["email-intelligence", "overview", days],
    queryFn: async () => {
      return (await sdk.client.fetch(
        "/admin/ai-agents/email-intelligence/overview",
        { query: { days } }
      )) as EmailOverview
    },
    staleTime: 60 * 1000,
  })
}
