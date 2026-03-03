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
import {
  useCreateContactGroup,
  useUpdateContactGroup,
  useContactGroupDetail,
} from "@/hooks/use-contacts"
import type { ContactGroupDocument } from "@/types/contacts"

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#1e293b",
]

interface GroupEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId?: string | null
  onSaved?: () => void
}

export function GroupEditor({ open, onOpenChange, groupId, onSaved }: GroupEditorProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState<string | null>(null)

  const { data: existing } = useContactGroupDetail(groupId ?? null)
  const createMutation = useCreateContactGroup()
  const updateMutation = useUpdateContactGroup()

  const isEditing = !!groupId
  const saving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    if (open && existing && isEditing) {
      setName(existing.name)
      setDescription(existing.description || "")
      setColor(existing.color ?? null)
    } else if (open && !isEditing) {
      setName("")
      setDescription("")
      setColor(null)
    }
  }, [open, existing, isEditing])

  const handleSave = async () => {
    if (!name.trim()) return
    try {
      if (isEditing && groupId) {
        await updateMutation.mutateAsync({
          id: groupId,
          data: { name: name.trim(), description: description.trim(), color },
        })
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim(),
          color,
        })
      }
      onSaved?.()
      onOpenChange(false)
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: VIP, Newsletter, Mayoristas"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional del grupo"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    color === c ? "border-gray-900 scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(color === c ? null : c)}
                />
              ))}
            </div>
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
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Guardando..." : isEditing ? "Guardar" : "Crear Grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
