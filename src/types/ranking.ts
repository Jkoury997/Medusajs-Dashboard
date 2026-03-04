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
  duration_seconds?: number
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
