"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrafficSourcesProps {
  data: {
    source: string
    medium: string
    sessions: number
    users: number
    purchases: number
    revenue: number
  }[]
}

export function TrafficSources({ data }: TrafficSourcesProps) {
  const chartData = data
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10)
    .map((d) => ({
      name: `${d.source} / ${d.medium}`,
      sessions: d.sessions,
      purchases: d.purchases,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fuentes de Tráfico</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                width={150}
                tickLine={false}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions" fill="#ff75a8" name="Sesiones" />
              <Bar dataKey="purchases" fill="#16a34a" name="Compras" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
