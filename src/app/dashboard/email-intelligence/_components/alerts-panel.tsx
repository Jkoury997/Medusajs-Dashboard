"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useEmailAlerts, useResolveAlert } from "@/hooks/use-email-intelligence"
import type { AlertSeverity } from "@/types/email-intelligence"
import { AlertTriangle } from "lucide-react"

const SEVERITY: Record<AlertSeverity, { label: string; cls: string }> = {
  info: { label: "Info", cls: "bg-blue-100 text-blue-700" },
  warn: { label: "Aviso", cls: "bg-yellow-100 text-yellow-800" },
  error: { label: "Error", cls: "bg-orange-100 text-orange-800" },
  critical: { label: "Crítico", cls: "bg-red-100 text-red-700" },
}

/** Panel de alertas operativas abiertas (ai_email_alert). Oculto si no hay. */
export function AlertsPanel() {
  const { data } = useEmailAlerts(false)
  const resolve = useResolveAlert()

  const alerts = data?.alerts ?? []
  if (alerts.length === 0) return null

  return (
    <Card className="border-amber-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Alertas abiertas ({data?.open_count ?? alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((a) => {
          const sev = SEVERITY[a.severity] ?? { label: a.severity, cls: "bg-gray-100 text-gray-700" }
          return (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded border p-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${sev.cls}`}>
                    {sev.label}
                  </span>
                  <span className="text-xs text-gray-400">{a.kind}</span>
                </div>
                <p className="mt-1 truncate text-sm">{a.message}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resolve.mutate({ id: a.id, resolved: true })}
                disabled={resolve.isPending}
              >
                Resolver
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
