"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

// ─── Types ───────────────────────────────────────────────────

interface AuthorizedOrderFilters {
  limit?: number
  offset?: number
}

// Campos livianos para la lista
const AUTHORIZED_ORDER_FIELDS =
  "id,display_id,email,total,currency_code,payment_status,created_at,*shipping_address,*items"

// ─── Queries ─────────────────────────────────────────────────

/**
 * Órdenes con payment_status "authorized" (esperando transferencia bancaria).
 * Usa filtro server-side para eficiencia.
 */
export function useAuthorizedOrders(filters: AuthorizedOrderFilters = {}) {
  return useQuery({
    queryKey: ["admin", "authorized-orders", filters],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/orders", {
        query: {
          payment_status: "authorized",
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          order: "-created_at",
          fields: AUTHORIZED_ORDER_FIELDS,
        },
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

/**
 * Detalle de una orden con payment_collections expandido.
 * Necesario para obtener el payment_id antes de capturar.
 */
export function useOrderPaymentDetails(orderId: string | undefined) {
  return useQuery({
    queryKey: ["admin", "order-payment-details", orderId],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/orders/${orderId}`, {
        query: {
          fields:
            "id,display_id,email,total,currency_code,*payment_collections,*payment_collections.payment_sessions,*payment_collections.payments",
        },
      })
      return (response as { order: any }).order
    },
    enabled: !!orderId,
  })
}

// ─── Mutations ───────────────────────────────────────────────

/**
 * Captura un pago. POST /admin/payments/{id}/capture
 */
export function useCapturePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await sdk.client.fetch(
        `/admin/payments/${paymentId}/capture`,
        { method: "POST", body: {} }
      )
      return response
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "authorized-orders"] })
      qc.invalidateQueries({ queryKey: ["admin", "pending-counts"] })
      qc.invalidateQueries({ queryKey: ["admin", "order-payment-details"] })
      qc.invalidateQueries({ queryKey: ["orders"] })
    },
  })
}

/**
 * Agrega una nota a una orden. POST /admin/notes
 * Se usa para auditoría: registrar quién capturó el pago.
 */
export function useAddOrderNote() {
  return useMutation({
    mutationFn: async ({
      orderId,
      value,
    }: {
      orderId: string
      value: string
    }) => {
      const response = await sdk.client.fetch("/admin/notes", {
        method: "POST",
        body: {
          resource_id: orderId,
          resource_type: "order",
          value,
        },
      })
      return response
    },
  })
}
