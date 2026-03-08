"use client"

import { useState } from "react"
import Link from "next/link"
import { usePhysicalResellerOrders, useMarkOrderShipped, useConfirmOrderDelivery } from "@/hooks/use-resellers-fisicas"
import type { ResellerOrderStatus } from "@/types/reseller-fisicas"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

const STATUS_CONFIG: Record<ResellerOrderStatus, { label: string; className: string }> = {
  pagado: { label: "Pagado", className: "bg-blue-100 text-blue-700" },
  enviado: { label: "Enviado", className: "bg-yellow-100 text-yellow-700" },
  entregado: { label: "Entregado", className: "bg-green-100 text-green-700" },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function PedidosResellersFisicasPage() {
  const [statusFilter, setStatusFilter] = useState<ResellerOrderStatus | "">("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = usePhysicalResellerOrders({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const markShipped = useMarkOrderShipped()
  const confirmDelivery = useConfirmOrderDelivery()
  const count = data?.count ?? 0

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pedidos de Revendedoras Físicas</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar pedidos.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Pedidos de Revendedoras Físicas</h1>

      <div className="flex gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ResellerOrderStatus | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="pagado">Pagado</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendedora</TableHead>
                  <TableHead>Orden Medusa</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.orders?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  data.orders.map((order) => {
                    const reseller = typeof order.reseller_id === "object" ? order.reseller_id : null
                    const statusCfg = STATUS_CONFIG[order.status]

                    return (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          {reseller ? (
                            <Link
                              href={`/dashboard/resellers-fisicas/lista/${reseller._id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {reseller.business_name}
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{order.medusa_order_id}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {order.items.map((i) => `${i.quantity}x ${i.product_title}`).join(", ")}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(order.created_at)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {order.delivery_confirmed_date
                            ? formatDate(order.delivery_confirmed_date)
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.status === "pagado" && (
                              <button
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                                disabled={markShipped.isPending}
                                onClick={() => markShipped.mutate(order._id)}
                              >
                                Marcar Enviado
                              </button>
                            )}
                            {order.status === "enviado" && (
                              <button
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                                disabled={confirmDelivery.isPending}
                                onClick={() => confirmDelivery.mutate(order._id)}
                              >
                                Confirmar Entrega
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {count > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-gray-500">
                Mostrando {offset + 1}-{Math.min(offset + PAGE_SIZE, count)} de {count}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  Anterior
                </button>
                <button
                  className="px-3 py-1 text-sm border rounded-md disabled:opacity-50"
                  disabled={offset + PAGE_SIZE >= count}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
