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
  useUpdateGlobalConfig,
  useUpdateGroupConfig,
  useDeleteGroupConfig,
} from "@/hooks/use-email-marketing"
import { formatNumber, formatCurrency } from "@/lib/format"
import type { AbandonedCartListFilters } from "@/types/email-marketing"

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

  // Mutations
  const processMutation = useProcessAbandonedCarts()
  const updateGlobalMutation = useUpdateGlobalConfig()
  const updateGroupMutation = useUpdateGroupConfig()
  const deleteGroupMutation = useDeleteGroupConfig()

  // Config local state for editing
  const [globalEnabled, setGlobalEnabled] = useState<boolean | null>(null)
  const [globalDiscountEnabled, setGlobalDiscountEnabled] = useState<boolean | null>(null)
  const [globalDiscountPct, setGlobalDiscountPct] = useState<string>("")

  // Sync config state when data loads
  const effectiveGlobalEnabled = globalEnabled ?? config?.global?.enabled ?? true
  const effectiveGlobalDiscountEnabled = globalDiscountEnabled ?? config?.global?.discount_enabled ?? true
  const effectiveGlobalDiscountPct = globalDiscountPct || String(config?.global?.discount_percentage ?? 10)

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
            <TabsTrigger value="config">Configuración</TabsTrigger>
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
                        Detectados: {processMutation.data.detected} · Email 1 enviados: {processMutation.data.email1_sent} · Email 2 enviados: {processMutation.data.email2_sent}
                      </div>
                    )}
                    {processMutation.isError && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-700">
                        Error al procesar: {processMutation.error?.message}
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
                            {formatCurrency(r.cart_total / 100)}
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
                      <div className="flex-1">
                        <Label>Porcentaje de descuento</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={effectiveGlobalDiscountPct}
                          onChange={(e) => setGlobalDiscountPct(e.target.value)}
                          className="mt-1 w-32"
                        />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Fuente: {config.global.source}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => {
                        const data: Record<string, unknown> = {}
                        if (globalEnabled !== null) data.enabled = globalEnabled
                        if (globalDiscountEnabled !== null) data.discount_enabled = globalDiscountEnabled
                        if (globalDiscountPct) data.discount_percentage = Number(globalDiscountPct)
                        updateGlobalMutation.mutate(data as any)
                      }}
                      disabled={updateGlobalMutation.isPending}
                    >
                      {updateGlobalMutation.isPending ? "Guardando..." : "Guardar Global"}
                    </Button>
                    {updateGlobalMutation.isSuccess && (
                      <p className="text-sm text-green-600">Configuración global actualizada</p>
                    )}
                  </CardContent>
                </Card>

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
  groupConfig: { enabled: boolean; discount_enabled: boolean; discount_percentage: number } | null
  globalConfig: { enabled: boolean; discount_enabled: boolean; discount_percentage: number }
  onSave: (data: { enabled?: boolean; discount_enabled?: boolean; discount_percentage?: number }) => void
  onDelete: () => void
  isSaving: boolean
  isDeleting: boolean
}) {
  const inheritsGlobal = !groupConfig
  const effective = groupConfig || globalConfig

  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [discountEnabled, setDiscountEnabled] = useState<boolean | null>(null)
  const [discountPct, setDiscountPct] = useState("")

  const effectiveEnabled = enabled ?? effective.enabled
  const effectiveDiscountEnabled = discountEnabled ?? effective.discount_enabled
  const effectiveDiscountPct = discountPct || String(effective.discount_percentage)

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
          <Label className="text-xs">% Descuento</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={effectiveDiscountPct}
            onChange={(e) => setDiscountPct(e.target.value)}
            className="mt-1 w-24 h-8 text-sm"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={() => {
              const data: Record<string, unknown> = {}
              if (enabled !== null) data.enabled = enabled
              if (discountEnabled !== null) data.discount_enabled = discountEnabled
              if (discountPct) data.discount_percentage = Number(discountPct)
              onSave(data as any)
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
