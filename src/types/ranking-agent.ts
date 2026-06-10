// ============================================================
// Ranking Dinámico IA — tipos del agente de ranking de Medusa
// Backend: /admin/ai-agents/ranking/* y /admin/ai-agents/guardrails
// (distinto del microservicio legacy en src/types/ranking.ts)
// ============================================================

import type { Guardrail, GuardrailsResponse } from "@/types/seo-agent"

export type { Guardrail, GuardrailsResponse }

export type RankingRange = "30d" | "90d"
export type RankingType = "general" | "personalized"
export type RankingEntityType = "category" | "collection"
export type RankingSegment = "bestseller" | "discoverable" | "new" | "rotating"

// ---------- Stats (/stats) ----------

export interface RankingStatsTotals {
  rankings_active: number
  rankings_personalized_active: number
  customers_with_personalized: number
  runs_30d: number
  runs_90d: number
  llm_cost_30d: number
  llm_cost_90d: number
  last_run_at: string | null
}

export interface RankingChannelStat {
  sales_channel_id: string
  rankings_count: number
  last_run_at: string | null
}

export interface RankingStatsResponse {
  totals: RankingStatsTotals
  by_channel: RankingChannelStat[]
  generated_at: string
}

// ---------- Performance / uplift (/performance) ----------

export interface RankingPerfTotals {
  clicks: number
  attributions_count: number
  unique_orders: number
  attributed_revenue_amount: number
  attributed_revenue_currency: string | null
  attributed_revenue_usd: number
  click_to_purchase_pct: number
  llm_cost_30d_usd: number
  roi_multiplier: number | null
  usd_ars_rate: number
  usd_ars_rate_type: string
}

export interface RankingPerfChannel {
  sales_channel_id: string
  attributions_count: number
  attributed_revenue_amount: number
  attributed_revenue_currency: string | null
  attributed_revenue_usd: number
  unique_orders: number
}

export type RankingPositionBucket = "1" | "2-5" | "6-10" | "11-20" | "21+"

export interface RankingPerfPosition {
  position_bucket: RankingPositionBucket
  attributions_count: number
  attributed_revenue_amount: number
}

export interface RankingPerfTopPerformer {
  product_id: string
  product_title: string | null
  attributions_count: number
  attributed_revenue_amount: number
  avg_position_at_click: number
}

export interface RankingPerformanceResponse {
  range: { key: string; days: number; from: string; to: string }
  totals: RankingPerfTotals
  by_channel: RankingPerfChannel[]
  by_position: RankingPerfPosition[]
  top_performers: RankingPerfTopPerformer[]
}

// ---------- Rankings activos (/rankings) ----------

export interface RankingSegmentEntry {
  product_id: string
  position: number
  segment: RankingSegment
  reason?: string | null
}

export interface RankingItem {
  id: string
  entity_id: string
  entity_type: RankingEntityType
  entity_name: string
  sales_channel_id: string
  customer_group_id: string | null
  type: RankingType
  customer_id: string | null
  product_ids: string[]
  segments: RankingSegmentEntry[] | null
  previous_rankings: string[][] | null
  total_products: number
  model_used: string | null
  prompt_tokens: number
  completion_tokens: number
  cost_usd: number
  generated_at: string
}

export interface RankingProductInfo {
  id: string
  title: string | null
  handle: string | null
  thumbnail: string | null
}

export interface RankingListResponse {
  rankings: RankingItem[]
  customer_groups_by_id: Record<string, { id: string; name: string | null }>
  products_by_id: Record<string, RankingProductInfo>
  count: number
  limit: number
  offset: number
}

export interface RankingListFilters {
  salesChannelId?: string
  customerGroupId?: string
  type?: RankingType | "all"
  entityType?: RankingEntityType | "all"
  limit?: number
}

// ---------- Runs (/runs) ----------

export interface RankingRun {
  id: string
  trigger: string
  combos_planned: number
  combos_processed: number
  combos_succeeded: number
  combos_failed: number
  rankings_generated: number
  customers_personalized: number
  llm_calls: number
  llm_failures: number
  llm_errors_sample: string[] | null
  fallback_usages: number
  tokens_in: number
  tokens_out: number
  usd_cost: number
  model_used: string | null
  errors_sample: string[] | null
  duration_ms: number
  started_at: string
  completed_at: string | null
}

