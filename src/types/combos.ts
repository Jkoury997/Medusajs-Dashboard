// ============================================================
// COMBO CONFIG
// ============================================================

export interface ComboSizeProportion {
  S: number
  M: number
  L: number
  XL: number
  [key: string]: number
}

export interface ComboConfig {
  max_discount: number
  size_proportion: ComboSizeProportion
  allowed_categories: string[]
  must_include_category: string
  enabled_customer_groups: string[]
  ai_enabled: boolean
}

// ============================================================
// COMBO PRODUCTS & COMBOS
// ============================================================

export interface ComboProduct {
  product_id: string
  variant_id: string
  title: string
  thumbnail: string | null
  size: string
  color: string
  original_price: number
  category_handle: string
}

export interface Combo {
  id: string
  name: string
  description: string
  products: ComboProduct[]
  total_price: number
  combo_price: number
  discount_percentage: number
  generation_method: "ai" | "algorithmic"
}

export interface StoreCombosResponse {
  combos: Combo[]
  config: ComboConfig
}

// ============================================================
// EVENTS SERVICE - COMBO STATS
// ============================================================

export interface ComboProductScore {
  product_id: string
  title: string
  score: number
  views: number
  clicks: number
  added_to_cart: number
  purchased: number
}

export interface ComboSlowMover {
  product_id: string
  title: string
  views: number
  clicks: number
  added_to_cart: number
  purchased: number
  view_to_purchase_ratio: number
}

export interface ComboDataResponse {
  popular_products: ComboProductScore[]
  slow_movers: ComboSlowMover[]
}

export interface ComboPerformance {
  combo_id: string
  combo_name: string
  generation_method: "ai" | "algorithmic"
  views: number
  added_to_cart: number
  converted: number
  conversion_rate: string
  revenue: number
}

export interface ComboPerformanceSummary {
  total_views: number
  total_added_to_cart: number
  total_converted: number
  ai_conversion_rate: string
  algorithmic_conversion_rate: string
}

export interface ComboStatsResponse {
  combos: ComboPerformance[]
  summary: ComboPerformanceSummary
}
