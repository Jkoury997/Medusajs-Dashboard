"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmailTimeseries } from "@/hooks/use-email-intelligence"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

/** Serie temporal diaria de envíos y conversiones. */
export function TrendChart({ days }: { days: number }) {
  const { data, isLoading } = useEmailTimeseries(days)

  const points = (data?.points ?? []).map((p) => ({
    ...p,
    label: p.date.slice(5), // MM-DD
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendencia diaria</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full" />
        ) : points.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Sin datos en el período.
          </p>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={11} tickMargin={6} minTickGap={24} />
                <YAxis fontSize={11} allowDecimals={false} width={36} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sends"
                  name="Envíos"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  name="Conversiones"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
