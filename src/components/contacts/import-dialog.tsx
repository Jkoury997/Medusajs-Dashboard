"use client"

import { useState, useRef } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useImportCSV, useContactGroupList } from "@/hooks/use-contacts"
import { Upload, X, FileText } from "lucide-react"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported?: () => void
}

export function ImportDialog({ open, onOpenChange, onImported }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [updateExisting, setUpdateExisting] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: groupsData } = useContactGroupList()
  const importMutation = useImportCSV()
  const groups = groupsData?.groups ?? []

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId]
    )
  }

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput("")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith(".csv") || dropped.type === "text/csv")) {
      setFile(dropped)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleImport = async () => {
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    if (selectedGroups.length > 0) {
      formData.append("group_ids", JSON.stringify(selectedGroups))
    }
    if (tags.length > 0) {
      formData.append("tags", JSON.stringify(tags))
    }
    formData.append("update_existing", String(updateExisting))

    try {
      await importMutation.mutateAsync(formData)
      onImported?.()
      onOpenChange(false)
      // Reset
      setFile(null)
      setSelectedGroups([])
      setTags([])
      setTagInput("")
      setUpdateExisting(true)
    } catch {
      // error handled by mutation state
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Contactos desde CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-400">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Arrastrá un archivo CSV o hacé click para seleccionar
                </p>
                <p className="text-xs text-gray-400 mt-1">Máximo 5MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Columnas soportadas:</strong> email (requerido), first_name/nombre,
            last_name/apellido, phone/telefono, company/empresa, notas. Las columnas extra
            se guardan como campos personalizados.
          </div>

          {/* Groups selection */}
          <div className="space-y-1.5">
            <Label>Asignar a grupos</Label>
            <div className="flex flex-wrap gap-2">
              {groups.map((g) => (
                <button
                  key={g._id}
                  type="button"
                  onClick={() => toggleGroup(g._id)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    selectedGroups.includes(g._id)
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {g.name}
                </button>
              ))}
              {groups.length === 0 && (
                <span className="text-xs text-gray-400">No hay grupos</span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Agregar tags</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Agregar tag y presionar Enter"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addTag(tagInput)
                }
              }}
            />
          </div>

          {/* Update existing */}
          <div className="flex items-center justify-between">
            <Label>Actualizar contactos existentes</Label>
            <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} />
          </div>
        </div>

        {importMutation.isError && (
          <p className="text-sm text-red-600">{importMutation.error?.message}</p>
        )}

        {importMutation.isSuccess && (
          <p className="text-sm text-green-600">Importación iniciada correctamente</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
            {importMutation.isPending ? "Importando..." : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
