"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

// ─── Fields ──────────────────────────────────────────────────

// Campos livianos para la lista
const AUTHORIZED_ORDER_FIELDS =
  "id,display_id,email,total,currency_code,payment_status,created_at,*shipping_address,*items"

// ─── Queries ─────────────────────────────────────────────────

/**
 * Órdenes con payment_status "authorized" (esperando transferencia bancaria).
 * Medusa v2 no soporta filtro server-side por payment_status,
 * así que fetcheamos todas las órdenes y filtramos client-side.
 */
export function useAuthorizedOrders() {
  return useQuery({
    queryKey: ["admin", "authorized-orders"],
    queryFn: async () => {
      const allOrders: any[] = []
      let offset = 0
      const limit = 100
      let total = Infinity

      while (offset < total) {
        const response = (await sdk.client.fetch("/admin/orders", {
          query: {
            limit,
            offset,
            order: "-created_at",
            fields: AUTHORIZED_ORDER_FIELDS,
          },
        })) as { orders: any[]; count: number }

        allOrders.push(...response.orders)
        total = response.count
        offset += limit
      }

      // Filtrar client-side por payment_status === "authorized"
      return allOrders.filter(
        (order: any) => order.payment_status === "authorized"
      )
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
