"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ["#ff75a8", "#ff8fb8", "#ffaacb", "#ffc4dd", "#ffd6e5", "#fff0f5"]

interface RevenueByGroupProps {
  data: { group: string; revenue: number; orders: number }[]
}

export function RevenueByGroup({ data }: RevenueByGroupProps) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ingresos por Grupo de Cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis
              type="number"
              tickFormatter={(v) =>
                `$${(v / 1000).toFixed(0)}k`
              }
            />
            <YAxis type="category" dataKey="group" width={120} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) =>
                new Intl.NumberFormat("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 0,
                }).format(Number(value))
              }
              labelFormatter={(label) => `Grupo: ${label}`}
            />
            <Bar dataKey="revenue" name="Ingresos" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
