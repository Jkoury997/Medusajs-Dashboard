"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

export interface AdminPendingCounts {
  authorizedOrders: number
  pendingDocuments: number
  pendingWithdrawals: number // pending + approved (ambos necesitan acción)
  total: number
}

const RESELLER_BASE = "/api/reseller-proxy"

/**
 * Cuenta items pendientes para los badges del sidebar.
 * Medusa v2 no soporta filtro server-side por payment_status,
 * así que fetcheamos órdenes con campos mínimos y contamos client-side.
 */
export function useAdminPendingCounts() {
  return useQuery({
    queryKey: ["admin", "pending-counts"],
    queryFn: async (): Promise<AdminPendingCounts> => {
      // Lanzamos requests en paralelo
      const [authorizedCount, docsRes, wPendingRes, wApprovedRes] =
        await Promise.all([
          // Contar órdenes con payment_status "authorized" (client-side)
          countAuthorizedOrders(),

          // Documentos pendientes
          fetch(
            `${RESELLER_BASE}/admin/documents?status=pending&limit=1&offset=0`
          ).then((r) => r.json()) as Promise<{ count: number }>,

          // Retiros pendientes
          fetch(
            `${RESELLER_BASE}/admin/withdrawals?status=pending&limit=1&offset=0`
          ).then((r) => r.json()) as Promise<{ count: number }>,

          // Retiros aprobados (listos para pagar)
          fetch(
            `${RESELLER_BASE}/admin/withdrawals?status=approved&limit=1&offset=0`
          ).then((r) => r.json()) as Promise<{ count: number }>,
        ])

      const pendingDocuments = docsRes.count ?? 0
      const pendingWithdrawals =
        (wPendingRes.count ?? 0) + (wApprovedRes.count ?? 0)

      return {
        authorizedOrders: authorizedCount,
        pendingDocuments,
        pendingWithdrawals,
        total: authorizedCount + pendingDocuments + pendingWithdrawals,
      }
    },
    refetchInterval: 60_000, // Refrescar cada 60s
    staleTime: 30_000, // Considerar stale después de 30s
  })
}

/**
 * Fetchea todas las órdenes con campos mínimos y cuenta las que
 * tienen payment_status === "authorized".
 */
async function countAuthorizedOrders(): Promise<number> {
  let count = 0
  let offset = 0
  const limit = 100
  let total = Infinity

  while (offset < total) {
    const response = (await sdk.client.fetch("/admin/orders", {
      query: {
        limit,
        offset,
        fields: "id,payment_status",
      },
    })) as { orders: any[]; count: number }

    count += response.orders.filter(
      (o: any) => o.payment_status === "authorized"
    ).length
    total = response.count
    offset += limit
  }

  return count
}
