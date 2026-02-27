"use client"

import { useState, useMemo } from "react"
import { useResellers, useResellerTypes } from "@/hooks/use-resellers"
import type { ResellerStatus } from "@/types/reseller"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

const STATUS_CONFIG: Record<ResellerStatus, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-green-100 text-green-700" },
  pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  suspended: { label: "Suspendida", className: "bg-red-100 text-red-700" },
  rejected: { label: "Rechazada", className: "bg-gray-100 text-gray-600" },
}

function formatCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export default function ResellersListaPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ResellerStatus | "">("")
  const [typeFilter, setTypeFilter] = useState("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, error } = useResellers({
    status: statusFilter || undefined,
    reseller_type_id: typeFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const { data: types } = useResellerTypes()

  const filtered = useMemo(() => {
    if (!data?.resellers) return []
    if (!search.trim()) return data.resellers
    const q = search.toLowerCase()
    return data.resellers.filter(
      (r) =>
        r.first_name?.toLowerCase().includes(q) ||
        r.last_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.referral_code?.toLowerCase().includes(q)
    )
  }, [data?.resellers, search])

  const count = data?.count ?? 0

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Lista de Revendedoras</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar revendedoras. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Lista de Revendedoras</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre, email o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as ResellerStatus | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="pending">Pendientes</option>
          <option value="suspended">Suspendidas</option>
          <option value="rejected">Rechazadas</option>
        </select>
        {types && types.length > 0 && (
          <select
            className="border rounded-md px-3 py-2 text-sm bg-white"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setOffset(0)
            }}
          >
            <option value="">Todos los tipos</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.display_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead className="text-right">Saldo Pendiente</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-center">Pedidos</TableHead>
                  <TableHead>Código</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron revendedoras
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const statusCfg = STATUS_CONFIG[r.status] ?? {
                      label: r.status,
                      className: "bg-gray-100 text-gray-600",
                    }
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.first_name} {r.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {r.email}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {r.type?.display_name ?? "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCentavos(r.total_sales_amount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCentavos(r.pending_balance)}
                        </TableCell>
                        <TableCell className="text-center">{r.total_customers}</TableCell>
                        <TableCell className="text-center">{r.total_orders}</TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {r.referral_code}
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
