"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  CampaignStats,
  CampaignType,
  CampaignRecentResponse,
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
