"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Pega al backend de Medusa (mismo patrón que GEO/Ranking): proxy /medusa + JWT.
// Reemplaza la versión anterior que pegaba al reseller-api (se da de baja).
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

const BASE = `${BACKEND_URL}/admin/ai-agents/employees`

export interface EmployeeBreakdown {
  id: string
  name: string
  sales: number
  commission: number
  orders: number
}

export interface EmployeeRow {
  id: string
  name: string
  email: string
  referral_code: string
  commission_percentage: number
  active: boolean
  total_sales_amount: number
  total_commissions_earned: number
  pending_balance: number
  total_orders: number
  by_channel: EmployeeBreakdown[]
  by_group: EmployeeBreakdown[]
  created_at: string
}

export interface EmployeesResponse {
  employees: EmployeeRow[]
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees", "list"],
    queryFn: async () => {
      const res = await fetch(BASE, { headers: authHeaders() })
      if (!res.ok) throw new Error("Error al obtener empleados")
      return res.json() as Promise<EmployeesResponse>
    },
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; email: string; commission_percentage?: number }) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || body.message || "Error al crear empleado")
      return body
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  })
}
