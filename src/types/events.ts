// Tipos para las respuestas del Events Backend (MongoDB Analytics)

export interface EventStats {
  total_events: number
  by_type: Record<string, number>
  by_source: Record<string, number>
  by_day: Array<{ date: string; count: number }>
}

export interface FunnelStep {
  step: string
  count: number
}

export interface FunnelStats {
  funnel: FunnelStep[]
  conversion_rates: {
    view_to_cart: string
    cart_to_checkout: string
    checkout_to_order: string
    order_to_payment: string
    payment_to_ship: string
    ship_to_delivery: string
    total_view_to_purchase: string
  }
}

export interface ProductStatsItem {
  product_id: string
  title: string
  views: number
  clicks: number
  added_to_cart: number
  purchased: number
  conversion_rate: string
  revenue: number
}

export interface ProductStats {
  products: ProductStatsItem[]
}

export interface SearchStats {
  top_searches: Array<{
    term: string
    count: number
    results_avg: number
  }>
  no_results: Array<{
    term: string
    count: number
  }>
}

export interface EventItem {
  _id: string
  event: string
  data: Record<string, unknown>
  source: "medusa" | "storefront"
  session_id: string | null
  customer_id: string | null
  timestamp: string
}

export interface EventsList {
  events: EventItem[]
  total: number
  limit: number
  offset: number
}

export interface EventFilters {
  event?: string
  from?: string
  to?: string
  customer_id?: string
  session_id?: string
  source?: "medusa" | "storefront"
  limit?: number
  offset?: number
  sort?: "asc" | "desc"
}

// Heatmap — clicks por zona y elemento en una página
export interface HeatmapZone {
  x_pct: number
  y_pct: number
  count: number
  element_tag: string
  element_text: string
}

export interface HeatmapElement {
  element_tag: string
  element_text: string
  count: number
}

export interface HeatmapStats {
  page_url: string
  total_clicks: number
  zones: HeatmapZone[]
  by_element: HeatmapElement[]
  viewport: { mobile: number; tablet: number; desktop: number }
}

// Scroll Depth — profundidad de scroll por milestone
export interface ScrollMilestone {
  depth_pct: number
  sessions: number
  rate: string
}

export interface ScrollDepthStats {
  page_url: string
  total_sessions: number
  milestones: ScrollMilestone[]
  avg_max_depth: string
}

// Product Visibility — visibilidad de productos en una página
export interface ProductVisibilityItem {
  product_id: string
  title: string
  times_seen: number
  total_loads: number
  visibility_pct: string
}

export interface ProductVisibilityStats {
  page_url: string
  total_products: number
  avg_products_seen: number
  visibility_rate: string
  products: ProductVisibilityItem[]
}
