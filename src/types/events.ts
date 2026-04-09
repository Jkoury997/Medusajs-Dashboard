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
export interface HeatmapClick {
  x_pct: number
  y_abs: number
  el_tag: string
  el_text: string
  count: number
}

export interface HeatmapViewportBreakdown {
  vw_range: string
  clicks: number
}

export interface HeatmapStats {
  page_url: string
  total_clicks: number
  clicks: HeatmapClick[]
  viewport_breakdown: HeatmapViewportBreakdown[]
}

// Scroll Depth — profundidad de scroll por milestone
export interface ScrollDepthStats {
  page_url: string
  total_sessions: number
  milestones: Record<string, number> // { "25": 11, "50": 8, "75": 6, "100": 2 }
  avg_max_depth: number
}

// Product Visibility — visibilidad de productos en una página
export interface ProductVisibilityItem {
  product_id: string
  times_seen: number
  visibility_rate: string
}

export interface ProductVisibilityStats {
  page_url: string
  total_observations: number
  avg_products_seen: number
  avg_products_total: number
  visibility_rate: string
  product_visibility: ProductVisibilityItem[]
}

// Inspire (Reels/TikTok feed) — métricas de engagement por producto, sesión y posición

export interface InspireProductMetric {
  product_id: string
  product_title: string
  views: number
  avg_dwell_time_ms: number
  like_count: number
  like_rate: string
  cart_count: number
  cart_rate: string
  skip_rate: string
  detail_clicks: number
  avg_images_viewed: number
  engagement_score: number
}

export interface InspireSessionMetrics {
  total_sessions: number
  avg_depth: number
  avg_duration_ms: number
  avg_likes_per_session: number
  avg_carts_per_session: number
  avg_dwell_time_ms: number
  total_likes: number
  total_carts: number
  total_detail_clicks: number
  like_to_cart_rate: string
}

export interface InspirePositionMetric {
  position: number
  views: number
  like_rate: string
  cart_rate: string
  avg_dwell_time_ms: number
}

export interface InspireDailyMetric {
  date: string
  sessions: number
  views: number
  likes: number
  carts: number
}

export interface InspireStats {
  products: InspireProductMetric[]
  session_metrics: InspireSessionMetrics
  position_metrics: InspirePositionMetric[]
  daily_metrics: InspireDailyMetric[]
}

// Checkout funnel — dropoff por paso

export interface CheckoutFunnelStep {
  step: string
  count: number
  drop_rate: string
}

export interface CheckoutFunnelStats {
  steps: CheckoutFunnelStep[]
  total_started: number
  total_completed: number
  overall_conversion: string
}

// Cart abandonment

export interface CartAbandonmentStats {
  total_started: number
  total_abandoned: number
  abandonment_rate: string
  estimated_lost_value: number
  by_step: Array<{ step: string; count: number }>
}

// Search quality

export interface SearchQueryMetric {
  query: string
  searches: number
  clicks: number
  ctr: string
  no_results_count: number
}

export interface SearchQualityStats {
  queries: SearchQueryMetric[]
  overall_ctr: string
  total_searches: number
  total_clicks: number
  zero_result_rate: string
}

// Customer cohorts

export interface CustomerCohort {
  period: string
  new_customers: number
  repeat_customers: number
  total_orders: number
  total_revenue: number
  avg_order_value: number
}

export interface CustomerCohortsStats {
  cohorts: CustomerCohort[]
  overall_repeat_rate: string
  total_customers: number
  total_repeat_customers: number
}
