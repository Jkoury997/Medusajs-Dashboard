"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

interface OrderFilters {
  from?: Date
  to?: Date
  status?: string
  limit?: number
  offset?: number
}

// Campos que necesitamos de las órdenes para el dashboard
const ORDER_FIELDS =
  "id,customer_id,email,total,subtotal,currency_code,status,payment_status,fulfillment_status,created_at,display_id,*items"

export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        limit: filters.limit || 100,
        offset: filters.offset || 0,
        order: "-created_at",
        fields: ORDER_FIELDS,
      }

      if (filters.from || filters.to) {
        const created_at: Record<string, string> = {}
        if (filters.from) created_at["$gte"] = filters.from.toISOString()
        if (filters.to) created_at["$lte"] = filters.to.toISOString()
        params.created_at = created_at
      }

      if (filters.status) {
        params.status = filters.status
      }

      const response = await sdk.client.fetch("/admin/orders", {
        query: params,
      })

      return response as {
        orders: any[]
        count: number
        offset: number
        limit: number
      }
    },
  })
}

export function useAllOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["orders", "all", filters],
    queryFn: async () => {
      const allOrders: any[] = []
      let offset = 0
      const limit = 100
      let total = Infinity

      while (offset < total) {
        const params: Record<string, unknown> = {
          limit,
          offset,
          order: "-created_at",
          fields: ORDER_FIELDS,
        }

        if (filters.from || filters.to) {
          const created_at: Record<string, string> = {}
          if (filters.from) created_at["$gte"] = filters.from.toISOString()
          if (filters.to) created_at["$lte"] = filters.to.toISOString()
          params.created_at = created_at
        }

        const response = (await sdk.client.fetch("/admin/orders", {
          query: params,
        })) as { orders: any[]; count: number }

        allOrders.push(...response.orders)
        total = response.count
        offset += limit
      }

      return allOrders
    },
  })
}
