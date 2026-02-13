"use client"

import { useQuery } from "@tanstack/react-query"

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function useGA4Overview(from: Date, to: Date) {
  return useQuery({
    queryKey: ["ga4", "overview", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/ga4?type=overview&startDate=${formatDateParam(from)}&endDate=${formatDateParam(to)}`
      )
      if (!res.ok) throw new Error("Failed to fetch GA4 overview")
      return res.json()
    },
  })
}

export function useGA4Traffic(from: Date, to: Date) {
  return useQuery({
    queryKey: ["ga4", "traffic", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/ga4?type=traffic&startDate=${formatDateParam(from)}&endDate=${formatDateParam(to)}`
      )
      if (!res.ok) throw new Error("Failed to fetch GA4 traffic")
      return res.json()
    },
  })
}

export function useGA4Devices(from: Date, to: Date) {
  return useQuery({
    queryKey: ["ga4", "devices", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/ga4?type=devices&startDate=${formatDateParam(from)}&endDate=${formatDateParam(to)}`
      )
      if (!res.ok) throw new Error("Failed to fetch GA4 devices")
      return res.json()
    },
  })
}
