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
  Cell,
} from "recharts"
import type { ScrollDepthStats } from "@/types/events"
import { formatNumber } from "@/lib/format"

interface ScrollDepthChartProps {
  data: ScrollDepthStats
}

const MILESTONE_COLORS = ["#ff75a8", "#ff8fb8", "#ffaacb", "#ffc4dd"]

export function ScrollDepthChart({ data }: ScrollDepthChartProps) {
  const chartData = data.milestones.map((m, idx) => ({
    milestone: `${m.depth_pct}%`,
    sessions: m.sessions,
    rate: parseFloat(m.rate),
    color: MILESTONE_COLORS[idx] || MILESTONE_COLORS[0],
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Profundidad de Scroll
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({formatNumber(data.total_sessions)} sesiones · promedio {data.avg_max_depth}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="milestone" fontSize={12} width={50} />
                  <Tooltip
                    formatter={(value) => [formatNumber(Number(value)), "Sesiones"]}
                  />
                  <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              {data.milestones.map((m) => (
                <span key={m.depth_pct}>
                  <strong>{m.depth_pct}%:</strong> {m.rate}% de usuarios
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-4">Sin datos de scroll</p>
        )}
      </CardContent>
    </Card>
  )
}
