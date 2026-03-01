"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ResellerDashboardStats,
  Reseller,
  ResellerListResponse,
  ResellerFilters,
  ResellerType,
  ResellerCustomer,
  ResellerCommission,
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

// ---- Reseller Detail ----

export function useResellerDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["resellers", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/resellers/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle de revendedora")
      const data = await res.json()
      return data.reseller as Reseller
    },
    enabled: !!id,
  })
}

export function useResellerCustomers(id: string | undefined) {
  return useQuery({
    queryKey: ["resellers", "customers", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/resellers/${id}/customers`)
      if (!res.ok) throw new Error("Error al obtener clientes")
      const data = await res.json()
      return (data.customers ?? []) as ResellerCustomer[]
    },
    enabled: !!id,
  })
}

export function useResellerCommissions(id: string | undefined) {
  return useQuery({
    queryKey: ["resellers", "commissions", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/resellers/${id}/commissions`)
      if (!res.ok) throw new Error("Error al obtener comisiones")
      const data = await res.json()
      return (data.commissions ?? []) as ResellerCommission[]
    },
    enabled: !!id,
  })
}

// ---- Reseller Actions ----

export function useApproveReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/resellers/${id}/approve`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al aprobar revendedora")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] })
    },
  })
}

export function useSuspendReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await fetch(`${BASE}/admin/resellers/${id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "Suspendida por admin" }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al suspender revendedora")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] })
    },
  })
}

export function useReactivateReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/resellers/${id}/reactivate`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al reactivar revendedora")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] })
    },
  })
}

export interface UpdateResellerData {
  status?: string
  custom_commission_percentage?: number | null
  custom_customer_discount_percentage?: number | null
  admin_notes?: string
}

export function useUpdateReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateResellerData }) => {
      const res = await fetch(`${BASE}/admin/resellers/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar revendedora")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers"] })
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

export function useApproveWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/withdrawals/${id}/approve`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al aprobar retiro")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "withdrawals"] })
      qc.invalidateQueries({ queryKey: ["resellers", "stats"] })
    },
  })
}

export function useRejectWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, rejection_reason }: { id: string; rejection_reason: string }) => {
      const res = await fetch(`${BASE}/admin/withdrawals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al rechazar retiro")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "withdrawals"] })
      qc.invalidateQueries({ queryKey: ["resellers", "stats"] })
    },
  })
}

export interface MarkPaidData {
  payment_reference?: string
  payment_proof?: string
  payment_notes?: string
}

export function useMarkWithdrawalPaid() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MarkPaidData }) => {
      const res = await fetch(`${BASE}/admin/withdrawals/${id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al marcar como pagado")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "withdrawals"] })
      qc.invalidateQueries({ queryKey: ["resellers", "stats"] })
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

// ============================================================
// SETTINGS
// ============================================================

export interface ResellerSetting {
  key: string
  value: string
  value_type?: string
  description?: string
}

export function useResellerSettings() {
  return useQuery({
    queryKey: ["resellers", "settings"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/settings`)
      if (!res.ok) throw new Error("Error al obtener settings")
      const data = await res.json()
      return (data.settings ?? []) as ResellerSetting[]
    },
  })
}

export function useUpdateResellerSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch(`${BASE}/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar setting")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers", "settings"] })
    },
  })
}
