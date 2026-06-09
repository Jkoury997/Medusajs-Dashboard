"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

const ROOT = "/admin/ai-agents"

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────

export interface CheckoutDropoff {
  brief: string
  range: { from: string; to: string; days: number }
  sales_channel_id: string | null
  funnel: {
    checkout_started: number
    steps: { contact: number; delivery: number; payment: number }
    order_placed: number
    completion_pct: number
    biggest_leak: { from: string; to: string; drop_pct: number } | null
  }
  ticket: { count: number; p25: number; p50: number; p75: number; p90: number; mean: number }
  shipping: {
    representative_home_delivery_ars: number
    paid_methods: Array<{ method: string; cohort: string; median_ars: number; orders: number }>
  }
  free_shipping_recommendation: {
    recommended_threshold_ars: number
    cohorts: string
    rationale: string
    scenarios: Array<{ threshold_ars: number; pct_already_qualify: number; nudge_zone_count: number }>
  }
  note: string
}

export interface ShippingCostBucket {
  sales_channel_id: string
  sales_channel_name: string
  shipping_method: string
  customer_group: string
  orders: number
  avg_shipping_ars: number
  median_shipping_ars: number
  min_shipping_ars: number
  max_shipping_ars: number
  free_count: number
  free_pct: number
}

export interface ShippingCostStats {
  range: { from: string; to: string }
  total_orders_scanned: number
  buckets: ShippingCostBucket[]
}

export interface FreeShippingGuardrail {
  allow_writes: boolean
  min_threshold_ars: number
}

export interface FreeShippingStatus {
  promotions: Array<{
    sales_channel_id: string
    customer_group_id: string | null
    threshold_ars: number | null
  }>
  guardrail: FreeShippingGuardrail
}

export interface SetFreeShippingResult {
  applied: boolean
  reason?: string
  preview: {
    threshold_ars: number
    sales_channel_id: string
    scope: string
    exclude_group_ids?: string[]
  }
  promotion_id?: string | null
  code?: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────────────────────

export function useCheckoutDropoff(salesChannelId?: string, days = 90) {
  return useQuery({
    queryKey: ["checkout-dropoff", salesChannelId ?? "all", days],
    queryFn: () => {
      const query: Record<string, string | number> = { days }
      if (salesChannelId) query.sales_channel_id = salesChannelId
      return sdk.client.fetch<CheckoutDropoff>(`${ROOT}/checkout-dropoff`, { query })
    },
  })
}

export function useShippingCostStats(salesChannelId?: string, days = 90) {
  return useQuery({
    queryKey: ["shipping-cost-stats", salesChannelId ?? "all", days],
    queryFn: () => {
      const query: Record<string, string | number> = { days }
      if (salesChannelId) query.sales_channel_id = salesChannelId
      return sdk.client.fetch<ShippingCostStats>(`${ROOT}/shipping-cost-stats`, { query })
    },
  })
}

export function useFreeShippingStatus(salesChannelId?: string) {
  return useQuery({
    queryKey: ["free-shipping", "status", salesChannelId ?? "all"],
    queryFn: () => {
      const query: Record<string, string | number> = {}
      if (salesChannelId) query.sales_channel_id = salesChannelId
      return sdk.client.fetch<FreeShippingStatus>(`${ROOT}/free-shipping`, { query })
    },
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────────────────────

export function useSetFreeShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      threshold_ars: number
      sales_channel_id: string
      customer_group_id?: string | null
    }) => sdk.client.fetch<SetFreeShippingResult>(`${ROOT}/free-shipping`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["free-shipping"] }),
  })
}

export function useToggleFreeShippingGuardrail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { allow_writes: boolean; min_threshold_ars?: number }) =>
      sdk.client.fetch<{ ok: boolean; guardrail: FreeShippingGuardrail }>(`${ROOT}/free-shipping`, {
        method: "PATCH",
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["free-shipping"] }),
  })
}

export function useDeactivateFreeShipping() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (salesChannelId?: string) => {
      const query: Record<string, string> = {}
      if (salesChannelId) query.sales_channel_id = salesChannelId
      return sdk.client.fetch<{ ok: boolean }>(`${ROOT}/free-shipping`, {
        method: "DELETE",
        query,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["free-shipping"] }),
  })
}
