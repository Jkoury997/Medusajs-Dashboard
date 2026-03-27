"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ComboConfig,
  StoreCombosResponse,
  ComboDataResponse,
  ComboStatsResponse,
} from "@/types/combos"

const BACKEND_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/medusa`
    : process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!

const SDK_JWT_KEY = "medusa_auth_token"

function getToken(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(SDK_JWT_KEY) || ""
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  }
}

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0]
}

function formatToParam(date: Date): string {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  return next.toISOString().split("T")[0]
}

// Don't retry on 4xx errors (endpoint not implemented yet, auth issues, etc.)
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false
  if (error instanceof Error && /4\d{2}|not found|bad request/i.test(error.message)) return false
  return true
}

// ============================================================
// ADMIN - Combo Config
// ============================================================

export function useComboConfig() {
  return useQuery({
    queryKey: ["combos", "config"],
    queryFn: async (): Promise<ComboConfig> => {
      const res = await fetch(`${BACKEND_URL}/admin/combos/config`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener configuración de combos`)
      const json = await res.json()
      // Backend wraps response in { config: {...} }
      return json.config ?? json
    },
    retry: shouldRetry,
  })
}

export function useUpdateComboConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (config: Partial<ComboConfig>) => {
      const res = await fetch(`${BACKEND_URL}/admin/combos/config`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error("Error al actualizar configuración de combos")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos", "config"] })
    },
  })
}

// ============================================================
// STORE - Generated Combos
// ============================================================

export function useStoreCombos() {
  return useQuery({
    queryKey: ["combos", "store"],
    queryFn: async (): Promise<StoreCombosResponse> => {
      const res = await fetch(`${BACKEND_URL}/store/combos`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`${res.status} - Error al obtener combos`)
      const json = await res.json()
      // Transform backend response to match dashboard types
      return {
        combos: (json.combos ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          generation_method: c.generation_method,
          total_price: c.original_price ?? c.total_price,
          combo_price: c.combo_price,
          discount_percentage: c.discount_percentage,
          products: (c.products ?? []).map((p: any) => ({
            product_id: p.product_id,
            variant_id: p.variant_id,
            title: p.product_title ?? p.title,
            thumbnail: p.thumbnail,
            size: p.size,
            color: p.color,
            original_price: p.unit_price ?? p.original_price,
            category_handle: p.category_handle ?? "",
          })),
        })),
        config: json.config,
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour (matches backend cache)
    retry: shouldRetry,
  })
}

// ============================================================
// EVENTS SERVICE - Combo Analytics
// ============================================================

export function useComboData(from: Date, to: Date, limit: number = 100) {
  return useQuery({
    queryKey: ["combos", "data", from.toISOString(), to.toISOString(), limit],
    queryFn: async (): Promise<ComboDataResponse> => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
        limit: String(limit),
      })
      const res = await fetch(`/api/events-proxy/stats/combo-data?${params.toString()}`)
      if (!res.ok) throw new Error(`${res.status} - Error al obtener datos de scoring de combos`)
      return res.json()
    },
    retry: shouldRetry,
  })
}

export function useComboStats(from: Date, to: Date, comboId?: string) {
  return useQuery({
    queryKey: ["combos", "stats", from.toISOString(), to.toISOString(), comboId || ""],
    queryFn: async (): Promise<ComboStatsResponse> => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      if (comboId) params.set("combo_id", comboId)
      const res = await fetch(`/api/events-proxy/stats/combos?${params.toString()}`)
      if (!res.ok) throw new Error(`${res.status} - Error al obtener estadísticas de combos`)
      return res.json()
    },
    retry: shouldRetry,
  })
}
