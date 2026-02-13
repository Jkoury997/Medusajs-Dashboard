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

const COLORS = ["#ff75a8", "#16a34a", "#eab308", "#ef4444"]
const SOURCE_LABELS: Record<string, string> = {
  medusa: "Backend (Medusa)",
  storefront: "Storefront",
}

interface EventsBySourceProps {
  data: Record<string, number>
}

export function EventsBySource({ data }: EventsBySourceProps) {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: SOURCE_LABELS[key] || key,
    value,
  }))

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Eventos por Fuente</CardTitle>
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
