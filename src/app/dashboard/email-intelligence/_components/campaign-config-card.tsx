"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useUpdateEmailCampaign } from "@/hooks/use-email-intelligence"
import {
  CAMPAIGN_KIND_LABELS,
  CAMPAIGN_KIND_DESCRIPTIONS,
  TRIGGER_FIELD_LABELS,
} from "@/types/email-intelligence"
import type {
  EmailCampaign,
  EmailCampaignPatch,
  SalesChannel,
} from "@/types/email-intelligence"
import { Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface FormState {
  enabled: boolean
  name: string
  daily_cap_per_customer: number
  daily_cap_global: number
  min_sends_before_kill: number
  ctr_pct: number // se guarda como fracción (ctr_pct / 100)
  target_active_variants: number
  evolution_model: string
  trigger_config: Record<string, number>
  channel_enabled: Record<string, boolean>
}

function humanizeKey(key: string): string {
  return TRIGGER_FIELD_LABELS[key] ?? key.replace(/_/g, " ")
}

function buildInitialState(
  c: EmailCampaign,
  channels: SalesChannel[],
): FormState {
  const channel_enabled: Record<string, boolean> = {}
  for (const ch of channels) {
    const override = c.overrides_by_channel?.[ch.id]?.enabled
    channel_enabled[ch.id] = override ?? c.enabled
  }
  return {
    enabled: c.enabled,
    name: c.name,
    daily_cap_per_customer: c.daily_cap_per_customer,
    daily_cap_global: c.daily_cap_global,
    min_sends_before_kill: c.min_sends_before_kill,
    ctr_pct: Number((c.min_ctr_threshold * 100).toFixed(2)),
    target_active_variants: c.target_active_variants,
    evolution_model: c.evolution_model ?? "",
    trigger_config: { ...(c.trigger_config ?? {}) },
    channel_enabled,
  }
}

export function CampaignConfigCard({
  campaign,
  channels,
}: {
  campaign: EmailCampaign
  channels: SalesChannel[]
}) {
  const update = useUpdateEmailCampaign()
  const initial = useMemo(
    () => buildInitialState(campaign, channels),
    [campaign, channels],
  )
  const [form, setForm] = useState<FormState>(initial)
  const [feedback, setFeedback] = useState<"ok" | "err" | null>(null)

  // Re-sincroniza si cambia la data del server (tras guardar/invalidar).
  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFeedback(null)
  }

  const num = (raw: string, fallback = 0): number => {
    const n = Number(raw)
    return Number.isFinite(n) ? n : fallback
  }

  const handleSave = () => {
    // Overrides: solo guardamos canales que difieren del enabled global.
    const overrides: Record<string, { enabled: boolean }> = {}
    for (const ch of channels) {
      const val = form.channel_enabled[ch.id]
      if (val !== form.enabled) overrides[ch.id] = { enabled: val }
    }

    const patch: EmailCampaignPatch = {
      enabled: form.enabled,
      name: form.name.trim(),
      daily_cap_per_customer: form.daily_cap_per_customer,
      daily_cap_global: form.daily_cap_global,
      min_sends_before_kill: form.min_sends_before_kill,
      min_ctr_threshold: Number((form.ctr_pct / 100).toFixed(4)),
      target_active_variants: form.target_active_variants,
      evolution_model: form.evolution_model.trim() || null,
      trigger_config: form.trigger_config,
      overrides_by_channel: Object.keys(overrides).length ? overrides : null,
    }

    update.mutate(
      { id: campaign.id, patch },
      {
        onSuccess: () => setFeedback("ok"),
        onError: () => setFeedback("err"),
      },
    )
  }

  const reset = () => {
    setForm(initial)
    setFeedback(null)
  }

  const triggerKeys = Object.keys(form.trigger_config)

  return (
    <Card className={form.enabled ? "" : "opacity-90"}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                {CAMPAIGN_KIND_LABELS[campaign.kind]}
              </h3>
              <Badge variant={form.enabled ? "default" : "secondary"}>
                {form.enabled ? "Activa" : "Pausada"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {CAMPAIGN_KIND_DESCRIPTIONS[campaign.kind]}
            </p>
            <div className="flex gap-2 mt-2 text-xs text-gray-400">
              <span>Variantes activas: {campaign.variant_counts.active}</span>
              <span>·</span>
              <span>Borrador: {campaign.variant_counts.drafted}</span>
              <span>·</span>
              <span>Retiradas: {campaign.variant_counts.retired}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-500">Encendida</span>
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => set("enabled", v)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Nombre */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Nombre interno</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Modelo de IA (evolution)</Label>
            <Input
              value={form.evolution_model}
              placeholder="claude-sonnet-4-20250514"
              onChange={(e) => set("evolution_model", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Límites y umbrales */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-2">
            Límites y umbrales
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Field
              label="Tope diario / cliente"
              value={form.daily_cap_per_customer}
              min={0}
              max={100}
              onChange={(v) => set("daily_cap_per_customer", v)}
            />
            <Field
              label="Tope diario global"
              value={form.daily_cap_global}
              min={0}
              max={100000}
              onChange={(v) => set("daily_cap_global", v)}
            />
            <Field
              label="Variantes activas objetivo"
              value={form.target_active_variants}
              min={1}
              max={20}
              onChange={(v) => set("target_active_variants", v)}
            />
            <Field
              label="Envíos mín. antes de retirar"
              value={form.min_sends_before_kill}
              min={1}
              max={10000}
              onChange={(v) => set("min_sends_before_kill", v)}
            />
            <div>
              <Label className="text-xs">CTR mínimo (%)</Label>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={100}
                value={form.ctr_pct}
                onChange={(e) => set("ctr_pct", num(e.target.value))}
                className="mt-1"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Variantes por debajo se retiran automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Trigger config dinámico */}
        {triggerKeys.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">
              Condiciones de disparo
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {triggerKeys.map((key) => (
                <Field
                  key={key}
                  label={humanizeKey(key)}
                  value={form.trigger_config[key]}
                  onChange={(v) =>
                    set("trigger_config", {
                      ...form.trigger_config,
                      [key]: v,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Overrides por marca */}
        {channels.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">
              Habilitación por marca
            </p>
            <div className="space-y-2">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2"
                >
                  <span className="text-sm text-gray-700">{ch.name}</span>
                  <Switch
                    checked={form.channel_enabled[ch.id] ?? form.enabled}
                    disabled={!form.enabled}
                    onCheckedChange={(v) =>
                      set("channel_enabled", {
                        ...form.channel_enabled,
                        [ch.id]: v,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            {!form.enabled && (
              <p className="text-[11px] text-gray-400 mt-1">
                La campaña está pausada globalmente: ninguna marca recibirá envíos.
              </p>
            )}
          </div>
        )}

        {/* Acciones */}
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
          <div className="flex gap-2">
            {dirty && (
              <Button variant="ghost" size="sm" onClick={reset} disabled={update.isPending}>
                Descartar
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!dirty || update.isPending}
            >
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value)
          onChange(Number.isFinite(n) ? n : 0)
        }}
        className="mt-1"
      />
    </div>
  )
}
