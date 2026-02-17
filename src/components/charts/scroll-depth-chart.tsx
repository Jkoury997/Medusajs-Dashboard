"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ScrollDepthStats } from "@/types/events"
import { formatNumber } from "@/lib/format"

interface ScrollDepthChartProps {
  data: ScrollDepthStats
}

const MILESTONE_KEYS = ["25", "50", "75", "100"]

export function ScrollDepthChart({ data }: ScrollDepthChartProps) {
  const chartData = useMemo(() => {
    return MILESTONE_KEYS
      .filter((key) => data.milestones[key] !== undefined)
      .map((key) => {
        const sessions = data.milestones[key]
        const rate = data.total_sessions > 0
          ? (sessions / data.total_sessions) * 100
          : 0
        return {
          milestone: key,
          sessions,
          rate,
        }
      })
  }, [data])

  // Color por milestone: verde a rosa según dificultad
  const getColor = (milestone: string) => {
    switch (milestone) {
      case "25": return "#22c55e"  // verde – fácil
      case "50": return "#eab308"  // amarillo – medio
      case "75": return "#f97316"  // naranja – avanzado
      case "100": return "#ff75a8" // rosa marca – completaron
      default: return "#ff75a8"
    }
  }

  const getLabel = (milestone: string) => {
    switch (milestone) {
      case "25": return "Primer cuarto"
      case "50": return "Media página"
      case "75": return "Tres cuartos"
      case "100": return "Final de página"
      default: return `${milestone}%`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Profundidad de Scroll
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({formatNumber(data.total_sessions)} sesiones · promedio {data.avg_max_depth.toFixed(0)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="space-y-4">
            {chartData.map((m) => {
              const color = getColor(m.milestone)
              return (
                <div key={m.milestone} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-700">{m.milestone}%</span>
                      <span className="text-gray-400 text-xs">{getLabel(m.milestone)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs">
                        {formatNumber(m.sessions)} sesiones
                      </span>
                      <span className="font-bold text-sm" style={{ color }}>
                        {m.rate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(m.rate, 2)}%`,
                        backgroundColor: color,
                      }}
                    >
                      {m.rate >= 10 && (
                        <span className="text-white text-xs font-bold">
                          {m.rate.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Indicador de scroll promedio */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Scroll Promedio</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-400"
                      style={{ width: `${Math.min(data.avg_max_depth, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700">{data.avg_max_depth.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">Sin datos de scroll</p>
        )}
      </CardContent>
    </Card>
  )
}
