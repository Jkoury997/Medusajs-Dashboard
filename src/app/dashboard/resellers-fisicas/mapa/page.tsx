"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  usePhysicalResellersMap,
  useToggleResellerMap,
} from "@/hooks/use-resellers-fisicas"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ResellerMapDynamic } from "@/components/resellers-fisicas/reseller-map-dynamic"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
  aprobada: { label: "Aprobada", className: "bg-green-100 text-green-700" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700" },
}

const TYPE_LABELS: Record<string, string> = {
  tienda_fisica: "Tienda Física",
  redes: "Solo Redes",
  distribuidor: "Distribuidor",
}

type MapVisibilityFilter = "" | "visible" | "hidden" | "disabled"

export default function MapaResellersFisicasPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState<MapVisibilityFilter>("")

  const { data, isLoading, error } = usePhysicalResellersMap({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  })

  const toggleMap = useToggleResellerMap()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleToggle(id: string, enabled: boolean) {
    setActionError(null)
    setTogglingId(id)
    try {
      await toggleMap.mutateAsync({ id, enabled })
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error al actualizar")
    } finally {
      setTogglingId(null)
    }
  }

  const allResellers = data?.resellers ?? []

  const filteredResellers = useMemo(() => {
    let list = allResellers
    if (visibilityFilter === "visible") list = list.filter((r) => r.visible_on_map === "compras")
    else if (visibilityFilter === "hidden") list = list.filter((r) => !r.visible_on_map)
    else if (visibilityFilter === "disabled") list = list.filter((r) => r.map_enabled === false)
    return list
  }, [allResellers, visibilityFilter])

  const withLocation = filteredResellers.filter((r) => r.location?.coordinates)
  const withoutLocation = filteredResellers.filter((r) => !r.location?.coordinates)

  const summary = useMemo(() => {
    const visible = allResellers.filter((r) => r.visible_on_map === "compras").length
    const disabled = allResellers.filter((r) => r.map_enabled === false).length
    const locatedApproved = allResellers.filter(
      (r) => r.status === "aprobada" && r.active && r.location?.coordinates
    ).length
    return { visible, disabled, locatedApproved }
  }, [allResellers])

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Mapa de Revendedoras Físicas
        </h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar datos del mapa.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Mapa de Revendedoras Físicas
        </h1>
        <span className="text-sm text-gray-500">
          {filteredResellers.length} revendedoras ({withLocation.length} con ubicación)
        </span>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-2xl font-bold">{allResellers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">En mapa público</p>
            <p className="text-2xl font-bold text-green-600">{summary.visible}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Aprobadas con ubicación</p>
            <p className="text-2xl font-bold text-blue-600">{summary.locatedApproved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Deshabilitadas (admin)</p>
            <p className="text-2xl font-bold text-orange-600">{summary.disabled}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="aprobada">Aprobada</option>
          <option value="pendiente">Pendiente</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="tienda_fisica">Tienda Física</option>
          <option value="redes">Solo Redes</option>
          <option value="distribuidor">Distribuidor</option>
        </select>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value as MapVisibilityFilter)}
        >
          <option value="">Mapa: Todas</option>
          <option value="visible">Solo visibles</option>
          <option value="hidden">Solo ocultas</option>
          <option value="disabled">Deshabilitadas por admin</option>
        </select>
      </div>

      {/* Interactive map */}
      {isLoading ? (
        <div className="w-full h-[560px] rounded-lg border border-gray-200 bg-gray-100 animate-pulse" />
      ) : (
        <ResellerMapDynamic
          resellers={withLocation}
          onToggleMapEnabled={handleToggle}
          togglingId={togglingId}
        />
      )}

      {/* Resellers without location */}
      {withoutLocation.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-gray-900">
              Sin ubicación ({withoutLocation.length})
            </h2>
            <p className="text-sm text-gray-500">
              Estas revendedoras no tienen coordenadas y no pueden aparecer en el mapa.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>WhatsApp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withoutLocation.map((r) => {
                    const statusCfg =
                      STATUS_CONFIG[r.status] ?? {
                        label: r.status,
                        className: "bg-gray-100 text-gray-500",
                      }
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
                        <TableCell className="text-sm">
                          {TYPE_LABELS[r.type] ?? r.type}
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
                        <TableCell className="text-sm text-gray-500">
                          {r.whatsapp || "-"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
