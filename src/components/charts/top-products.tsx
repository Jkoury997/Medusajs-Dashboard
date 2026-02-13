"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TopProductsProps {
  data: { name: string; revenue: number; quantity: number }[]
}

export function TopProducts({ data }: TopProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                width={120}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString("es-AR")}`,
                  "Ingresos",
                ]}
              />
              <Bar dataKey="revenue" fill="#ff75a8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
