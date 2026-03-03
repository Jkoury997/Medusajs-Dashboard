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
import { RULE_TYPES } from "@/types/segments"
import type { RuleTypeInfo } from "@/types/segments"
import type { SegmentRule, SegmentMatchType, SegmentType, SegmentGroup } from "@/types/campaigns"
import type { SavedSegment } from "@/types/segments"
import { Trash2, Plus, BookmarkCheck } from "lucide-react"

interface AudienceBuilderProps {
  rules: SegmentRule[]
  match: SegmentMatchType
  onChange: (rules: SegmentRule[], match: SegmentMatchType) => void
  onEstimate?: () => void
  estimatedCount?: number | null
  isEstimating?: boolean
  groups?: SegmentGroup[]
  contactGroups?: { id: string; name: string }[]
  contactTags?: string[]
  savedSegments?: SavedSegment[]
  segmentId?: string | null
  onSegmentIdChange?: (id: string | null) => void
}

export function AudienceBuilder({
  rules,
  match,
  onChange,
  onEstimate,
  estimatedCount,
  isEstimating,
  groups,
  contactGroups,
  contactTags,
  savedSegments,
  segmentId,
  onSegmentIdChange,
}: AudienceBuilderProps) {
  const updateRule = (index: number, updates: Partial<SegmentRule>) => {
    const newRules = rules.map((r, i) => (i === index ? { ...r, ...updates } : r))
    onChange(newRules, match)
  }

  const changeRuleType = (index: number, type: SegmentType) => {
    const ruleInfo = RULE_TYPES.find((r) => r.type === type)
    const newRule: SegmentRule = { type }
    if (ruleInfo?.params.includes("days")) newRule.days = 30
    if (ruleInfo?.params.includes("engagement_type")) newRule.engagement_type = "opened"
    if (ruleInfo?.params.includes("value") && ruleInfo.valueOptions?.length) {
      newRule.value = ruleInfo.valueOptions[0].value
    }
    const newRules = rules.map((r, i) => (i === index ? newRule : r))
    onChange(newRules, match)
  }

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index), match)
  }

  const addRule = () => {
    onChange([...rules, { type: "contact_all" }], match)
  }

  const getRuleInfo = (type: string): RuleTypeInfo | undefined => {
    return RULE_TYPES.find((r) => r.type === type)
  }

  const usingSavedSegment = !!segmentId

  return (
    <div className="space-y-3">
      {/* Saved segment selector */}
      {savedSegments && savedSegments.length > 0 && onSegmentIdChange && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-blue-600" />
            <Label className="text-sm font-medium">Segmento guardado</Label>
          </div>
          <Select
            value={segmentId || "_manual_"}
            onValueChange={(v) => {
              if (v === "_manual_") {
                onSegmentIdChange(null)
              } else {
                onSegmentIdChange(v)
              }
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Reglas manuales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_manual_">Reglas manuales</SelectItem>
              {savedSegments.map((seg) => (
                <SelectItem key={seg._id} value={seg._id}>
                  {seg.name} (~{seg.estimated_count.toLocaleString("es-AR")} contactos)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {usingSavedSegment && (
            <p className="text-xs text-blue-600">
              Usando segmento guardado. Las reglas del segmento se aplican automáticamente.
            </p>
          )}
        </div>
      )}

      {/* Manual rules — only when not using saved segment */}
      {!usingSavedSegment && (
        <>
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

          {rules.map((rule, idx) => {
            const ruleInfo = getRuleInfo(rule.type)
            return (
              <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-md border">
                <div className="flex-1 space-y-2">
                  {/* Rule type selector */}
                  <Select
                    value={rule.type}
                    onValueChange={(v) => changeRuleType(idx, v as SegmentType)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RULE_TYPES.map((rt) => (
                        <SelectItem key={rt.type} value={rt.type}>
                          <span className="font-medium">{rt.label}</span>
                          <span className="text-gray-400 ml-1 text-xs">— {rt.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Rule params */}
                  <div className="flex gap-2 flex-wrap">
                    {ruleInfo?.params.includes("value") && (
                      <div className="flex-1 min-w-[150px]">
                        {ruleInfo.valueOptions ? (
                          <Select
                            value={rule.value || ""}
                            onValueChange={(v) => updateRule(idx, { value: v })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder={ruleInfo.valueLabel} />
                            </SelectTrigger>
                            <SelectContent>
                              {ruleInfo.valueOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : rule.type === "customer_group" ? (
                          <Select
                            value={rule.value || ""}
                            onValueChange={(v) => updateRule(idx, { value: v })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Seleccionar grupo" />
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
                        ) : rule.type === "contact_group" ? (
                          <Select
                            value={rule.value || ""}
                            onValueChange={(v) => updateRule(idx, { value: v })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Seleccionar grupo" />
                            </SelectTrigger>
                            <SelectContent>
                              {contactGroups?.map((g) => (
                                <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : rule.type === "contact_tag" ? (
                          <Select
                            value={rule.value || ""}
                            onValueChange={(v) => updateRule(idx, { value: v })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Seleccionar tag" />
                            </SelectTrigger>
                            <SelectContent>
                              {contactTags?.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            className="h-8 text-sm"
                            placeholder={ruleInfo.valuePlaceholder || "Valor"}
                            value={rule.value || ""}
                            onChange={(e) => updateRule(idx, { value: e.target.value })}
                          />
                        )}
                      </div>
                    )}

                    {ruleInfo?.params.includes("days") && (
                      <div className="w-24">
                        <Input
                          type="number"
                          className="h-8 text-sm"
                          placeholder="Días"
                          min={1}
                          value={rule.days || ""}
                          onChange={(e) => updateRule(idx, { days: parseInt(e.target.value) || undefined })}
                        />
                      </div>
                    )}

                    {ruleInfo?.params.includes("engagement_type") && (
                      <div className="w-32">
                        <Select
                          value={rule.engagement_type || "opened"}
                          onValueChange={(v) => updateRule(idx, { engagement_type: v as "opened" | "clicked" })}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="opened">Abrió</SelectItem>
                            <SelectItem value="clicked">Hizo click</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remove rule */}
                {rules.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => removeRule(idx)}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                )}
              </div>
            )
          })}

          <Button type="button" size="sm" variant="outline" className="text-xs" onClick={addRule}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Agregar regla
          </Button>
        </>
      )}

      {/* Estimate */}
      <div className="flex items-center gap-3">
        {onEstimate && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onEstimate}
            disabled={isEstimating || (!usingSavedSegment && rules.length === 0)}
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
