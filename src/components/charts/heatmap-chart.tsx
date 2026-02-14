"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { HeatmapStats } from "@/types/events"
import { formatNumber } from "@/lib/format"

interface HeatmapChartProps {
  data: HeatmapStats
  heatmapUrl?: string | null
}

export function HeatmapChart({ data, heatmapUrl }: HeatmapChartProps) {
  // Agrupar clicks por el_tag + el_text para tabla de elementos
  const elementGroups = useMemo(() => {
    const groups = new Map<string, { el_tag: string; el_text: string; count: number }>()
    data.clicks.forEach((c) => {
      const key = `${c.el_tag}|${c.el_text}`
      const existing = groups.get(key)
      if (existing) {
        existing.count += c.count
      } else {
        groups.set(key, { el_tag: c.el_tag, el_text: c.el_text, count: c.count })
      }
    })
    return Array.from(groups.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [data.clicks])

  // Colores para viewport breakdown
  const VIEWPORT_COLORS = ["#ff75a8", "#16a34a", "#eab308", "#3b82f6", "#8b5cf6"]

  const viewportData = data.viewport_breakdown
    .filter((v) => v.clicks > 0)
    .map((v, idx) => ({
      name: v.vw_range,
      value: v.clicks,
      color: VIEWPORT_COLORS[idx % VIEWPORT_COLORS.length],
    }))

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Elementos Más Clickeados
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({formatNumber(data.total_clicks)} clicks totales)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {elementGroups.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Texto</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elementGroups.map((el, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{el.el_tag}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {el.el_text || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(el.count)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500 py-4">Sin datos de elementos</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución por Viewport</CardTitle>
        </CardHeader>
        <CardContent>
          {viewportData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={viewportData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${formatNumber(value)}`}
                  >
                    {viewportData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Sin datos de viewport</p>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Mapa Visual de Calor (reporte HTML generado por el backend) */}
    {heatmapUrl && (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Mapa Visual de Calor</CardTitle>
            <a
              href={heatmapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-pink-500 hover:text-pink-600 underline"
            >
              Abrir en nueva pestaña
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <iframe
            src={heatmapUrl}
            title="Mapa de calor visual"
            className="w-full rounded border"
            style={{ height: 700, border: "none" }}
          />
        </CardContent>
      </Card>
    )}
    </div>
  )
}
