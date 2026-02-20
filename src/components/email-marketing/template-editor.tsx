"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useTemplateResolved,
  useUpsertTemplate,
  useDeleteTemplate,
  useTemplatePreview,
} from "@/hooks/use-email-templates"
import type { EmailTemplateType, EmailTemplateFields } from "@/types/email-marketing"

const GROUP_OPTIONS = [
  { value: "global", label: "Global (por defecto)" },
  { value: "minorista", label: "Minorista" },
  { value: "mayorista", label: "Mayorista" },
  { value: "revendedora", label: "Revendedora" },
]

const TYPE_OPTIONS: { value: EmailTemplateType; label: string }[] = [
  { value: "reminder", label: "Recordatorio (Email 1)" },
  { value: "coupon", label: "Cupon con descuento (Email 2)" },
]

const TEMPLATE_VARIABLES = [
  { key: "customer_name", desc: "Nombre del cliente" },
  { key: "discount_value", desc: "Valor del descuento (ej: 15% OFF)" },
  { key: "coupon_code", desc: "Codigo del cupon" },
  { key: "cart_total", desc: "Total del carrito" },
]

const SOURCE_LABELS: Record<string, string> = {
  group_db: "Personalizado (grupo)",
  default_db: "Personalizado (global)",
  hardcoded: "Por defecto",
}

const EMPTY_FORM: EmailTemplateFields = {
  subject: "",
  heading: "",
  body_text: "",
  button_text: "",
  banner_gradient: "",
  footer_text: "",
  validity_text: "",
}

export function TemplateEditor() {
  // Selection
  const [selectedType, setSelectedType] = useState<EmailTemplateType>("reminder")
  const [selectedGroup, setSelectedGroup] = useState("global")

  // "global" → undefined para los hooks (sin filtro de grupo)
  const groupForApi = selectedGroup === "global" ? undefined : selectedGroup

  // Form
  const [formData, setFormData] = useState<EmailTemplateFields>({ ...EMPTY_FORM })
  const [isDirty, setIsDirty] = useState(false)

  // Preview dialog
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")

  // Hooks
  const { data: resolved, isLoading } = useTemplateResolved(
    selectedType,
    groupForApi,
  )
  const upsertMutation = useUpsertTemplate()
  const deleteMutation = useDeleteTemplate()
  const previewMutation = useTemplatePreview()

  // Sync form when resolved template loads
  useEffect(() => {
    if (resolved) {
      setFormData({
        subject: resolved.subject || "",
        heading: resolved.heading || "",
        body_text: resolved.body_text || "",
        button_text: resolved.button_text || "",
        banner_gradient: resolved.banner_gradient || "",
        footer_text: resolved.footer_text || "",
        validity_text: resolved.validity_text || "",
      })
      setIsDirty(false)
    }
  }, [resolved])

  const updateField = (field: keyof EmailTemplateFields, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    upsertMutation.mutate({
      type: selectedType,
      groupName: groupForApi,
      data: formData,
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(
      { type: selectedType, groupName: groupForApi },
      {
        onSuccess: () => {
          setIsDirty(false)
        },
      },
    )
  }

  const handlePreview = () => {
    previewMutation.mutate(
      { type: selectedType, groupName: groupForApi },
      {
        onSuccess: (result) => {
          setPreviewHtml(result.html)
          setPreviewOpen(true)
        },
      },
    )
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`)
  }

  const isCustom = resolved?.source === "group_db" || resolved?.source === "default_db"

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Editor de Templates</CardTitle>
            {resolved && (
              <Badge
                variant="outline"
                className={
                  isCustom
                    ? "text-blue-600 border-blue-300"
                    : "text-gray-500"
                }
              >
                {SOURCE_LABELS[resolved.source] || resolved.source}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Selectores */}
          <div className="flex flex-wrap gap-4">
            <div>
              <Label className="text-xs text-gray-500">Tipo de email</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v as EmailTemplateType)
                  setIsDirty(false)
                }}
              >
                <SelectTrigger className="mt-1 w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Grupo de cliente</Label>
              <Select
                value={selectedGroup}
                onValueChange={(v) => {
                  setSelectedGroup(v)
                  setIsDirty(false)
                }}
              >
                <SelectTrigger className="mt-1 w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <>
              {/* Formulario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Asunto del email</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => updateField("subject", e.target.value)}
                    placeholder="Ej: {{customer_name}}, tu carrito te esta esperando!"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Encabezado</Label>
                  <Input
                    value={formData.heading}
                    onChange={(e) => updateField("heading", e.target.value)}
                    placeholder="Ej: {{customer_name}}, olvidaste algo!"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Texto del cuerpo</Label>
                  <Textarea
                    value={formData.body_text}
                    onChange={(e) => updateField("body_text", e.target.value)}
                    placeholder="Texto principal del email..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Texto del boton</Label>
                  <Input
                    value={formData.button_text}
                    onChange={(e) => updateField("button_text", e.target.value)}
                    placeholder="Ej: Completar mi compra"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Gradiente CSS del banner</Label>
                  <Input
                    value={formData.banner_gradient}
                    onChange={(e) => updateField("banner_gradient", e.target.value)}
                    placeholder="Ej: linear-gradient(to right, #3b82f6, #4f46e5)"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Texto del pie</Label>
                  <Input
                    value={formData.footer_text}
                    onChange={(e) => updateField("footer_text", e.target.value)}
                    placeholder="Ej: Si tenes alguna pregunta..."
                    className="mt-1"
                  />
                </div>
                {selectedType === "coupon" && (
                  <div className="md:col-span-2">
                    <Label>Texto de validez</Label>
                    <Input
                      value={formData.validity_text}
                      onChange={(e) => updateField("validity_text", e.target.value)}
                      placeholder="Ej: Valido por 48 horas"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Variables disponibles */}
              <div>
                <p className="text-xs text-gray-500 mb-2">
                  Variables disponibles (click para copiar):
                </p>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARIABLES.map((v) => (
                    <Badge
                      key={v.key}
                      variant="outline"
                      className="cursor-pointer text-xs hover:bg-pink-50 hover:border-pink-300 transition-colors"
                      onClick={() => copyVariable(v.key)}
                      title={v.desc}
                    >
                      {`{{${v.key}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-wrap gap-3 pt-2 border-t">
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  disabled={previewMutation.isPending}
                >
                  {previewMutation.isPending ? "Generando..." : "Vista previa"}
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={upsertMutation.isPending}
                >
                  {upsertMutation.isPending ? "Guardando..." : "Guardar template"}
                </Button>
                {isCustom && (
                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    {deleteMutation.isPending ? "Eliminando..." : "Restaurar por defecto"}
                  </Button>
                )}
              </div>

              {/* Feedback */}
              {upsertMutation.isSuccess && (
                <p className="text-sm text-green-600">Template guardado correctamente</p>
              )}
              {upsertMutation.isError && (
                <p className="text-sm text-red-600">
                  Error al guardar: {upsertMutation.error?.message}
                </p>
              )}
              {deleteMutation.isSuccess && (
                <p className="text-sm text-green-600">Template restaurado a los valores por defecto</p>
              )}
              {deleteMutation.isError && (
                <p className="text-sm text-red-600">
                  Error al restaurar: {deleteMutation.error?.message}
                </p>
              )}
              {previewMutation.isError && (
                <p className="text-sm text-red-600">
                  Error al generar preview: {previewMutation.error?.message}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-base">
              Vista previa: {formData.subject || "Sin asunto"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[65vh] border rounded-md bg-white">
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[500px] border-0"
              title="Vista previa del template"
              sandbox="allow-same-origin"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
