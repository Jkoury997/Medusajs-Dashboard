"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useBulkRegeneratePreview, useBulkRegenerate } from "@/hooks/use-seo-agent"
import type {
  EntityKind,
  BulkRegenerateMode,
  BulkRegenerateDryRun,
  BulkRegenerateSummary,
} from "@/types/seo-agent"
import { Layers, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"

export function SeoBulkRegenerateDialog({
  entity,
  salesChannelId,
  open,
  onOpenChange,
}: {
  entity: EntityKind
  salesChannelId?: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [mode, setMode] = useState<BulkRegenerateMode>("missing_only")
  const [preview, setPreview] = useState<BulkRegenerateDryRun | null>(null)
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null)
  const [summary, setSummary] = useState<BulkRegenerateSummary | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const previewMut = useBulkRegeneratePreview(entity)
  const runMut = useBulkRegenerate(entity)

  const noun = entity === "category" ? "categorías" : "productos"

  // Cada vez que se abre el modal o cambia el modo/marca, pedimos el dry-run.
  useEffect(() => {
    if (!open) return
    setSummary(null)
    setProgress(null)
    setErrorMsg("")
    previewMut.mutate(
      { mode, salesChannelId },
      {
        onSuccess: (data) => setPreview(data),
        onError: (e) => setErrorMsg((e as Error).message),
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, salesChannelId, entity])

  const close = () => {
    setPreview(null)
    setProgress(null)
    setSummary(null)
    setErrorMsg("")
    onOpenChange(false)
  }

  const handleRun = () => {
    setErrorMsg("")
    setSummary(null)
    setProgress({ processed: 0, total: preview?.total ?? 0 })
    runMut.mutate(
      {
        mode,
        salesChannelId,
        chunkSize: 5,
        onProgress: (p) => setProgress(p),
      },
      {
        onSuccess: (s) => setSummary(s),
        onError: (e) => setErrorMsg((e as Error).message),
      },
    )
  }

  const total = preview?.total ?? 0
  const budgetStopped = preview?.budget_stopped || (preview?.budget_remaining_usd ?? 1) <= 0
  const canRun = !runMut.isPending && total > 0 && !budgetStopped

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" /> Regeneración masiva de {noun}
          </DialogTitle>
          <DialogDescription>
            Genera SEO por IA en lote. Cada propuesta queda en la cola (o se aplica sola si el
            auto-apply está activo). Respeta el presupuesto mensual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Alcance</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as BulkRegenerateMode)}
              disabled={runMut.isPending}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missing_only">Solo lo que no tiene SEO</SelectItem>
                <SelectItem value="all">Todo (re-genera y pisa lo existente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {previewMut.isPending && !preview ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Calculando…
            </div>
          ) : preview ? (
            <div className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">{noun} a procesar</span>
                <span className="font-medium">{total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Costo estimado</span>
                <span className="font-medium">USD {preview.estimated_usd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Presupuesto restante</span>
                <span className="font-medium">
                  USD {preview.budget_remaining_usd.toFixed(2)} / {preview.budget_limit_usd.toFixed(0)}
                </span>
              </div>
            </div>
          ) : null}

          {budgetStopped && preview && (
            <p className="flex items-center gap-1 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" /> Presupuesto mensual agotado. Subí el límite
              en “Configuración” o esperá al próximo período.
            </p>
          )}

          {total === 0 && preview && !budgetStopped && (
            <p className="text-sm text-gray-500">
              No hay {noun} pendientes para este alcance. ¡Todo cubierto!
            </p>
          )}

          {/* Progreso */}
          {progress && !summary && runMut.isPending && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procesando {progress.processed} de {progress.total}…
            </div>
          )}

          {/* Resultado */}
          {summary && (
            <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm space-y-1">
              <p className="flex items-center gap-1 font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Listo
              </p>
              <p className="text-gray-700">
                {summary.success_count} propuestas creadas · {summary.failure_count} fallidas ·{" "}
                {summary.processed}/{summary.total} procesados.
              </p>
              {summary.budget_exhausted && (
                <p className="text-amber-600">
                  Se detuvo por presupuesto. Reabrí para continuar con los restantes.
                </p>
              )}
            </div>
          )}

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={runMut.isPending}>
            {summary ? "Cerrar" : "Cancelar"}
          </Button>
          {!summary && (
            <Button onClick={handleRun} disabled={!canRun}>
              {runMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Layers className="h-4 w-4" />
              )}
              Regenerar {total > 0 ? `(${total})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
