"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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

// ============================================================
// TYPES
// ============================================================

export interface AiDescription {
  meta_title: string
  meta_description: string
  corta: string
  media: string
  larga: string
  keywords: string[]
  schema_description: string
}

export interface AiPendingProduct {
  id: string
  title: string
  thumbnail: string | null
  ai_generated_at: string
  ai_description: AiDescription
}

// ============================================================
// QUERIES
// ============================================================

export function useAiPendingProducts() {
  return useQuery({
    queryKey: ["ai", "pending"],
    queryFn: async (): Promise<AiPendingProduct[]> => {
      const res = await fetch(`${BACKEND_URL}/admin/ai/pending`, {
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error("Error al obtener productos pendientes")
      const data = await res.json()
      return data.products ?? []
    },
    refetchInterval: 15_000,
  })
}

// ============================================================
// MUTATIONS
// ============================================================

export function useApproveDescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      productId,
      variant,
    }: {
      productId: string
      variant: "corta" | "media" | "larga"
    }) => {
      const res = await fetch(
        `${BACKEND_URL}/admin/ai/approve-description/${productId}`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ variant }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Error al aprobar descripción")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "pending"] })
    },
  })
}

export function useRegenerateDescription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(
        `${BACKEND_URL}/admin/ai/regenerate/${productId}`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Error al regenerar descripción")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "pending"] })
    },
  })
}

// ============================================================
// GENERATE ALL
// ============================================================

export interface GenerateAllResult {
  queued: number
  products: string[]
}

export function useGenerateAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<GenerateAllResult> => {
      const res = await fetch(`${BACKEND_URL}/admin/ai/generate-all`, {
        method: "POST",
        headers: authHeaders(),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Error al generar descripciones")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "pending"] })
    },
  })
}
