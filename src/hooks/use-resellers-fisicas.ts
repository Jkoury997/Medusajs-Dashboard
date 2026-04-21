import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  PhysicalReseller,
  PhysicalResellerWithStats,
  PhysicalResellerFilters,
  PhysicalResellerStats,
  ResellerOrder,
  ResellerOrderFilters,
  ResellerSale,
  ResellerSaleFilters,
  ResellerInventoryItem,
} from "@/types/reseller-fisicas"

const BASE = "/api/reseller-fisicas-proxy"

// ============================================================
// STATS
// ============================================================

export function usePhysicalResellerStats() {
  return useQuery({
    queryKey: ["resellers-fisicas", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas")
      const data = await res.json()
      return data.stats as PhysicalResellerStats
    },
  })
}

// ============================================================
// RESELLERS
// ============================================================

export function usePhysicalResellers(filters: PhysicalResellerFilters = {}) {
  return useQuery({
    queryKey: ["resellers-fisicas", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.type) params.set("type", filters.type)
      if (filters.search) params.set("search", filters.search)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset) params.set("offset", String(filters.offset))

      const res = await fetch(`${BASE}/resellers?${params}`)
      if (!res.ok) throw new Error("Error al obtener revendedoras")
      return res.json() as Promise<{
        resellers: PhysicalReseller[]
        count: number
        limit: number
        offset: number
      }>
    },
  })
}

export function usePhysicalResellerDetail(id: string) {
  return useQuery({
    queryKey: ["resellers-fisicas", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/resellers/${id}`)
      if (!res.ok) throw new Error("Error al obtener revendedora")
      const json = await res.json()
      // API returns { reseller: {...}, stats: {...} } - merge into single object
      return { ...json.reseller, stats: json.stats } as PhysicalResellerWithStats
    },
    enabled: !!id,
  })
}

export function useApprovePhysicalReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/resellers/${id}/approve`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Error al aprobar revendedora")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas"] })
    },
  })
}

export function useRejectPhysicalReseller() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/resellers/${id}/reject`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Error al rechazar revendedora")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas"] })
    },
  })
}

// ============================================================
// ORDERS
// ============================================================

export function usePhysicalResellerOrders(filters: ResellerOrderFilters = {}) {
  return useQuery({
    queryKey: ["resellers-fisicas", "orders", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.reseller_id) params.set("reseller_id", filters.reseller_id)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset) params.set("offset", String(filters.offset))

      const res = await fetch(`${BASE}/orders?${params}`)
      if (!res.ok) throw new Error("Error al obtener pedidos")
      return res.json() as Promise<{
        orders: ResellerOrder[]
        count: number
        limit: number
        offset: number
      }>
    },
  })
}

export function useMarkOrderShipped() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/orders/${id}/mark-shipped`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Error al marcar como enviado")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas", "orders"] })
    },
  })
}

export function useConfirmOrderDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/orders/${id}/confirm-delivery`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Error al confirmar entrega")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas"] })
    },
  })
}

// ============================================================
// SALES
// ============================================================

export function usePhysicalResellerSales(filters: ResellerSaleFilters = {}) {
  return useQuery({
    queryKey: ["resellers-fisicas", "sales", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.reseller_id) params.set("reseller_id", filters.reseller_id)
      if (filters.channel) params.set("channel", filters.channel)
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset) params.set("offset", String(filters.offset))

      const res = await fetch(`${BASE}/sales?${params}`)
      if (!res.ok) throw new Error("Error al obtener ventas")
      return res.json() as Promise<{
        sales: ResellerSale[]
        count: number
        limit: number
        offset: number
      }>
    },
  })
}

export function useSyncOrders() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (days: number = 10) => {
      const res = await fetch(`${BASE}/orders/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: String(days) }),
      })
      if (!res.ok) throw new Error("Error al sincronizar pedidos")
      return res.json() as Promise<{
        message: string
        imported: number
        skipped: number
        errors: number
        resellers_checked: number
        days: number
        details: Array<{ order_id: string; display_id: string; reseller: string }>
      }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas", "orders"] })
      qc.invalidateQueries({ queryKey: ["resellers-fisicas", "stats"] })
    },
  })
}

export function useSyncOrderTotals() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/orders/sync-totals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Error al sincronizar totales")
      return res.json() as Promise<{
        message: string
        total_checked: number
        updated: number
        errors: number
      }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas", "orders"] })
    },
  })
}

export function useImportOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`${BASE}/orders/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Error al importar pedido")
      }
      return res.json() as Promise<{
        message: string
        order: ResellerOrder
        reseller: { id: string; business_name: string; email: string }
      }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas", "orders"] })
      qc.invalidateQueries({ queryKey: ["resellers-fisicas", "stats"] })
    },
  })
}

export function useRelinkResellersByEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/resellers/relink-by-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Error al re-vincular revendedoras")
      }
      return res.json() as Promise<{
        message: string
        checked: number
        relinked: number
        skipped: number
        errors: number
        details: Array<{
          reseller_id: string
          business_name: string
          email: string
          old_customer_id: string
          new_customer_id: string
        }>
      }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resellers-fisicas"] })
    },
  })
}

// ============================================================
// MAP
// ============================================================

export interface ResellerMapItem {
  id: string
  business_name: string
  email: string
  whatsapp: string
  type: string
  address: string | null
  location: { type: "Point"; coordinates: [number, number] } | null
  approximate_zone: string
  social_media: { instagram?: string; facebook?: string; tiktok?: string }
  status: string
  active: boolean
  product_count: number
  total_stock: number
  created_at: string
}

export function usePhysicalResellersMap(status?: string) {
  return useQuery({
    queryKey: ["resellers-fisicas", "map", status],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (status) params.set("status", status)
      const res = await fetch(`${BASE}/resellers/map?${params}`)
      if (!res.ok) throw new Error("Error al obtener datos de mapa")
      return res.json() as Promise<{ resellers: ResellerMapItem[]; count: number }>
    },
  })
}

// ============================================================
// INVENTORY
// ============================================================

export function usePhysicalResellerInventory(resellerId: string) {
  return useQuery({
    queryKey: ["resellers-fisicas", "inventory", resellerId],
    queryFn: async () => {
      const res = await fetch(`${BASE}/inventory/${resellerId}`)
      if (!res.ok) throw new Error("Error al obtener inventario")
      return res.json() as Promise<{ items: ResellerInventoryItem[] }>
    },
    enabled: !!resellerId,
  })
}
