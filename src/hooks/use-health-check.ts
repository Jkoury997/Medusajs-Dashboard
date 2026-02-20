"use client"

import { useQuery } from "@tanstack/react-query"
import type { HealthCheckResponse } from "@/types/email-marketing"

export function useHealthCheck() {
  return useQuery({
    queryKey: ["email", "health"],
    queryFn: async () => {
      const res = await fetch("/api/health-check")
      if (!res.ok) throw new Error("Error al verificar estado del servicio")
      return res.json() as Promise<HealthCheckResponse>
    },
    refetchInterval: 60_000,
  })
}