export interface RankingRunsResponse {
  runs: RankingRun[]
  count: number
  limit: number
  offset: number
}

// ---------- Trigger (/trigger) ----------

export interface TriggerRankingInput {
  sales_channel_id?: string
  customer_group_id?: string | null
  entity_id?: string
  entity_type?: RankingEntityType
  model?: string
}

export interface TriggerRankingDryRun {
  ok: true
  dry_run: true
  scope_targets: number
  categories: number
  combos: number
  estimated_usd: number
  cost_per_combo_usd: number
}

export interface TriggerRankingStarted {
  ok: true
  dry_run: false
  ranking_run_id: string
  started: true
  combos_planned: number
  message: string
}

// ---------- Guardrail dynamic-ranking ----------

export interface RankingGuardrailValue {
  enabled: boolean
  monthly_usd_limit: number
  model: string
  max_products_per_batch: number
  max_personalized_customers: number
  lookback_days: number
  attribution_window_days: number
  enable_fallback_on_llm_failure: boolean
  excluded_customer_group_handles: string[]
}

/** Defaults del guardrail (espejo de DEFAULT_RANKING_GUARDRAIL en el backend). */
export const DEFAULT_RANKING_GUARDRAIL: RankingGuardrailValue = {
  enabled: true,
  monthly_usd_limit: 30,
  model: "claude-sonnet-4-20250514",
  max_products_per_batch: 80,
  max_personalized_customers: 15,
  lookback_days: 30,
  attribution_window_days: 7,
  enable_fallback_on_llm_failure: true,
  excluded_customer_group_handles: [
    "mayorista",
    "revendedora",
    "personal-interno",
    "mercado libre",
  ],
}

export const RANKING_GUARDRAIL_KEY = "dynamic-ranking"
export const RANKING_GUARDRAIL_DOMAIN = "global"

/** Definición declarativa de un campo editable del guardrail. */
export interface RankingGuardrailFieldDef {
  key: keyof RankingGuardrailValue
  label: string
  type: "boolean" | "number" | "text" | "list"
  help?: string
  min?: number
  max?: number
}

export const RANKING_GUARDRAIL_FIELDS: RankingGuardrailFieldDef[] = [
  {
    key: "enabled",
    label: "Agente encendido",
    type: "boolean",
    help: "Kill-switch. Apagado: el cron y el recompute manual quedan bloqueados; el storefront sirve el último ranking persistido.",
  },
  {
    key: "monthly_usd_limit",
    label: "Presupuesto mensual (USD)",
    type: "number",
    min: 0,
    max: 10000,
  },
  { key: "model", label: "Modelo de IA", type: "text" },
  {
    key: "max_products_per_batch",
    label: "Máx. productos por batch",
    type: "number",
    min: 1,
    max: 500,
  },
  {
    key: "max_personalized_customers",
    label: "Máx. clientes personalizados",
    type: "number",
    min: 0,
    max: 500,
  },
  {
    key: "lookback_days",
    label: "Ventana de señales (días)",
    type: "number",
    min: 1,
    max: 365,
    help: "Días hacia atrás de ventas/vistas/clicks que alimentan al modelo.",
  },
  {
    key: "attribution_window_days",
    label: "Ventana de atribución (días)",
    type: "number",
    min: 1,
    max: 90,
    help: "Tiempo máximo entre click y compra para atribuir revenue al ranking.",
  },
  {
    key: "enable_fallback_on_llm_failure",
    label: "Fallback si falla el LLM",
    type: "boolean",
    help: "Si el LLM falla, usa un orden heurístico en vez de cortar.",
  },
  {
    key: "excluded_customer_group_handles",
    label: "Grupos excluidos (handles)",
    type: "list",
    help: "Cohortes que NO reciben ranking personalizado (ej. mayorista, revendedora).",
  },
]

export const RANKING_SEGMENT_BADGE: Record<
  RankingSegment,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  bestseller: { label: "Bestseller", variant: "default" },
  discoverable: { label: "Descubrimiento", variant: "secondary" },
  new: { label: "Nuevo", variant: "outline" },
  rotating: { label: "Rotación", variant: "outline" },
}
