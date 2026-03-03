"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  SavedSegment,
  SegmentWithEstimate,
  EstimateResponse,
  CreateSegmentData,
  UpdateSegmentData,
  SegmentRule,
  SegmentMatchType,
} from "@/types/segments"

const BASE = "/api/campaigns-proxy/segments/saved"

// ============================================================
// QUERIES
// ============================================================

export function useSegmentList() {
  return useQuery({
    queryKey: ["segments", "list"],
    queryFn: async () => {
      const res = await fetch(BASE)
      if (!res.ok) throw new Error("Error al obtener segmentos")
      return res.json() as Promise<SavedSegment[]>
    },
  })
}

export function useSegmentDetail(id: string | null) {
  return useQuery({
    queryKey: ["segments", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle del segmento")
      return res.json() as Promise<SavedSegment>
    },
    enabled: !!id,
  })
}

// ============================================================
// MUTATIONS
// ============================================================

export function useCreateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateSegmentData) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear segmento")
      }
      return res.json() as Promise<SegmentWithEstimate>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["segments"] })
    },
  })
}

export function useUpdateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSegmentData }) => {
      const res = await fetch(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar segmento")
      }
      return res.json() as Promise<SegmentWithEstimate>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["segments"] })
    },
  })
}

export function useDeleteSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar segmento")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["segments"] })
    },
  })
}

export function useEstimateSegment(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/${id}/estimate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al estimar segmento")
      }
      return res.json() as Promise<EstimateResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["segments"] })
    },
  })
}

export function useEstimateAdHoc() {
  return useMutation({
    mutationFn: async ({ rules, match }: { rules: SegmentRule[]; match: SegmentMatchType }) => {
      const res = await fetch("/api/campaigns-proxy/segments/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules, match }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al estimar audiencia")
      }
      return res.json() as Promise<EstimateResponse>
    },
  })
}
