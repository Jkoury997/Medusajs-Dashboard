"use client"

import { useState, useCallback, useId } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SortableSection } from "./sortable-section"
import { SectionToolbar } from "./section-toolbar"
import { EmailPreview } from "./email-preview"
import { useGenerateTemplateContent } from "@/hooks/use-manual-campaigns"
import type { ContentSection, ContentPreset, ManualCampaignContent, ManualCampaignDiscount } from "@/types/campaigns"

interface SectionWithId {
  id: string
  section: ContentSection
}

interface TemplateEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preset?: ContentPreset | null
  onSave: (data: {
    name: string
    description: string
    content: ManualCampaignContent
    discount: ManualCampaignDiscount | null
  }) => void
  isSaving?: boolean
}

export function TemplateEditor({ open, onOpenChange, preset, onSave, isSaving }: TemplateEditorProps) {
  const idPrefix = useId()

  // Form state
  const [name, setName] = useState(preset?.name || "")
  const [description, setDescription] = useState(preset?.description || "")
  const [subject, setSubject] = useState(preset?.content?.subject || "")
  const [previewText, setPreviewText] = useState(preset?.content?.preview_text || "")
  const [heading, setHeading] = useState(preset?.content?.heading || "")
  const [buttonText, setButtonText] = useState(preset?.content?.button_text || "Ver mas")
  const [buttonUrl, setButtonUrl] = useState(preset?.content?.button_url || "https://www.marcelakoury.com")
  const [footerText, setFooterText] = useState(preset?.content?.footer_text || "")
  const [bannerGradient, setBannerGradient] = useState(preset?.content?.banner_gradient || "")

  // AI state
  const [aiTheme, setAiTheme] = useState("")
  const [aiTone, setAiTone] = useState("formal")
  const generateMutation = useGenerateTemplateContent()

  // Sections state
  const [sections, setSections] = useState<SectionWithId[]>(() => {
    if (preset?.content?.body_sections?.length) {
      return preset.content.body_sections.map((section, i) => ({
        id: `${idPrefix}-${i}`,
        section,
      }))
    }
    return [{ id: `${idPrefix}-0`, section: { type: "text", html: "<p>Escribe tu contenido aqui...</p>" } }]
  })

  let nextIdCounter = sections.length

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id)
        const newIndex = prev.findIndex((s) => s.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  const addSection = useCallback(
    (section: ContentSection) => {
      nextIdCounter++
      setSections((prev) => [
        ...prev,
        { id: `${idPrefix}-${Date.now()}-${nextIdCounter}`, section },
      ])
    },
    [idPrefix]
  )

  const updateSection = useCallback((id: string, updated: ContentSection) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, section: updated } : s))
    )
  }, [])

  const removeSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleGenerateAI = async () => {
    if (!aiTheme) return
    try {
      const result = await generateMutation.mutateAsync({ theme: aiTheme, tone: aiTone })
      if (result.subject) setSubject(result.subject)
      if (result.heading) setHeading(result.heading)
      if (result.button_text) setButtonText(result.button_text)
      if (result.footer_text) setFooterText(result.footer_text)
      if (result.body_sections && result.body_sections.length > 0) {
        setSections(
          result.body_sections.map((section, i) => ({
            id: `${idPrefix}-ai-${Date.now()}-${i}`,
            section,
          }))
        )
      }
    } catch {
      // Error handled by mutation state
    }
  }

  const handleSave = () => {
    const content: ManualCampaignContent = {
      subject: subject || undefined,
      preview_text: previewText || undefined,
      heading: heading || undefined,
      body_text: sections
        .filter((s) => s.section.type === "text")
        .map((s) => (s.section as { html: string }).html)
        .join("\n") || undefined,
      body_sections: sections.map((s) => s.section),
      button_text: buttonText || undefined,
      button_url: buttonUrl || undefined,
      banner_gradient: bannerGradient || undefined,
      footer_text: footerText || undefined,
      featured_product_ids: preset?.content?.featured_product_ids || [],
      include_personalized_products: preset?.content?.include_personalized_products || false,
    }

    onSave({
      name,
      description,
      content,
      discount: preset?.discount || null,
    })
  }

  // Sync state when preset changes
  const resetFromPreset = (p: ContentPreset | null | undefined) => {
    if (!p) return
    setName(p.name || "")
    setDescription(p.description || "")
    setSubject(p.content?.subject || "")
    setPreviewText(p.content?.preview_text || "")
    setHeading(p.content?.heading || "")
    setButtonText(p.content?.button_text || "Ver mas")
    setButtonUrl(p.content?.button_url || "https://www.marcelakoury.com")
    setFooterText(p.content?.footer_text || "")
    setBannerGradient(p.content?.banner_gradient || "")
    if (p.content?.body_sections?.length) {
      setSections(
        p.content.body_sections.map((section, i) => ({
          id: `${idPrefix}-reset-${i}`,
          section,
        }))
      )
    } else {
      setSections([
        { id: `${idPrefix}-reset-0`, section: { type: "text", html: "<p>Escribe tu contenido aqui...</p>" } },
      ])
    }
  }

  // Reset when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      resetFromPreset(preset)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{preset ? "Editar Plantilla" : "Nueva Plantilla"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="editor" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-[300px] grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Vista previa</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 overflow-y-auto space-y-4 pr-2 mt-2">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nombre de la plantilla *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="Ej: Promo Verano"
                />
              </div>
              <div>
                <Label className="text-xs">Descripcion</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="Breve descripcion de la plantilla"
                />
              </div>
            </div>

            {/* Email fields */}
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Asunto del email</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="Asunto que aparece en la bandeja"
                />
              </div>
              <div>
                <Label className="text-xs">Preview text</Label>
                <Input
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="Texto debajo del asunto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Titulo (heading)</Label>
                <Input
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="Titulo principal del email"
                />
              </div>
              <div>
                <Label className="text-xs">Gradiente del banner</Label>
                <Input
                  value={bannerGradient}
                  onChange={(e) => setBannerGradient(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="linear-gradient(135deg, #ff75a8, #ff4081)"
                />
              </div>
            </div>

            {/* AI Content Generation */}
            <Separator />
            <div className="p-3 bg-purple-50 rounded-md space-y-2">
              <Label className="text-xs font-medium text-purple-700">
                Generar contenido con IA
              </Label>
              <p className="text-xs text-gray-500">
                La IA genera asunto, titulo, secciones del email y mas.
              </p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Tema</Label>
                  <Input
                    value={aiTheme}
                    onChange={(e) => setAiTheme(e.target.value)}
                    className="mt-1 h-8 text-sm"
                    placeholder="Ej: Nuevos arrivals de primavera"
                  />
                </div>
                <div className="w-36">
                  <Label className="text-xs">Tono</Label>
                  <Select value={aiTone} onValueChange={setAiTone}>
                    <SelectTrigger className="mt-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="amigable">Amigable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleGenerateAI}
                  disabled={generateMutation.isPending || !aiTheme}
                >
                  {generateMutation.isPending ? "Generando..." : "Generar con IA"}
                </Button>
              </div>
              {generateMutation.isError && (
                <p className="text-xs text-red-600">{generateMutation.error?.message}</p>
              )}
              {generateMutation.isSuccess && (
                <p className="text-xs text-green-600">Contenido generado correctamente</p>
              )}
            </div>

            {/* Sections */}
            <Separator />
            <div>
              <Label className="text-sm font-medium">Secciones del email</Label>
              <p className="text-xs text-gray-500 mb-3">
                Arrastra para reordenar. Agrega texto, imagenes, botones y mas.
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sections.map((item) => (
                      <SortableSection
                        key={item.id}
                        id={item.id}
                        section={item.section}
                        onChange={(updated) => updateSection(item.id, updated)}
                        onRemove={() => removeSection(item.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="mt-3">
                <SectionToolbar onAdd={addSection} />
              </div>
            </div>

            {/* Footer fields */}
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Texto del boton (CTA)</Label>
                <Input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="Ver mas"
                />
              </div>
              <div>
                <Label className="text-xs">URL del boton</Label>
                <Input
                  value={buttonUrl}
                  onChange={(e) => setButtonUrl(e.target.value)}
                  className="mt-1 h-8 text-sm"
                  placeholder="https://www.marcelakoury.com"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Texto del footer</Label>
              <Textarea
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="mt-1 text-sm"
                rows={2}
                placeholder="Texto al pie del email"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-y-auto mt-2">
            <EmailPreview
              heading={heading}
              sections={sections.map((s) => s.section)}
              buttonText={buttonText}
              buttonUrl={buttonUrl}
              footerText={footerText}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name || isSaving}
          >
            {isSaving ? "Guardando..." : preset ? "Actualizar plantilla" : "Guardar plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
