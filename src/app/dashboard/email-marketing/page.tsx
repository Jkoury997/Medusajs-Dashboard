"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
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
  useAbandonedCartList,
  useEmailConfig,
  useProcessAbandonedCarts,
  useForceSendEmail,
  useDeleteAbandonedCart,
  useUpdateGlobalConfig,
  useUpdateGroupConfig,
  useDeleteGroupConfig,
} from "@/hooks/use-email-marketing"
import {
  useCampaignStats,
  useCampaignRecent,
  useCampaignConfig,
  useProcessCampaigns,
  useCampaignForceSend,
} from "@/hooks/use-campaigns"
import { useHealthCheck } from "@/hooks/use-health-check"
import { TemplateEditor } from "@/components/email-marketing/template-editor"
import { formatNumber, formatCurrency } from "@/lib/format"
import type {
  AbandonedCartListFilters,
  DiscountType,
  CampaignType,
  CampaignEmailRecord,
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
}

const CAMPAIGN_COLORS: Record<string, string> = {
  post_purchase: "bg-green-100 text-green-700",
  welcome_1: "bg-blue-100 text-blue-700",
  welcome_2: "bg-pink-100 text-pink-700",
  welcome_3: "bg-purple-100 text-purple-700",
  browse_abandonment: "bg-orange-100 text-orange-700",
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
]

function buildForceSendData(
  type: CampaignType,
  record: CampaignEmailRecord
): Record<string, unknown> | null {
  switch (type) {
    case "post_purchase":
      return {
        customer_id: record.customer_id,
        ...(record.trigger_data?.order_id ? { order_id: record.trigger_data.order_id } : {}),
      }
    case "welcome_1":
    case "welcome_2":
    case "welcome_3":
      return { customer_id: record.customer_id }
    case "browse_abandonment":
      return {
        customer_id: record.customer_id,
        product_id: (record.trigger_data?.product_id as string) || "",
      }
    default:
      return null
  }
}

