"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useRankingGuardrail, useUpdateRankingGuardrail } from "@/hooks/use-ranking-agent"
import {
  RANKING_GUARDRAIL_FIELDS,
  DEFAULT_RANKING_GUARDRAIL,
} from "@/types/ranking-agent"
import type {
  Guardrail,
  RankingGuardrailValue,
  RankingGuardrailFieldDef,
} from "@/types/ranking-agent"
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type FieldValue = string | number | boolean | string[]

export function RankingConfigTab() {
  const { data: guardrail, isLoading, error } = useRankingGuardrail()

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-600">
          No se pudo cargar la configuración. {(error as Error).message}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Controlá el agente de ranking dinámico: kill-switch, presupuesto mensual, modelo,
        ventanas de señales/atribución y cohortes excluidas.
      </p>
      {/* guardrail puede ser null (sin configurar): el form arranca con defaults. */}
      <RankingGuardrailForm guardrail={guardrail ?? null} />
    </div>
  )
}

function RankingGuardrailForm({ guardrail }: { guardrail: Guardrail | null }) {
  const update = useUpdateRankingGuardrail()
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null)

  const initial = useMemo(() => {
    const base = {
      ...DEFAULT_RANKING_GUARDRAIL,
      ...((guardrail?.value as Partial<RankingGuardrailValue>) ?? {}),
    }
    const out: Record<string, FieldValue> = {}
    for (const f of RANKING_GUARDRAIL_FIELDS) {
      const v = base[f.key]
      if (f.type === "boolean") out[f.key] = Boolean(v)
      else if (f.type === "number") out[f.key] = Number(v ?? 0)
      else if (f.type === "list") out[f.key] = Array.isArray(v) ? (v as string[]) : []
      else out[f.key] = String(v ?? "")
    }
    return out
  }, [guardrail])

  const [form, setForm] = useState(initial)
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  )

  const set = (key: string, value: FieldValue) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFeedback(null)
  }

  const handleSave = () => {
    const value: Record<string, unknown> = { ...(guardrail?.value ?? {}) }
    for (const f of RANKING_GUARDRAIL_FIELDS) {
      value[f.key] = form[f.key]
    }
    update.mutate(
      {
        value: value as Partial<RankingGuardrailValue>,
        description:
          guardrail?.description ?? "Config del ranking dinámico IA (dynamic-ranking).",
      },
      {
        onSuccess: () => setFeedback("ok"),
        onError: () => setFeedback("err"),
      },
    )
  }

  const enabled = Boolean(form["enabled"])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Ranking Dinámico IA</h3>
            <p className="text-sm text-gray-500 mt-1">
              Guardrail <span className="font-mono">dynamic-ranking</span>. El kill-switch
              bloquea cron y recompute manual al instante (sin redeploy).
            </p>
            {!guardrail && (
              <p className="text-xs text-amber-600 mt-1">
                Sin configurar todavía: se muestran valores por defecto. Guardá para crearlo.
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">Encendido</span>
            <Switch checked={enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {RANKING_GUARDRAIL_FIELDS.filter((f) => f.key !== "enabled").map((f) => (
            <RankingField
              key={f.key}
              def={f}
              value={form[f.key]}
              onChange={(v) => set(f.key, v)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs">
            {feedback === "ok" && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Guardado
              </span>
            )}
            {feedback === "err" && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="h-4 w-4" /> Error al guardar
              </span>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={!dirty || update.isPending}>
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RankingField({
  def,
  value,
  onChange,
}: {
  def: RankingGuardrailFieldDef
  value: FieldValue
  onChange: (v: FieldValue) => void
}) {
  if (def.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
        <div>
          <Label className="text-xs">{def.label}</Label>
          {def.help && <p className="text-[11px] text-gray-400 mt-0.5">{def.help}</p>}
        </div>
        <Switch checked={Boolean(value)} onCheckedChange={(v) => onChange(v)} />
      </div>
    )
  }

  if (def.type === "list") {
    const arr = Array.isArray(value) ? value : []
    return (
      <div className="md:col-span-2 lg:col-span-3">
        <Label className="text-xs">{def.label}</Label>
        <Input
          value={arr.join(", ")}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder="separados por comas"
          className="mt-1"
        />
        {def.help && <p className="text-[11px] text-gray-400 mt-1">{def.help}</p>}
      </div>
    )
  }

  if (def.type === "text") {
    return (
      <div>
        <Label className="text-xs">{def.label}</Label>
        <Input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1"
        />
        {def.help && <p className="text-[11px] text-gray-400 mt-1">{def.help}</p>}
      </div>
    )
  }

  // number
  return (
    <div>
      <Label className="text-xs">{def.label}</Label>
      <Input
        type="number"
        min={def.min}
        max={def.max}
        value={Number(value)}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="mt-1"
      />
      {def.help && <p className="text-[11px] text-gray-400 mt-1">{def.help}</p>}
    </div>
  )
}
