"use client"

import { useQuery, useMutation } from "@tanstack/react-query"

const BASE = "/api/email-proxy"

// ============================================================
// TIPOS
// ============================================================

export const TEMPLATE_TYPES = [
  "reminder",
  "coupon",
  "post_purchase",
  "welcome_1",
  "welcome_2",
  "welcome_3",
  "browse_abandonment",
  "newsletter",
  "win_back",
] as const

export type TemplateType = (typeof TEMPLATE_TYPES)[number]

export const TEMPLATE_LABELS: Record<string, string> = {
  reminder: "Carrito — Recordatorio",
  coupon: "Carrito — Cupón",
  post_purchase: "Post-compra (cross-sell)",
  welcome_1: "Bienvenida 1",
  welcome_2: "Bienvenida 2 (cupón)",
  welcome_3: "Bienvenida 3 (recomendaciones)",
  browse_abandonment: "Navegó sin comprar",
  newsletter: "Newsletter",
  win_back: "Reactivación (win-back)",
}

export interface EmailTemplate {
  _id?: string
  template_type: string
  group_name?: string | null
  subject: string
  heading: string
  body_text: string
  button_text?: string
  footer_text?: string
  source?: string
  updated_at?: string
}

export interface TemplatesResponse {
  templates: EmailTemplate[]
  defaults: Record<string, Omit<EmailTemplate, "template_type">>
}

export interface CampaignTypeStats {
  campaign_type: string
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  open_rate: string
  click_rate: string
  with_ai?: number
}

export interface CampaignStatsResponse {
  totals: {
    total: number
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    open_rate: string
    click_rate: string
  }
  campaigns: CampaignTypeStats[]
  ai_enabled: boolean
  ai_model: string
}

export interface CampaignEmailRecord {
  _id: string
  email: string
  customer_name?: string
  customer_group?: string
  sent_at?: string
  opened_at?: string | null
  clicked_at?: string | null
  bounced?: boolean
  ai_subject?: string
  has_preview?: boolean
}

export interface AbandonedCartStats {
  total_tracked: number
  total_recovered: number
  recovery_rate: string
  email_1_sent: number
  email_2_sent: number
}

export interface AbandonedCartRecord {
  _id: string
  cart_id: string
  email: string
  customer_name?: string
  customer_group?: string
  cart_total?: number
  items_count?: number
  abandoned_at?: string
  recovered?: boolean
  email_1_sent_at?: string | null
  email_2_sent_at?: string | null
  email_1_opened_at?: string | null
  email_1_clicked_at?: string | null
  has_preview_1?: boolean
  has_preview_2?: boolean
}

// ============================================================
// TEMPLATES
// ============================================================

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email", "templates"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/templates`)
      if (!res.ok) throw new Error("Error al obtener plantillas")
      return res.json() as Promise<TemplatesResponse>
    },
  })
}

export function useTemplatePreview() {
  return useMutation({
    mutationFn: async (type: string) => {
      const res = await fetch(`${BASE}/templates/${type}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (!res.ok) throw new Error("Error al generar la vista previa")
      const data = await res.json()
      return (data.html as string) ?? ""
    },
  })
}

// ============================================================
// CAMPAÑAS IA
// ============================================================

export function useCampaignStats() {
  return useQuery({
    queryKey: ["email", "campaigns", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/campaigns/stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de campañas")
      return res.json() as Promise<CampaignStatsResponse>
    },
  })
}

export function useCampaignRecent(type: string, limit = 30) {
  return useQuery({
    queryKey: ["email", "campaigns", "recent", type, limit],
    queryFn: async () => {
      const res = await fetch(`${BASE}/campaigns/${type}/recent?limit=${limit}`)
      if (!res.ok) throw new Error("Error al obtener emails recientes")
      const data = await res.json()
      return (data.records ?? []) as CampaignEmailRecord[]
    },
    enabled: !!type,
  })
}

// ============================================================
// CARRITOS ABANDONADOS
// ============================================================

export function useAbandonedCartStats() {
  return useQuery({
    queryKey: ["email", "abandoned", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/abandoned-carts/stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de carritos")
      return res.json() as Promise<AbandonedCartStats>
    },
  })
}

export function useAbandonedCartList(limit = 50) {
  return useQuery({
    queryKey: ["email", "abandoned", "list", limit],
    queryFn: async () => {
      const res = await fetch(`${BASE}/abandoned-carts/list?limit=${limit}`)
      if (!res.ok) throw new Error("Error al obtener carritos abandonados")
      const data = await res.json()
      return {
        records: (data.records ?? []) as AbandonedCartRecord[],
        total: (data.total as number) ?? 0,
      }
    },
  })
}

// URLs de preview (HTML) servidas vía proxy — usar directo como src de un iframe.
export function campaignEmailPreviewUrl(id: string): string {
  return `${BASE}/campaigns/emails/${id}/preview`
}
export function abandonedCartPreviewUrl(cartId: string, emailNumber: 1 | 2): string {
  return `${BASE}/campaigns/abandoned-carts/${cartId}/preview/${emailNumber}`
}
