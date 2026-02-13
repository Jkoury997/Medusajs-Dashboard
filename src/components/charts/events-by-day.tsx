"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EventsByDayProps {
  data: { date: string; count: number }[]
}

export function EventsByDay({ data }: EventsByDayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Eventos por Día</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickLine={false} />
              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString("es-AR"),
                  "Eventos",
                ]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#ff75a8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
