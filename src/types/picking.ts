// Tipos para la API de Picking Ecommerce — Marcela Koury

// ============================================================
// STATS
// ============================================================

export interface PickingPerformanceStats {
  global: {
    total_orders_picked: number
    avg_pick_time_seconds: number
    avg_items_per_order: number
    total_items_picked: number
  }
  by_picker: Array<{
    user_id: string
    user_name: string
    orders_picked: number
    avg_pick_time_seconds: number
    items_picked: number
  }>
  today: {
    orders_picked: number
    items_picked: number
    avg_pick_time_seconds: number
  }
}

export interface OrderStats {
  by_fulfillment: Record<string, number>
  by_shipping_method: Record<string, number>
  pending: number
  total: number
}

export interface FaltantesStats {
  ranking_products: Array<{
    product_id: string
    product_title: string
    sku: string
    times_missing: number
  }>
  by_picker: Array<{
    user_id: string
    user_name: string
    total_faltantes: number
  }>
  daily_trend: Array<{
    date: string
    count: number
  }>
  total_faltantes: number
}

export interface ActivityStats {
  audit_entries: number
  deliveries: number
  active_users: number
  by_action: Record<string, number>
  recent_activity: Array<{
    action: string
    user_name: string
    order_id: string
    timestamp: string
    details?: string
  }>
}

// ============================================================
// AUDIT
// ============================================================

export interface AuditEntry {
  _id: string
  action: string
  user_id: string
  user_name: string
  order_id: string
  order_display_id?: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface AuditListResponse {
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}

export interface AuditFilters {
  limit?: number
  offset?: number
  action?: string
  userName?: string
  orderId?: string
  from?: string
  to?: string
}

export interface PickingHistoryEntry {
  _id: string
  user_id: string
  user_name: string
  order_id: string
  order_display_id?: string
  items_picked: number
  items_missing: number
  pick_time_seconds: number
  completed_at: string
  started_at: string
}

export interface PickingHistoryResponse {
  entries: PickingHistoryEntry[]
  total: number
  limit: number
  offset: number
}

export interface PickingHistoryFilters {
  limit?: number
  offset?: number
  userId?: string
  from?: string
  to?: string
}

export interface OrdersCountResponse {
  count: number
}

// ============================================================
// USERS
// ============================================================

export type PickingUserRole = "picker" | "store" | "admin"

export interface PickingUser {
  _id: string
  name: string
  pin: string
  role: PickingUserRole
  active: boolean
  store_id?: string
  store_name?: string
  created_at: string
  updated_at: string
}

export interface PickingUserWithStats extends PickingUser {
  stats?: {
    orders_picked: number
    avg_pick_time_seconds: number
    items_picked: number
    faltantes: number
  }
}

export interface CreatePickingUserData {
  name: string
  pin: string
  role: PickingUserRole
  storeId?: string
  storeName?: string
}

export interface UpdatePickingUserData {
  name?: string
  pin?: string
  active?: boolean
  role?: PickingUserRole
  storeId?: string
  storeName?: string
}

// ============================================================
// GESTION
// ============================================================

export type GestionTab = "por-preparar" | "faltantes" | "por-enviar" | "enviados"

export interface GestionOrder {
  order_id: string
  order_display_id: string
  customer_name: string
  customer_email?: string
  items_count: number
  total?: number
  shipping_method?: string
  status: string
  fulfillment_status?: string
  picked_at?: string
  packed_at?: string
  shipped_at?: string
  delivered_at?: string
  created_at: string
  faltantes_count?: number
  faltantes_resolved?: boolean
}

export interface GestionListResponse {
  orders: GestionOrder[]
  counts: Record<GestionTab, number>
  total: number
}

export interface ShipOrderData {
  orderId: string
  orderDisplayId?: string
}

export interface DeliverOrderData {
  orderId: string
  orderDisplayId?: string
}

export interface ResolveFaltanteData {
  orderId: string
  resolution: string
  notes?: string
}

export interface CreateVoucherData {
  orderId: string
  value: number
  notes?: string
}

export interface FaltanteItem {
  line_item_id: string
  product_title: string
  sku: string
  barcode?: string
  quantity_missing: number
  quantity_received: number
}

export interface FaltantesReceiveResponse {
  items: FaltanteItem[]
  order_id: string
}

export interface ReceiveFaltanteData {
  orderId: string
  barcode?: string
  sku?: string
  lineItemId?: string
}

// ============================================================
// STORES
// ============================================================

export interface PickingStore {
  _id: string
  name: string
  address?: string
  created_at: string
}

export interface CreateStoreData {
  name: string
  address?: string
}
