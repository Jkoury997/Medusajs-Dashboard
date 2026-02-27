"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  PickingPerformanceStats,
  OrderStats,
  FaltantesStats,
  ActivityStats,
  AuditListResponse,
  AuditFilters,
  PickingHistoryResponse,
  PickingHistoryFilters,
  OrdersCountResponse,
  PickingUser,
  PickingUserWithStats,
  CreatePickingUserData,
  UpdatePickingUserData,
  GestionTab,
  GestionListResponse,
  ShipOrderData,
  DeliverOrderData,
  ResolveFaltanteData,
  CreateVoucherData,
  FaltantesReceiveResponse,
  ReceiveFaltanteData,
  PickingStore,
  CreateStoreData,
} from "@/types/picking"

const BASE = "/api/picking-proxy"

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0]
}

// ============================================================
// STATS QUERIES
// ============================================================

export function usePickingStats(from: Date, to: Date) {
  return useQuery({
    queryKey: ["picking", "stats", "performance", fmtDate(from), fmtDate(to)],
    queryFn: async () => {
      const params = new URLSearchParams({ from: fmtDate(from), to: fmtDate(to) })
      const res = await fetch(`${BASE}/stats/picking?${params}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de picking")
      return res.json() as Promise<PickingPerformanceStats>
    },
  })
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["picking", "stats", "orders"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/stats/orders`)
      if (!res.ok) throw new Error("Error al obtener estado de pedidos")
      return res.json() as Promise<OrderStats>
    },
  })
}

export function useFaltantesStats(from: Date, to: Date) {
  return useQuery({
    queryKey: ["picking", "stats", "faltantes", fmtDate(from), fmtDate(to)],
    queryFn: async () => {
      const params = new URLSearchParams({ from: fmtDate(from), to: fmtDate(to) })
      const res = await fetch(`${BASE}/stats/faltantes?${params}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de faltantes")
      return res.json() as Promise<FaltantesStats>
    },
  })
}

export function useActivityStats(from: Date, to: Date) {
  return useQuery({
    queryKey: ["picking", "stats", "activity", fmtDate(from), fmtDate(to)],
    queryFn: async () => {
      const params = new URLSearchParams({ from: fmtDate(from), to: fmtDate(to) })
      const res = await fetch(`${BASE}/stats/activity?${params}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de actividad")
      return res.json() as Promise<ActivityStats>
    },
  })
}

// ============================================================
// AUDIT QUERIES
// ============================================================

export function useAuditLog(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ["picking", "audit", "log", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      if (filters.action) params.set("action", filters.action)
      if (filters.userName) params.set("userName", filters.userName)
      if (filters.orderId) params.set("orderId", filters.orderId)
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      const res = await fetch(`${BASE}/picking/audit?${params}`)
      if (!res.ok) throw new Error("Error al obtener log de auditoría")
      return res.json() as Promise<AuditListResponse>
    },
  })
}

export function usePickingHistory(filters: PickingHistoryFilters = {}) {
  return useQuery({
    queryKey: ["picking", "audit", "history", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      if (filters.userId) params.set("userId", filters.userId)
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      const res = await fetch(`${BASE}/picking/history?${params}`)
      if (!res.ok) throw new Error("Error al obtener historial de picking")
      return res.json() as Promise<PickingHistoryResponse>
    },
  })
}

export function useOrdersCount() {
  return useQuery({
    queryKey: ["picking", "orders-count"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/picking/orders-count`)
      if (!res.ok) throw new Error("Error al obtener conteo de pedidos")
      return res.json() as Promise<OrdersCountResponse>
    },
    refetchInterval: 30_000,
  })
}

// ============================================================
// USER QUERIES
// ============================================================

export function usePickingUsers(includeInactive = false) {
  return useQuery({
    queryKey: ["picking", "users", "list", includeInactive],
    queryFn: async () => {
      const params = includeInactive ? "?all=true" : ""
      const res = await fetch(`${BASE}/picking/users${params}`)
      if (!res.ok) throw new Error("Error al obtener usuarios")
      const data = await res.json()
      return (data.users ?? data) as PickingUser[]
    },
  })
}

export function usePickingUserDetail(userId: string | null) {
  return useQuery({
    queryKey: ["picking", "users", "detail", userId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/picking/users/${userId}`)
      if (!res.ok) throw new Error("Error al obtener detalle del usuario")
      return res.json() as Promise<PickingUserWithStats>
    },
    enabled: !!userId,
  })
}

// ============================================================
// GESTION QUERIES
// ============================================================

export function useGestionOrders(tab: GestionTab) {
  return useQuery({
    queryKey: ["picking", "gestion", tab],
    queryFn: async () => {
      const res = await fetch(`${BASE}/gestion?tab=${tab}`)
      if (!res.ok) throw new Error("Error al obtener pedidos de gestión")
      return res.json() as Promise<GestionListResponse>
    },
  })
}

export function useFaltantesReceive(orderId: string | null) {
  return useQuery({
    queryKey: ["picking", "gestion", "faltantes-receive", orderId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/gestion/faltantes/receive?orderId=${orderId}`)
      if (!res.ok) throw new Error("Error al obtener items faltantes")
      return res.json() as Promise<FaltantesReceiveResponse>
    },
    enabled: !!orderId,
  })
}

// ============================================================
// STORES QUERY
// ============================================================

export function usePickingStores() {
  return useQuery({
    queryKey: ["picking", "stores"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/picking/stores`)
      if (!res.ok) throw new Error("Error al obtener tiendas")
      const data = await res.json()
      return (data.stores ?? data) as PickingStore[]
    },
  })
}

// ============================================================
// USER MUTATIONS
// ============================================================

export function useCreatePickingUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreatePickingUserData) => {
      const res = await fetch(`${BASE}/picking/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear usuario")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "users"] })
    },
  })
}

export function useUpdatePickingUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePickingUserData }) => {
      const res = await fetch(`${BASE}/picking/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar usuario")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "users"] })
    },
  })
}

export function useDeletePickingUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/picking/users/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar usuario")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "users"] })
    },
  })
}

// ============================================================
// GESTION MUTATIONS
// ============================================================

export function useShipOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ShipOrderData) => {
      const res = await fetch(`${BASE}/gestion/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al marcar como enviado")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "gestion"] })
    },
  })
}

export function useDeliverOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: DeliverOrderData) => {
      const res = await fetch(`${BASE}/gestion/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al marcar como entregado")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "gestion"] })
    },
  })
}

export function useResolveFaltante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ResolveFaltanteData) => {
      const res = await fetch(`${BASE}/gestion/faltantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al resolver faltante")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "gestion"] })
    },
  })
}

export function useCreateVoucher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateVoucherData) => {
      const res = await fetch(`${BASE}/gestion/faltantes/voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear voucher")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "gestion"] })
    },
  })
}

export function useReceiveFaltante() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: ReceiveFaltanteData) => {
      const res = await fetch(`${BASE}/gestion/faltantes/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al registrar item recibido")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "gestion"] })
      qc.invalidateQueries({ queryKey: ["picking", "gestion", "faltantes-receive"] })
    },
  })
}

// ============================================================
// STORE MUTATIONS
// ============================================================

export function useCreateStore() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateStoreData) => {
      const res = await fetch(`${BASE}/picking/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear tienda")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["picking", "stores"] })
    },
  })
}
