"use client"

import { useQuery } from "@tanstack/react-query"

const BASE = "/api/campaigns-proxy"

export interface AggregatedEmailStats {
  total_campaigns: number
  campaigns_by_status: Record<string, number>
  total_sent: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  total_bounced: number
  avg_open_rate: string
  avg_click_rate: string
  avg_bounce_rate: string
  recent_campaigns: Array<{
    _id: string
    name: string
    status: string
    total_sent: number
    open_rate: string
    click_rate: string
    sending_completed_at: string | null
    created_at: string
  }>
}

export function useAggregatedEmailStats() {
  return useQuery({
    queryKey: ["email-stats", "aggregated"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/stats/aggregated`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al obtener estadísticas agregadas")
      }
      return res.json() as Promise<AggregatedEmailStats>
    },
    staleTime: 60_000,
  })
}
