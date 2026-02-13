"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Verde primero para "Pagado" que es el más importante
const COLORS = ["#16a34a", "#ff75a8", "#eab308", "#ef4444", "#ff8fb8", "#ffaacb"]

interface OrdersByStatusProps {
  data: { status: string; count: number }[]
}

export function OrdersByStatus({ data }: OrdersByStatusProps) {
  // Los datos ya vienen con labels en español desde aggregateByStatus()
  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Órdenes por Estado de Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
