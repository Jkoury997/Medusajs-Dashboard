// Tipos para el sistema de Segmentos Guardados — Marcela Koury

// --- Rule Types ---

export type SegmentRuleType =
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

export type EngagementType = "opened" | "clicked"

export interface SegmentRule {
  type: SegmentRuleType
  value?: string
  days?: number
  engagement_type?: EngagementType
}

// --- Segment Document ---

export interface SavedSegment {
  _id: string
  name: string
  description?: string
  rules: SegmentRule[]
  match: SegmentMatchType
  estimated_count: number
  last_estimated_at?: string
  created_at: string
  updated_at: string
}

// --- Create / Update Payloads ---

export interface CreateSegmentData {
  name: string
  description?: string
  rules: SegmentRule[]
  match: SegmentMatchType
}

export interface UpdateSegmentData {
  name?: string
  description?: string
  rules?: SegmentRule[]
  match?: SegmentMatchType
}

// --- Responses ---

export interface SegmentWithEstimate {
  segment: SavedSegment
  estimated_count: number
}

export interface SampleRecipient {
  email: string
  name?: string
}

export interface EstimateResponse {
  estimated_count: number
  sample_recipients: SampleRecipient[]
}

// --- Rule metadata for UI ---

export interface RuleTypeInfo {
  type: SegmentRuleType
  label: string
  description: string
  params: ("value" | "days" | "engagement_type")[]
  valueLabel?: string
  valuePlaceholder?: string
  valueOptions?: { value: string; label: string }[]
}

export const RULE_TYPES: RuleTypeInfo[] = [
  { type: "contact_all", label: "Todos los contactos", description: "Todos los contactos suscritos", params: [] },
  { type: "contact_group", label: "Grupo de contacto", description: "Pertenece a un grupo", params: ["value"], valueLabel: "Grupo", valuePlaceholder: "Nombre del grupo" },
  { type: "contact_tag", label: "Tag", description: "Tiene un tag específico", params: ["value"], valueLabel: "Tag", valuePlaceholder: "Nombre del tag" },
  { type: "contact_source", label: "Fuente", description: "Según origen del contacto", params: ["value"], valueLabel: "Fuente", valueOptions: [
    { value: "manual", label: "Manual" },
    { value: "csv_import", label: "CSV" },
    { value: "medusa_import", label: "Medusa" },
    { value: "api", label: "API" },
  ]},
  { type: "contact_engaged", label: "Interactuó", description: "Interactuó en últimos N días", params: ["days", "engagement_type"] },
  { type: "contact_not_engaged", label: "No interactuó", description: "No interactuó en últimos N días", params: ["days", "engagement_type"] },
  { type: "contact_added_days", label: "Agregado recientemente", description: "Agregado en los últimos N días", params: ["days"] },
  { type: "contact_not_added_days", label: "Antiguo", description: "Con más de N días de antigüedad", params: ["days"] },
  { type: "contact_birthday_month", label: "Cumpleaños en mes", description: "Cumpleaños en un mes específico", params: ["value"], valueLabel: "Mes", valueOptions: [
    { value: "1", label: "Enero" }, { value: "2", label: "Febrero" }, { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" }, { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
    { value: "7", label: "Julio" }, { value: "8", label: "Agosto" }, { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" }, { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
  ]},
  { type: "contact_birthday_today", label: "Cumpleaños hoy", description: "Contactos que cumplen años hoy", params: [] },
  { type: "contact_has_phone", label: "Tiene teléfono", description: "Contactos con teléfono registrado", params: [] },
  { type: "contact_no_phone", label: "Sin teléfono", description: "Contactos sin teléfono", params: [] },
  { type: "contact_not_emailed_days", label: "No recibió email", description: "No recibió email en N días", params: ["days"] },
  { type: "contact_custom_field", label: "Campo personalizado", description: "Campo custom con valor específico", params: ["value"], valueLabel: "Campo:Valor", valuePlaceholder: "campo:valor" },
  { type: "contact_email_count_gte", label: "Cantidad de emails >=", description: "Recibió al menos N emails", params: ["days"], },
  { type: "all_customers", label: "Todos los clientes (Medusa)", description: "Todos los clientes de Medusa", params: [] },
  { type: "customer_group", label: "Grupo Medusa", description: "Grupo de cliente en Medusa", params: ["value"], valueLabel: "Group ID", valuePlaceholder: "ID del grupo" },
  { type: "has_purchased", label: "Compró", description: "Realizó una compra", params: ["days"] },
  { type: "not_purchased", label: "No compró", description: "No realizó compras", params: ["days"] },
  { type: "email_engaged", label: "Interactuó email (Medusa)", description: "Interactuó con email de Medusa", params: ["days", "engagement_type"] },
  { type: "email_not_engaged", label: "No interactuó email (Medusa)", description: "No interactuó con email de Medusa", params: ["days", "engagement_type"] },
  { type: "subscriber", label: "Suscriptor newsletter", description: "Suscriptores de newsletter", params: [] },
]
