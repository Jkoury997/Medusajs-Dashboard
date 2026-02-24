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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AudienceBuilder } from "./audience-builder"
import { ProductPicker } from "./product-picker"
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
  useContentPresets,
  useSaveAsPreset,
} from "@/hooks/use-manual-campaigns"
import type { SegmentRule, SegmentMatchType } from "@/types/campaigns"

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
  // Form state — basic
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [rules, setRules] = useState<SegmentRule[]>([{ type: "all_customers" }])
  const [match, setMatch] = useState<SegmentMatchType>("all")

  // Form state — content
  const [heading, setHeading] = useState("")
  const [bodyText, setBodyText] = useState("")
  const [buttonText, setButtonText] = useState("")
  const [buttonUrl, setButtonUrl] = useState("")
  const [bannerGradient, setBannerGradient] = useState("")
  const [footerText, setFooterText] = useState("")

  // Form state — products
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>([])
  const [includePersonalized, setIncludePersonalized] = useState(false)

  // Form state — discount
  const [discountEnabled, setDiscountEnabled] = useState(false)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [discountValue, setDiscountValue] = useState<number>(10)
  const [discountExpiresHours, setDiscountExpiresHours] = useState<number>(48)
  const [discountSingleCode, setDiscountSingleCode] = useState(true)

  // Form state — scheduling & misc
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("09:00")
  const [testEmail, setTestEmail] = useState("")
  const [aiTheme, setAiTheme] = useState("")
  const [aiTone, setAiTone] = useState("formal")
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(campaignId ?? null)
  const [draftMsg, setDraftMsg] = useState<string | null>(null)

  // Hooks
  const { data: detail } = useManualCampaignDetail(campaignId ?? null)
  const { data: groups } = useSegmentGroups()
  const { data: presets } = useContentPresets()
  const createMutation = useCreateCampaign()
  const updateMutation = useUpdateCampaign()
  const sendMutation = useSendCampaign()
  const testSendMutation = useTestSendCampaign()
  const previewMutation = usePreviewEmail()
  const generateMutation = useGenerateContent()
  const estimateMutation = useEstimateSegment()
  const savePresetMutation = useSaveAsPreset()

  // Populate form when editing
  useEffect(() => {
    if (detail && campaignId) {
      setName(detail.name || "")
      setSubject(detail.content?.subject || "")
      setPreviewText(detail.content?.preview_text || "")
      setRules(detail.segment?.rules || [{ type: "all_customers" }])
      setMatch(detail.segment?.match || "all")
      setHeading(detail.content?.heading || "")
      setBodyText(detail.content?.body_text || "")
      setButtonText(detail.content?.button_text || "")
      setButtonUrl(detail.content?.button_url || "")
      setBannerGradient(detail.content?.banner_gradient || "")
      setFooterText(detail.content?.footer_text || "")
      setFeaturedProductIds(detail.content?.featured_product_ids || [])
      setIncludePersonalized(detail.content?.include_personalized_products || false)
      setSavedId(campaignId)

      if (detail.discount) {
        setDiscountEnabled(detail.discount.enabled)
        setDiscountType(detail.discount.type)
        setDiscountValue(detail.discount.value)
        setDiscountExpiresHours(detail.discount.expires_hours)
        setDiscountSingleCode(detail.discount.single_code)
      } else {
        setDiscountEnabled(false)
      }
    }
  }, [detail, campaignId])

  // Reset form when dialog opens for creation
  useEffect(() => {
    if (open && !campaignId) {
      setName(""); setSubject(""); setPreviewText("")
      setRules([{ type: "all_customers" }]); setMatch("all")
      setHeading(""); setBodyText(""); setButtonText(""); setButtonUrl("")
      setBannerGradient(""); setFooterText("")
      setFeaturedProductIds([]); setIncludePersonalized(false)
      setDiscountEnabled(false); setDiscountType("percentage"); setDiscountValue(10)
      setDiscountExpiresHours(48); setDiscountSingleCode(true)
      setScheduleMode("now"); setScheduledDate(""); setScheduledTime("09:00")
      setTestEmail(""); setAiTheme(""); setPreviewHtml(null)
      setSavedId(null); setDraftMsg(null)
      createMutation.reset(); updateMutation.reset()
      sendMutation.reset(); testSendMutation.reset(); generateMutation.reset()
    }
  }, [open, campaignId])

  const buildPayload = () => ({
    name,
    segment: { rules, match },
    content: {
      subject: subject || undefined,
      preview_text: previewText || undefined,
      heading: heading || undefined,
      body_text: bodyText || undefined,
      button_text: buttonText || undefined,
      button_url: buttonUrl || undefined,
      banner_gradient: bannerGradient || undefined,
      footer_text: footerText || undefined,
      featured_product_ids: featuredProductIds.length > 0 ? featuredProductIds : undefined,
      include_personalized_products: includePersonalized,
    },
    discount: discountEnabled
      ? {
          enabled: true,
          type: discountType,
          value: discountValue,
          expires_hours: discountExpiresHours,
          single_code: discountSingleCode,
          shared_code: null,
          shared_promotion_id: null,
        }
      : null,
  })

  const handleSaveDraft = async () => {
    setDraftMsg(null)
    try {
      const payload = buildPayload()
      if (savedId) {
        await updateMutation.mutateAsync({ id: savedId, data: payload })
        setDraftMsg("Borrador actualizado correctamente")
      } else {
        const created = await createMutation.mutateAsync(payload)
        setSavedId(created._id)
        setDraftMsg("Borrador guardado correctamente")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al guardar"
      setDraftMsg(`Error: ${msg}`)
    }
  }

  const handleSend = async () => {
    try {
      const payload = buildPayload()
      let id = savedId
      if (id) {
        await updateMutation.mutateAsync({ id, data: payload })
      } else {
        const created = await createMutation.mutateAsync(payload)
        id = created._id
        setSavedId(id)
      }
      const sendData: { send_at?: string } = {}
      if (scheduleMode === "later" && scheduledDate) {
        sendData.send_at = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
      }
      await sendMutation.mutateAsync({ id, data: sendData })
      onSaved?.()
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido al enviar"
      setDraftMsg(`Error: ${msg}`)
    }
  }

  const handleTestSend = () => {
    if (!savedId || !testEmail) return
    testSendMutation.mutate({ id: savedId, email: testEmail })
  }

  const handlePreviewEmail = async () => {
    if (!savedId) return
    try {
      // Save first so preview uses latest content
      await updateMutation.mutateAsync({ id: savedId, data: buildPayload() })
      const result = await previewMutation.mutateAsync(savedId)
      setPreviewHtml(result.html)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setDraftMsg(`Error preview: ${msg}`)
    }
  }

  const handleGenerateContent = async () => {
    if (!savedId || !aiTheme) return
    try {
      const result = await generateMutation.mutateAsync({ id: savedId, data: { theme: aiTheme, tone: aiTone } })
      setSubject(result.subject || subject)
      setPreviewText(result.preview_text || previewText)
      setHeading(result.heading || heading)
      setBodyText(result.body_text || bodyText)
      setButtonText(result.button_text || buttonText)
      if (result.featured_product_ids?.length > 0) {
        setFeaturedProductIds(result.featured_product_ids)
      }
      setDraftMsg("Contenido AI generado correctamente")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido"
      setDraftMsg(`Error AI: ${msg}`)
    }
  }

  const handleEstimate = () => {
    estimateMutation.mutate({ rules, match })
  }

  const handleSaveAsPreset = () => {
    if (!savedId) return
    const presetName = window.prompt("Nombre del preset:")
    if (presetName) {
      savePresetMutation.mutate(
        { campaignId: savedId, name: presetName },
        { onSuccess: () => setDraftMsg(`Preset "${presetName}" guardado`) }
      )
    }
  }

  const loadPreset = (preset: typeof presets extends (infer T)[] | undefined ? T : never) => {
    if (!preset) return
    setSubject(preset.content.subject || "")
    setPreviewText(preset.content.preview_text || "")
    setHeading(preset.content.heading || "")
    setBodyText(preset.content.body_text || "")
    setButtonText(preset.content.button_text || "")
    setButtonUrl(preset.content.button_url || "")
    setBannerGradient(preset.content.banner_gradient || "")
    setFooterText(preset.content.footer_text || "")
    setFeaturedProductIds(preset.content.featured_product_ids || [])
    setIncludePersonalized(preset.content.include_personalized_products || false)
    if (preset.discount) {
      setDiscountEnabled(preset.discount.enabled)
      setDiscountType(preset.discount.type)
      setDiscountValue(preset.discount.value)
      setDiscountExpiresHours(preset.discount.expires_hours)
      setDiscountSingleCode(preset.discount.single_code)
    }
    setDraftMsg(`Preset "${preset.name}" cargado`)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isSending = sendMutation.isPending

  return (
    <>
      <Dialog open={open && !previewHtml} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{campaignId ? "Editar Campana" : "Nueva Campana"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Presets — solo al crear nueva */}
            {!campaignId && presets && presets.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-md space-y-2">
                <Label className="text-xs font-medium text-blue-700">Comenzar desde un preset</Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset._id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => loadPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Nombre y Asunto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre de la campana</Label>
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
                  placeholder="Ej: Aprovecha 20% OFF solo hoy"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preview text */}
            <div>
              <Label className="text-xs">Texto de preview (bandeja de entrada)</Label>
              <Input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="mt-1"
                placeholder="Texto que aparece debajo del asunto en la bandeja..."
              />
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
                    placeholder="Titulo del email"
                  />
                </div>
                <div>
                  <Label className="text-xs">Texto del boton</Label>
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
                  <Label className="text-xs">URL del boton (CTA)</Label>
                  <Input
                    value={buttonUrl}
                    onChange={(e) => setButtonUrl(e.target.value)}
                    className="mt-1"
                    placeholder="https://www.marcelakoury.com/..."
                  />
                </div>
                <div>
                  <Label className="text-xs">Gradiente del banner</Label>
                  <Input
                    value={bannerGradient}
                    onChange={(e) => setBannerGradient(e.target.value)}
                    className="mt-1"
                    placeholder="Ej: linear-gradient(135deg, #ff75a8, #ff4081)"
                  />
                </div>
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

              <Separator className="my-2" />

              {/* Productos */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Productos destacados</Label>
                <ProductPicker
                  selectedIds={featuredProductIds}
                  onChange={setFeaturedProductIds}
                />
                <p className="text-xs text-gray-500">
                  {featuredProductIds.length > 0
                    ? `${featuredProductIds.length} productos seleccionados`
                    : "Si generas con IA, los productos se seleccionan automaticamente"}
                </p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={includePersonalized}
                    onCheckedChange={setIncludePersonalized}
                  />
                  <Label className="text-xs">Incluir productos personalizados por cliente (IA)</Label>
                </div>
              </div>

              <Separator className="my-2" />

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
                  <p className="text-xs text-gray-500">Guarda como borrador primero para generar con IA</p>
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
                  <p className="text-xs text-gray-500 self-center">Guarda como borrador primero</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Descuento */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={discountEnabled}
                  onCheckedChange={setDiscountEnabled}
                />
                <Label className="text-sm font-medium">Incluir descuento</Label>
              </div>
              {discountEnabled && (
                <div className="p-3 bg-green-50 rounded-md space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={discountType}
                        onValueChange={(v) => setDiscountType(v as "percentage" | "fixed")}
                      >
                        <SelectTrigger className="mt-1 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                          <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Valor</Label>
                      <Input
                        type="number"
                        min={1}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Expira en (horas)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={discountExpiresHours}
                        onChange={(e) => setDiscountExpiresHours(Number(e.target.value))}
                        className="mt-1 h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-2 pb-1">
                      <Switch
                        checked={discountSingleCode}
                        onCheckedChange={setDiscountSingleCode}
                      />
                      <Label className="text-xs">Codigo unico para todos</Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Programacion */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Envio</Label>
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
                <p className="text-xs text-gray-500">Guarda como borrador primero para enviar test</p>
              )}
              {testSendMutation.isSuccess && (
                <p className="text-xs text-green-600">Test enviado correctamente</p>
              )}
              {testSendMutation.isError && (
                <p className="text-xs text-red-600">{testSendMutation.error?.message}</p>
              )}
            </div>

            {/* Feedback */}
            {draftMsg && (
              <div className={`p-3 rounded-md text-sm ${draftMsg.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                {draftMsg}
              </div>
            )}
            {sendMutation.isError && (
              <div className="p-3 bg-red-50 rounded-md text-sm text-red-700">
                {sendMutation.error?.message}
              </div>
            )}
            {sendMutation.isSuccess && (
              <div className="p-3 bg-green-50 rounded-md text-sm text-green-700">
                {scheduleMode === "later" ? "Campana programada correctamente" : "Campana enviada correctamente"}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            {savedId && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={handleSaveAsPreset}
                disabled={savePresetMutation.isPending}
              >
                {savePresetMutation.isPending ? "Guardando..." : "Guardar como preset"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || !name}
            >
              {isSaving ? "Guardando..." : "Guardar borrador"}
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || isSaving || !name || rules.length === 0}
            >
              {isSending ? "Enviando..." : scheduleMode === "later" ? "Programar envio" : "Enviar ahora"}
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
