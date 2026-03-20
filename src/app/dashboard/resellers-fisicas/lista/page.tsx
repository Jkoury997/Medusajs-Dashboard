"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  usePhysicalResellers,
  useApprovePhysicalReseller,
  useRejectPhysicalReseller,
} from "@/hooks/use-resellers-fisicas"
import type { PhysicalResellerStatus, PhysicalResellerType } from "@/types/reseller-fisicas"
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
  PhysicalResellerStatus,
  { label: string; className: string }
> = {
  aprobada: { label: "Aprobada", className: "bg-green-100 text-green-700" },
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700" },
}

const TYPE_LABELS: Record<PhysicalResellerType, string> = {
  tienda_fisica: "Tienda Física",
  redes: "Solo Redes",
}

export default function ResellersFisicasListaPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PhysicalResellerStatus | "">("")
  const [typeFilter, setTypeFilter] = useState<PhysicalResellerType | "">("")
  const [offset, setOffset] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, error } = usePhysicalResellers({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    limit: PAGE_SIZE,
    offset,
  })

  const approve = useApprovePhysicalReseller()
  const reject = useRejectPhysicalReseller()
  const isActioning = approve.isPending || reject.isPending

  const filtered = useMemo(() => {
    if (!data?.resellers) return []
    if (!search.trim()) return data.resellers
    const q = search.toLowerCase()
    return data.resellers.filter(
      (r) =>
        r.business_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.whatsapp?.includes(q)
    )
  }, [data?.resellers, search])

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Revendedoras Físicas — Lista</h1>
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
      <h1 className="text-2xl font-bold text-gray-900">Revendedoras Físicas — Lista</h1>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nombre, email o WhatsApp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as PhysicalResellerStatus | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los estados</option>
          <option value="aprobada">Aprobadas</option>
          <option value="pendiente">Pendientes</option>
          <option value="rechazada">Rechazadas</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as PhysicalResellerType | "")
            setOffset(0)
          }}
        >
          <option value="">Todos los tipos</option>
          <option value="tienda_fisica">Tienda Física</option>
          <option value="redes">Solo Redes</option>
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
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Zona</TableHead>
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
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No se encontraron revendedoras
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const statusCfg = STATUS_CONFIG[r.status] ?? { label: r.status, className: "bg-gray-100 text-gray-500" }
                    return (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/resellers-fisicas/lista/${r._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {r.business_name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{r.email}</TableCell>
                        <TableCell className="text-sm">{r.whatsapp}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {TYPE_LABELS[r.type]}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {r.approximate_zone || "-"}
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
                            {r.status === "pendiente" && (
                              <>
                                <button
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() => handleApprove(r._id)}
                                >
                                  Aprobar
                                </button>
                                <button
                                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded disabled:opacity-50"
                                  disabled={isActioning}
                                  onClick={() => handleReject(r._id)}
                                >
                                  Rechazar
                                </button>
                              </>
                            )}
                            <Link
                              href={`/dashboard/resellers-fisicas/lista/${r._id}`}
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
