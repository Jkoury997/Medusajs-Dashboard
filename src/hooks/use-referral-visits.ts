"use client"

import { useQuery } from "@tanstack/react-query"

export interface ReferralVisitStats {
  total_visits: number
  unique_sessions: number
  top_landing_pages: { page: string; count: number }[]
  visits_by_day: { date: string; count: number }[]
}

/**
 * Obtiene estadísticas de visitas por código de referido.
 * Consulta eventos "referral.visited" del backend de analytics
 * filtrando por referral_code en los datos del evento.
 */
export function useReferralVisits(
  referralCode: string | undefined,
  from: Date,
  to: Date
) {
  return useQuery({
    queryKey: ["referral-visits", referralCode, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      // Traer todos los eventos referral.visited y filtrar por código
      const params = new URLSearchParams({
        event: "referral.visited",
        from: from.toISOString().split("T")[0],
        to: nextDay(to).toISOString().split("T")[0],
        limit: "10000",
        sort: "desc",
      })

      const res = await fetch(`/api/events-proxy/events?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener visitas de referido")

      const data = await res.json()
      const events: Array<{
        data: { referral_code?: string; landing_page?: string; page_url?: string }
        session_id?: string
        timestamp?: string
        created_at?: string
      }> = data.events ?? data.results ?? []

      // Filtrar por código de referido
      const filtered = events.filter(
        (e) => e.data?.referral_code === referralCode
      )

      // Calcular métricas
      const uniqueSessions = new Set(filtered.map((e) => e.session_id).filter(Boolean))

      // Top landing pages
      const pageCount: Record<string, number> = {}
      for (const e of filtered) {
        const page = e.data?.landing_page || e.data?.page_url || "/"
        pageCount[page] = (pageCount[page] || 0) + 1
      }
      const topLandingPages = Object.entries(pageCount)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Visitas por día
      const dayCount: Record<string, number> = {}
      for (const e of filtered) {
        const dateStr = (e.timestamp || e.created_at || "").split("T")[0]
        if (dateStr) {
          dayCount[dateStr] = (dayCount[dateStr] || 0) + 1
        }
      }
      const visitsByDay = Object.entries(dayCount)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return {
        total_visits: filtered.length,
        unique_sessions: uniqueSessions.size,
        top_landing_pages: topLandingPages,
        visits_by_day: visitsByDay,
      } as ReferralVisitStats
    },
    enabled: !!referralCode,
  })
}

function nextDay(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + 1)
  return d
}
