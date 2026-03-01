// ============================================================
// STATS
// ============================================================

export interface ResellerDashboardStats {
  total_resellers: number
  active_resellers: number
  pending_resellers: number
  suspended_resellers: number
  by_type: {
    type_id: string
    type_name: string
    count: number
    active?: number
    pending?: number
    suspended?: number
  }[]
  total_sales_amount: number
  total_orders: number
  total_commissions_earned: number
  total_commissions_pending: number
  total_commissions_paid: number
  total_withdrawals_pending: number
  total_withdrawals_pending_amount: number
  total_customers: number
  active_customers: number
  inactive_customers: number
  currency_code: string
}

// ============================================================
// RESELLER TYPES
// ============================================================

export interface ResellerType {
  id: string
  name: string
  display_name: string
  description: string
  requires_invitation: boolean
  target_customer_type: "consumer" | "wholesale"
  default_commission_percentage: number
  default_customer_discount_percentage: number
  has_wholesale_prices: boolean
  is_active: boolean
  priority: number
}

// ============================================================
// RESELLERS
// ============================================================

export type ResellerStatus = "pending" | "active" | "suspended" | "rejected"

export interface Reseller {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  referral_code: string
  status: ResellerStatus
  reseller_type_id: string
  reseller_type?: {
    id: string
    name: string
    display_name: string
    default_commission_percentage: number
  }
  custom_commission_percentage: number | null
  custom_customer_discount_percentage: number | null
  total_sales_amount: number
  total_commissions_earned: number
  total_commissions_paid: number
  pending_balance: number
  total_orders: number
  total_customers: number
  has_signed_contract: boolean
  has_monotributo_cert: boolean
  created_at: string
  updated_at: string
}

export interface ResellerListResponse {
  resellers: Reseller[]
  count: number
  limit: number
  offset: number
}

export interface ResellerFilters {
  status?: ResellerStatus
  reseller_type_id?: string
  limit?: number
  offset?: number
}

// ============================================================
// RESELLER DETAIL (customers & commissions)
// ============================================================

export interface ResellerCustomer {
  id: string
  email: string
  first_name: string
  last_name: string
  total_orders: number
  total_spent: number
  created_at: string
}

export interface ResellerCommission {
  id: string
  order_id: string
  order_display_id?: string
  sale_amount: number
  commission_percentage: number
  commission_amount: number
  status: string
  currency_code: string
  created_at: string
}

// ============================================================
// WITHDRAWALS
// ============================================================

export type WithdrawalStatus = "pending" | "approved" | "paid" | "rejected" | "cancelled"

export interface WithdrawalRequest {
  id: string
  reseller_id: string
  reseller?: {
    id: string
    email: string
    first_name: string
    last_name: string
    phone?: string
    bank_account_configured?: boolean
    bank_account_holder?: string | null
    bank_name?: string | null
    bank_cbu?: string | null
  }
  requested_amount: number
  currency_code: string
  status: WithdrawalStatus
  payment_method: string | null
  payment_reference: string | null
  payment_notes: string | null
  reseller_notes: string | null
  is_first_withdrawal: boolean
  invoice_document_id: string | null
  created_at: string
  updated_at: string
}

export interface WithdrawalListResponse {
  withdrawals: WithdrawalRequest[]
  count: number
  limit: number
  offset: number
}

export interface WithdrawalFilters {
  status?: WithdrawalStatus
  limit?: number
  offset?: number
}

// ============================================================
// FRAUD ALERTS
// ============================================================

export type FraudSeverity = "low" | "medium" | "high" | "critical"
export type FraudAlertStatus = "new" | "investigating" | "resolved" | "dismissed"

export interface FraudAlert {
  id: string
  reseller_id: string
  alert_type: string
  severity: FraudSeverity
  status: FraudAlertStatus
  description: string
  evidence: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface FraudAlertListResponse {
  fraud_alerts: FraudAlert[]
  count: number
  stats: {
    total_active: number
    critical: number
    high: number
    medium: number
    low: number
  }
  limit: number
  offset: number
}

export interface FraudAlertFilters {
  status?: string
  severity?: string
  limit?: number
  offset?: number
}

// ============================================================
// VOUCHERS
// ============================================================

export type VoucherStatus = "active" | "partially_used" | "depleted" | "expired" | "cancelled"

export interface Voucher {
  id: string
  reseller_id: string
  code: string
  original_value: number
  remaining_value: number
  currency_code: string
  status: VoucherStatus
  times_used: number
  expires_at: string
  last_used_at: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface VoucherListResponse {
  vouchers: Voucher[]
  count: number
  limit: number
  offset: number
}

export interface VoucherFilters {
  status?: VoucherStatus
  reseller_id?: string
  limit?: number
  offset?: number
}

// ============================================================
// INVITATION CODES
// ============================================================

export interface InvitationCode {
  id: string
  code: string
  reseller_type_id: string
  reseller_type?: { display_name: string }
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface InvitationCodeListResponse {
  invitation_codes: InvitationCode[]
  count: number
  limit: number
  offset: number
}

export interface InvitationCodeFilters {
  reseller_type_id?: string
  limit?: number
  offset?: number
}
