"use client"

import { useState } from "react"
import { useVouchers } from "@/hooks/use-resellers"
import type { VoucherStatus } from "@/types/reseller"
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

const VOUCHER_STATUS_CONFIG: Record<VoucherStatus, { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-green-100 text-green-700" },
  partially_used: { label: "Parcialmente Usado", className: "bg-blue-100 text-blue-700" },
  depleted: { label: "Agotado", className: "bg-gray-100 text-gray-600" },
  expired: { label: "Expirado", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-500" },
}

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export default function ResellersVouchersPage() {
  const [statusFilter, setStatusFilter] = useState<VoucherStatus | "">("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = useVouchers({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const count = data?.count ?? 0

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Vouchers</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar vouchers. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as VoucherStatus | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="partially_used">Parcialmente Usados</option>
          <option value="depleted">Agotados</option>
          <option value="expired">Expirados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Valor Original</TableHead>
                  <TableHead className="text-right">Valor Restante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead>Expiración</TableHead>
                  <TableHead>Creado</TableHead>
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
                ) : !data?.vouchers?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay vouchers
                    </TableCell>
                  </TableRow>
                ) : (
                  data.vouchers.map((v) => {
                    const statusCfg = VOUCHER_STATUS_CONFIG[v.status] ?? {
                      label: v.status,
                      className: "bg-gray-100 text-gray-600",
                    }
                    const isExpired = new Date(v.expires_at) < new Date()
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {v.code}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCentavos(v.original_value)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-sm ${
                            v.remaining_value === 0 ? "text-red-500" : ""
                          }`}
                        >
                          {formatCentavos(v.remaining_value)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{v.times_used}</TableCell>
                        <TableCell
                          className={`text-sm ${isExpired ? "text-red-500" : "text-gray-500"}`}
                        >
                          {formatDate(v.expires_at)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(v.created_at)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
