"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  usePhysicalResellers,
  useApprovePhysicalReseller,
  useRejectPhysicalReseller,
  useToggleResellerMap,
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
  tienda_fisica: "Tienda F\u00edsica",
  redes: "Solo Redes",
  distribuidor: "Distribuidor",
}

const MAP_CONFIG: Record<string, { label: string; className: string }> = {
  compras: { label: "Compras", className: "bg-amber-100 text-amber-700" },
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  })
}

export default function ResellersFisicasListaPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PhysicalResellerStatus | "">("")
  const [typeFilter, setTypeFilter] = useState<PhysicalResellerType | "">("")
  const [mapFilter, setMapFilter] = useState<
    "" | "visible" | "not_visible" | "disabled"
  >("")
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
  const toggleMap = useToggleResellerMap()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const isActioning = approve.isPending || reject.isPending

  const filtered = useMemo(() => {
    if (!data?.resellers) return []
    let list = data.resellers

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.business_name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.whatsapp?.includes(q)
      )
    }

    if (mapFilter === "visible") {
      list = list.filter((r) => !!r.visible_on_map)
    } else if (mapFilter === "not_visible") {
      list = list.filter((r) => !r.visible_on_map)
    } else if (mapFilter === "disabled") {
      list = list.filter((r) => r.map_enabled === false)
    }

    return list
  }, [data?.resellers, search, mapFilter])

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

  async function handleToggleMap(id: string, enabled: boolean) {
    setActionError(null)
    setTogglingId(id)
    try {
      await toggleMap.mutateAsync({ id, enabled })
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error al actualizar mapa")
    } finally {
      setTogglingId(null)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Revendedoras F\u00edsicas \u2014 Lista</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar revendedoras. Verific\u00e1 que la API est\u00e9 configurada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Revendedoras F\u00edsicas \u2014 Lista</h1>

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
          <option value="tienda_fisica">Tienda F\u00edsica</option>
          <option value="redes">Solo Redes</option>
          <option value="distribuidor">Distribuidor</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={mapFilter}
          onChange={(e) =>
            setMapFilter(
              e.target.value as "" | "visible" | "not_visible" | "disabled"
            )
          }
        >
          <option value="">Mapa: Todas</option>
          <option value="visible">Visibles en mapa</option>
          <option value="not_visible">No visibles</option>
          <option value="disabled">Deshabilitadas por admin</option>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Compras 30d</TableHead>
                  <TableHead className="text-right">Falta</TableHead>
                  <TableHead>Última compra</TableHead>
                  <TableHead className="text-right">Clicks 30d</TableHead>
                  <TableHead>Mapa</TableHead>
                  <TableHead>Acciones</TableHead>
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
                    const statusCfg = STATUS_CONFIG[r.status] ?? { label: r.status, className: "bg-gray-100 text-gray-500" }
                    const mapCfg = r.visible_on_map ? MAP_CONFIG[r.visible_on_map] : null
                    const purchase30d = r.purchase_last_30d ?? 0
                    const needed = r.purchase_needed_for_map ?? 0
                    const clicks = r.clicks_30d?.total ?? 0
                    return (
                      <TableRow key={r._id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/dashboard/resellers-fisicas/lista/${r._id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {r.business_name}
                          </Link>
                          <div className="text-xs text-gray-400">{r.email}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {TYPE_LABELS[r.type]}
                          </span>
                          {r.approximate_zone && (
                            <div className="text-xs text-gray-400 mt-1">{r.approximate_zone}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}
                          >
                            {statusCfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          <span className={purchase30d > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {formatCurrency(purchase30d)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {needed === 0 ? (
                            <span className="text-green-600 text-xs font-medium">OK</span>
                          ) : (
                            <span className="font-mono text-orange-600">{formatCurrency(needed)}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {r.last_order ? (
                            <div>
                              <div>{formatDateShort(r.last_order.date)}</div>
                              {r.last_order.total != null && (
                                <div className="text-xs text-gray-400 font-mono">
                                  {formatCurrency(r.last_order.total)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Sin pedidos</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <div className={clicks > 0 ? "font-medium" : "text-gray-400"}>{clicks}</div>
                          {r.clicks_30d && r.clicks_30d.whatsapp_clicks > 0 && (
                            <div className="text-xs text-green-600">
                              {r.clicks_30d.whatsapp_clicks} WA
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {mapCfg ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium text-center ${mapCfg.className}`}>
                                {mapCfg.label}
                              </span>
                            ) : (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 text-center"
                                title={r.not_visible_reason ?? "No visible"}
                              >
                                No
                              </span>
                            )}
                            {r.not_visible_reason && !mapCfg && (
                              <span className="text-[10px] text-gray-400 max-w-[140px] leading-tight">
                                {r.not_visible_reason}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
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
                            {r.status === "aprobada" && (
                              <button
                                className={`px-2 py-1 text-xs rounded text-white disabled:opacity-50 ${
                                  r.map_enabled
                                    ? "bg-orange-600 hover:bg-orange-700"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                                disabled={togglingId === r._id}
                                onClick={() => handleToggleMap(r._id, !r.map_enabled)}
                                title={
                                  r.map_enabled
                                    ? "Ocultar del mapa público"
                                    : "Mostrar en el mapa público"
                                }
                              >
                                {togglingId === r._id
                                  ? "..."
                                  : r.map_enabled
                                  ? "Ocultar mapa"
                                  : "Mostrar mapa"}
                              </button>
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
