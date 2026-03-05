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

export function useAdminPendingCounts() {
  return useQuery({
    queryKey: ["admin", "pending-counts"],
    queryFn: async (): Promise<AdminPendingCounts> => {
      // Lanzamos 4 requests en paralelo, cada uno con limit=1 para minimizar payload
      const [ordersRes, docsRes, wPendingRes, wApprovedRes] = await Promise.all([
        // Órdenes con pago autorizado
        sdk.client.fetch("/admin/orders", {
          query: {
            payment_status: "authorized",
            limit: 1,
            offset: 0,
            fields: "id",
          },
        }) as Promise<{ count: number }>,

        // Documentos pendientes
        fetch(`${RESELLER_BASE}/admin/documents?status=pending&limit=1&offset=0`)
          .then((r) => r.json()) as Promise<{ count: number }>,

        // Retiros pendientes
        fetch(`${RESELLER_BASE}/admin/withdrawals?status=pending&limit=1&offset=0`)
          .then((r) => r.json()) as Promise<{ count: number }>,

        // Retiros aprobados (listos para pagar)
        fetch(`${RESELLER_BASE}/admin/withdrawals?status=approved&limit=1&offset=0`)
          .then((r) => r.json()) as Promise<{ count: number }>,
      ])

      const authorizedOrders = ordersRes.count ?? 0
      const pendingDocuments = docsRes.count ?? 0
      const pendingWithdrawals =
        (wPendingRes.count ?? 0) + (wApprovedRes.count ?? 0)

      return {
        authorizedOrders,
        pendingDocuments,
        pendingWithdrawals,
        total: authorizedOrders + pendingDocuments + pendingWithdrawals,
      }
    },
    refetchInterval: 60_000, // Refrescar cada 60s
    staleTime: 30_000, // Considerar stale después de 30s
  })
}
