"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  useDistributors,
  useApproveDistributor,
  useRejectDistributor,
} from "@/hooks/use-distributors"
import type { DistributorStatus } from "@/types/distributors"
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

const STATUS_CONFIG: Record<
  DistributorStatus,
  { label: string; className: string }
> = {
  aprobada: { label: "Aprobado", className: "bg-green-100 text-green-700" },
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  rechazada: { label: "Rechazado", className: "bg-red-100 text-red-700" },
}

export default function DistribuidoresListaPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DistributorStatus | "">("")
  const [offset, setOffset] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, error } = useDistributors({
    status: statusFilter || undefined,
    search: search.trim() || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const approve = useApproveDistributor()
  const reject = useRejectDistributor()
  const isActioning = approve.isPending || reject.isPending

  const distributors = data?.distributors ?? []
  const count = data?.count ?? 0

  async function handleApprove(id: string) {
    setActionError(null)
    try {
      await approve.mutateAsync(id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al aprobar")
    }
  }

  async function handleReject(id: string) {
    setActionError(null)
    try {
      await reject.mutateAsync(id)
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al rechazar")
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Distribuidores</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar distribuidores. Verificá que la API esté configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Distribuidores</h1>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre, email o CUIT..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOffset(0)
          }}
          className="max-w-sm"
        />
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as DistributorStatus | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="aprobada">Aprobados</option>
          <option value="pendiente">Pendientes</option>
          <option value="rechazada">Rechazados</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead className="text-center">Sucursales</TableHead>
                  <TableHead>Estado</TableHead>
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
                ) : distributors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron distribuidores
                    </TableCell>
                  </TableRow>
                ) : (
                  distributors.map((d) => {
                    const statusCfg = STATUS_CONFIG[d.status] ?? {
                      label: d.status,
                      className: "bg-gray-100 text-gray-500",
                    }
                    return (
                      <TableRow key={d._id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/resellers-fisicas/distribuidores/${d._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {d.business_name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{d.email}</TableCell>
                        <TableCell className="text-sm font-mono">{d.cuit}</TableCell>
                        <TableCell className="text-sm">{d.whatsapp}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {d.branch_count ?? 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {d.status === "pendiente" && (
                              <>
                                <button
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() => handleApprove(d._id)}
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() => handleReject(d._id)}
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            <Link
                              href={`/dashboard/resellers-fisicas/distribuidores/${d._id}`}
                              className="px-2 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
                            >
                              Ver
                            </Link>
                          </div>
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
