"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useEmailAlerts, useResolveAlert } from "@/hooks/use-email-intelligence"
import { useAIRecommendations } from "@/hooks/use-ai-recommendations"
import type { AlertSeverity, EmailAlert } from "@/types/email-intelligence"
import { AlertTriangle, Sparkles } from "lucide-react"

const SEVERITY: Record<AlertSeverity, { label: string; cls: string }> = {
  info: { label: "Info", cls: "bg-blue-100 text-blue-700" },
  warn: { label: "Aviso", cls: "bg-yellow-100 text-yellow-800" },
  error: { label: "Error", cls: "bg-orange-100 text-orange-800" },
  critical: { label: "Crítico", cls: "bg-red-100 text-red-700" },
}

const TRIAGE_INSTRUCTION = `Sos soporte de operaciones del email marketing de Marcela Koury. Te paso UNA alerta del sistema (kind, severity, mensaje, payload). Explicá en 1-2 frases qué significa y por qué pasó, y dame el FIX concreto en pasos cortos. Si es de entregabilidad (bounce/spam) priorizá proteger la reputación del dominio. Máximo 120 palabras, directo y accionable.`

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
        {alerts.map((a) => (
          <AlertRow
            key={a.id}
            alert={a}
            onResolve={() => resolve.mutate({ id: a.id, resolved: true })}
            resolving={resolve.isPending}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function AlertRow({
  alert,
  onResolve,
  resolving,
}: {
  alert: EmailAlert
  onResolve: () => void
  resolving: boolean
}) {
  const sev = SEVERITY[alert.severity] ?? {
    label: alert.severity,
    cls: "bg-gray-100 text-gray-700",
  }
  const ai = useAIRecommendations()

  const runTriage = () =>
    ai.mutate({
      metrics: {
        kind: alert.kind,
        severity: alert.severity,
        message: alert.message,
        payload: alert.payload,
      },
      provider: "anthropic",
      focusInstruction: TRIAGE_INSTRUCTION,
    })

  return (
    <div className="rounded border p-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${sev.cls}`}>
              {sev.label}
            </span>
            <span className="text-xs text-gray-400">{alert.kind}</span>
          </div>
          <p className="mt-1 truncate text-sm">{alert.message}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={runTriage}
            disabled={ai.isPending}
          >
            <Sparkles className="h-4 w-4" />
            {ai.isPending ? "Analizando…" : "Analizar IA"}
          </Button>
          <Button variant="outline" size="sm" onClick={onResolve} disabled={resolving}>
            Resolver
          </Button>
        </div>
      </div>

      {ai.isPending && <Skeleton className="mt-2 h-12 w-full" />}
      {ai.data && (
        <div className="mt-2 whitespace-pre-wrap rounded bg-amber-50 p-2 text-xs text-gray-700">
          {ai.data}
        </div>
      )}
      {ai.isError && (
        <p className="mt-2 text-xs text-red-600">No se pudo analizar la alerta.</p>
      )}
    </div>
  )
}
