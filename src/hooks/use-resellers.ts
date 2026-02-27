"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  ResellerDashboardStats,
  ResellerListResponse,
  ResellerFilters,
  ResellerType,
  WithdrawalListResponse,
  WithdrawalFilters,
  FraudAlertListResponse,
  FraudAlertFilters,
  VoucherListResponse,
  VoucherFilters,
} from "@/types/reseller"

const BASE = "/api/reseller-proxy"

// ============================================================
// STATS
// ============================================================

export function useResellerStats() {
  return useQuery({
    queryKey: ["resellers", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de revendedoras")
      const data = await res.json()
      return data.stats as ResellerDashboardStats
    },
  })
}

// ============================================================
// RESELLERS
// ============================================================

export function useResellers(filters: ResellerFilters = {}) {
  return useQuery({
    queryKey: ["resellers", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.reseller_type_id) params.set("reseller_type_id", filters.reseller_type_id)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}/admin/resellers?${params}`)
      if (!res.ok) throw new Error("Error al obtener revendedoras")
      return res.json() as Promise<ResellerListResponse>
    },
  })
}

export function useResellerTypes() {
  return useQuery({
    queryKey: ["resellers", "types"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/reseller-types`)
      if (!res.ok) throw new Error("Error al obtener tipos de revendedoras")
      const data = await res.json()
      return (data.reseller_types ?? []) as ResellerType[]
    },
  })
}

// ============================================================
// WITHDRAWALS
// ============================================================

export function useWithdrawals(filters: WithdrawalFilters = {}) {
  return useQuery({
    queryKey: ["resellers", "withdrawals", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}/admin/withdrawals?${params}`)
      if (!res.ok) throw new Error("Error al obtener retiros")
      return res.json() as Promise<WithdrawalListResponse>
    },
  })
}

// ============================================================
// FRAUD ALERTS
// ============================================================

export function useFraudAlerts(filters: FraudAlertFilters = {}) {
  return useQuery({
    queryKey: ["resellers", "fraud-alerts", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.severity) params.set("severity", filters.severity)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}/admin/fraud-alerts?${params}`)
      if (!res.ok) throw new Error("Error al obtener alertas de fraude")
      return res.json() as Promise<FraudAlertListResponse>
    },
  })
}

// ============================================================
// VOUCHERS
// ============================================================

export function useVouchers(filters: VoucherFilters = {}) {
  return useQuery({
    queryKey: ["resellers", "vouchers", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.reseller_id) params.set("reseller_id", filters.reseller_id)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}/admin/vouchers?${params}`)
      if (!res.ok) throw new Error("Error al obtener vouchers")
      return res.json() as Promise<VoucherListResponse>
    },
  })
}
