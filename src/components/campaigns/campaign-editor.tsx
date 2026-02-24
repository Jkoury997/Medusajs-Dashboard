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
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AudienceBuilder } from "./audience-builder"
import {
  useManualCampaignDetail,
  useCreateCampaign,
  useUpdateCampaign,
  useSendCampaign,
  useTestSendCampaign,
  usePreviewEmail,
  useGenerateContent,
  useEstimateSegment,
  useSegmentGroups,
} from "@/hooks/use-manual-campaigns"
import type { SegmentRule, SegmentMatchType } from "@/types/campaigns"

const TEMPLATE_TYPES = [
  { value: "reminder", label: "Recordatorio" },
  { value: "coupon", label: "Cupón" },
  { value: "post_purchase", label: "Post-Compra" },
  { value: "welcome_1", label: "Bienvenida 1" },
  { value: "welcome_2", label: "Bienvenida 2" },
  { value: "welcome_3", label: "Bienvenida 3" },
  { value: "browse_abandonment", label: "Browse Abandonment" },
]

const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "urgente", label: "Urgente" },
  { value: "amigable", label: "Amigable" },
]

interface CampaignEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId?: string | null
  onSaved?: () => void
}

export function CampaignEditor({ open, onOpenChange, campaignId, onSaved }: CampaignEditorProps) {
  // Form state
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [templateType, setTemplateType] = useState("reminder")
  const [rules, setRules] = useState<SegmentRule[]>([{ type: "all_customers" }])
  const [match, setMatch] = useState<SegmentMatchType>("all")
  const [heading, setHeading] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [buttonText, setButtonText] = useState("")
  const [bannerGradient, setBannerGradient] = useState("")
  const [footerText, setFooterText] = useState("")
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("09:00")
  const [testEmail, setTestEmail] = useState("")
  const [aiTheme, setAiTheme] = useState("")
  const [aiTone, setAiTone] = useState("formal")
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(campaignId ?? null)

  // Hooks
  const { data: detail } = useManualCampaignDetail(campaignId ?? null)
  const { data: groups } = useSegmentGroups()
  const createMutation = useCreateCampaign()
  const updateMutation = useUpdateCampaign()
  const sendMutation = useSendCampaign()
  const testSendMutation = useTestSendCampaign()
  const previewMutation = usePreviewEmail()
  const generateMutation = useGenerateContent()
  const estimateMutation = useEstimateSegment()

  // Populate form when editing
  useEffect(() => {
    if (detail && campaignId) {
      setName(detail.name || "")
      setSubject(detail.subject || "")
      setTemplateType(detail.template_type || "reminder")
      setRules(detail.audience?.rules || [{ type: "all_customers" }])
      setMatch(detail.audience?.match || "all")
      setHeading(detail.content?.heading || "")
      setBodyText(detail.content?.body_text || "")
      setButtonText(detail.content?.button_text || "")
      setBannerGradient(detail.content?.banner_gradient || "")
      setFooterText(detail.content?.footer_text || "")
      setSavedId(campaignId)
    }
  }, [detail, campaignId])

  // Reset form when dialog opens for creation
  useEffect(() => {
    if (open && !campaignId) {
      setName("")
      setSubject("")
      setTemplateType("reminder")
      setRules([{ type: "all_customers" }])
      setMatch("all")
      setHeading("")
      setBodyText("")
      setButtonText("")
      setBannerGradient("")
      setFooterText("")
      setScheduleMode("now")
      setScheduledDate("")
      setScheduledTime("09:00")
      setTestEmail("")
      setAiTheme("")
      setPreviewHtml(null)
      setSavedId(null)
      createMutation.reset()
      updateMutation.reset()
      sendMutation.reset()
      testSendMutation.reset()
      generateMutation.reset()
    }
  }, [open, campaignId])

  const buildPayload = () => ({
    name,
    subject,
    template_type: templateType,
    audience: { rules, match },
    content: {
      heading: heading || undefined,
      body_text: bodyText || undefined,
      button_text: buttonText || undefined,
      banner_gradient: bannerGradient || undefined,
      footer_text: footerText || undefined,
    },
  })

  const handleSaveDraft = async () => {
    const payload = buildPayload()
    if (savedId) {
      await updateMutation.mutateAsync({ id: savedId, data: payload })
    } else {
      const created = await createMutation.mutateAsync(payload)
      setSavedId(created.id)
    }
    onSaved?.()
  }

  const handleSend = async () => {
    // Save first
    const payload = buildPayload()
    let id = savedId
    if (id) {
      await updateMutation.mutateAsync({ id, data: payload })
    } else {
      const created = await createMutation.mutateAsync(payload)
      id = created.id
      setSavedId(id)
    }
    // Then send
    const sendData: { send_at?: string } = {}
    if (scheduleMode === "later" && scheduledDate) {
      sendData.send_at = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
    }
    await sendMutation.mutateAsync({ id, data: sendData })
    onSaved?.()
    onOpenChange(false)
  }

  const handleTestSend = () => {
    if (!savedId || !testEmail) return
    testSendMutation.mutate({ id: savedId, email: testEmail })
  }

  const handlePreviewEmail = async () => {
    if (!savedId) return
    const result = await previewMutation.mutateAsync(savedId)
    setPreviewHtml(result.html)
  }

  const handleGenerateContent = async () => {
    if (!savedId || !aiTheme) return
    const result = await generateMutation.mutateAsync({ id: savedId, data: { theme: aiTheme, tone: aiTone } })
    setSubject(result.subject || subject)
    setHeading(result.heading || heading)
    setBodyText(result.body_text || bodyText)
    setButtonText(result.button_text || buttonText)
  }

  const handleEstimate = () => {
    estimateMutation.mutate({ rules, match })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isSending = sendMutation.isPending

  return (
    <>
      <Dialog open={open && !previewHtml} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{campaignId ? "Editar Campaña" : "Nueva Campaña"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Nombre y Asunto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre de la campaña</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Promo Verano 2026"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Asunto del email</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Aprovechá 20% OFF solo hoy"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Template Type */}
            <div>
              <Label>Tipo de template</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger className="mt-1 w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Audiencia */}
            <div>
              <Label className="text-sm font-medium">Audiencia</Label>
              <div className="mt-2">
                <AudienceBuilder
                  rules={rules}
                  match={match}
                  onChange={(r, m) => { setRules(r); setMatch(m) }}
                  onEstimate={handleEstimate}
                  estimatedCount={estimateMutation.data?.estimated_count ?? null}
                  isEstimating={estimateMutation.isPending}
                  groups={groups ?? undefined}
                />
              </div>
            </div>

            <Separator />

            {/* Contenido */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Contenido</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Heading</Label>
                  <Input
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    className="mt-1"
                    placeholder="Título del email"
                  />
                </div>
                <div>
                  <Label className="text-xs">Texto del botón</Label>
                  <Input
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="mt-1"
                    placeholder="Ej: Ver ofertas"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Cuerpo del email</Label>
                <Textarea
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="mt-1"
                  rows={4}
                  placeholder="Texto principal del email..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Gradiente del banner</Label>
                  <Input
                    value={bannerGradient}
                    onChange={(e) => setBannerGradient(e.target.value)}
                    className="mt-1"
                    placeholder="Ej: linear-gradient(135deg, #ff75a8, #ff4081)"
                  />
                </div>
                <div>
                  <Label className="text-xs">Texto del footer</Label>
                  <Input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    className="mt-1"
                    placeholder="Texto al pie del email"
                  />
                </div>
              </div>

              {/* AI Content Generation */}
              <div className="p-3 bg-purple-50 rounded-md space-y-2">
                <Label className="text-xs font-medium text-purple-700">Generar contenido con IA</Label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Tema</Label>
                    <Input
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      className="mt-1 h-8 text-sm"
                      placeholder="Ej: Descuentos de temporada"
                    />
                  </div>
                  <div className="w-36">
                    <Label className="text-xs">Tono</Label>
                    <Select value={aiTone} onValueChange={setAiTone}>
                      <SelectTrigger className="mt-1 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={handleGenerateContent}
                    disabled={generateMutation.isPending || !savedId || !aiTheme}
                  >
                    {generateMutation.isPending ? "Generando..." : "Generar"}
                  </Button>
                </div>
                {!savedId && (
                  <p className="text-xs text-gray-500">Guardá como borrador primero para generar con IA</p>
                )}
                {generateMutation.isError && (
                  <p className="text-xs text-red-600">{generateMutation.error?.message}</p>
                )}
              </div>

              {/* Preview Email */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={handlePreviewEmail}
                  disabled={previewMutation.isPending || !savedId}
                >
                  {previewMutation.isPending ? "Cargando..." : "Vista previa del email"}
                </Button>
                {!savedId && (
                  <p className="text-xs text-gray-500 self-center">Guardá como borrador primero</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Programación */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Envío</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={scheduleMode === "now" ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setScheduleMode("now")}
                >
                  Enviar ahora
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={scheduleMode === "later" ? "default" : "outline"}
                  className="h-8 text-xs"
                  onClick={() => setScheduleMode("later")}
                >
                  Programar
                </Button>
              </div>
              {scheduleMode === "later" && (
                <div className="flex gap-2">
                  <div>
                    <Label className="text-xs">Fecha</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Hora</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="mt-1 h-8 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Test Send */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Enviar prueba</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="h-8 text-sm max-w-xs"
                  placeholder="email@ejemplo.com"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={handleTestSend}
                  disabled={testSendMutation.isPending || !savedId || !testEmail}
                >
                  {testSendMutation.isPending ? "Enviando..." : "Enviar test"}
                </Button>
              </div>
              {!savedId && (
                <p className="text-xs text-gray-500">Guardá como borrador primero para enviar test</p>
              )}
              {testSendMutation.isSuccess && (
                <p className="text-xs text-green-600">Test enviado correctamente</p>
              )}
              {testSendMutation.isError && (
                <p className="text-xs text-red-600">{testSendMutation.error?.message}</p>
              )}
            </div>

            {/* Feedback */}
            {(createMutation.isError || updateMutation.isError) && (
              <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
                {createMutation.error?.message || updateMutation.error?.message}
              </div>
            )}
            {sendMutation.isError && (
              <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
                {sendMutation.error?.message}
              </div>
            )}
            {sendMutation.isSuccess && (
              <div className="p-3 bg-green-50 rounded-md text-sm text-green-700">
                {scheduleMode === "later" ? "Campaña programada correctamente" : "Campaña enviada correctamente"}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || !name || !subject}
            >
              {isSaving ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || isSaving || !name || !subject || rules.length === 0}
            >
              {isSending ? "Enviando..." : scheduleMode === "later" ? "Programar envío" : "Enviar ahora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Vista previa del email</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[60vh] border rounded-md"
              sandbox="allow-same-origin"
              title="Email preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
