import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  Distributor,
  DistributorDetail,
  DistributorFilters,
  DistributorGlobalMetrics,
} from "@/types/distributors"

const BASE = "/api/reseller-fisicas-proxy"

// ============================================================
// LIST
// ============================================================

export function useDistributors(filters: DistributorFilters = {}) {
  return useQuery({
    queryKey: ["distributors", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set("status", filters.status)
      if (filters.search) params.set("search", filters.search)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset) params.set("offset", String(filters.offset))

      const res = await fetch(`${BASE}/distributors?${params}`)
      if (!res.ok) throw new Error("Error al obtener distribuidores")
      return res.json() as Promise<{
        distributors: Distributor[]
        count: number
        limit: number
        offset: number
      }>
    },
  })
}

// ============================================================
// DETAIL
// ============================================================

export function useDistributorDetail(id: string) {
  return useQuery({
    queryKey: ["distributors", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/distributors/${id}`)
      if (!res.ok) throw new Error("Error al obtener distribuidor")
      return res.json() as Promise<DistributorDetail>
    },
    enabled: !!id,
  })
}

// ============================================================
// APPROVE / REJECT
// ============================================================

export function useApproveDistributor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/distributors/${id}/approve`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Error al aprobar distribuidor")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributors"] })
    },
  })
}

export function useRejectDistributor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/distributors/${id}/reject`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Error al rechazar distribuidor")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributors"] })
    },
  })
}

// ============================================================
// UPDATE
// ============================================================

export function useUpdateDistributor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Distributor> }) => {
      const res = await fetch(`${BASE}/distributors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar distribuidor")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributors"] })
    },
  })
}

// ============================================================
// DELETE (deactivate)
// ============================================================

export function useDeactivateDistributor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/distributors/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Error al desactivar distribuidor")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributors"] })
    },
  })
}

// ============================================================
// BRANCH RECEPTION
// ============================================================

export function useMarkBranchReception() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ distributorId, branchId }: { distributorId: string; branchId: string }) => {
      const res = await fetch(
        `${BASE}/distributors/${distributorId}/branches/${branchId}/reception`,
        { method: "POST" }
      )
      if (!res.ok) throw new Error("Error al marcar recepción")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["distributors"] })
    },
  })
}

// ============================================================
// GLOBAL METRICS
// ============================================================

export function useDistributorGlobalMetrics() {
  return useQuery({
    queryKey: ["distributors", "metrics", "global"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/distributors/metrics/global`)
      if (!res.ok) throw new Error("Error al obtener métricas globales")
      return res.json() as Promise<DistributorGlobalMetrics>
    },
  })
}
