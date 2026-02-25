"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  useContentPresets,
  useCreatePreset,
  useUpdatePreset,
  useDeletePreset,
} from "@/hooks/use-manual-campaigns"
import { TemplateEditor } from "@/components/templates/template-editor"
import type { ContentPreset, ManualCampaignContent, ManualCampaignDiscount } from "@/types/campaigns"

export default function TemplatesPage() {
  const { data: presets, isLoading } = useContentPresets()
  const createMutation = useCreatePreset()
  const updateMutation = useUpdatePreset()
  const deleteMutation = useDeletePreset()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<ContentPreset | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingPreset(null)
    setEditorOpen(true)
  }

  const handleEdit = (preset: ContentPreset) => {
    setEditingPreset(preset)
    setEditorOpen(true)
  }

  const handleSave = async (data: {
    name: string
    description: string
    content: ManualCampaignContent
    discount: ManualCampaignDiscount | null
  }) => {
    try {
      if (editingPreset) {
        await updateMutation.mutateAsync({
          id: editingPreset._id,
          data: {
            name: data.name,
            description: data.description,
            content: data.content,
            discount: data.discount,
          },
        })
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description,
          content: data.content,
          discount: data.discount,
        })
      }
      setEditorOpen(false)
      setEditingPreset(null)
    } catch {
      // Error is handled by mutation state
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      setDeleteConfirm(null)
    } catch {
      // Error handled
    }
  }

  const countSections = (preset: ContentPreset) =>
    preset.content?.body_sections?.length || 0

  const sectionSummary = (preset: ContentPreset) => {
    const sections = preset.content?.body_sections || []
    const counts: Record<string, number> = {}
    for (const s of sections) {
      counts[s.type] = (counts[s.type] || 0) + 1
    }
    return Object.entries(counts)
      .map(([type, count]) => {
        const labels: Record<string, string> = {
          text: "texto",
          image: "imagen",
          button: "boton",
          divider: "divisor",
          spacer: "espacio",
        }
        return `${count} ${labels[type] || type}`
      })
      .join(", ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plantillas de Email</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea y edita plantillas reutilizables con el editor visual
          </p>
        </div>
        <Button onClick={handleCreate}>
          + Nueva Plantilla
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!presets || presets.length === 0) && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-4xl mb-4">-</div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No hay plantillas todavia
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Crea tu primera plantilla con el editor visual para usarla en tus campanas.
            </p>
            <Button onClick={handleCreate}>
              Crear primera plantilla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Grid of templates */}
      {!isLoading && presets && presets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map((preset) => (
            <Card key={preset._id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">
                    {preset.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {preset.discount?.enabled && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Descuento
                      </Badge>
                    )}
                    {countSections(preset) > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {countSections(preset)} secciones
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {preset.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {preset.description}
                  </p>
                )}

                {countSections(preset) > 0 && (
                  <p className="text-xs text-gray-400">
                    {sectionSummary(preset)}
                  </p>
                )}

                {preset.content?.subject && (
                  <p className="text-xs text-gray-400 truncate">
                    Asunto: {preset.content.subject}
                  </p>
                )}

                <p className="text-xs text-gray-300">
                  Actualizado: {new Date(preset.updated_at).toLocaleDateString("es-AR")}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={() => handleEdit(preset)}
                  >
                    Editar
                  </Button>
                  {deleteConfirm === preset._id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs"
                        onClick={() => handleDelete(preset._id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? "..." : "Si"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-gray-400 hover:text-red-500"
                      onClick={() => setDeleteConfirm(preset._id)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error states */}
      {createMutation.isError && (
        <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
          Error al crear: {createMutation.error?.message}
        </div>
      )}
      {updateMutation.isError && (
        <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
          Error al actualizar: {updateMutation.error?.message}
        </div>
      )}

      {/* Template Editor Dialog */}
      <TemplateEditor
        key={editingPreset?._id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        preset={editingPreset}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}
