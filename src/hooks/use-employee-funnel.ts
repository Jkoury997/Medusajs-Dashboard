"use client"

import { useQuery } from "@tanstack/react-query"

// Mismo patrón que use-employees: proxy /medusa + JWT en localStorage.
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

const BASE = `${BACKEND_URL}/admin/ai-agents/employees/funnel`

export interface FunnelBucket {
  id: string
  name: string
  carts: number
  completed: number
  abandoned: number
  conversion_rate: number // %
  completed_sales_amount: number // ARS (no centavos)
}

export interface FunnelEmployeeBucket extends FunnelBucket {
  referral_code: string
  employee_id: string | null
  email: string | null
  active: boolean | null
}

export interface FunnelResponse {
  range: { days: number; from: string; to: string }
  filters: { referral_code: string | null; sales_channel_id: string | null }
  truncated: boolean
  totals: {
    referral_carts: number
    completed: number
    abandoned: number
    conversion_rate: number
    completed_sales_amount: number
  }
  by_channel: FunnelBucket[]
  by_group: FunnelBucket[]
  by_employee: FunnelEmployeeBucket[]
}

export function useEmployeeFunnel(days: number) {
  return useQuery({
    queryKey: ["employees", "funnel", days],
    queryFn: async () => {
      const res = await fetch(`${BASE}?days=${days}`, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error al obtener el funnel de empleados")
      return res.json() as Promise<FunnelResponse>
    },
  })
}
