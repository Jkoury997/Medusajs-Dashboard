// Tipos para la API de Picking Ecommerce — Marcela Koury

// ============================================================
// STATS
// ============================================================

export interface PickingPerformanceStats {
  success: boolean
  global: {
    sessionsCompleted: number
    sessionsCancelled: number
    sessionsInProgress: number
    avgDurationSeconds: number
    totalDurationSeconds: number
    totalItemsPicked: number
    totalItemsRequired: number
    pickAccuracy: number
    avgItemsPerOrder: number
    avgSecondsPerItem: number
    fastestPickSeconds: number
    slowestPickSeconds: number
  }
  perPicker: Array<{
    userId: string
    userName: string
    completedOrders: number
    cancelledOrders: number
    totalOrders: number
    cancelRate: number
    totalItemsPicked: number
    accuracy: number
    avgDurationSeconds: number
    avgSecondsPerItem: number
    firstPickAt: string | null
    lastPickAt: string | null
  }>
  today: {
    completed: number
    cancelled: number
    inProgress: number
    itemsPicked: number
  }
}

export interface OrderStats {
  success: boolean
  orders: {
    totalPaid: number
    byFulfillmentStatus: Record<string, number>
    byShippingMethod: Record<string, number>
    pendingPicking: number
    readyToShip: number
    shipped: number
    delivered: number
  }
}

export interface FaltantesStats {
  success: boolean
  global: {
    totalMissing: number
    totalSessions: number
    sessionsWithMissing: number
    missingRate: number
  }
  today: {
    totalMissing: number
    sessionsWithMissing: number
  }
  productRanking: Array<{
    sku: string
    barcode: string
    variantId: string
    totalMissing: number
    occurrences: number
    orderCount: number
  }>
  perPicker: Array<{
    userId: string
    userName: string
    totalMissing: number
    ordersWithMissing: number
  }>
  dailyTrend: Array<{
    date: string
    totalMissing: number
    sessions: number
    sessionsWithMissing: number
  }>
}

export interface ActivityStats {
  success: boolean
  audit: {
    totalActions: number
    byActionType: Record<string, number>
    recentActions: Array<{
      _id: string
      action: string
      userName: string
      orderId?: string
      orderDisplayId?: number
      details?: string
      createdAt: string
    }>
  }
  deliveries: {
    totalDeliveries: number
    byStore: Array<{ storeId: string; storeName: string; count: number }>
    recentDeliveries: Array<{
      _id: string
      orderId: string
      orderDisplayId: number
      storeName: string
      deliveredByName: string
      deliveredAt: string
    }>
  }
  users: {
    totalActive: number
    pickers: number
    storeUsers: number
  }
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
