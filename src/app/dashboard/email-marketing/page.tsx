"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  useAbandonedCartStats,
  useEmailConfig,
  useProcessAbandonedCarts,
  useUpdateGlobalConfig,
  useUpdateGroupConfig,
  useDeleteGroupConfig,
} from "@/hooks/use-email-marketing"
import { useMedusaCustomerGroups } from "@/hooks/use-resellers"
import {
  useCampaignConfig,
  useProcessCampaigns,
  useNewsletterSend,
  useNewsletterSchedule,
} from "@/hooks/use-campaigns"
import { useHealthCheck } from "@/hooks/use-health-check"
import { TemplateEditor } from "@/components/email-marketing/template-editor"
import { formatNumber } from "@/lib/format"
import type {
  DiscountType,
  AiTone,
  CampaignsEnabledMap,
  CampaignTimings,
} from "@/types/email-marketing"

const GROUP_LABELS: Record<string, string> = {
  minorista: "Minorista",
  mayorista: "Mayorista",
  revendedora: "Revendedora",
}

const GROUP_COLORS: Record<string, string> = {
  minorista: "bg-blue-100 text-blue-700",
  mayorista: "bg-purple-100 text-purple-700",
  revendedora: "bg-amber-100 text-amber-700",
}

const CAMPAIGN_LABELS: Record<string, string> = {
  post_purchase: "Post-Compra",
  welcome_1: "Bienvenida 1",
  welcome_2: "Bienvenida 2 (Descuento)",
  welcome_3: "Bienvenida 3 (IA)",
  browse_abandonment: "Browse Abandonment",
  newsletter: "Newsletter",
  win_back: "Win-Back",
}

const TIMING_FIELDS: { key: keyof CampaignTimings; label: string; unit: string }[] = [
  { key: "post_purchase_min_hours", label: "Post-compra mín", unit: "horas" },
  { key: "post_purchase_max_hours", label: "Post-compra máx", unit: "horas" },
  { key: "welcome_1_min_minutes", label: "Bienvenida 1 mín", unit: "minutos" },
  { key: "welcome_2_min_hours", label: "Bienvenida 2 mín", unit: "horas" },
  { key: "welcome_3_min_days", label: "Bienvenida 3 mín", unit: "días" },
  { key: "browse_min_views", label: "Browse mín vistas", unit: "vistas" },
  { key: "browse_wait_hours", label: "Browse espera", unit: "horas" },
  { key: "browse_lookback_hours", label: "Browse lookback", unit: "horas" },
  { key: "abandoned_cart_email1_min_hours", label: "Carrito Email 1 mín", unit: "horas" },
  { key: "abandoned_cart_email1_max_hours", label: "Carrito Email 1 máx", unit: "horas" },
  { key: "abandoned_cart_email2_min_hours", label: "Carrito Email 2 mín", unit: "horas" },
  { key: "winback_inactivity_days", label: "Win-Back inactividad", unit: "días" },
  { key: "winback_cooldown_days", label: "Win-Back cooldown", unit: "días" },
]

const AI_TONE_OPTIONS = [
  { value: "warm", label: "Cálido" },
  { value: "urgent", label: "Urgente" },
  { value: "exclusive", label: "Exclusivo" },
  { value: "professional", label: "Profesional" },
  { value: "casual", label: "Casual" },
] as const

