// Tipos para el sistema de Contactos — Marcela Koury

// --- Subscription Status ---

export type SubscriptionStatus = "subscribed" | "unsubscribed"

export type ContactSource = "manual" | "csv_import" | "medusa_import" | "api"

export type ImportStatus = "processing" | "completed" | "failed"

// --- Address ---

export interface ContactAddress {
  street?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country?: string | null
}

// --- Contact Document ---

export interface ContactDocument {
  _id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  company?: string | null
  address?: ContactAddress | null
  notes?: string | null
  tags: string[]
  custom_fields?: Record<string, string>
  groups: string[]
  source: ContactSource
  medusa_customer_id?: string | null
  subscription_status: SubscriptionStatus
  unsubscribed_at?: string | null
  last_email_sent_at?: string | null
  last_email_opened_at?: string | null
  last_email_clicked_at?: string | null
  email_count: number
  created_at: string
  updated_at: string
}

// --- Contact Group Document ---

export interface ContactGroupDocument {
  _id: string
  name: string
  description: string
  color?: string | null
  contact_count: number
  created_at: string
  updated_at: string
}

// --- Contact Import Document ---

export interface ContactImportError {
  row: number
  email: string
  error: string
}

export interface ContactImportDocument {
  _id: string
  source: "csv" | "medusa"
  status: ImportStatus
  filename?: string | null
  total_rows: number
  imported: number
  updated: number
  skipped: number
  errors: ContactImportError[]
  target_group_ids: string[]
  tags: string[]
  started_at: string
  completed_at?: string | null
  created_at: string
}

// --- Filters ---

export interface ContactListFilters {
  group_id?: string
  tag?: string
  subscription_status?: SubscriptionStatus
  source?: ContactSource
  search?: string
  limit?: number
  offset?: number
}

// --- Create / Update Payloads ---

export interface CreateContactData {
  email: string
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  company?: string | null
  address?: ContactAddress | null
  notes?: string | null
  tags?: string[]
  custom_fields?: Record<string, string>
  groups?: string[]
  source?: ContactSource
  subscription_status?: SubscriptionStatus
}

export interface UpdateContactData {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  company?: string | null
  address?: ContactAddress | null
  notes?: string | null
  tags?: string[]
  custom_fields?: Record<string, string>
  groups?: string[]
  subscription_status?: SubscriptionStatus
}

export interface CreateGroupData {
  name: string
  description?: string
  color?: string | null
}

export interface UpdateGroupData {
  name?: string
  description?: string
  color?: string | null
}

// --- List Responses ---

export interface ContactListResponse {
  contacts: ContactDocument[]
  total: number
}

export interface ContactGroupListResponse {
  groups: ContactGroupDocument[]
  total: number
}

export interface TagsResponse {
  tags: string[]
}

export interface ImportHistoryResponse {
  imports: ContactImportDocument[]
}

// --- Bulk Responses ---

export interface BulkDeleteResponse {
  deleted: number
}

export interface BulkModifyResponse {
  modified: number
}

// --- Import Payloads ---

export interface MedusaImportData {
  group_ids?: string[]
  tags?: string[]
}
