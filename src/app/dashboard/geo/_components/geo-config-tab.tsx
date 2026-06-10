"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useGeoGuardrail, useUpdateGeoGuardrail } from "@/hooks/use-geo-agent"
import { GEO_GUARDRAIL_FIELDS, DEFAULT_GEO_GUARDRAIL } from "@/types/geo-agent"
import type { Guardrail, GeoGuardrailValue, GeoGuardrailFieldDef } from "@/types/geo-agent"
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type FieldValue = string | number | boolean

export function GeoConfigTab() {
  const { data: guardrail, isLoading, error } = useGeoGuardrail()

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
        Controlá el agente de guías GEO: kill-switch, auto-publicación, topes, presupuesto,
        confianza mínima y modelo.
      </p>
      <GeoGuardrailForm guardrail={guardrail ?? null} />
    </div>
  )
}

function GeoGuardrailForm({ guardrail }: { guardrail: Guardrail | null }) {
  const update = useUpdateGeoGuardrail()
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null)

  const initial = useMemo(() => {
    const base = {
      ...DEFAULT_GEO_GUARDRAIL,
      ...((guardrail?.value as Partial<GeoGuardrailValue>) ?? {}),
    }
    const out: Record<string, FieldValue> = {}
    for (const f of GEO_GUARDRAIL_FIELDS) {
      const v = base[f.key]
      if (f.type === "percent") out[f.key] = Math.round(Number(v ?? 0) * 100)
      else if (f.type === "boolean") out[f.key] = Boolean(v)
      else if (f.type === "number") out[f.key] = Number(v ?? 0)
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
    for (const f of GEO_GUARDRAIL_FIELDS) {
      if (f.type === "percent") value[f.key] = Number(form[f.key]) / 100
      else value[f.key] = form[f.key]
    }
    update.mutate(
      {
        value: value as Partial<GeoGuardrailValue>,
        description: guardrail?.description ?? "Config del agente de guías GEO (geo-content).",
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
            <h3 className="text-base font-semibold text-gray-900">Guías GEO</h3>
            <p className="text-sm text-gray-500 mt-1">
              Guardrail <span className="font-mono">geo-content</span>. El contenido debería
              pasar siempre por revisión humana (dejá auto-publicar apagado).
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
          {GEO_GUARDRAIL_FIELDS.filter((f) => f.key !== "enabled").map((f) => (
            <GeoField key={f.key} def={f} value={form[f.key]} onChange={(v) => set(f.key, v)} />
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

function GeoField({
  def,
  value,
  onChange,
}: {
  def: GeoGuardrailFieldDef
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

  if (def.type === "text") {
    return (
      <div>
        <Label className="text-xs">{def.label}</Label>
        <Input value={String(value)} onChange={(e) => onChange(e.target.value)} className="mt-1" />
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
