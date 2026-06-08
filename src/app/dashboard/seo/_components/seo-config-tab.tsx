"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useSeoGuardrails, useUpdateGuardrail } from "@/hooks/use-seo-agent"
import { SEO_GUARDRAILS } from "@/types/seo-agent"
import type {
  Guardrail,
  GuardrailFieldDef,
  SeoGuardrailConfig,
} from "@/types/seo-agent"
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function SeoConfigTab() {
  const { data: guardrails, isLoading, error } = useSeoGuardrails()

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
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Controlá el comportamiento de los agentes SEO: encendido, auto-aplicación,
        topes diarios, presupuesto mensual y modelo de IA.
      </p>
      {SEO_GUARDRAILS.map((cfg) => (
        <GuardrailCard
          key={cfg.key}
          config={cfg}
          guardrail={guardrails?.find((g) => g.key === cfg.key) ?? null}
        />
      ))}
    </div>
  )
}

function GuardrailCard({
  config,
  guardrail,
}: {
  config: SeoGuardrailConfig
  guardrail: Guardrail | null
}) {
  const update = useUpdateGuardrail()
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null)

  // Valor efectivo: lo del backend o los defaults declarados.
  const initial = useMemo(() => {
    const base = { ...config.defaults, ...(guardrail?.value ?? {}) }
    const out: Record<string, string | number | boolean> = {}
    for (const f of config.fields) {
      const v = base[f.key]
      if (f.type === "percent") out[f.key] = Math.round(Number(v ?? 0) * 100)
      else if (f.type === "boolean") out[f.key] = Boolean(v)
      else if (f.type === "number") out[f.key] = Number(v ?? 0)
      else out[f.key] = String(v ?? "")
    }
    return out
  }, [config, guardrail])

  const [form, setForm] = useState(initial)
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  )

  const set = (key: string, value: string | number | boolean) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFeedback(null)
  }

  const handleSave = () => {
    // Reconstruir el value preservando claves desconocidas del guardrail.
    const value: Record<string, unknown> = { ...(guardrail?.value ?? {}) }
    for (const f of config.fields) {
      if (f.type === "percent") value[f.key] = Number(form[f.key]) / 100
      else value[f.key] = form[f.key]
    }
    update.mutate(
      { key: config.key, value, description: guardrail?.description ?? config.description },
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
            <h3 className="text-base font-semibold text-gray-900">{config.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{config.description}</p>
            {!guardrail && (
              <p className="text-xs text-amber-600 mt-1">
                Sin configurar todavía: se muestran valores por defecto. Guardá para crearlo.
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">Encendido</span>
            <Switch
              checked={enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.fields
            .filter((f) => f.key !== "enabled")
            .map((f) => (
              <GuardrailField
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

function GuardrailField({
  def,
  value,
  onChange,
}: {
  def: GuardrailFieldDef
  value: string | number | boolean
  onChange: (v: string | number | boolean) => void
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

  // number | percent
  return (
    <div>
      <Label className="text-xs">{def.label}</Label>
      <Input
        type="number"
        min={def.min}
        max={def.max}
        step={def.step}
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
