// ============================================================
// DISTRIBUTOR TYPES
// ============================================================

export type DistributorStatus = "pendiente" | "aprobada" | "rechazada"

// ---- Distributor ----

export interface Distributor {
  _id: string
  email: string
  business_name: string
  cuit: string
  whatsapp: string
  logo_url: string | null
  social_media: {
    instagram?: string
    facebook?: string
    tiktok?: string
  }
  minimum_order: number
  status: DistributorStatus
  active: boolean
  branch_count?: number
  created_at: string
  updated_at: string
}

// ---- Branch ----

export interface DistributorBranch {
  _id: string
  distributor_id: string
  name: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number]
  } | null
  approximate_zone: string
  business_hours: string
  whatsapp: string
  active: boolean
  last_reception_date: string | null
  created_at: string
  updated_at: string
}

// ---- Detail (with branches and metrics) ----

export interface DistributorMetrics {
  card_views: number
  whatsapp_clicks: number
  social_clicks: number
}

export interface DistributorDetail {
  distributor: Distributor
  branches: DistributorBranch[]
  metrics: DistributorMetrics
}

// ---- Filters ----

export interface DistributorFilters {
  status?: DistributorStatus
  search?: string
  limit?: number
  offset?: number
}

// ---- Global Metrics ----

export interface DistributorRankingItem {
  distributor_id: string
  business_name: string
  total_clicks: number
  whatsapp_clicks: number
  card_views: number
}

export interface DistributorGlobalMetrics {
  total_distributors: number
  active_distributors: number
  total_branches: number
  ranking: DistributorRankingItem[]
}
