// Tipos para la API de Email Marketing — Carritos Abandonados

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
  discount_percentage: number
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

export interface EmailGlobalConfig {
  enabled: boolean
  discount_enabled: boolean
  discount_percentage: number
  source: string
}

export interface EmailGroupConfig {
  config_type: string
  group_name: string
  enabled: boolean
  discount_enabled: boolean
  discount_percentage: number
  updated_at: string
}

export interface EmailConfigAll {
  global: EmailGlobalConfig
  groups: EmailGroupConfig[]
}

export interface ProcessResult {
  success: boolean
  detected: number
  email1_sent: number
  email2_sent: number
}

export interface ForceSendResult {
  success: boolean
  resend_id: string
  email_type: string
  cart_id: string
}
