// Tipos para la API de Ranking de Productos — Marcela Koury

// --- Health ---

export interface RankingHealthResponse {
  status: string
  mongo: string
  service?: string
  timestamp?: string
}

// --- Rankings ---

export interface RankedProduct {
  product_id: string
  score: number
  rank: number
  title?: string
  [key: string]: unknown
}

export interface EntityRankingResponse {
  entity_id: string
  customer_id?: string
  rankings: RankedProduct[]
  is_personalized: boolean
  generated_at: string
}

// --- Job Status ---

export interface RankingJobStatus {
  status: string
  entities_processed: number
  customers_processed: number
  total_api_calls: number
  total_tokens_used: number
  errors: string[] | number
  started_at?: string
  completed_at?: string
}

// --- Stats Summary ---

export interface RankingStatsSummary {
  total_rankings: number
  general: number
  personalized: number
  entities_with_rankings: number
}

// --- Trigger ---

export interface RankingTriggerResponse {
  message: string
  job_id?: string
}

// --- Metrics: Costos ---

export interface CostTimeseriesPoint {
  date: string
  cost_usd: number
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  calls: number
  successful_calls: number
}

export interface CostTimeseriesResponse {
  from: string
  to: string
  granularity: "hour" | "day" | "month"
  series: CostTimeseriesPoint[]
}

export interface CostByModel {
  model: string
  cost_usd: number
  calls: number
  tokens: number
}

export interface CostByEntity {
  entity_type: "collection" | "category" | null
  ranking_type: "general" | "personalized"
  cost_usd: number
  calls: number
}

export interface CostSummaryResponse {
  from: string
  to: string
  total_cost_usd: number
  total_prompt_tokens: number
  total_completion_tokens: number
  total_tokens: number
  total_calls: number
  successful_calls: number
  failed_calls: number
  avg_cost_per_call: number
  by_model: CostByModel[]
  by_entity: CostByEntity[]
}

// --- Metrics: Performance ---

export interface RankingPerformanceItem {
  ranking_id: string
  entity_id: string
  entity_type: "collection" | "category"
  entity_name: string
  ranking_type: "general" | "personalized"
  customer_id: string | null
  applied_at: string
  window_days: number
  total_pre_sales: number
  total_pre_revenue: number
  total_active_sales: number
  total_active_revenue: number
  total_delta_sales_pct: number | null
  total_delta_revenue_pct: number | null
  products_count: number
  measured_at: string
}

export interface RankingPerformanceListResponse {
  from: string
  to: string
  count: number
  items: RankingPerformanceItem[]
}

export interface RankingPerformanceProduct {
  product_id: string
  rank_position: number
  pre_sales: number
  pre_revenue: number
  active_sales: number
  active_revenue: number
  delta_sales: number
  delta_revenue: number
  delta_sales_pct: number | null
  delta_revenue_pct: number | null
}

export interface RankingPerformanceDetailResponse {
  ranking_id: string
  entity_id: string
  entity_type: "collection" | "category"
  entity_name: string
  ranking_type: "general" | "personalized"
  customer_id: string | null
  applied_at: string
  window_days: number
  pre_window_start: string
  pre_window_end: string
  active_window_start: string
  active_window_end: string
  products: RankingPerformanceProduct[]
  total_pre_sales: number
  total_pre_revenue: number
  total_active_sales: number
  total_active_revenue: number
  total_delta_sales_pct: number | null
  total_delta_revenue_pct: number | null
  measured_at: string
}
