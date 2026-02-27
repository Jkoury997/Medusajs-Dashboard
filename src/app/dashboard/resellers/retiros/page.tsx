"use client"

import { useState } from "react"
import { useWithdrawals } from "@/hooks/use-resellers"
import type { WithdrawalStatus } from "@/types/reseller"
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

const STATUS_CONFIG: Record<WithdrawalStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  approved: { label: "Aprobado", className: "bg-blue-100 text-blue-700" },
  paid: { label: "Pagado", className: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazado", className: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelado", className: "bg-gray-100 text-gray-600" },
}

const STATUS_TABS: { value: WithdrawalStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "paid", label: "Pagados" },
  { value: "rejected", label: "Rechazados" },
]

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

export default function ResellersRetirosPage() {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | "">("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = useWithdrawals({
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const count = data?.count ?? 0

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Retiros</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar retiros. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Retiros</h1>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.value
                ? "border-mk-pink text-mk-pink"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setStatusFilter(tab.value)
              setOffset(0)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Revendedora</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Primer Retiro</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Fecha</TableHead>
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
                ) : !data?.withdrawals?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No hay retiros
                    </TableCell>
                  </TableRow>
                ) : (
                  data.withdrawals.map((w) => {
                    const statusCfg = STATUS_CONFIG[w.status] ?? {
                      label: w.status,
                      className: "bg-gray-100 text-gray-600",
                    }
                    return (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium">
                          {w.reseller
                            ? `${w.reseller.first_name} ${w.reseller.last_name}`
                            : w.reseller_id.slice(0, 12) + "..."}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCentavos(w.requested_amount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {w.payment_method ?? "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {w.is_first_withdrawal ? (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Sí
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-sm text-gray-500 max-w-[200px] truncate"
                          title={w.reseller_notes ?? ""}
                        >
                          {w.reseller_notes || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(w.created_at)}
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
