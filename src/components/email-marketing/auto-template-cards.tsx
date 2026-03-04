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
  useTemplateList,
  useTemplateResolved,
  useUpsertTemplate,
  useDeleteTemplate,
  useTemplatePreview,
} from "@/hooks/use-email-templates"
import type { EmailTemplateType, EmailTemplateFields } from "@/types/email-marketing"

// ─── Static info per template type ───

const TEMPLATE_TYPES: EmailTemplateType[] = [
  "reminder",
  "coupon",
  "post_purchase",
  "welcome_1",
  "welcome_2",
  "welcome_3",
  "browse_abandonment",
  "newsletter",
  "win_back",
]

const TYPE_INFO: Record<
  EmailTemplateType,
  { label: string; campaign: string; color: string; desc: string }
> = {
  reminder: {
    label: "Recordatorio (Email 1)",
    campaign: "Carrito Abandonado",
    color: "bg-orange-100 text-orange-700",
    desc: "Primer email recordando los productos en el carrito",
  },
  coupon: {
    label: "Cupon (Email 2)",
    campaign: "Carrito Abandonado",
    color: "bg-pink-100 text-pink-700",
    desc: "Segundo email con descuento para recuperar el carrito",
  },
  post_purchase: {
    label: "Post-Compra",
    campaign: "Post-Compra",
    color: "bg-green-100 text-green-700",
    desc: "Cross-sell despues de una compra",
  },
  welcome_1: {
    label: "Bienvenida 1",
    campaign: "Bienvenida",
    color: "bg-blue-100 text-blue-700",
    desc: "Email inmediato al registrarse",
  },
  welcome_2: {
    label: "Bienvenida 2",
    campaign: "Bienvenida",
    color: "bg-blue-100 text-blue-700",
    desc: "Segundo email con descuento de bienvenida",
  },
  welcome_3: {
    label: "Bienvenida 3 (IA)",
    campaign: "Bienvenida",
    color: "bg-purple-100 text-purple-700",
    desc: "Tercer email con contenido generado por IA",
  },
  browse_abandonment: {
    label: "Browse Abandonment",
    campaign: "Browse",
    color: "bg-amber-100 text-amber-700",
    desc: "Email cuando un cliente ve un producto sin comprar",
  },
  newsletter: {
    label: "Newsletter",
    campaign: "Newsletter",
    color: "bg-teal-100 text-teal-700",
    desc: "Newsletter periodico con contenido IA",
  },
  win_back: {
    label: "Win-Back",
    campaign: "Reactivacion",
    color: "bg-rose-100 text-rose-700",
    desc: "Reactivar clientes inactivos",
  },
}

const GROUP_OPTIONS = [
  { value: "global", label: "Global (por defecto)" },
  { value: "minorista", label: "Minorista" },
  { value: "mayorista", label: "Mayorista" },
  { value: "revendedora", label: "Revendedora" },
]

const TEMPLATE_VARIABLES = [
  { key: "customer_name", desc: "Nombre del cliente" },
  { key: "discount_value", desc: "Valor del descuento (ej: 15% OFF)" },
  { key: "coupon_code", desc: "Codigo del cupon" },
  { key: "cart_total", desc: "Total del carrito" },
  { key: "product_name", desc: "Nombre del producto (browse_abandonment)" },
  { key: "order_number", desc: "Numero de orden (post_purchase)" },
  { key: "category_name", desc: "Categoria del producto" },
]

const EMPTY_FORM: EmailTemplateFields = {
  subject: "",
  heading: "",
  body_text: "",
  button_text: "",
  banner_gradient: "",
  footer_text: "",
  validity_text: "",
}

// ─── Editor Dialog ───

