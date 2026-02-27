"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
  InvitationCodeListResponse,
  InvitationCodeFilters,
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

export interface CreateResellerTypeData {
  name: string
  display_name: string
  description?: string
  requires_invitation?: boolean
  default_commission_percentage: number
  default_customer_discount_percentage: number
  has_wholesale_prices?: boolean
  priority?: number
}

export interface UpdateResellerTypeData {
  display_name?: string
  description?: string
  requires_invitation?: boolean
  default_commission_percentage?: number
  default_customer_discount_percentage?: number
  has_wholesale_prices?: boolean
  is_active?: boolean
  priority?: number
}

export function useCreateResellerType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateResellerTypeData) => {
      const res = await fetch(`${BASE}/admin/reseller-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear tipo")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "types"] })
    },
  })
}

export function useUpdateResellerType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateResellerTypeData }) => {
      const res = await fetch(`${BASE}/admin/reseller-types/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar tipo")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "types"] })
    },
  })
}

export function useDeleteResellerType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/reseller-types/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar tipo")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "types"] })
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

// ============================================================
// INVITATION CODES
// ============================================================

export function useInvitationCodes(filters: InvitationCodeFilters = {}) {
  return useQuery({
    queryKey: ["resellers", "invitation-codes", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.reseller_type_id) params.set("reseller_type_id", filters.reseller_type_id)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}/admin/invitation-codes?${params}`)
      if (!res.ok) throw new Error("Error al obtener códigos de invitación")
      return res.json() as Promise<InvitationCodeListResponse>
    },
  })
}

export interface CreateInvitationCodeData {
  reseller_type_id: string
  code?: string
  max_uses?: number | null
  expires_at?: string | null
  is_active?: boolean
  notes?: string
}

export interface UpdateInvitationCodeData {
  is_active?: boolean
  max_uses?: number | null
  expires_at?: string | null
}

export function useCreateInvitationCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateInvitationCodeData) => {
      const res = await fetch(`${BASE}/admin/invitation-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear código")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "invitation-codes"] })
    },
  })
}

export function useUpdateInvitationCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInvitationCodeData }) => {
      const res = await fetch(`${BASE}/admin/invitation-codes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar código")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "invitation-codes"] })
    },
  })
}

export function useDeleteInvitationCode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/invitation-codes/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar código")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "invitation-codes"] })
    },
  })
}
