"use client"

import { useState } from "react"
import Link from "next/link"
import { usePhysicalResellerSales } from "@/hooks/use-resellers-fisicas"
import type { ResellerSaleStatus, SaleChannel } from "@/types/reseller-fisicas"
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

const STATUS_CONFIG: Record<ResellerSaleStatus, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  completada: { label: "Completada", className: "bg-green-100 text-green-700" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700" },
}

const CHANNEL_LABELS: Record<SaleChannel, string> = {
  tienda_fisica: "Tienda",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  otro: "Otro",
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
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

export default function VentasResellersFisicasPage() {
  const [statusFilter, setStatusFilter] = useState<ResellerSaleStatus | "">("")
  const [channelFilter, setChannelFilter] = useState<SaleChannel | "">("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = usePhysicalResellerSales({
    status: statusFilter || undefined,
    channel: channelFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const count = data?.count ?? 0

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ventas de Revendedoras Físicas</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar ventas.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Ventas de Revendedoras Físicas</h1>

      <div className="flex flex-wrap gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ResellerSaleStatus | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="completada">Completadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value as SaleChannel | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los canales</option>
          <option value="tienda_fisica">Tienda Física</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendedora</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.sales?.length ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No hay ventas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  data.sales.map((sale) => {
                    const reseller = typeof sale.reseller_id === "object" ? sale.reseller_id : null
                    const statusCfg = STATUS_CONFIG[sale.status] ?? { label: sale.status, className: "bg-gray-100 text-gray-500" }

                    return (
                      <TableRow key={sale._id}>
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
                        <TableCell className="text-sm text-gray-500">{formatDate(sale.date)}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {sale.items.map((i) => `${i.quantity}x ${i.product_title}`).join(", ")}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {CHANNEL_LABELS[sale.channel] || sale.channel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              sale.origin === "whatsapp_locator"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sale.origin === "whatsapp_locator" ? "Localizador" : "Manual"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {sale.customer_name || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(sale.total)}</TableCell>
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
