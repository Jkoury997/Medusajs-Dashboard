"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SegmentRule, SegmentMatchType, SegmentType, SegmentGroup } from "@/types/campaigns"

const SEGMENT_LABELS: Record<SegmentType, string> = {
  all_customers: "Todos los clientes",
  customer_group: "Grupo de cliente",
  has_purchased: "Compró en los últimos N días",
  not_purchased: "No compró en N días",
  email_engaged: "Interactuó con email",
  email_not_engaged: "No interactuó con email",
  subscriber: "Suscriptor (no cliente)",
}

interface AudienceBuilderProps {
  rules: SegmentRule[]
  match: SegmentMatchType
  onChange: (rules: SegmentRule[], match: SegmentMatchType) => void
  onEstimate?: () => void
  estimatedCount?: number | null
  isEstimating?: boolean
  groups?: SegmentGroup[]
}

export function AudienceBuilder({
  rules,
  match,
  onChange,
  onEstimate,
  estimatedCount,
  isEstimating,
  groups,
}: AudienceBuilderProps) {
  const updateRule = (index: number, updates: Partial<SegmentRule>) => {
    const newRules = rules.map((r, i) => (i === index ? { ...r, ...updates } : r))
    onChange(newRules, match)
  }

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index), match)
  }

  const addRule = () => {
    onChange([...rules, { type: "all_customers" }], match)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Coincidencia:</Label>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={match === "all" ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => onChange(rules, "all")}
          >
            Todas (Y)
          </Button>
          <Button
            type="button"
            size="sm"
            variant={match === "any" ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => onChange(rules, "any")}
          >
            Alguna (O)
          </Button>
        </div>
      </div>

      {rules.map((rule, idx) => (
        <div key={idx} className="flex flex-wrap items-end gap-2 p-3 bg-gray-50 rounded-md">
          <div className="min-w-[200px]">
            <Label className="text-xs">Segmento</Label>
            <Select
              value={rule.type}
              onValueChange={(v) => updateRule(idx, { type: v as SegmentType, value: undefined, days: undefined, engagement_type: undefined })}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEGMENT_LABELS) as SegmentType[]).map((t) => (
                  <SelectItem key={t} value={t}>{SEGMENT_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rule.type === "customer_group" && (
            <div className="min-w-[150px]">
              <Label className="text-xs">Grupo</Label>
              <Select
                value={rule.value || ""}
                onValueChange={(v) => updateRule(idx, { value: v })}
              >
                <SelectTrigger className="mt-1 h-8 text-sm">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((g) => (
                    <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                  ))}
                  {(!groups || groups.length === 0) && (
                    <>
                      <SelectItem value="Minorista">Minorista</SelectItem>
                      <SelectItem value="Mayorista">Mayorista</SelectItem>
                      <SelectItem value="Revendedora">Revendedora</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {(rule.type === "has_purchased" || rule.type === "not_purchased") && (
            <div>
              <Label className="text-xs">Días</Label>
              <Input
                type="number"
                min={1}
                value={rule.days ?? ""}
                onChange={(e) => updateRule(idx, { days: Number(e.target.value) || undefined })}
                className="mt-1 w-20 h-8 text-sm"
                placeholder="30"
              />
            </div>
          )}

          {rule.type === "email_engaged" && (
            <>
              <div>
                <Label className="text-xs">Días</Label>
                <Input
                  type="number"
                  min={1}
                  value={rule.days ?? ""}
                  onChange={(e) => updateRule(idx, { days: Number(e.target.value) || undefined })}
                  className="mt-1 w-20 h-8 text-sm"
                  placeholder="30"
                />
              </div>
              <div className="min-w-[120px]">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={rule.engagement_type || "opened"}
                  onValueChange={(v) => updateRule(idx, { engagement_type: v as "opened" | "clicked" })}
                >
                  <SelectTrigger className="mt-1 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opened">Abrió</SelectItem>
                    <SelectItem value="clicked">Hizo click</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 text-xs text-red-600 hover:text-red-700"
            onClick={() => removeRule(idx)}
          >
            Quitar
          </Button>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" variant="outline" className="text-xs" onClick={addRule}>
          + Agregar regla
        </Button>
        {onEstimate && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onEstimate}
            disabled={isEstimating || rules.length === 0}
          >
            {isEstimating ? "Estimando..." : "Estimar audiencia"}
          </Button>
        )}
        {estimatedCount != null && (
          <Badge className="bg-blue-100 text-blue-700">
            ~{estimatedCount.toLocaleString("es-AR")} destinatarios
          </Badge>
        )}
      </div>
    </div>
  )
}
