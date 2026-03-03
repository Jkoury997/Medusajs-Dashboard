// Tipos para el sistema de Campañas Manuales de Email — Marcela Koury

// --- Campaign Status ---

export type ManualCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "paused"
  | "cancelled"

// --- Segments ---

export type SegmentType =
  | "contact_all"
  | "contact_group"
  | "contact_tag"
  | "contact_source"
  | "contact_engaged"
  | "contact_not_engaged"
  | "contact_added_days"
  | "contact_not_added_days"
  | "contact_birthday_month"
  | "contact_birthday_today"
  | "contact_has_phone"
  | "contact_no_phone"
  | "contact_not_emailed_days"
  | "contact_custom_field"
  | "contact_email_count_gte"
  | "all_customers"
  | "customer_group"
  | "has_purchased"
  | "not_purchased"
  | "email_engaged"
  | "email_not_engaged"
  | "subscriber"

export type SegmentMatchType = "all" | "any"

export interface SegmentRule {
  type: SegmentType
  value?: string
  days?: number
  engagement_type?: "opened" | "clicked"
}

export interface SegmentConfig {
  rules: SegmentRule[]
  match: SegmentMatchType
  segment_id?: string | null
}

// --- Content Sections ---

export type ContentSection =
  | { type: "text"; html: string }
  | { type: "image"; src: string; alt?: string; href?: string; width?: "full" | "medium" | "small" }
  | { type: "button"; text: string; url: string; backgroundColor?: string }
  | { type: "divider" }
  | { type: "spacer"; height?: number }

// --- Content ---

export interface ManualCampaignContent {
  subject?: string
  preview_text?: string
  heading?: string
  body_text?: string
  body_sections?: ContentSection[]
  button_text?: string
  button_url?: string
  banner_gradient?: string
  footer_text?: string
  featured_product_ids?: string[]
  include_personalized_products?: boolean
}

// --- Media ---

export interface MediaItem {
  id: string
  filename: string
  content_type: string
  size: number
  url: string
  created_at: string
}

// --- Discount ---

export interface ManualCampaignDiscount {
  enabled: boolean
  type: "percentage" | "fixed"
  value: number
  expires_hours: number
  single_code: boolean
  shared_code?: string | null
  shared_promotion_id?: string | null
}

// --- Campaign (matches backend response) ---

export interface ManualCampaign {
  _id: string
  name: string
  template_type?: "standard" | "template"
  status: ManualCampaignStatus
  segment: SegmentConfig
  segment_id?: string | null
  estimated_recipients: number
  content: ManualCampaignContent
  discount: ManualCampaignDiscount | null
  scheduled_at?: string | null
  sending_started_at?: string | null
  sending_completed_at?: string | null
  total_recipients: number
  total_sent: number
  total_failed: number
  total_skipped: number
  ai_generated: boolean
  ai_tokens_used: number
  ai_model?: string
  created_at: string
  updated_at: string
  quick_stats?: {
    open_rate: string
    click_rate: string
  }
}

export interface ManualCampaignListResponse {
  campaigns: ManualCampaign[]
  total: number
  limit: number
  offset: number
}

// --- Create / Update ---

export interface CreateCampaignData {
  name: string
  template_type?: "standard" | "template"
  segment: SegmentConfig
  segment_id?: string | null
  content?: ManualCampaignContent
  discount?: ManualCampaignDiscount | null
}

export type UpdateCampaignData = Partial<CreateCampaignData>

// --- Actions ---

export interface SendCampaignData {
  send_at?: string
}

export interface TestSendData {
  email: string
}

// --- Audience Preview ---

export interface AudiencePreviewResponse {
  count: number
  by_rule?: Array<{
    type: string
    count: number
  }>
  sample: Array<{
    email: string
    customer_name?: string
    customer_group?: string
  }>
  /** @deprecated Use sample instead */
  samples?: Array<{
    email: string
    name?: string
    group?: string
  }>
}

// --- Email Preview ---

export interface EmailPreviewResponse {
  html: string
  subject: string
}

// --- AI Content ---

export interface GenerateContentData {
  theme: string
  tone: string
}

export interface GenerateContentResponse {
  subject: string
  preview_text: string
  heading: string
  body_text: string
  button_text: string
  featured_product_ids: string[]
}

// --- AI Template Content ---

export interface GenerateTemplateContentData {
  theme: string
  tone?: string
}

export interface GenerateTemplateContentResponse {
  subject: string
  heading: string
  button_text: string
  footer_text: string
  body_sections: ContentSection[]
  tokens_used: number
  model: string
}

// --- Segment Estimation ---

export interface SegmentEstimateData {
  rules: SegmentRule[]
  match: SegmentMatchType
}

export interface SegmentEstimateResponse {
  estimated_count: number
}

export interface SegmentGroup {
  id: string
  name: string
}

// --- Stats ---

export interface ManualCampaignStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  delivery_rate: string
  open_rate: string
  click_rate: string
  bounce_rate: string
}

// --- Recipients ---

export interface CampaignRecipient {
  email: string
  name?: string
  group?: string
  sent_at?: string | null
  delivered_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  bounced: boolean
  coupon_code?: string
}

export interface CampaignRecipientsResponse {
  recipients: CampaignRecipient[]
  total: number
  page: number
  limit: number
}

// --- List Filters ---

export interface CampaignListFilters {
  status?: ManualCampaignStatus
  limit?: number
  offset?: number
}

// --- Content Presets ---

export interface ContentPreset {
  _id: string
  name: string
  description: string
  content: ManualCampaignContent
  discount: ManualCampaignDiscount | null
  created_at: string
  updated_at: string
}

// --- Aggregated Stats ---

export interface AggregatedStatsResponse {
  total_campaigns: number
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  avg_open_rate: string
  avg_click_rate: string
  avg_bounce_rate: string
}

// --- Contact Groups (local campaign endpoint) ---

export interface ContactGroupLocal {
  id: string
  name: string
  count?: number
}

// --- Contact Tags (local campaign endpoint) ---

export interface ContactTagsResponse {
  tags: string[]
}

// --- Media List Response ---

export interface MediaListResponse {
  media: MediaItem[]
  total: number
}

// --- Product (for product picker) ---

export interface ProductSearchResult {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  category: string
  collection: string
  price: number
}
