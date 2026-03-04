// Tipos para la API de Email Marketing — Marcela Koury

// --- Discount Type ---

export type DiscountType = "percentage" | "fixed"

// --- AI Tone ---

export type AiTone = "warm" | "urgent" | "exclusive" | "professional" | "casual"

// --- Abandoned Cart Stats ---

export interface AbandonedCartEngagement {
  email_1_delivered: number
  email_1_opened: number
  email_1_clicked: number
  email_1_bounced: number
  email_1_open_rate: string
  email_1_click_rate: string
  email_2_delivered: number
  email_2_opened: number
  email_2_clicked: number
  email_2_bounced: number
  email_2_open_rate: string
  email_2_click_rate: string
}

export interface AbandonedCartGroupStats {
  group: string
  total: number
  recovered: number
  recovery_rate: string
  email_1_sent: number
  email_2_sent: number
  with_coupon: number
  email_1_opened: number
  email_1_clicked: number
  email_2_opened: number
  email_2_clicked: number
}

export interface AbandonedCartStats {
  total: number
  pending_email_1: number
  pending_email_2: number
  email_1_sent: number
  email_2_sent: number
  recovered: number
  recovery_rate: string
  with_coupon: number
  engagement: AbandonedCartEngagement
  by_group: AbandonedCartGroupStats[]
}

// --- Abandoned Cart Records ---

export interface AbandonedCartRecord {
  _id: string
  cart_id: string
  customer_id: string
  email: string
  customer_name: string
  email_1_sent_at: string | null
  email_2_sent_at: string | null
  coupon_code: string | null
  promotion_id: string | null
  abandoned_at: string
  checkout_step: string
  cart_total: number // en pesos (ARS)
  items_count: number
  recovered: boolean
  recovered_at: string | null
  customer_group: string
  customer_group_id: string
  discount_percentage: number | null
  discount_type: DiscountType | null
  resend_email_1_id: string | null
  resend_email_2_id: string | null
  email_1_delivered_at: string | null
  email_1_opened_at: string | null
  email_1_clicked_at: string | null
  email_2_delivered_at: string | null
  email_2_opened_at: string | null
  email_2_clicked_at: string | null
  email_1_bounced: boolean
  email_2_bounced: boolean
  has_preview_1: boolean
  has_preview_2: boolean
  created_at: string
  updated_at: string
}

export interface AbandonedCartList {
  records: AbandonedCartRecord[]
  total: number
  limit: number
  offset: number
}

