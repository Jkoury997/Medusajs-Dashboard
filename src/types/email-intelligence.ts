// ============================================================
// Email Intelligence — tipos del agente de IA de campañas de email
// Backend: /admin/ai-agents/email-intelligence/*
// ============================================================

export type EmailCampaignKind =
  | "cart_recovery"
  | "browse_abandon"
  | "winback"
  | "price_drop"
  | "post_purchase_upsell"
  | "back_in_stock"

export type VariantStatus = "drafted" | "active" | "retired"

export type SendStatus = "queued" | "sent" | "failed" | "bounced" | "complained"

export interface VariantCounts {
  campaign_id: string
  active: number
  retired: number
  drafted: number
}

/** Override de habilitación por canal de venta (multi-marca). */
export type ChannelOverrides = Record<string, { enabled?: boolean }>

export interface EmailCampaign {
  id: string
  kind: EmailCampaignKind
  name: string
  enabled: boolean
  daily_cap_per_customer: number
  daily_cap_global: number
  min_sends_before_kill: number
  min_ctr_threshold: number
  target_active_variants: number
  trigger_config: Record<string, number> | null
  evolution_model: string | null
  overrides_by_channel: ChannelOverrides | null
  variant_counts: VariantCounts
  created_at: string
  updated_at: string
}

export interface CampaignsResponse {
  campaigns: EmailCampaign[]
}

/** Campos editables vía PATCH /campaigns/:id */
export interface EmailCampaignPatch {
  enabled?: boolean
  name?: string
  daily_cap_per_customer?: number
  daily_cap_global?: number
  min_sends_before_kill?: number
  min_ctr_threshold?: number
  target_active_variants?: number
  trigger_config?: Record<string, number> | null
  evolution_model?: string | null
  overrides_by_channel?: ChannelOverrides | null
}

// ---------- Overview / KPIs ----------

export interface OverviewTotals {
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

/**
 * % de cambio relativo vs el período anterior, por métrica. null = el período
 * anterior no tenía base (prev <= 0), por lo que no hay comparación.
 */
export type Deltas = Partial<Record<keyof OverviewTotals, number | null>>

export interface CampaignBreakdown {
  campaign_id: string
  kind: EmailCampaignKind
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
  deltas?: Deltas
}

/**
 * Bucket de funnel por segmento (marca/canal o grupo de cliente).
 * `key` es el id del segmento (o un sentinel como "__guest__"/"__none__");
 * `name` es el label legible.
 */
export interface SegmentRow {
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
  deltas?: Deltas
}

export interface Deliverability {
  processed: number
  sent: number
  queued: number
  failed: number
  bounced: number
  complained: number
  bounce_rate: number
  complaint_rate: number
  fail_rate: number
}

export interface OverviewResponse {
  range: { days: number; from: string; to: string }
  range_prev?: { from: string; to: string }
  totals: OverviewTotals
  totals_deltas?: Deltas
  deliverability?: Deliverability
  per_campaign: CampaignBreakdown[]
  by_sales_channel: SegmentRow[]
  by_customer_group: SegmentRow[]
}

// ---------- Serie temporal ----------

export interface TimeseriesPoint {
  date: string
  sends: number
  conversions: number
  revenue_ars: number
}

export interface TimeseriesResponse {
  range: { days: number; from: string; to: string }
  granularity: string
  points: TimeseriesPoint[]
}

// ---------- Alertas ----------

export type AlertSeverity = "info" | "warn" | "error" | "critical"

export interface EmailAlert {
  id: string
  kind: string
  severity: AlertSeverity
  message: string
  payload: unknown
  sales_channel_id: string | null
  notified_at: string | null
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

export interface AlertsResponse {
  alerts: EmailAlert[]
  count: number
  open_count: number
  limit: number
  offset: number
}

// ---------- Variantes ----------

export interface EmailVariant {
  id: string
  campaign_id: string
  label: string
  status: VariantStatus
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
  score_updated_at: string | null
  parent_variant_id: string | null
  generation_run_id: string | null
  ctr: number
  open_rate: number
  conv_rate: number
  created_at: string
  updated_at: string
}

export interface VariantsResponse {
  variants: EmailVariant[]
  count: number
  limit: number
  offset: number
}

export interface VariantPreviewResponse {
  /** HTML renderizado del email, o null si la campaña no tiene diseño. */
  html: string | null
  subject: string | null
  kind: string
  /** "last_send" = copy de un email real; "template" = copy guardado; "none"/"error". */
  source: "last_send" | "template" | "none" | "error"
}

// ---------- Envíos (sends log) ----------

export interface EmailSend {
  id: string
  campaign_id: string
  variant_id: string
  customer_id: string | null
  cart_id: string | null
  order_id: string | null
  email: string
  sales_channel_id: string | null
  status: SendStatus
  sent_at: string | null
  opened_at: string | null
  clicked_at: string | null
  converted_at: string | null
  conversion_order_id: string | null
  conversion_revenue_ars: number
  resend_id: string | null
  llm_cost_usd: number
  skip_reason: string | null
  composed_subject: string | null
  composed_headline: string | null
  composed_body: string | null
  created_at: string
}

export interface SendsResponse {
  sends: EmailSend[]
  count: number
  limit: number
  offset: number
}

// ---------- Sales channels (para overrides por marca) ----------

export interface SalesChannel {
  id: string
  name: string
  is_disabled?: boolean
}

// ---------- Metadata de presentación ----------

export const CAMPAIGN_KIND_LABELS: Record<EmailCampaignKind, string> = {
  cart_recovery: "Recuperación de carrito",
  browse_abandon: "Abandono de navegación",
  winback: "Reactivación (winback)",
  price_drop: "Bajó de precio",
  post_purchase_upsell: "Post-compra (upsell)",
  back_in_stock: "Volvió a stock",
}

export const CAMPAIGN_KIND_DESCRIPTIONS: Record<EmailCampaignKind, string> = {
  cart_recovery: "Carrito abandonado con productos sin comprar.",
  browse_abandon: "Vio varios productos pero no agregó nada al carrito.",
  winback: "Cliente inactivo que no compra hace tiempo.",
  price_drop: "Un producto que el cliente vio bajó de precio.",
  post_purchase_upsell: "Cross-sell luego de una compra reciente.",
  back_in_stock: "Producto agotado que volvió a tener stock.",
}

/** Labels legibles para las claves conocidas de trigger_config. */
export const TRIGGER_FIELD_LABELS: Record<string, string> = {
  abandoned_hours_min: "Horas mín. desde abandono",
  abandoned_hours_max: "Horas máx. desde abandono",
  min_views: "Vistas mínimas",
  lookback_days: "Días de ventana",
  send_after_days: "Enviar luego de (días)",
  inactive_days_min: "Días inactivo (mín.)",
  inactive_days_max: "Días inactivo (máx.)",
  min_delta_pct: "Baja de precio mín. (%)",
  viewed_lookback_days: "Visto en últimos (días)",
  post_purchase_days_min: "Días post-compra (mín.)",
  post_purchase_days_max: "Días post-compra (máx.)",
}
