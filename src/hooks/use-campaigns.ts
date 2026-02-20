"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  CampaignStats,
  CampaignType,
  CampaignRecentResponse,
  CampaignConfigResponse,
  CampaignProcessResponse,
  CampaignForceSendResponse,
} from "@/types/email-marketing"

export function useCampaignStats() {
  return useQuery({
    queryKey: ["email", "campaigns", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/email-proxy/campaigns/stats")
      if (!res.ok) throw new Error("Error al obtener estadísticas de campañas")
      return res.json() as Promise<CampaignStats>
    },
  })
}

export function useCampaignRecent(type: CampaignType | null, limit = 20) {
  return useQuery({
    queryKey: ["email", "campaigns", type, "recent", limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (limit) params.set("limit", String(limit))
      const res = await fetch(`/api/email-proxy/campaigns/${type}/recent?${params.toString()}`)
      if (!res.ok) throw new Error(`Error al obtener emails recientes de ${type}`)
      return res.json() as Promise<CampaignRecentResponse>
    },
    enabled: !!type,
  })
}

export function useCampaignConfig() {
  return useQuery({
    queryKey: ["email", "campaigns", "config"],
    queryFn: async () => {
      const res = await fetch("/api/email-proxy/campaigns/config")
      if (!res.ok) throw new Error("Error al obtener configuración de campañas")
      return res.json() as Promise<CampaignConfigResponse>
    },
  })
}

export function useProcessCampaigns() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email-proxy/campaigns/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.status === 409) {
        const err = await res.json().catch(() => ({ error: "Proceso ya en ejecución" }))
        throw new Error(err.error || "Ya hay un proceso de campañas corriendo")
      }
      if (!res.ok) throw new Error("Error al procesar campañas")
      return res.json() as Promise<CampaignProcessResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "campaigns"] })
    },
  })
}

export function useCampaignForceSend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: CampaignType
      data: Record<string, unknown>
    }) => {
      const res = await fetch(`/api/email-proxy/campaigns/${type}/force-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al forzar envío de campaña")
      }
      return res.json() as Promise<CampaignForceSendResponse>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "campaigns"] })
    },
  })
}
