"use client"

import { useState } from "react"
import Link from "next/link"
import { usePhysicalResellersMap } from "@/hooks/use-resellers-fisicas"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-gray-100 text-gray-700" },
  aprobada: { label: "Aprobada", className: "bg-green-100 text-green-700" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700" },
}

const TYPE_LABELS: Record<string, string> = {
  tienda_fisica: "Tienda Física",
  redes: "Solo Redes",
}

export default function MapaResellersFisicasPage() {
  const [statusFilter, setStatusFilter] = useState("")
  const { data, isLoading, error } = usePhysicalResellersMap(statusFilter || undefined)

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mapa de Revendedoras Físicas</h1>
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar datos del mapa.
          </CardContent>
        </Card>
      </div>
    )
  }

  const resellers = data?.resellers ?? []
  const withLocation = resellers.filter((r) => r.location?.coordinates)
  const withoutLocation = resellers.filter((r) => !r.location?.coordinates)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mapa de Revendedoras Físicas</h1>
        <span className="text-sm text-gray-500">
          {resellers.length} revendedoras ({withLocation.length} con ubicación)
        </span>
      </div>

      <div className="flex gap-3">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="rechazada">Rechazada</option>
        </select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Total Revendedoras</p>
                <p className="text-2xl font-bold">{resellers.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Con Ubicación</p>
                <p className="text-2xl font-bold text-green-600">{withLocation.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">Sin Ubicación</p>
                <p className="text-2xl font-bold text-orange-500">{withoutLocation.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Resellers Table with stock info */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Dirección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Stock Total</TableHead>
                      <TableHead>WhatsApp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resellers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No hay revendedoras
                        </TableCell>
                      </TableRow>
                    ) : (
                      resellers.map((r) => {
                        const statusCfg = STATUS_CONFIG[r.status] ?? { label: r.status, className: "bg-gray-100 text-gray-500" }
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">
                              <Link
                                href={`/dashboard/resellers-fisicas/lista/${r.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {r.business_name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-sm">{TYPE_LABELS[r.type] ?? r.type}</TableCell>
                            <TableCell className="text-sm text-gray-500">{r.approximate_zone || "-"}</TableCell>
                            <TableCell className="text-sm text-gray-500 max-w-xs truncate">{r.address || "-"}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{r.product_count}</TableCell>
                            <TableCell className="text-sm font-medium">{r.total_stock}</TableCell>
                            <TableCell className="text-sm text-gray-500">{r.whatsapp || "-"}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
