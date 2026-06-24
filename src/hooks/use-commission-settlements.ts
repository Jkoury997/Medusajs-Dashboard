"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

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

const BASE = `${BACKEND_URL}/admin/ai-agents/employees/settlements`

export interface MonthSummary {
  period: string
  pending_amount: number
  pending_count: number
  paid_amount: number
  paid_count: number
  total_amount: number
  total_count: number
}

export interface SettlementDetail {
  employee_id: string
  name: string
  email: string | null
  referral_code: string | null
  pending_amount: number
  pending_count: number
  paid_amount: number
  paid_count: number
  total_amount: number
}

export interface SettlementRecord {
  id: string
  employee_id: string
  employee_name: string
  period: string
  total_amount: number
  commission_count: number
  status: string
  payment_reference: string | null
  payment_notes: string | null
  created_at: string
}

export interface SettlementsResponse {
  months: MonthSummary[]
  month: string | null
  detail: SettlementDetail[]
  settlements: SettlementRecord[]
}

export function useSettlements(month?: string) {
  return useQuery({
    queryKey: ["settlements", month ?? null],
    queryFn: async () => {
      const url = month ? `${BASE}?month=${encodeURIComponent(month)}` : BASE
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error al obtener liquidaciones")
      return res.json() as Promise<SettlementsResponse>
    },
  })
}

export function useLiquidar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      period: string
      employee_id?: string
      payment_reference?: string
      payment_notes?: string
    }) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || body.message || "Error al liquidar")
      return body as { created: unknown[]; settled_count: number; settled_amount: number }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settlements"] })
      qc.invalidateQueries({ queryKey: ["employees"] })
    },
  })
}
