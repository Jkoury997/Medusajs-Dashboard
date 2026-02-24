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

export interface AudienceConfig {
  rules: SegmentRule[]
  match: SegmentMatchType
}

// --- Campaign ---

export interface ManualCampaign {
  id: string
  name: string
  subject: string
  status: ManualCampaignStatus
  audience: AudienceConfig
  template_type: string
  content?: {
    heading?: string
    body_text?: string
    button_text?: string
    banner_gradient?: string
    footer_text?: string
  }
  scheduled_at?: string | null
  sent_at?: string | null
  audience_count?: number
  created_at: string
  updated_at: string
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
  subject: string
  audience: AudienceConfig
  template_type: string
  content?: ManualCampaign["content"]
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
  samples: Array<{
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
  heading: string
  body_text: string
  button_text: string
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
