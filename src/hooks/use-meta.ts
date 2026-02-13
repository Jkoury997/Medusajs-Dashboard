"use client"

import { useQuery } from "@tanstack/react-query"

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function useMetaOverview(from: Date, to: Date) {
  return useQuery({
    queryKey: ["meta", "overview", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/meta?type=overview&startDate=${formatDateParam(from)}&endDate=${formatDateParam(to)}`
      )
      if (!res.ok) throw new Error("Failed to fetch Meta overview")
      return res.json()
    },
  })
}

export function useMetaCampaigns(from: Date, to: Date) {
  return useQuery({
    queryKey: ["meta", "campaigns", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/meta?type=campaigns&startDate=${formatDateParam(from)}&endDate=${formatDateParam(to)}`
      )
      if (!res.ok) throw new Error("Failed to fetch Meta campaigns")
      return res.json()
    },
  })
}
