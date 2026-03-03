"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateSegment,
  useUpdateSegment,
  useSegmentDetail,
  useEstimateAdHoc,
} from "@/hooks/use-segments"
import { useContactGroupList, useContactTags } from "@/hooks/use-contacts"
import { RULE_TYPES } from "@/types/segments"
import type { SegmentRule, SegmentRuleType, SegmentMatchType, RuleTypeInfo } from "@/types/segments"
import { Plus, X, Trash2, Users, Zap } from "lucide-react"

interface SegmentEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segmentId?: string | null
  onSaved?: () => void
}

export function SegmentEditor({ open, onOpenChange, segmentId, onSaved }: SegmentEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [match, setMatch] = useState<SegmentMatchType>("all")
  const [rules, setRules] = useState<SegmentRule[]>([{ type: "contact_all" }])

  const { data: existing } = useSegmentDetail(segmentId ?? null)
  const { data: groupsData } = useContactGroupList()
  const { data: tagsData } = useContactTags()
  const createMutation = useCreateSegment()
  const updateMutation = useUpdateSegment()
  const estimateMutation = useEstimateAdHoc()

  const isEditing = !!segmentId
  const saving = createMutation.isPending || updateMutation.isPending
  const groups = groupsData?.groups ?? []
  const tags = tagsData?.tags ?? []

  useEffect(() => {
    if (open && existing && isEditing) {
      setName(existing.name)
      setDescription(existing.description || "")
      setMatch(existing.match)
      setRules(existing.rules.length > 0 ? existing.rules : [{ type: "contact_all" }])
    } else if (open && !isEditing) {
      setName("")
      setDescription("")
      setMatch("all")
      setRules([{ type: "contact_all" }])
      estimateMutation.reset()
    }
  }, [open, existing, isEditing])

  const addRule = () => {
    setRules([...rules, { type: "contact_all" }])
  }

  const removeRule = (index: number) => {
    if (rules.length <= 1) return
    setRules(rules.filter((_, i) => i !== index))
  }

  const updateRule = (index: number, updates: Partial<SegmentRule>) => {
    setRules(rules.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }

  const changeRuleType = (index: number, type: SegmentRuleType) => {
    const ruleInfo = RULE_TYPES.find((r) => r.type === type)
    const newRule: SegmentRule = { type }
    if (ruleInfo?.params.includes("days")) newRule.days = 30
    if (ruleInfo?.params.includes("engagement_type")) newRule.engagement_type = "opened"
    if (ruleInfo?.params.includes("value") && ruleInfo.valueOptions?.length) {
      newRule.value = ruleInfo.valueOptions[0].value
    }
    setRules(rules.map((r, i) => (i === index ? newRule : r)))
  }

  const handleEstimate = () => {
    estimateMutation.mutate({ rules, match })
  }

  const handleSave = async () => {
    if (!name.trim() || rules.length === 0) return
    try {
      if (isEditing && segmentId) {
        await updateMutation.mutateAsync({
          id: segmentId,
          data: { name: name.trim(), description: description.trim() || undefined, rules, match },
        })
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          rules,
          match,
        })
      }
      onSaved?.()
      onOpenChange(false)
    } catch {
      // error handled by mutation state
    }
  }

  const getRuleInfo = (type: SegmentRuleType): RuleTypeInfo | undefined => {
    return RULE_TYPES.find((r) => r.type === type)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Segmento" : "Nuevo Segmento"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name & Description */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Clientes VIP, Nuevos últimos 30 días"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>
          </div>

          {/* Match type */}
          <div className="space-y-1.5">
            <Label>Lógica de combinación</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={match === "all" ? "default" : "outline"}
                onClick={() => setMatch("all")}
              >
                Todas (Y)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={match === "any" ? "default" : "outline"}
                onClick={() => setMatch("any")}
              >
                Alguna (O)
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              {match === "all"
                ? "El contacto debe cumplir TODAS las reglas"
                : "El contacto debe cumplir AL MENOS UNA regla"}
            </p>
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <Label>Reglas</Label>
            {rules.map((rule, index) => {
              const ruleInfo = getRuleInfo(rule.type)
              return (
                <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-1 space-y-2">
                    {/* Rule type selector */}
                    <Select
                      value={rule.type}
                      onValueChange={(v) => changeRuleType(index, v as SegmentRuleType)}
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
                              onValueChange={(v) => updateRule(index, { value: v })}
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
                          ) : rule.type === "contact_group" ? (
                            <Select
                              value={rule.value || ""}
                              onValueChange={(v) => updateRule(index, { value: v })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar grupo" />
                              </SelectTrigger>
                              <SelectContent>
                                {groups.map((g) => (
                                  <SelectItem key={g._id} value={g.name}>
                                    {g.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : rule.type === "contact_tag" ? (
                            <Select
                              value={rule.value || ""}
                              onValueChange={(v) => updateRule(index, { value: v })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Seleccionar tag" />
                              </SelectTrigger>
                              <SelectContent>
                                {tags.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              className="h-8 text-sm"
                              placeholder={ruleInfo.valuePlaceholder || "Valor"}
                              value={rule.value || ""}
                              onChange={(e) => updateRule(index, { value: e.target.value })}
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
                            onChange={(e) => updateRule(index, { days: parseInt(e.target.value) || undefined })}
                          />
                        </div>
                      )}

                      {ruleInfo?.params.includes("engagement_type") && (
                        <div className="w-32">
                          <Select
                            value={rule.engagement_type || "opened"}
                            onValueChange={(v) => updateRule(index, { engagement_type: v as "opened" | "clicked" })}
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
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              )
            })}

            <Button type="button" variant="outline" size="sm" onClick={addRule}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Agregar regla
            </Button>
          </div>

          {/* Estimate */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleEstimate}
              disabled={estimateMutation.isPending}
            >
              <Zap className="w-3.5 h-3.5 mr-1" />
              {estimateMutation.isPending ? "Estimando..." : "Estimar audiencia"}
            </Button>

            {estimateMutation.data && (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  <Users className="w-3 h-3 mr-1" />
                  {estimateMutation.data.estimated_count.toLocaleString("es-AR")} contactos
                </Badge>
                {(estimateMutation.data.sample_recipients?.length ?? 0) > 0 && (
                  <span className="text-xs text-gray-500">
                    Ej: {estimateMutation.data.sample_recipients!.slice(0, 3).map((r) => r.email).join(", ")}
                  </span>
                )}
              </div>
            )}

            {estimateMutation.isError && (
              <span className="text-xs text-red-600">{estimateMutation.error?.message}</span>
            )}
          </div>
        </div>

        {(createMutation.isError || updateMutation.isError) && (
          <p className="text-sm text-red-600">
            {createMutation.error?.message || updateMutation.error?.message}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim() || rules.length === 0}>
            {saving ? "Guardando..." : isEditing ? "Guardar" : "Crear Segmento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