function TemplateEditorDialog({
  type,
  open,
  onOpenChange,
}: {
  type: EmailTemplateType
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const info = TYPE_INFO[type]
  const [selectedGroup, setSelectedGroup] = useState("global")
  const groupForApi = selectedGroup === "global" ? undefined : selectedGroup

  const [formData, setFormData] = useState<EmailTemplateFields>({ ...EMPTY_FORM })
  const [isDirty, setIsDirty] = useState(false)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")

  const { data: resolved, isLoading } = useTemplateResolved(
    open ? type : ("reminder" as EmailTemplateType),
    groupForApi,
  )

  useEffect(() => {
    if (resolved && open) {
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
  }, [resolved, open])

  const upsertMutation = useUpsertTemplate()
  const deleteMutation = useDeleteTemplate()
  const previewMutation = useTemplatePreview()

  const isCustom = resolved?.source === "group_db" || resolved?.source === "default_db"

  const updateField = (field: keyof EmailTemplateFields, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = () => {
    upsertMutation.mutate({ type, groupName: groupForApi, data: formData })
  }

  const handleDelete = () => {
    deleteMutation.mutate(
      { type, groupName: groupForApi },
      { onSuccess: () => setIsDirty(false) },
    )
  }

  const handlePreview = () => {
    previewMutation.mutate(
      { type, groupName: groupForApi },
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base">{info.label}</DialogTitle>
              <Badge className={info.color}>{info.campaign}</Badge>
              {resolved && (
                <Badge
                  variant="outline"
                  className={
                    isCustom ? "text-blue-600 border-blue-300" : "text-gray-500"
                  }
                >
                  {isCustom ? "Personalizado" : "Por defecto"}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Group selector */}
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

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <>
                {/* Form */}
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
                  {["coupon", "welcome_2"].includes(type) && (
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

                {/* Variables */}
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

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2 border-t">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    disabled={previewMutation.isPending}
                  >
                    {previewMutation.isPending ? "Generando..." : "Vista previa"}
                  </Button>
                  <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? "Guardando..." : "Guardar template"}
                  </Button>
                  {isCustom && (
                    <Button
                      onClick={handleDelete}
                      variant="outline"
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      {deleteMutation.isPending ? "..." : "Restaurar por defecto"}
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
                  <p className="text-sm text-green-600">
                    Template restaurado a los valores por defecto
                  </p>
                )}
                {deleteMutation.isError && (
                  <p className="text-sm text-red-600">
                    Error: {deleteMutation.error?.message}
                  </p>
                )}
                {previewMutation.isError && (
                  <p className="text-sm text-red-600">
                    Error preview: {previewMutation.error?.message}
                  </p>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

// ─── Main Cards Grid ───

export function AutoTemplateCards() {
  const { data: templateList, isLoading } = useTemplateList()
  const [editingType, setEditingType] = useState<EmailTemplateType | null>(null)

  // Build a map: type → array of custom group names
  const customMap = new Map<string, string[]>()
  if (templateList?.templates) {
    for (const t of templateList.templates) {
      const key = t.template_type
      if (!customMap.has(key)) customMap.set(key, [])
      if (t.group_name) {
        customMap.get(key)!.push(t.group_name)
      }
    }
  }

  // Get default subject for each type from the defaults map
  const getDefaultSubject = (type: EmailTemplateType): string | null => {
    if (templateList?.defaults?.[type]) {
      return templateList.defaults[type].subject || null
    }
    // Check if there's a custom template with subject
    const custom = templateList?.templates?.find(
      (t) => t.template_type === type && !t.group_name,
    )
    return custom?.subject || null
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATE_TYPES.map((type) => {
          const info = TYPE_INFO[type]
          const hasCustom = customMap.has(type)
          const customGroups = customMap.get(type) || []
          const subject = getDefaultSubject(type)

          return (
            <Card
              key={type}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base leading-tight">
                    {info.label}
                  </CardTitle>
                  <Badge className={`${info.color} text-[10px] px-1.5 py-0 shrink-0`}>
                    {info.campaign}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-500">{info.desc}</p>

                {subject && (
                  <p className="text-xs text-gray-400 truncate">
                    Asunto: {subject}
                  </p>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  {hasCustom ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-blue-600 border-blue-300"
                    >
                      Personalizado
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-gray-500"
                    >
                      Por defecto
                    </Badge>
                  )}
                  {customGroups.length > 0 &&
                    customGroups.map((g) => (
                      <Badge
                        key={g}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {g}
                      </Badge>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs flex-1"
                    onClick={() => setEditingType(type)}
                  >
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Editor dialog for the selected type */}
      {editingType && (
        <TemplateEditorDialog
          key={editingType}
          type={editingType}
          open={!!editingType}
          onOpenChange={(open) => {
            if (!open) setEditingType(null)
          }}
        />
      )}
    </>
  )
}
