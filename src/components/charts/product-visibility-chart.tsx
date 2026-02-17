"use client"

import { useMemo } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ProductVisibilityStats } from "@/types/events"
import { formatNumber } from "@/lib/format"
import { useProductsByIds } from "@/hooks/use-products-by-ids"

interface ProductVisibilityChartProps {
  data: ProductVisibilityStats
  /** Fallback: mapa product_id → title del Events backend (para cuando Medusa SDK falla) */
  titleFallbacks?: Map<string, string>
}

// Semáforo de visibilidad: verde >70%, amarillo 40-70%, rojo <40%
function getVisibilityColor(rate: string): { bg: string; text: string; label: string } {
  const num = parseFloat(rate)
  if (num >= 70) return { bg: "bg-green-100", text: "text-green-700", label: "Alta" }
  if (num >= 40) return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Media" }
  return { bg: "bg-red-100", text: "text-red-700", label: "Baja" }
}

// Color para barras del chart
function getBarColor(rate: number): string {
  if (rate >= 70) return "#22c55e"
  if (rate >= 40) return "#eab308"
  return "#ef4444"
}

export function ProductVisibilityChart({ data, titleFallbacks }: ProductVisibilityChartProps) {
  // Extraer IDs únicos para buscar en Medusa
  const productIds = useMemo(
    () => data.product_visibility.map((p) => p.product_id),
    [data.product_visibility]
  )

  const { data: productsMap, isLoading: productsLoading } = useProductsByIds(productIds)

  const getName = (id: string) => {
    const info = productsMap?.get(id)
    if (info?.title) return info.title
    // Fallback: título del Events backend
    if (titleFallbacks?.has(id)) return titleFallbacks.get(id)!
    // Último recurso: ID truncado
    return id.length > 20 ? "..." + id.slice(-12) : id
  }

  const getExternalId = (id: string) => {
    return productsMap?.get(id)?.external_id || ""
  }

  const getThumbnail = (id: string) => {
    return productsMap?.get(id)?.thumbnail || null
  }

  const chartData = data.product_visibility.slice(0, 10).map((p) => {
    const name = getName(p.product_id)
    const shortName = name.length > 25 ? name.substring(0, 22) + "..." : name
    return {
      name: shortName,
      fullName: name,
      visibility: parseFloat(p.visibility_rate),
    }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{formatNumber(data.avg_products_total)}</p>
            <p className="text-sm text-gray-500">Productos en la Página</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{data.avg_products_seen.toFixed(1)}</p>
            <p className="text-sm text-gray-500">Productos Vistos (Promedio)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {(() => {
              const color = getVisibilityColor(data.visibility_rate)
              return (
                <p className={`text-2xl font-bold ${color.text}`}>{data.visibility_rate}</p>
              )
            })()}
            <p className="text-sm text-gray-500">Tasa de Visibilidad</p>
            <p className="text-xs text-gray-400 mt-1">
              ~{Math.round(data.avg_products_seen)} de {Math.round(data.avg_products_total)} productos vistos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leyenda semáforo */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500" /> Alta (&gt;70%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-yellow-500" /> Media (40-70%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Baja (&lt;40%)
        </span>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibilidad por Producto (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" fontSize={10} width={160} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Visibilidad"]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item?.fullName || label
                    }}
                  />
                  <Bar dataKey="visibility" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={getBarColor(entry.visibility)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.product_visibility.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Detalle de Productos ({formatNumber(data.total_observations)} observaciones)
              {productsLoading && (
                <span className="text-sm font-normal text-gray-400 ml-2">
                  Cargando nombres...
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>External ID</TableHead>
                  <TableHead className="text-right">Veces Visto</TableHead>
                  <TableHead className="text-right">Visibilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.product_visibility.map((p, idx) => {
                  const thumbnail = getThumbnail(p.product_id)
                  const externalId = getExternalId(p.product_id)

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {thumbnail ? (
                            <Image
                              src={thumbnail}
                              alt={getName(p.product_id)}
                              width={40}
                              height={40}
                              className="rounded object-cover"
                              style={{ width: 40, height: 40 }}
                              unoptimized
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                              📦
                            </div>
                          )}
                          <span className="text-sm font-medium max-w-[200px] truncate">
                            {getName(p.product_id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 font-mono">
                        {externalId || "-"}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(p.times_seen)}</TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const color = getVisibilityColor(p.visibility_rate)
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${color.bg} ${color.text}`}>
                              {p.visibility_rate}
                              <span className="text-[10px] font-normal opacity-70">{color.label}</span>
                            </span>
                          )
                        })()}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {formatNumber(p.times_seen)} / {formatNumber(data.total_observations)} obs.
                        </p>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
