// ============================================================
// PHYSICAL RESELLER TYPES
// ============================================================

export type PhysicalResellerStatus = "pendiente" | "aprobada" | "rechazada"
export type PhysicalResellerType = "tienda_fisica" | "redes"
export type ResellerOrderStatus = "pagado" | "enviado" | "entregado"
export type ResellerSaleStatus = "pendiente" | "completada" | "cancelada"
export type SaleChannel = "tienda_fisica" | "whatsapp" | "instagram" | "facebook" | "otro"
export type SaleOrigin = "manual" | "whatsapp_locator"

// ---- Reseller ----

export interface PhysicalReseller {
  _id: string
  medusa_customer_id: string
  email: string
  business_name: string
  whatsapp: string
  type: PhysicalResellerType
  address: string | null
  location: {
    type: "Point"
    coordinates: [number, number]
  } | null
  approximate_zone: string
  social_media: {
    instagram?: string
    facebook?: string
    tiktok?: string
  }
  status: PhysicalResellerStatus
  active: boolean
  visible_on_map?: "stock" | "compras" | false
  created_at: string
  updated_at: string
}

export interface PhysicalResellerWithStats extends PhysicalReseller {
  stats: {
    inventory_items: number
    total_stock: number
    sales_this_month: number
    revenue_this_month: number
    total_orders: number
  }
}

export interface PhysicalResellerFilters {
  status?: PhysicalResellerStatus
  type?: PhysicalResellerType
  search?: string
  limit?: number
  offset?: number
}

// ---- Inventory ----

export interface ResellerInventoryItem {
  _id: string
  reseller_id: string
  variant_id: string
  product_id: string
  available_quantity: number
  custom_price: number | null
  active: boolean
  product_title?: string
  product_thumbnail?: string | null
  variant_title?: string
  suggested_price?: number | null
  created_at: string
  updated_at: string
}

// ---- Orders ----

export interface ResellerOrderItem {
  variant_id: string
  product_id: string
  quantity: number
  product_title: string
  variant_title: string
}

export interface ResellerOrder {
  _id: string
  reseller_id: string | PhysicalReseller
  medusa_order_id: string
  status: ResellerOrderStatus
  delivery_confirmed_date: string | null
  items: ResellerOrderItem[]
  created_at: string
  updated_at: string
  // Medusa enrichment fields (optional, returned by admin endpoint)
  display_id?: string | null
  payment_status?: string | null
  fulfillment_status?: string | null
  total?: number | null
  currency_code?: string | null
}

export interface ResellerOrderFilters {
  status?: ResellerOrderStatus
  reseller_id?: string
  limit?: number
  offset?: number
}

// ---- Sales ----

export interface ResellerSaleItem {
  variant_id: string
  product_title: string
  variant_title: string
  quantity: number
  price_sold: number
}

export interface ResellerSale {
  _id: string
  reseller_id: string | PhysicalReseller
  date: string
  customer_name: string
  customer_whatsapp: string
  channel: SaleChannel
  items: ResellerSaleItem[]
  total: number
  notes: string
  origin: SaleOrigin
  status: ResellerSaleStatus
  created_at: string
  updated_at: string
}

export interface ResellerSaleFilters {
  status?: ResellerSaleStatus
  reseller_id?: string
  channel?: SaleChannel
  from?: string
  to?: string
  limit?: number
  offset?: number
}

// ---- Stats ----

export interface PhysicalResellerStats {
  total_resellers: number
  pending_resellers: number
  resellers_by_type: Record<string, number>
  total_stock_distributed: number
  sales_this_month: number
  revenue_this_month: number
  pending_sales: number
  pending_orders: number
}

// ---- API Responses ----

export interface PaginatedResponse<T> {
  count: number
  limit: number
  offset: number
  [key: string]: T[] | number
}
