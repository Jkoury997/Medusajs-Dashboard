// ============================================================
// SEO Agent — tipos del agente de IA de SEO
// Backend: /admin/ai-agents/seo/* y /admin/ai-agents/guardrails
// ============================================================

export type SeoProposalStatus =
  | "proposed"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "auto_applied"

export interface FaqItem {
  pregunta: string
  respuesta: string
}

/** Resultado de SEO generado por IA (output de la propuesta). */
export interface AiDescriptionResult {
  meta_title?: string
  meta_description?: string
  og_title?: string
  og_description?: string
  corta?: string
  media?: string
  larga?: string
  schema_description?: string
  alt_text?: string
  url_slug?: string
  keywords_primary?: string[]
  keywords_secondary?: string[]
  keywords_long_tail?: string[]
  faq?: FaqItem[]
  image_alts?: unknown[]
}

export interface ProposalDiffEntry {
  field: keyof AiDescriptionResult
  before: unknown
  after: unknown
  kind: "added" | "removed" | "changed" | "unchanged"
}

export interface SeoProposal {
  proposal_id: string
  product_id: string
  product_title: string
  sales_channel_id: string | null
  sales_channel_name: string | null
  status: SeoProposalStatus
  proposal: AiDescriptionResult
  current: AiDescriptionResult | null
  diff: ProposalDiffEntry[]
  created_at: string
  reviewed_at: string | null
  reviewer_id: string | null
  review_note: string | null
}

export interface ProposalsResponse {
  proposals: SeoProposal[]
  count: number
  limit: number
  offset: number
}

// ---------- Stats ----------

export interface SeoChannelCoverage {
  sales_channel_id: string | null
  sales_channel_name: string | null
  total_products: number
  with_ai_approved: number
  coverage_pct: number
}

export interface SeoDebtItem {
  product_id: string
  title: string
  handle: string
  sales_channel_id: string | null
  sales_channel_name: string | null
  ai_status: "none" | "pending_review" | "approved"
  description_length: number
  priority_score: number
  reason: string
}

export interface SeoPeriodMetrics {
  proposals_created: number
  approvals: number
  rejections: number
  cost_usd: number
}

export interface SeoStatsResponse {
  range: {
    key: string
    days: number
    from: string
    to: string
    previous_from: string
    previous_to: string
  }
  coverage: {
    total_products: number
    with_ai_approved: number
    with_ai_pending: number
    without_ai: number
    coverage_pct: number
  }
  current: SeoPeriodMetrics
  previous: SeoPeriodMetrics
  by_sales_channel: SeoChannelCoverage[]
  budget: {
    period: string
    usd_spent: number
    usd_limit: number
    utilization: number
    stopped: boolean
  }
  top_opportunities: SeoDebtItem[]
}

// ---------- Búsqueda de productos ----------

export interface ProductSearchItem {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  ai_status: "none" | "pending_review" | "approved"
  sales_channel_id: string | null
  sales_channel_name: string | null
}

// ---------- Guardrails (config) ----------

export interface Guardrail {
  id: string
  domain: string
  key: string
  value: Record<string, unknown>
  description: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export interface GuardrailsResponse {
  guardrails: Guardrail[]
}

/** Definición declarativa de un campo editable de guardrail. */
export interface GuardrailFieldDef {
  key: string
  label: string
  type: "boolean" | "number" | "text" | "percent"
  help?: string
  min?: number
  max?: number
  step?: number
}

export interface SeoGuardrailConfig {
  key: string
  title: string
  description: string
  defaults: Record<string, unknown>
  fields: GuardrailFieldDef[]
}

/** Config declarativa de los 2 guardrails del agente SEO. */
export const SEO_GUARDRAILS: SeoGuardrailConfig[] = [
  {
    key: "seo-bulk-regen",
    title: "SEO masivo (productos)",
    description:
      "Cron de regeneración de SEO de productos + auto-apply. Si auto_apply está activo, el SEO de productos nuevos se genera y aplica solo.",
    defaults: {
      enabled: true,
      auto_apply: true,
      daily_cap: 30,
      monthly_usd_limit: 50,
      min_priority_score: 30,
      model: "claude-haiku-4-5-20251001",
      alts_backfill_enabled: false,
      alts_backfill_cap: 10,
    },
    fields: [
      { key: "enabled", label: "Agente encendido", type: "boolean" },
      {
        key: "auto_apply",
        label: "Auto-aplicar",
        type: "boolean",
        help: "Si está apagado, las propuestas quedan en cola para revisión manual.",
      },
      { key: "daily_cap", label: "Tope diario de productos", type: "number", min: 0, max: 1000 },
      { key: "monthly_usd_limit", label: "Presupuesto mensual (USD)", type: "number", min: 0, max: 10000 },
      {
        key: "min_priority_score",
        label: "Score mínimo de prioridad",
        type: "number",
        min: 0,
        max: 100,
        help: "Solo procesa productos con prioridad ≥ este valor.",
      },
      { key: "model", label: "Modelo de IA", type: "text" },
      { key: "alts_backfill_enabled", label: "Backfill de alt texts", type: "boolean" },
      { key: "alts_backfill_cap", label: "Tope diario de backfill", type: "number", min: 0, max: 1000 },
    ],
  },
  {
    key: "seo-growth",
    title: "SEO Growth (mejora continua)",
    description:
      "Cruza Search Console + synonyms vs catálogo y propone synonyms / regeneración de meta / boosts de ranking.",
    defaults: {
      enabled: true,
      auto_apply: false,
      daily_cap: 20,
      monthly_usd_limit: 30,
      min_confidence: 0.4,
      model: "claude-sonnet-4-20250514",
    },
    fields: [
      { key: "enabled", label: "Agente encendido", type: "boolean" },
      {
        key: "auto_apply",
        label: "Auto-aplicar",
        type: "boolean",
        help: "Apagado = shadow mode: todo queda en la cola para aprobación.",
      },
      { key: "daily_cap", label: "Acciones por corrida", type: "number", min: 0, max: 1000 },
      { key: "monthly_usd_limit", label: "Presupuesto mensual (USD)", type: "number", min: 0, max: 10000 },
      {
        key: "min_confidence",
        label: "Confianza mínima (%)",
        type: "percent",
        min: 0,
        max: 100,
        step: 1,
      },
      { key: "model", label: "Modelo de IA", type: "text" },
    ],
  },
]

export const SEO_FIELD_LABELS: Record<string, string> = {
  meta_title: "Meta título",
  meta_description: "Meta descripción",
  og_title: "OG título",
  og_description: "OG descripción",
  corta: "Descripción corta",
  media: "Descripción media",
  larga: "Descripción larga",
  schema_description: "Schema description",
  alt_text: "Alt text principal",
  url_slug: "URL slug",
  keywords_primary: "Keywords primarias",
  keywords_secondary: "Keywords secundarias",
  keywords_long_tail: "Keywords long-tail",
  faq: "FAQ",
  image_alts: "Alt texts de galería",
}