export default function EmailMarketingPage() {
  // Stats
  const { data: stats, isLoading: statsLoading } = useAbandonedCartStats()

  // Config
  const { data: config, isLoading: configLoading } = useEmailConfig()

  // Campaign config
  const { data: campaignConfig, isLoading: campaignConfigLoading } = useCampaignConfig()

  // Health check
  const { data: health, isLoading: healthLoading } = useHealthCheck()

  // Medusa customer groups (to resolve group_id for config operations)
  const { data: customerGroups } = useMedusaCustomerGroups()

  // Mutations
  const processMutation = useProcessAbandonedCarts()
  const updateGlobalMutation = useUpdateGlobalConfig()
  const updateGroupMutation = useUpdateGroupConfig()
  const deleteGroupMutation = useDeleteGroupConfig()
  const processCampaignsMutation = useProcessCampaigns()
  const newsletterSendMutation = useNewsletterSend()
  const newsletterScheduleMutation = useNewsletterSchedule()

  // Config local state for editing
  const [globalEnabled, setGlobalEnabled] = useState<boolean | null>(null)
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState<boolean | null>(null)
  const [globalDiscountPct, setGlobalDiscountPct] = useState<string>("")
  const [globalDiscountType, setGlobalDiscountType] = useState<DiscountType | null>(null)
  const [globalDiscountMaxPct, setGlobalDiscountMaxPct] = useState<string>("")
  const [globalDiscountMaxFixed, setGlobalDiscountMaxFixed] = useState<string>("")

  // Campaign config local state
  const [campaignsEnabled, setCampaignsEnabled] = useState<Partial<CampaignsEnabledMap> | null>(null)
  const [timings, setTimings] = useState<Partial<CampaignTimings> | null>(null)
  const [frequencyCapPerWeek, setFrequencyCapPerWeek] = useState<string>("")
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null)
  const [aiModel, setAiModel] = useState<string>("")
  const [aiModelRecommendations, setAiModelRecommendations] = useState<string>("")
  const [aiTone, setAiTone] = useState<AiTone | null>(null)

  // Newsletter config local state
  const [newsletterCronEnabled, setNewsletterCronEnabled] = useState<boolean | null>(null)
  const [newsletterCronExpression, setNewsletterCronExpression] = useState<string>("")
  const [newsletterDefaultTheme, setNewsletterDefaultTheme] = useState<string>("")
  const [newsletterSendTheme, setNewsletterSendTheme] = useState<string>("")
  const [newsletterSendGroup, setNewsletterSendGroup] = useState<string>("")

  // Sync config state when data loads
  const effectiveGlobalEnabled = globalEnabled ?? config?.global?.enabled ?? true
  const effectiveGlobalDiscountEnabled = globalDiscountEnabled ?? config?.global?.discount_enabled ?? true
  const effectiveGlobalDiscountPct = globalDiscountPct || String(config?.global?.discount_percentage ?? 10)
  const effectiveGlobalDiscountType = globalDiscountType ?? config?.global?.discount_type ?? "percentage"
  const effectiveGlobalDiscountMaxPct = globalDiscountMaxPct || String(config?.global?.discount_max_percentage ?? "")
  const effectiveGlobalDiscountMaxFixed = globalDiscountMaxFixed || String(config?.global?.discount_max_fixed ?? "")

  // Campaign config effective values
  const defaultCampaignsEnabled: CampaignsEnabledMap = {
    post_purchase: true, welcome_1: true, welcome_2: true, welcome_3: true, browse_abandonment: true, newsletter: true, win_back: true,
  }
  const effectiveCampaignsEnabled = {
    ...defaultCampaignsEnabled,
    ...(campaignConfig?.effective_global?.campaigns_enabled ?? {}),
    ...(campaignsEnabled ?? {}),
  }
  const effectiveTimings = {
    ...(campaignConfig?.effective_global?.timings ?? {}),
    ...(timings ?? {}),
  }
  const effectiveFrequencyCapPerWeek = frequencyCapPerWeek || String(campaignConfig?.effective_global?.frequency_cap_per_week ?? 3)
  const effectiveAiEnabled = aiEnabled ?? campaignConfig?.effective_global?.ai_enabled ?? true
  const effectiveAiModel = aiModel || campaignConfig?.effective_global?.ai_model || "gpt-4o-mini"
  const effectiveAiModelRecommendations = aiModelRecommendations || campaignConfig?.effective_global?.ai_model_recommendations || "gpt-4o-mini"
  const effectiveAiTone = aiTone ?? campaignConfig?.effective_global?.ai_tone ?? "warm"
  const effectiveNewsletterCronEnabled = newsletterCronEnabled ?? campaignConfig?.effective_global?.newsletter_cron_enabled ?? false
  const effectiveNewsletterCronExpression = newsletterCronExpression || campaignConfig?.effective_global?.newsletter_cron_expression || "0 10 * * 1"
  const effectiveNewsletterDefaultTheme = newsletterDefaultTheme || campaignConfig?.effective_global?.newsletter_default_theme || ""

  return (
    <div>
      <Header
        title="Email Marketing"
        description="Carritos abandonados, recuperación automática y configuración de descuentos"
      />
      <div className="p-6 space-y-6">
        <Tabs defaultValue="resumen">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* TAB: Resumen */}
          <TabsContent value="resumen" className="space-y-6 mt-4">
            {statsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
                </div>
                <Skeleton className="h-[300px]" />
              </div>
            ) : stats ? (
              <>
                {/* Health Check Status */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Estado del Sistema</p>
                        <p className="text-xs text-gray-400 mt-1">Email Marketing Backend</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {healthLoading ? (
                          <Skeleton className="h-6 w-20" />
                        ) : health ? (
                          <>
                            <Badge className={health.status === "ok" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {health.status === "ok" ? "Activo" : "Error"}
                            </Badge>
                            <Badge className={health.mongo === "connected" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              Mongo: {health.mongo === "connected" ? "OK" : "Error"}
                            </Badge>
                            <Badge className={health.abandoned_cart_enabled ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}>
                              Carritos: {health.abandoned_cart_enabled ? "ON" : "OFF"}
                            </Badge>
                            <Badge className={health.campaigns_enabled ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}>
                              Campañas: {health.campaigns_enabled ? "ON" : "OFF"}
                            </Badge>
                            <Badge className={health.ai_enabled ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}>
                              IA: {health.ai_enabled ? "ON" : "OFF"}
                            </Badge>
                            <Badge className={health.discount_enabled ? "bg-pink-100 text-pink-700" : "bg-gray-100 text-gray-500"}>
                              Descuentos: {health.discount_enabled ? "ON" : "OFF"}
                            </Badge>
                          </>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Sin conexión</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fila 1: KPIs principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Carritos Abandonados"
                    value={formatNumber(stats.total)}
                    icon="🛒"
                  />
                  <MetricCard
                    title="Recuperados"
                    value={formatNumber(stats.recovered)}
                    changeType="positive"
                    icon="✅"
                  />
                  <MetricCard
                    title="Tasa de Recuperación"
                    value={stats.recovery_rate}
                    changeType={parseFloat(stats.recovery_rate) >= 15 ? "positive" : "neutral"}
                    icon="📈"
                  />
                  <MetricCard
                    title="Con Cupón"
                    value={formatNumber(stats.with_coupon)}
                    icon="🎟️"
                  />
                </div>

                {/* Fila 2: Email engagement */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Email 1 Enviados"
                    value={formatNumber(stats.email_1_sent)}
                    subtitle={`Pendientes: ${formatNumber(stats.pending_email_1)}`}
                    icon="📧"
                  />
                  <MetricCard
                    title="Email 1 Open Rate"
                    value={stats.engagement.email_1_open_rate}
                    subtitle={`${formatNumber(stats.engagement.email_1_opened)} abiertos`}
                    icon="👀"
                  />
                  <MetricCard
                    title="Email 2 Enviados"
                    value={formatNumber(stats.email_2_sent)}
                    subtitle={`Pendientes: ${formatNumber(stats.pending_email_2)}`}
                    icon="📧"
                  />
                  <MetricCard
                    title="Email 2 Click Rate"
                    value={stats.engagement.email_2_click_rate}
                    subtitle={`${formatNumber(stats.engagement.email_2_clicked)} clicks`}
                    icon="🖱️"
                  />
                </div>

                {/* Tabla por grupo */}
                {stats.by_group?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Rendimiento por Grupo de Cliente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Grupo</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Recuperados</TableHead>
                            <TableHead className="text-right">Tasa</TableHead>
                            <TableHead className="text-right">Email 1 Abiertos</TableHead>
                            <TableHead className="text-right">Email 1 Clicks</TableHead>
                            <TableHead className="text-right">Email 2 Abiertos</TableHead>
                            <TableHead className="text-right">Email 2 Clicks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.by_group.map((g) => (
                            <TableRow key={g.group}>
                              <TableCell>
                                <Badge className={GROUP_COLORS[g.group] || "bg-gray-100 text-gray-700"}>
                                  {GROUP_LABELS[g.group] || g.group}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(g.total)}</TableCell>
                              <TableCell className="text-right">{formatNumber(g.recovered)}</TableCell>
                              <TableCell className="text-right">
                                <span className={parseFloat(g.recovery_rate) >= 15 ? "text-green-600 font-semibold" : ""}>
                                  {g.recovery_rate}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">{formatNumber(g.email_1_opened)}</TableCell>
                              <TableCell className="text-right">{formatNumber(g.email_1_clicked)}</TableCell>
                              <TableCell className="text-right">{formatNumber(g.email_2_opened)}</TableCell>
                              <TableCell className="text-right">{formatNumber(g.email_2_clicked)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Botón procesar manual */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Procesar ahora</p>
                        <p className="text-sm text-gray-500">
                          Ejecutar manualmente la detección y envío de emails (normalmente corre cada 15 min)
                        </p>
                      </div>
                      <Button
                        onClick={() => processMutation.mutate()}
                        disabled={processMutation.isPending}
                        variant="outline"
                      >
                        {processMutation.isPending ? "Procesando..." : "Ejecutar"}
                      </Button>
                    </div>
                    {processMutation.isSuccess && processMutation.data && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md text-sm text-green-700">
                        Detectados: {processMutation.data.new_carts_detected} · Recordatorios: {processMutation.data.reminders_sent} · Cupones: {processMutation.data.coupons_sent} · Recuperados: {processMutation.data.recovered}
                      </div>
                    )}
                    {processMutation.isError && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
                        Error al procesar: {processMutation.error?.message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Botón procesar campañas AI */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Procesar Campañas AI</p>
                        <p className="text-sm text-gray-500">
                          Ejecutar manualmente el envío de campañas (post-compra, bienvenida, browse abandonment)
                        </p>
                      </div>
                      <Button
                        onClick={() => processCampaignsMutation.mutate()}
                        disabled={processCampaignsMutation.isPending}
                        variant="outline"
                      >
                        {processCampaignsMutation.isPending ? "Procesando..." : "Ejecutar Campañas"}
                      </Button>
                    </div>
                    {processCampaignsMutation.isSuccess && processCampaignsMutation.data && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md text-sm text-green-700">
                        Post-compra: {processCampaignsMutation.data.post_purchase} · Bienvenida: W1={processCampaignsMutation.data.welcome.w1} W2={processCampaignsMutation.data.welcome.w2} W3={processCampaignsMutation.data.welcome.w3} · Browse: {processCampaignsMutation.data.browse_abandonment} · Win-Back: {processCampaignsMutation.data.win_back ?? 0} · Tiempo: {processCampaignsMutation.data.elapsed_seconds.toFixed(1)}s
                      </div>
                    )}
                    {processCampaignsMutation.isError && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
                        {processCampaignsMutation.error?.message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No se pudieron cargar los datos. Verificá que EMAIL_MARKETING_API_URL y EMAIL_MARKETING_API_KEY estén configurados.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Configuración */}
          <TabsContent value="config" className="space-y-6 mt-4">
            {configLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[200px]" />
                <Skeleton className="h-[200px]" />
              </div>
            ) : config ? (
              <>
                {/* Config Global */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configuración Global</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Marketing habilitado</Label>
                        <p className="text-xs text-gray-400">Activa o desactiva todo el sistema de emails</p>
                      </div>
                      <Switch
                        checked={effectiveGlobalEnabled}
                        onCheckedChange={(v) => setGlobalEnabled(v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Cupón de descuento habilitado</Label>
                        <p className="text-xs text-gray-400">Enviar cupón en el Email 2</p>
                      </div>
                      <Switch
                        checked={effectiveGlobalDiscountEnabled}
                        onCheckedChange={(v) => setGlobalDiscountEnabled(v)}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <Label>Tipo de descuento</Label>
                        <Select
                          value={effectiveGlobalDiscountType}
                          onValueChange={(v) => setGlobalDiscountType(v as DiscountType)}
                        >
                          <SelectTrigger className="mt-1 w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                            <SelectItem value="fixed">Monto Fijo ($)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label>
                          {effectiveGlobalDiscountType === "percentage"
                            ? "Porcentaje de descuento (%)"
                            : "Monto de descuento ($)"}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={effectiveGlobalDiscountType === "percentage" ? 100 : undefined}
                          value={effectiveGlobalDiscountPct}
                          onChange={(e) => setGlobalDiscountPct(e.target.value)}
                          className="mt-1 w-32"
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Fuente: {config.global.source}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <Label>Máximo descuento porcentaje (%)</Label>
                        <p className="text-xs text-gray-400">Límite superior para descuentos porcentuales (vacío = sin límite)</p>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Sin límite"
                          value={effectiveGlobalDiscountMaxPct}
                          onChange={(e) => setGlobalDiscountMaxPct(e.target.value)}
                          className="mt-1 w-32"
                        />
                      </div>
                      <div>
                        <Label>Máximo descuento fijo ($)</Label>
                        <p className="text-xs text-gray-400">Límite superior para descuentos de monto fijo (vacío = sin límite)</p>
                        <Input
                          type="number"
                          min={0}
                          placeholder="Sin límite"
                          value={effectiveGlobalDiscountMaxFixed}
                          onChange={(e) => setGlobalDiscountMaxFixed(e.target.value)}
                          className="mt-1 w-32"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Campañas habilitadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campañas Habilitadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {campaignConfigLoading ? (
                      <Skeleton className="h-[120px]" />
                    ) : (
                      (["post_purchase", "welcome_1", "welcome_2", "welcome_3", "browse_abandonment", "newsletter", "win_back"] as const).map((key) => (
                        <div key={key} className="flex items-center justify-between">
                          <Label className="text-sm">{CAMPAIGN_LABELS[key] || key}</Label>
                          <Switch
                            checked={effectiveCampaignsEnabled[key] ?? true}
                            onCheckedChange={(v) =>
                              setCampaignsEnabled((prev) => ({
                                ...effectiveCampaignsEnabled,
                                ...prev,
                                [key]: v,
                              }))
                            }
                          />
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Tiempos de envío */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tiempos de Envío</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaignConfigLoading ? (
                      <Skeleton className="h-[200px]" />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TIMING_FIELDS.map(({ key, label, unit }) => (
                          <div key={key}>
                            <Label className="text-xs">{label}</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                min={0}
                                value={effectiveTimings[key] ?? ""}
                                onChange={(e) =>
                                  setTimings((prev) => ({
                                    ...(campaignConfig?.effective_global?.timings ?? {}),
                                    ...prev,
                                    [key]: Number(e.target.value),
                                  }))
                                }
                                className="w-24 h-8 text-sm"
                              />
                              <span className="text-xs text-gray-400">{unit}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Inteligencia Artificial */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Inteligencia Artificial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaignConfigLoading ? (
                      <Skeleton className="h-[120px]" />
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>IA habilitada</Label>
                            <p className="text-xs text-gray-400">Personalizar emails con IA</p>
                          </div>
                          <Switch
                            checked={effectiveAiEnabled}
                            onCheckedChange={(v) => setAiEnabled(v)}
                          />
                        </div>
                        <div>
                          <Label>Modelo AI (personalización)</Label>
                          <Select
                            value={effectiveAiModel}
                            onValueChange={(v) => setAiModel(v)}
                          >
                            <SelectTrigger className="mt-1 w-64">
                              <SelectValue placeholder="Seleccionar modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Modelo AI (recomendaciones)</Label>
                          <Select
                            value={effectiveAiModelRecommendations}
                            onValueChange={(v) => setAiModelRecommendations(v)}
                          >
                            <SelectTrigger className="mt-1 w-64">
                              <SelectValue placeholder="Seleccionar modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                              <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Tono AI</Label>
                          <p className="text-xs text-gray-400">Estilo de comunicación para los emails generados con IA</p>
                          <Select
                            value={effectiveAiTone}
                            onValueChange={(v) => setAiTone(v as AiTone)}
                          >
                            <SelectTrigger className="mt-1 w-64">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_TONE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Frecuencia */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Frecuencia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaignConfigLoading ? (
                      <Skeleton className="h-[60px]" />
                    ) : (
                      <div>
                        <Label>Emails máximos por semana</Label>
                        <Input
                          type="number"
                          min={1}
                          value={effectiveFrequencyCapPerWeek}
                          onChange={(e) => setFrequencyCapPerWeek(e.target.value)}
                          className="mt-1 w-32"
                        />
                        <p className="text-xs text-gray-400 mt-1">Límite de emails por cliente por semana (todas las campañas)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Newsletter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Newsletter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaignConfigLoading ? (
                      <Skeleton className="h-[120px]" />
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Cron habilitado</Label>
                            <p className="text-xs text-gray-400">Envío automático programado de newsletters</p>
                          </div>
                          <Switch
                            checked={effectiveNewsletterCronEnabled}
                            onCheckedChange={(v) => setNewsletterCronEnabled(v)}
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <Label>Expresión Cron</Label>
                            <Input
                              value={effectiveNewsletterCronExpression}
                              onChange={(e) => setNewsletterCronExpression(e.target.value)}
                              placeholder="0 10 * * 1"
                              className="mt-1 w-48"
                            />
                            <p className="text-xs text-gray-400 mt-1">Formato cron (ej: &quot;0 10 * * 1&quot; = lunes 10am)</p>
                          </div>
                          <div>
                            <Label>Tema por defecto</Label>
                            <Input
                              value={effectiveNewsletterDefaultTheme}
                              onChange={(e) => setNewsletterDefaultTheme(e.target.value)}
                              placeholder="ej: ofertas, novedades"
                              className="mt-1 w-48"
                            />
                          </div>
                        </div>
                        <div className="border-t pt-4 mt-4">
                          <p className="text-sm font-medium mb-3">Envío manual de Newsletter</p>
                          <div className="flex items-end gap-3">
                            <div>
                              <Label className="text-xs">Tema</Label>
                              <Input
                                value={newsletterSendTheme}
                                onChange={(e) => setNewsletterSendTheme(e.target.value)}
                                placeholder="Opcional"
                                className="mt-1 w-40 h-8 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Grupo</Label>
                              <Select
                                value={newsletterSendGroup}
                                onValueChange={setNewsletterSendGroup}
                              >
                                <SelectTrigger className="mt-1 w-40 h-8 text-sm">
                                  <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos</SelectItem>
                                  <SelectItem value="minorista">Minorista</SelectItem>
                                  <SelectItem value="mayorista">Mayorista</SelectItem>
                                  <SelectItem value="revendedora">Revendedora</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => newsletterSendMutation.mutate({
                                ...(newsletterSendTheme ? { theme: newsletterSendTheme } : {}),
                                ...(newsletterSendGroup && newsletterSendGroup !== "all" ? { group: newsletterSendGroup } : {}),
                              })}
                              disabled={newsletterSendMutation.isPending}
                            >
                              {newsletterSendMutation.isPending ? "Enviando..." : "Enviar Newsletter"}
                            </Button>
                          </div>
                          {newsletterSendMutation.isSuccess && newsletterSendMutation.data && (
                            <p className="text-sm text-green-600 mt-2">
                              Newsletter enviado: {newsletterSendMutation.data.sent} emails
                            </p>
                          )}
                          {newsletterSendMutation.isError && (
                            <p className="text-sm text-red-600 mt-2">{newsletterSendMutation.error?.message}</p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Botón guardar global (incluye todos los campos) */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      updateGlobalMutation.mutate({
                        enabled: effectiveGlobalEnabled,
                        discount_enabled: effectiveGlobalDiscountEnabled,
                        discount_percentage: Number(effectiveGlobalDiscountPct),
                        discount_type: effectiveGlobalDiscountType,
                        discount_max_percentage: effectiveGlobalDiscountMaxPct ? Number(effectiveGlobalDiscountMaxPct) : null,
                        discount_max_fixed: effectiveGlobalDiscountMaxFixed ? Number(effectiveGlobalDiscountMaxFixed) : null,
                        campaigns_enabled: effectiveCampaignsEnabled,
                        timings: effectiveTimings as CampaignTimings,
                        frequency_cap_per_week: Number(effectiveFrequencyCapPerWeek),
                        ai_enabled: effectiveAiEnabled,
                        ai_model: effectiveAiModel,
                        ai_model_recommendations: effectiveAiModelRecommendations,
                        ai_tone: effectiveAiTone,
                        newsletter_cron_enabled: effectiveNewsletterCronEnabled,
                        newsletter_cron_expression: effectiveNewsletterCronExpression,
                        newsletter_default_theme: effectiveNewsletterDefaultTheme,
                      })
                    }}
                    disabled={updateGlobalMutation.isPending}
                  >
                    {updateGlobalMutation.isPending ? "Guardando..." : "Guardar Configuración Global"}
                  </Button>
                  {updateGlobalMutation.isSuccess && (
                    <p className="text-sm text-green-600">Configuración global actualizada</p>
                  )}
                  {updateGlobalMutation.isError && (
                    <p className="text-sm text-red-600">Error: {updateGlobalMutation.error?.message}</p>
                  )}
                </div>

                {/* Config por grupo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["minorista", "mayorista", "revendedora"].map((groupName) => {
                    const groupConfig = config.groups.find((g) => g.group_name === groupName)
                    const medusaGroupId = customerGroups?.find(
                      (g) => g.name.toLowerCase() === groupName.toLowerCase()
                    )?.id
                    return (
                      <GroupConfigCard
                        key={groupName}
                        groupName={groupName}
                        groupConfig={groupConfig || null}
                        globalConfig={config.global}
                        onSave={(data) => updateGroupMutation.mutate({
                          group: groupName,
                          data: { ...data, ...(medusaGroupId ? { group_id: medusaGroupId } : {}) },
                        })}
                        onDelete={() => deleteGroupMutation.mutate({
                          group: groupName,
                          group_id: medusaGroupId,
                        })}
                        isSaving={updateGroupMutation.isPending}
                        isDeleting={deleteGroupMutation.isPending}
                      />
                    )
                  })}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No se pudo cargar la configuración. Verificá la conexión con la API.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Templates */}
          <TabsContent value="templates" className="space-y-6 mt-4">
            <TemplateEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// --- Componentes auxiliares ---

function GroupConfigCard({
  groupName,
  groupConfig,
  globalConfig,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  groupName: string
  groupConfig: { enabled: boolean; discount_enabled: boolean; discount_percentage: number; discount_type: DiscountType } | null
  globalConfig: { enabled: boolean; discount_enabled: boolean; discount_percentage: number; discount_type: DiscountType }
  onSave: (data: { enabled?: boolean; discount_enabled?: boolean; discount_percentage?: number; discount_type?: DiscountType }) => void
  onDelete: () => void
  isSaving: boolean
  isDeleting: boolean
}) {
  const inheritsGlobal = !groupConfig
  const effective = groupConfig || globalConfig

  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [discountEnabled, setDiscountEnabled] = useState<boolean | null>(null)
  const [discountPct, setDiscountPct] = useState("")
  const [discountType, setDiscountType] = useState<DiscountType | null>(null)

  const effectiveEnabled = enabled ?? effective.enabled
  const effectiveDiscountEnabled = discountEnabled ?? effective.discount_enabled
  const effectiveDiscountPct = discountPct || String(effective.discount_percentage)
  const effectiveDiscountType = discountType ?? effective.discount_type ?? "percentage"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            <Badge className={GROUP_COLORS[groupName] || "bg-gray-100 text-gray-700"}>
              {GROUP_LABELS[groupName] || groupName}
            </Badge>
          </CardTitle>
          {inheritsGlobal && (
            <Badge variant="outline" className="text-xs text-gray-400">Hereda global</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Habilitado</Label>
          <Switch
            checked={effectiveEnabled}
            onCheckedChange={(v) => setEnabled(v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Cupón</Label>
          <Switch
            checked={effectiveDiscountEnabled}
            onCheckedChange={(v) => setDiscountEnabled(v)}
          />
        </div>
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select
            value={effectiveDiscountType}
            onValueChange={(v) => setDiscountType(v as DiscountType)}
          >
            <SelectTrigger className="mt-1 w-full h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">% Porcentaje</SelectItem>
              <SelectItem value="fixed">$ Monto Fijo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">
            {effectiveDiscountType === "percentage" ? "% Descuento" : "$ Descuento"}
          </Label>
          <Input
            type="number"
            min={0}
            max={effectiveDiscountType === "percentage" ? 100 : undefined}
            value={effectiveDiscountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            className="mt-1 w-24 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => {
              onSave({
                enabled: effectiveEnabled,
                discount_enabled: effectiveDiscountEnabled,
                discount_percentage: Number(effectiveDiscountPct),
                discount_type: effectiveDiscountType,
              })
            }}
            disabled={isSaving}
          >
            {isSaving ? "..." : "Guardar"}
          </Button>
          {!inheritsGlobal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700"
            >
              {isDeleting ? "..." : "Eliminar override"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
