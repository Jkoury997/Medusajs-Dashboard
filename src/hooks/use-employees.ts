"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const BASE = "/api/reseller-proxy"

export interface EmployeeRow {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  referral_code: string
  status: string
  commission_percentage: number
  total_sales_amount: number
  total_commissions_earned: number
  total_commissions_paid: number
  pending_balance: number
  total_orders: number
  total_customers: number
  created_at: string
}

export interface EmployeesResponse {
  commission_percentage_default: number
  employees: EmployeeRow[]
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees", "list"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/admin/employees`)
      if (!res.ok) throw new Error("Error al obtener empleados")
      return res.json() as Promise<EmployeesResponse>
    },
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      email: string
      password: string
      first_name: string
      last_name: string
      commission_percentage?: number
    }) => {
      const res = await fetch(`${BASE}/admin/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || "Error al crear empleado")
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  })
}
