"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Alert {
  type: "critical" | "warning" | "info"
  message: string
}

interface AlertsPanelProps {
  alerts: Alert[]
}

const ALERT_STYLES = {
  critical: { icon: "🔴", bg: "bg-red-50 border-red-200" },
  warning: { icon: "🟡", bg: "bg-yellow-50 border-yellow-200" },
  info: { icon: "🟢", bg: "bg-green-50 border-green-200" },
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">⚠️ Alertas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, i) => {
          const style = ALERT_STYLES[alert.type]
          return (
            <div
              key={i}
              className={`flex items-start gap-2 p-3 rounded-md border ${style.bg}`}
            >
              <span className="text-sm">{style.icon}</span>
              <span className="text-sm text-gray-700">{alert.message}</span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
