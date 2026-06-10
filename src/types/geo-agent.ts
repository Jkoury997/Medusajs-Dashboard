// ============================================================
// GEO / Guías — tipos del agente de Generative Engine Optimization
// Backend: /admin/ai-agents/geo/* y /admin/ai-agents/guardrails
// ============================================================

import type { Guardrail, GuardrailsResponse } from "@/types/seo-agent"

export type { Guardrail, GuardrailsResponse }

export type GeoStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "auto_applied"

// ---------- Contenido de la guía ----------

export interface GeoGuideSection {
  heading: string
  body: string
  tip?: string | null
  image?: string | null
}

export interface GeoFaq {
  pregunta: string
  respuesta: string
}

export interface GeoInternalLink {
  label: string
  url_hint: string
}

export interface GeoGuideContent {
  slug: string
  title: string
  meta_title: string
  meta_description: string
  excerpt: string
  intro: string
  category?: string | null
  author?: string | null
  hero_image?: string | null
  sections: GeoGuideSection[]
  faq: GeoFaq[]
  /** Placeholders [[DATO:]]/[[FUENTE:]] que un humano debe completar antes de publicar. */
  data_needs: string[]
  internal_links: GeoInternalLink[]
  target_queries: string[]
  brand: string
}

// ---------- Proposal (item de la lista) ----------

export interface GeoProposal {
  proposal_id: string
  status: GeoStatus
  slug: string | null
  reason: string | null
  sales_channel_id: string | null
  brand: string | null
  guide: GeoGuideContent | null
  storefront_base: string
  public_url: string | null
}

export interface GeoProposalsResponse {
  proposals: GeoProposal[]
  count: number
  limit: number
  offset: number
}

// ---------- Generación ----------

export interface GenerateGeoInput {
  sales_channel_id?: string
  brand?: string
  topics?: string[]
  max_guides?: number
}

export interface GenerateGeoResult {
  ok: boolean
  created: number
  llm_used: boolean
  fallback_used: boolean
  cost_usd: number
}

/** Edits parciales que aceptan PATCH y approve (subset de GeoGuideContent). */
export type GeoGuideEdits = Partial<GeoGuideContent>

// ---------- Guardrail geo-content ----------

export interface GeoGuardrailValue {
  enabled: boolean
  auto_apply: boolean
  daily_cap: number
  monthly_usd_limit: number
  min_confidence: number
  model: string
}

export const DEFAULT_GEO_GUARDRAIL: GeoGuardrailValue = {
  enabled: true,
  auto_apply: false,
  daily_cap: 10,
  monthly_usd_limit: 30,
  min_confidence: 0.4,
  model: "claude-sonnet-4-20250514",
}

export const GEO_GUARDRAIL_KEY = "geo-content"
export const GEO_GUARDRAIL_DOMAIN = "geo_content"

export interface GeoGuardrailFieldDef {
  key: keyof GeoGuardrailValue
  label: string
  type: "boolean" | "number" | "text" | "percent"
  help?: string
  min?: number
  max?: number
  step?: number
}

export const GEO_GUARDRAIL_FIELDS: GeoGuardrailFieldDef[] = [
  {
    key: "enabled",
    label: "Agente encendido",
    type: "boolean",
    help: "Kill-switch: apagado, el cron de generación se saltea.",
  },
  {
    key: "auto_apply",
    label: "Auto-publicar",
    type: "boolean",
    help: "Las guías SIEMPRE deberían pasar por revisión: dejar apagado salvo excepción.",
  },
  { key: "daily_cap", label: "Tope diario de guías", type: "number", min: 0, max: 100 },
  {
    key: "monthly_usd_limit",
    label: "Presupuesto mensual (USD)",
    type: "number",
    min: 0,
    max: 10000,
  },
  {
    key: "min_confidence",
    label: "Confianza mínima (%)",
    type: "percent",
    min: 0,
    max: 100,
    step: 1,
    help: "Solo persiste guías con confianza ≥ este valor.",
  },
  { key: "model", label: "Modelo de IA", type: "text" },
]

// ---------- Badges ----------

export const GEO_STATUS_BADGE: Record<
  GeoStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  proposed: { label: "Pendiente", variant: "default" },
  approved: { label: "Aprobada", variant: "secondary" },
  applied: { label: "Publicada", variant: "secondary" },
  auto_applied: { label: "Auto-publicada", variant: "secondary" },
  rejected: { label: "Rechazada", variant: "outline" },
  failed: { label: "Falló", variant: "destructive" },
}
