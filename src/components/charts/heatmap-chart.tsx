"use client"

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
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  const viewportData = [
    { name: "Móvil", value: data.viewport.mobile, color: "#ff75a8" },
    { name: "Tablet", value: data.viewport.tablet, color: "#16a34a" },
    { name: "Escritorio", value: data.viewport.desktop, color: "#eab308" },
  ].filter((item) => item.value > 0)

  return (
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
          {data.by_element.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Texto/ID</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.by_element.slice(0, 10).map((el, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{el.element_tag}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">
                      {el.element_text}
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
          <CardTitle className="text-base">Distribución por Dispositivo</CardTitle>
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
  )
}