export interface AbandonedCartListFilters {
  recovered?: "true" | "false"
  email_1?: "true" | "false"
  email_2?: "true" | "false"
  customer_group?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

// --- Config ---

export interface EmailGlobalConfig {
  _id?: string
  config_type?: string
  enabled: boolean
  discount_enabled: boolean
  discount_percentage: number
  discount_type: DiscountType
  discount_min_percentage?: number | null
  discount_min_fixed?: number | null
  discount_max_percentage?: number | null
  discount_max_fixed?: number | null
  source?: string
  updated_at?: string
}

export interface EmailGroupConfig {
  _id?: string
  config_type: string
  group_name: string
  group_id?: string
  enabled: boolean
  discount_enabled: boolean
  discount_percentage: number
  discount_type: DiscountType
  discount_min_percentage?: number | null
  discount_min_fixed?: number | null
  discount_max_percentage?: number | null
  discount_max_fixed?: number | null
  updated_at: string
}

export interface EmailConfigAll {
  global: EmailGlobalConfig
  groups: EmailGroupConfig[]
}

export interface EmailConfigUpdateData {
  enabled?: boolean
  discount_enabled?: boolean
  discount_percentage?: number
  discount_type?: DiscountType
  discount_min_percentage?: number | null
  discount_min_fixed?: number | null
  discount_max_percentage?: number | null
  discount_max_fixed?: number | null
  group_id?: string
  campaigns_enabled?: Partial<CampaignsEnabledMap>
  timings?: Partial<CampaignTimings>
  frequency_cap_per_week?: number
  ai_enabled?: boolean
  ai_model?: string
  ai_model_recommendations?: string
  ai_tone?: AiTone
  newsletter_cron_enabled?: boolean
  newsletter_cron_expression?: string
  newsletter_default_theme?: string
}

// --- Process & Force Send ---

export interface ProcessResult {
  success: boolean
  new_carts_detected: number
  reminders_sent: number
  coupons_sent: number
  recovered: number
  errors: number
}

export interface ForceSendResult {
  success: boolean
  email_type: string
  email: string
  resend_id: string
}

export interface DeleteCartResult {
  success: boolean
  deleted: string
}

// --- Email Templates ---

export type EmailTemplateType =
  | "reminder"
  | "coupon"
  | "post_purchase"
  | "welcome_1"
  | "welcome_2"
  | "welcome_3"
  | "browse_abandonment"
  | "newsletter"
  | "win_back"

export interface EmailTemplateFields {
  subject: string
  heading: string
  body_text: string
  button_text: string
  banner_gradient: string
  footer_text: string
  validity_text: string
}

export interface EmailTemplateResolved extends EmailTemplateFields {
  source: "group_db" | "default_db" | "hardcoded"
}

export interface EmailTemplateListResponse {
  templates: Array<
    EmailTemplateFields & {
      template_type: EmailTemplateType
      group_name?: string | null
      source: string
      created_at?: string
      updated_at?: string
    }
  >
  defaults?: Record<EmailTemplateType, EmailTemplateFields>
}

// --- Campaigns (AI) ---

export type CampaignType =
  | "post_purchase"
  | "welcome_1"
  | "welcome_2"
  | "welcome_3"
  | "browse_abandonment"
  | "newsletter"
  | "win_back"

export interface CampaignTypeStats {
  campaign_type: CampaignType
  total: number
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  open_rate: string
  click_rate: string
  with_ai: number
  avg_ai_tokens: number | null
}

export interface CampaignStats {
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
  customer_id: string
  email: string
  customer_name: string | null
  customer_group: string | null
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  clicked_at: string | null
  bounced: boolean
  ai_subject: string | null
  ai_recommendations: string[]
  ai_tokens_used: number | null
  coupon_code: string | null
  trigger_data: Record<string, unknown>
  created_at: string
  has_preview: boolean
}

export interface CampaignRecentResponse {
  campaign_type: CampaignType
  count: number
  records: CampaignEmailRecord[]
}

// --- Health Check ---

export interface HealthCheckResponse {
  status: string
  mongo: string
  service: string
  abandoned_cart_enabled: boolean
  discount_enabled: boolean
  ai_enabled: boolean
  campaigns_enabled: boolean
  timestamp: string
}

// --- Campaign Config ---

export interface CampaignTimings {
  post_purchase_min_hours: number
  post_purchase_max_hours: number
  welcome_1_min_minutes: number
  welcome_2_min_hours: number
  welcome_3_min_days: number
  browse_min_views: number
  browse_wait_hours: number
  browse_lookback_hours: number
  abandoned_cart_email1_min_hours: number
  abandoned_cart_email1_max_hours: number
  abandoned_cart_email2_min_hours: number
  winback_inactivity_days: number
  winback_cooldown_days: number
}

export interface CampaignsEnabledMap {
  post_purchase: boolean
  welcome_1: boolean
  welcome_2: boolean
  welcome_3: boolean
  browse_abandonment: boolean
  newsletter: boolean
  win_back: boolean
}

export interface CampaignEffectiveGlobal {
  campaigns_enabled: CampaignsEnabledMap
  timings: CampaignTimings
  frequency_cap_per_week: number
  ai_enabled: boolean
  ai_model: string
  ai_model_recommendations: string
  ai_tone: AiTone
  discount_enabled: boolean
  discount_percentage: number
  discount_type: DiscountType
  discount_min_percentage: number | null
  discount_min_fixed: number | null
  discount_max_percentage: number | null
  discount_max_fixed: number | null
  newsletter_cron_enabled: boolean
  newsletter_cron_expression: string
  newsletter_default_theme: string
}

export interface CampaignConfigResponse {
  effective_global: CampaignEffectiveGlobal
  raw: {
    global: Record<string, unknown>
    groups: Record<string, unknown>[]
  }
}

// --- Campaign Process ---

export interface CampaignProcessResponse {
  success: boolean
  post_purchase: number
  welcome: {
    w1: number
    w2: number
    w3: number
  }
  browse_abandonment: number
  win_back: number
  elapsed_seconds: number
}

// --- Newsletter ---

export interface NewsletterSendResult {
  success: boolean
  sent: number
  errors: number
}

export interface NewsletterScheduleResult {
  success: boolean
  enabled: boolean
  cron_expression: string
}

// --- Campaign Force Send ---

export interface CampaignForceSendResponse {
  success: boolean
  campaign_type: CampaignType
  customer_id: string
  email: string | null
  resend_id: string | null
  error?: string
}
