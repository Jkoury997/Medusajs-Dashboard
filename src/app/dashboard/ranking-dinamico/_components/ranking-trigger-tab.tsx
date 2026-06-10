"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTriggerRankingPreview, useTriggerRanking } from "@/hooks/use-ranking-agent"
import type {
  RankingEntityType,
  TriggerRankingInput,
  TriggerRankingDryRun,
  TriggerRankingStarted,
} from "@/types/ranking-agent"
import { Calculator, Play, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

export function RankingTriggerTab({
  salesChannelId,
  channelName,
}: {
  salesChannelId?: string
  channelName: (id: string) => string
}) {
  const [entityId, setEntityId] = useState("")
  const [entityType, setEntityType] = useState<RankingEntityType>("category")
  const [model, setModel] = useState("")

  const preview = useTriggerRankingPreview()
  const trigger = useTriggerRanking()
  const [estimate, setEstimate] = useState<TriggerRankingDryRun | null>(null)
  const [started, setStarted] = useState<TriggerRankingStarted | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const buildInput = (): TriggerRankingInput => {
    const input: TriggerRankingInput = {}
    if (salesChannelId) input.sales_channel_id = salesChannelId
    if (entityId.trim()) {
      input.entity_id = entityId.trim()
      input.entity_type = entityType
    }
    if (model.trim()) input.model = model.trim()
    return input
  }

  const handleEstimate = () => {
    setErrorMsg("")
    setStarted(null)
    preview.mutate(buildInput(), {
      onSuccess: (d) => setEstimate(d),
      onError: (e) => {
        setEstimate(null)
        setErrorMsg((e as Error).message)
      },
    })
  }

  const handleRun = () => {
    setErrorMsg("")
    trigger.mutate(buildInput(), {
      onSuccess: (d) => {
        setStarted(d)
        setEstimate(null)
      },
      onError: (e) => setErrorMsg((e as Error).message),
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recalcular ranking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Dispara una regeneración del ranking dinámico para{" "}
            <span className="font-medium">
              {salesChannelId ? channelName(salesChannelId) : "todas las marcas"}
            </span>
            . Sin entidad, recalcula todas las categorías del scope. La corrida es asíncrona:
            seguí el progreso en la pestaña <span className="font-medium">Runs</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Entidad (opcional)</Label>
              <Input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="ID de categoría/colección"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo de entidad</Label>
              <Select
                value={entityType}
                onValueChange={(v) => setEntityType(v as RankingEntityType)}
                disabled={!entityId.trim()}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Categoría</SelectItem>
                  <SelectItem value="collection">Colección</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Modelo (opcional)</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="override del LLM"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleEstimate}
              disabled={preview.isPending || trigger.isPending}
            >
              {preview.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Estimar
            </Button>
            <Button onClick={handleRun} disabled={trigger.isPending || preview.isPending}>
              {trigger.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Recalcular ahora
            </Button>
          </div>

          {estimate && (
            <div className="rounded-md bg-gray-50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Combos a procesar</span>
                <span className="font-medium">{estimate.combos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Scope ({estimate.scope_targets} targets × {estimate.categories} entidades)
                </span>
                <span className="font-medium">USD {estimate.estimated_usd.toFixed(2)}</span>
              </div>
            </div>
          )}

          {started && (
            <div className="rounded-md border border-green-100 bg-green-50 p-3 text-sm space-y-1">
              <p className="flex items-center gap-1 font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" /> Recompute disparado
              </p>
              <p className="text-gray-700">
                Run <span className="font-mono text-xs">{started.ranking_run_id}</span> ·{" "}
                {started.combos_planned} combos. Mirá el progreso en la pestaña Runs.
              </p>
            </div>
          )}

          {errorMsg && (
            <p className="flex items-center gap-1 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" /> {errorMsg}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
