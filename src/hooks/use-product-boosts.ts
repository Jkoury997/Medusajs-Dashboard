"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ProductBoostListResponse,
  ProductBoostStats,
  ProductBoostFilters,
} from "@/types/reseller"

const BASE = "/api/reseller-proxy"

// ============================================================
// QUERIES
// ============================================================

export function useProductBoosts(filters: ProductBoostFilters = {}) {
  return useQuery({
    queryKey: ["product-boosts", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.is_active != null) params.set("is_active", String(filters.is_active))
      if (filters.reason) params.set("reason", filters.reason)
      if (filters.page) params.set("page", String(filters.page))
      params.set("limit", String(filters.limit ?? 50))
      const res = await fetch(`${BASE}/admin/product-boosts?${params}`)
      if (!res.ok) throw new Error("Error al obtener product boosts")
      return res.json() as Promise<ProductBoostListResponse>
    },
  })
}

export function useProductBoostStats() {
  return useQuery({
    queryKey: ["product-boosts", "stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/product-boosts/stats`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de boosts")
      const data = await res.json()
      return data.stats as ProductBoostStats
    },
  })
}

// ============================================================
// MUTATIONS
// ============================================================

export function useDetectStagnant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/admin/product-boosts/detect`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al detectar estancados")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-boosts"] })
    },
  })
}

export interface CreateProductBoostData {
  product_id: string
  product_title: string
  product_handle: string
  thumbnail?: string | null
  bonus_percentage: number
  variant_id?: string | null
}

export function useCreateProductBoost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateProductBoostData) => {
      const res = await fetch(`${BASE}/admin/product-boosts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al crear boost")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-boosts"] })
    },
  })
}

export interface UpdateProductBoostData {
  bonus_percentage?: number
  is_active?: boolean
  expires_at?: string | null
}

export function useUpdateProductBoost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductBoostData }) => {
      const res = await fetch(`${BASE}/admin/product-boosts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al actualizar boost")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-boosts"] })
    },
  })
}

export function useDeleteProductBoost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/admin/product-boosts/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || err.message || "Error al eliminar boost")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-boosts"] })
    },
  })
}