export default function EmailMarketingPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  // Stats
  const { data: stats, isLoading: statsLoading } = useAbandonedCartStats()

  // List filters
  const [recoveredFilter, setRecoveredFilter] = useState("all")
  const [email1Filter, setEmail1Filter] = useState("all")
  const [email2Filter, setEmail2Filter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [listPage, setListPage] = useState(0)
  const listLimit = 50

  const listFilters = useMemo<AbandonedCartListFilters>(() => {
    const f: AbandonedCartListFilters = {
      limit: listLimit,
      offset: listPage * listLimit,
    }
    if (recoveredFilter !== "all") f.recovered = recoveredFilter as "true" | "false"
    if (email1Filter !== "all") f.email_1 = email1Filter as "true" | "false"
    if (email2Filter !== "all") f.email_2 = email2Filter as "true" | "false"
    if (groupFilter !== "all") f.customer_group = groupFilter
    if (dateRange.from) f.from = dateRange.from.toISOString()
    if (dateRange.to) f.to = dateRange.to.toISOString()
    return f
  }, [recoveredFilter, email1Filter, email2Filter, groupFilter, listPage, dateRange])

  const { data: cartList, isLoading: listLoading } = useAbandonedCartList(listFilters)
  const totalListPages = cartList ? Math.ceil(cartList.total / listLimit) : 0

  // Config
  const { data: config, isLoading: configLoading } = useEmailConfig()

  // Campaigns
  const { data: campaignStats, isLoading: campaignStatsLoading } = useCampaignStats()
  const [selectedCampaignType, setSelectedCampaignType] = useState<CampaignType | null>(null)
  const { data: campaignRecent, isLoading: recentLoading } = useCampaignRecent(selectedCampaignType)
  const { data: campaignConfig, isLoading: campaignConfigLoading } = useCampaignConfig()

  // Health check
  const { data: health, isLoading: healthLoading } = useHealthCheck()

  // Mutations
  const processMutation = useProcessAbandonedCarts()
  const forceSendMutation = useForceSendEmail()
  const deleteCartMutation = useDeleteAbandonedCart()
  const updateGlobalMutation = useUpdateGlobalConfig()
  const updateGroupMutation = useUpdateGroupConfig()
  const deleteGroupMutation = useDeleteGroupConfig()
  const processCampaignsMutation = useProcessCampaigns()
  const campaignForceSendMutation = useCampaignForceSend()

  // Config local state for editing
  const [globalEnabled, setGlobalEnabled] = useState<boolean | null>(null)
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState<boolean | null>(null)
  const [globalDiscountPct, setGlobalDiscountPct] = useState<string>("")
  const [globalDiscountType, setGlobalDiscountType] = useState<DiscountType | null>(null)

  // Campaign config local state
  const [campaignsEnabled, setCampaignsEnabled] = useState<Partial<CampaignsEnabledMap> | null>(null)
  const [timings, setTimings] = useState<Partial<CampaignTimings> | null>(null)
  const [frequencyCapPerWeek, setFrequencyCapPerWeek] = useState<string>("")
  const [aiEnabled, setAiEnabled] = useState<boolean | null>(null)
  const [aiModel, setAiModel] = useState<string>("")
  const [aiModelRecommendations, setAiModelRecommendations] = useState<string>("")

  // Sync config state when data loads
  const effectiveGlobalEnabled = globalEnabled ?? config?.global?.enabled ?? true
  const effectiveGlobalDiscountEnabled = globalDiscountEnabled ?? config?.global?.discount_enabled ?? true
  const effectiveGlobalDiscountPct = globalDiscountPct || String(config?.global?.discount_percentage ?? 10)
  const effectiveGlobalDiscountType = globalDiscountType ?? config?.global?.discount_type ?? "percentage"

  // Campaign config effective values
  const defaultCampaignsEnabled: CampaignsEnabledMap = {
    post_purchase: true, welcome_1: true, welcome_2: true, welcome_3: true, browse_abandonment: true,
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
            <TabsTrigger value="carritos">Carritos Abandonados</TabsTrigger>
            <TabsTrigger value="campanas">Campañas AI</TabsTrigger>
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
                        Post-compra: {processCampaignsMutation.data.post_purchase} · Bienvenida: W1={processCampaignsMutation.data.welcome.w1} W2={processCampaignsMutation.data.welcome.w2} W3={processCampaignsMutation.data.welcome.w3} · Browse: {processCampaignsMutation.data.browse_abandonment} · Tiempo: {processCampaignsMutation.data.elapsed_seconds.toFixed(1)}s
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

          {/* TAB: Carritos Abandonados */}
          <TabsContent value="carritos" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <DateRangePicker value={dateRange} onChange={(v) => { setDateRange(v); setListPage(0) }} />
              </div>

              <Select value={recoveredFilter} onValueChange={(v) => { setRecoveredFilter(v); setListPage(0) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Recuperado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Recuperados</SelectItem>
                  <SelectItem value="false">No recuperados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={email1Filter} onValueChange={(v) => { setEmail1Filter(v); setListPage(0) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Email 1" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Email 1: Todos</SelectItem>
                  <SelectItem value="true">Email 1: Enviado</SelectItem>
                  <SelectItem value="false">Email 1: Pendiente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={email2Filter} onValueChange={(v) => { setEmail2Filter(v); setListPage(0) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Email 2" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Email 2: Todos</SelectItem>
                  <SelectItem value="true">Email 2: Enviado</SelectItem>
                  <SelectItem value="false">Email 2: Pendiente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setListPage(0) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grupos</SelectItem>
                  <SelectItem value="minorista">Minorista</SelectItem>
                  <SelectItem value="mayorista">Mayorista</SelectItem>
                  <SelectItem value="revendedora">Revendedora</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {listLoading ? (
              <Skeleton className="h-[400px]" />
            ) : cartList?.records?.length ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">
                      Carritos Abandonados ({formatNumber(cartList.total)} total)
                    </CardTitle>
                    <span className="text-sm text-gray-500">
                      Página {listPage + 1} de {totalListPages}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Grupo</TableHead>
                        <TableHead className="text-right">Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Paso</TableHead>
                        <TableHead>Email 1</TableHead>
                        <TableHead>Email 2</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartList.records.map((r) => (
                        <TableRow key={r._id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(r.abandoned_at).toLocaleString("es-AR")}
                          </TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate">
                            {r.customer_name || r.email || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${GROUP_COLORS[r.customer_group] || "bg-gray-100 text-gray-700"}`}>
                              {GROUP_LABELS[r.customer_group] || r.customer_group}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{r.items_count}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(r.cart_total)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{r.checkout_step || "-"}</Badge>
                          </TableCell>
                          <TableCell>
                            <EmailStatusBadge
                              sent={!!r.email_1_sent_at}
                              delivered={!!r.email_1_delivered_at}
                              opened={!!r.email_1_opened_at}
                              clicked={!!r.email_1_clicked_at}
                              bounced={r.email_1_bounced}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <EmailStatusBadge
                                sent={!!r.email_2_sent_at}
                                delivered={!!r.email_2_delivered_at}
                                opened={!!r.email_2_opened_at}
                                clicked={!!r.email_2_clicked_at}
                                bounced={r.email_2_bounced}
                              />
                              {r.coupon_code && (
                                <Badge className="bg-pink-100 text-pink-700 text-[10px]">🎟️</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {r.recovered ? (
                              <Badge className="bg-green-100 text-green-700">Recuperado</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700">Perdido</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!r.recovered && (!r.email_1_sent_at || !r.email_2_sent_at) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  disabled={forceSendMutation.isPending && forceSendMutation.variables?.cart_id === r.cart_id}
                                  onClick={() => forceSendMutation.mutate({ cart_id: r.cart_id, email_type: "next" })}
                                >
                                  {forceSendMutation.isPending && forceSendMutation.variables?.cart_id === r.cart_id
                                    ? "..."
                                    : !r.email_1_sent_at
                                      ? "📧 Email 1"
                                      : "📧 Email 2"
                                  }
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 text-red-500 hover:text-red-700"
                                disabled={deleteCartMutation.isPending && deleteCartMutation.variables === r.cart_id}
                                onClick={() => {
                                  if (window.confirm(`Eliminar registro de ${r.customer_name || r.email}?`)) {
                                    deleteCartMutation.mutate(r.cart_id)
                                  }
                                }}
                              >
                                {deleteCartMutation.isPending && deleteCartMutation.variables === r.cart_id ? "..." : "🗑️"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListPage((p) => Math.max(0, p - 1))}
                      disabled={listPage === 0}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setListPage((p) => p + 1)}
                      disabled={listPage + 1 >= totalListPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No se encontraron carritos abandonados con los filtros seleccionados
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB: Campañas AI */}
          <TabsContent value="campanas" className="space-y-6 mt-4">
            {campaignStatsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[100px]" />)}
                </div>
                <Skeleton className="h-[300px]" />
              </div>
            ) : campaignStats ? (
              <>
                {/* KPIs globales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Emails Enviados"
                    value={formatNumber(campaignStats.totals.sent)}
                    subtitle={`${formatNumber(campaignStats.totals.total)} programados`}
                    icon="📧"
                  />
                  <MetricCard
                    title="Open Rate"
                    value={campaignStats.totals.open_rate}
                    subtitle={`${formatNumber(campaignStats.totals.opened)} abiertos`}
                    changeType={parseFloat(campaignStats.totals.open_rate) >= 40 ? "positive" : "neutral"}
                    icon="👀"
                  />
                  <MetricCard
                    title="Click Rate"
                    value={campaignStats.totals.click_rate}
                    subtitle={`${formatNumber(campaignStats.totals.clicked)} clicks`}
                    changeType={parseFloat(campaignStats.totals.click_rate) >= 20 ? "positive" : "neutral"}
                    icon="🖱️"
                  />
                  <MetricCard
                    title="Rebotados"
                    value={formatNumber(campaignStats.totals.bounced)}
                    subtitle={campaignStats.ai_enabled ? `IA: ${campaignStats.ai_model}` : "IA desactivada"}
                    changeType={campaignStats.totals.bounced > 0 ? "negative" : "neutral"}
                    icon="💥"
                  />
                </div>

                {/* Botón procesar campañas */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Procesar Campañas</p>
                        <p className="text-sm text-gray-500">
                          Ejecutar manualmente el procesamiento de todas las campañas
                        </p>
                      </div>
                      <Button
                        onClick={() => processCampaignsMutation.mutate()}
                        disabled={processCampaignsMutation.isPending}
                        variant="outline"
                      >
                        {processCampaignsMutation.isPending ? "Procesando..." : "Ejecutar"}
                      </Button>
                    </div>
                    {processCampaignsMutation.isSuccess && processCampaignsMutation.data && (
                      <div className="mt-3 p-3 bg-green-50 rounded-md text-sm text-green-700">
                        Post-compra: {processCampaignsMutation.data.post_purchase} · Bienvenida: W1={processCampaignsMutation.data.welcome.w1} W2={processCampaignsMutation.data.welcome.w2} W3={processCampaignsMutation.data.welcome.w3} · Browse: {processCampaignsMutation.data.browse_abandonment} · Tiempo: {processCampaignsMutation.data.elapsed_seconds.toFixed(1)}s
                      </div>
                    )}
                    {processCampaignsMutation.isError && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
                        {processCampaignsMutation.error?.message}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tabla por tipo de campaña */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rendimiento por Tipo de Campaña</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaña</TableHead>
                          <TableHead className="text-right">Enviados</TableHead>
                          <TableHead className="text-right">Entregados</TableHead>
                          <TableHead className="text-right">Abiertos</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Open Rate</TableHead>
                          <TableHead className="text-right">Click Rate</TableHead>
                          <TableHead className="text-right">Con IA</TableHead>
                          <TableHead>Detalle</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignStats.campaigns.map((c) => (
                          <TableRow key={c.campaign_type}>
                            <TableCell>
                              <Badge className={CAMPAIGN_COLORS[c.campaign_type] || "bg-gray-100 text-gray-700"}>
                                {CAMPAIGN_LABELS[c.campaign_type] || c.campaign_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatNumber(c.sent)}</TableCell>
                            <TableCell className="text-right">{formatNumber(c.delivered)}</TableCell>
                            <TableCell className="text-right">{formatNumber(c.opened)}</TableCell>
                            <TableCell className="text-right">{formatNumber(c.clicked)}</TableCell>
                            <TableCell className="text-right">
                              <span className={parseFloat(c.open_rate) >= 40 ? "text-green-600 font-semibold" : ""}>
                                {c.open_rate}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={parseFloat(c.click_rate) >= 20 ? "text-green-600 font-semibold" : ""}>
                                {c.click_rate}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              {c.with_ai > 0 ? (
                                <span className="text-purple-600">{formatNumber(c.with_ai)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => setSelectedCampaignType(
                                  selectedCampaignType === c.campaign_type ? null : c.campaign_type as CampaignType
                                )}
                              >
                                {selectedCampaignType === c.campaign_type ? "Cerrar" : "Ver emails"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Detalle: emails recientes de la campaña seleccionada */}
                {selectedCampaignType && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Emails recientes: {CAMPAIGN_LABELS[selectedCampaignType] || selectedCampaignType}
                        </CardTitle>
                        <Badge className={CAMPAIGN_COLORS[selectedCampaignType] || ""}>
                          {campaignRecent?.count ?? 0} registros
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recentLoading ? (
                        <Skeleton className="h-[200px]" />
                      ) : campaignRecent?.records?.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Grupo</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead>AI Subject</TableHead>
                              <TableHead>Cupón</TableHead>
                              <TableHead>Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {campaignRecent.records.map((r, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="text-xs whitespace-nowrap">
                                  {r.sent_at ? new Date(r.sent_at).toLocaleString("es-AR") : "Pendiente"}
                                </TableCell>
                                <TableCell className="text-xs max-w-[180px] truncate">
                                  {r.customer_name || r.email}
                                </TableCell>
                                <TableCell>
                                  {r.customer_group && (
                                    <Badge className={`text-xs ${GROUP_COLORS[r.customer_group] || "bg-gray-100 text-gray-700"}`}>
                                      {GROUP_LABELS[r.customer_group] || r.customer_group}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <EmailStatusBadge
                                    sent={!!r.sent_at}
                                    delivered={!!r.delivered_at}
                                    opened={!!r.opened_at}
                                    clicked={!!r.clicked_at}
                                    bounced={r.bounced}
                                  />
                                </TableCell>
                                <TableCell className="text-xs max-w-[250px] truncate text-purple-600">
                                  {r.ai_subject || <span className="text-gray-400">Template</span>}
                                </TableCell>
                                <TableCell className="text-xs">
                                  {r.coupon_code ? (
                                    <Badge className="bg-pink-100 text-pink-700 text-[10px]">🎟️ {r.coupon_code}</Badge>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    disabled={campaignForceSendMutation.isPending}
                                    onClick={() => {
                                      const data = buildForceSendData(selectedCampaignType!, r)
                                      if (data) {
                                        campaignForceSendMutation.mutate({
                                          type: selectedCampaignType!,
                                          data,
                                        })
                                      }
                                    }}
                                  >
                                    {campaignForceSendMutation.isPending ? "..." : "Reenviar"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay emails recientes para esta campaña
                        </p>
                      )}
                      {campaignForceSendMutation.isSuccess && (
                        <p className="text-sm text-green-600 mt-2">
                          Email reenviado a {campaignForceSendMutation.data?.email}
                        </p>
                      )}
                      {campaignForceSendMutation.isError && (
                        <p className="text-sm text-red-600 mt-2">
                          Error: {campaignForceSendMutation.error?.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No se pudieron cargar las estadísticas de campañas.
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
                      (["post_purchase", "welcome_1", "welcome_2", "welcome_3", "browse_abandonment"] as const).map((key) => (
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

                {/* Botón guardar global (incluye todos los campos) */}
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => {
                      updateGlobalMutation.mutate({
                        enabled: effectiveGlobalEnabled,
                        discount_enabled: effectiveGlobalDiscountEnabled,
                        discount_percentage: Number(effectiveGlobalDiscountPct),
                        discount_type: effectiveGlobalDiscountType,
                        campaigns_enabled: effectiveCampaignsEnabled,
                        timings: effectiveTimings as CampaignTimings,
                        frequency_cap_per_week: Number(effectiveFrequencyCapPerWeek),
                        ai_enabled: effectiveAiEnabled,
                        ai_model: effectiveAiModel,
                        ai_model_recommendations: effectiveAiModelRecommendations,
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
                    return (
                      <GroupConfigCard
                        key={groupName}
                        groupName={groupName}
                        groupConfig={groupConfig || null}
                        globalConfig={config.global}
                        onSave={(data) => updateGroupMutation.mutate({ group: groupName, data })}
                        onDelete={() => deleteGroupMutation.mutate(groupName)}
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

function EmailStatusBadge({
  sent,
  delivered,
  opened,
  clicked,
  bounced,
}: {
  sent: boolean
  delivered: boolean
  opened: boolean
  clicked: boolean
  bounced: boolean
}) {
  if (bounced) return <Badge className="bg-red-100 text-red-700 text-[10px]">💥 Rebotó</Badge>
  if (clicked) return <Badge className="bg-green-100 text-green-700 text-[10px]">🖱️ Click</Badge>
  if (opened) return <Badge className="bg-blue-100 text-blue-700 text-[10px]">👀 Abierto</Badge>
  if (delivered) return <Badge className="bg-gray-100 text-gray-700 text-[10px]">✅ Entregado</Badge>
  if (sent) return <Badge className="bg-yellow-100 text-yellow-700 text-[10px]">📤 Enviado</Badge>
  return <Badge className="bg-gray-50 text-gray-400 text-[10px]">⏳ Pendiente</Badge>
}

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
