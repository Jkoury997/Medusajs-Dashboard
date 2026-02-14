"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { ProductVisibilityStats } from "@/types/events"
import { formatNumber } from "@/lib/format"

interface ProductVisibilityChartProps {
  data: ProductVisibilityStats
}

export function ProductVisibilityChart({ data }: ProductVisibilityChartProps) {
  const chartData = data.products.slice(0, 10).map((p) => ({
    name: p.title.length > 25 ? p.title.substring(0, 25) + "..." : p.title,
    visibility: parseFloat(p.visibility_pct),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{formatNumber(data.total_products)}</p>
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
            <p className="text-2xl font-bold">{data.visibility_rate}%</p>
            <p className="text-sm text-gray-500">Tasa de Visibilidad</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibilidad por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={140} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Visibilidad"]}
                  />
                  <Bar dataKey="visibility" fill="#ff75a8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {data.products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalle de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Veces Visto</TableHead>
                  <TableHead className="text-right">Total Cargas</TableHead>
                  <TableHead className="text-right">Visibilidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {p.title || p.product_id}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(p.times_seen)}</TableCell>
                    <TableCell className="text-right">{formatNumber(p.total_loads)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{p.visibility_pct}%</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
