"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import {
  usePhysicalResellerDetail,
  usePhysicalResellerInventory,
  usePhysicalResellerOrders,
  usePhysicalResellerSales,
  useMarkOrderShipped,
  useApprovePhysicalReseller,
  useRejectPhysicalReseller,
  useToggleResellerMap,
  usePurchaseHistory,
} from "@/hooks/use-resellers-fisicas"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Store,
  Smartphone,
  MapPin,
  Package,
  ShoppingCart,
  Boxes,
  Truck,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  MessageCircle,
  TrendingUp,
  MousePointerClick,
  DollarSign,
  AlertCircle,
} from "lucide-react"

type TabId = "info" | "inventario" | "pedidos" | "ventas"

const STATUS_COLORS: Record<string, string> = {
  pagado: "bg-blue-100 text-blue-700",
  enviado: "bg-yellow-100 text-yellow-700",
  entregado: "bg-green-100 text-green-700",
  pendiente: "bg-yellow-100 text-yellow-700",
  completada: "bg-green-100 text-green-700",
  cancelada: "bg-red-100 text-red-700",
  aprobada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-700",
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const MONTH_LABELS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
]

function formatMonthKey(key: string): string {
  const [y, m] = key.split("-")
  const idx = parseInt(m, 10) - 1
  return `${MONTH_LABELS[idx] ?? m} ${y.slice(2)}`
}

export default function ResellerFisicaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<TabId>("info")

  const { data, isLoading, error } = usePhysicalResellerDetail(id)
  const inventory = usePhysicalResellerInventory(id)
  const orders = usePhysicalResellerOrders({ reseller_id: id, limit: 50 })
  const sales = usePhysicalResellerSales({ reseller_id: id, limit: 50 })
  const purchaseHistory = usePurchaseHistory(id, 3)
  const markShipped = useMarkOrderShipped()
  const approve = useApprovePhysicalReseller()
  const reject = useRejectPhysicalReseller()
  const toggleMap = useToggleResellerMap()
  const [actionError, setActionError] = useState<string | null>(null)

  async function runAction(fn: () => Promise<unknown>, errorLabel: string) {
    setActionError(null)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : errorLabel)
    }
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error al cargar revendedora
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="p-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-6" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const reseller = data
  const stats = data.stats

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "info", label: "Info", icon: <Store className="w-4 h-4" /> },
    { id: "inventario", label: "Inventario", icon: <Boxes className="w-4 h-4" /> },
    { id: "pedidos", label: "Pedidos", icon: <Package className="w-4 h-4" /> },
    { id: "ventas", label: "Ventas", icon: <ShoppingCart className="w-4 h-4" /> },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{reseller.business_name}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[reseller.status]}`}
            >
              {reseller.status.charAt(0).toUpperCase() + reseller.status.slice(1)}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                reseller.visible_on_map === "compras"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {reseller.visible_on_map === "compras"
                ? "Visible en mapa público"
                : "No visible en mapa"}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                reseller.map_enabled
                  ? "bg-blue-50 text-blue-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {reseller.map_enabled ? "Mapa: habilitada" : "Mapa: deshabilitada"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {reseller.status === "pendiente" && (
            <>
              <button
                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center gap-1"
                disabled={approve.isPending}
                onClick={() => runAction(() => approve.mutateAsync(id), "Error al aprobar")}
              >
                <CheckCircle2 className="w-4 h-4" /> Aprobar
              </button>
              <button
                className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium disabled:opacity-50 flex items-center gap-1"
                disabled={reject.isPending}
                onClick={() => runAction(() => reject.mutateAsync(id), "Error al rechazar")}
              >
                <XCircle className="w-4 h-4" /> Rechazar
              </button>
            </>
          )}
          {reseller.status === "aprobada" && (
            <button
              className={`px-3 py-1.5 text-sm rounded-md font-medium text-white disabled:opacity-50 flex items-center gap-1 ${
                reseller.map_enabled
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
              disabled={toggleMap.isPending}
              onClick={() =>
                runAction(
                  () => toggleMap.mutateAsync({ id, enabled: !reseller.map_enabled }),
                  "Error al actualizar mapa"
                )
              }
            >
              {reseller.map_enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {reseller.map_enabled ? "Ocultar del mapa" : "Mostrar en mapa"}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {actionError}
        </div>
      )}

      {/* Not-visible banner */}
      {reseller.status === "aprobada" && reseller.visible_on_map !== "compras" && reseller.not_visible_reason && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">No visible en el mapa público:</span>{" "}
            {reseller.not_visible_reason}
            {stats.purchase_needed_for_map > 0 && (
              <span>
                {" "}(le faltan {formatCurrency(stats.purchase_needed_for_map)} en
                compras en los últimos 30 días)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Spend + engagement KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Compras 30d
          </div>
          <p className="text-lg font-bold">{formatCurrency(stats.purchase_last_30d)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {stats.is_purchase_eligible ? (
              <span className="text-green-600 font-medium">
                Supera el mínimo ({formatCurrency(stats.map_eligibility_threshold)})
              </span>
            ) : (
              <span className="text-orange-600 font-medium">
                Faltan {formatCurrency(stats.purchase_needed_for_map)}
              </span>
            )}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Última compra
          </div>
          {stats.last_order ? (
            <>
              <p className="text-lg font-bold">
                {stats.last_order.total != null
                  ? formatCurrency(stats.last_order.total)
                  : "—"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Hace {stats.days_since_last_order ?? "?"} días
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-gray-400">Sin pedidos</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Todavía no compró</p>
            </>
          )}
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <MousePointerClick className="w-3.5 h-3.5" /> Clicks 30d
          </div>
          <p className="text-lg font-bold">{stats.clicks_30d.total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {stats.clicks_30d.card_views} vistas · {stats.clicks_30d.whatsapp_clicks} WA
          </p>
        </div>
        <div className="bg-white border rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <ShoppingCart className="w-3.5 h-3.5" /> Ventas del mes
          </div>
          <p className="text-lg font-bold">{stats.sales_this_month}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {formatCurrency(stats.revenue_this_month)}
          </p>
        </div>
      </div>

      {/* Purchase history chart (last 3 months) + clicks panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Compras últimos 3 meses
              </h3>
              <span className="text-xs text-gray-400">
                Mínimo mensual: {formatCurrency(stats.map_eligibility_threshold)}
              </span>
            </div>
            {purchaseHistory.isLoading ? (
              <div className="h-32 bg-gray-100 rounded animate-pulse" />
            ) : (
              <PurchaseHistoryChart
                history={purchaseHistory.data?.history ?? stats.purchase_history}
                threshold={stats.map_eligibility_threshold}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Engagement últimos 30 días
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <ClickStat label="Vistas de tarjeta" value={stats.clicks_30d.card_views} />
              <ClickStat
                label="Clicks WhatsApp"
                value={stats.clicks_30d.whatsapp_clicks}
                icon={<MessageCircle className="w-3.5 h-3.5 text-green-500" />}
              />
              <ClickStat label="Clicks en redes" value={stats.clicks_30d.social_clicks} />
              <ClickStat label="Vistas catálogo" value={stats.clicks_30d.catalog_views} />
            </div>
            <div className="pt-2 border-t text-xs text-gray-500">
              Conversión a WhatsApp:{" "}
              <span className="font-medium text-gray-900">
                {stats.clicks_30d.card_views > 0
                  ? (
                      (stats.clicks_30d.whatsapp_clicks /
                        stats.clicks_30d.card_views) *
                      100
                    ).toFixed(1) + "%"
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-mk-pink text-mk-pink"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{reseller.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">WhatsApp</p>
                  <p className="font-medium">{reseller.whatsapp}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <div className="flex items-center gap-2">
                    {reseller.type === "tienda_fisica" ? (
                      <Store className="w-4 h-4 text-blue-500" />
                    ) : reseller.type === "distribuidor" ? (
                      <Truck className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Smartphone className="w-4 h-4 text-purple-500" />
                    )}
                    <span>
                      {reseller.type === "tienda_fisica"
                        ? "Tienda Física"
                        : reseller.type === "distribuidor"
                        ? "Distribuidor"
                        : "Solo Redes"}
                    </span>
                  </div>
                </div>
                {reseller.address && (
                  <div>
                    <p className="text-xs text-gray-500">Dirección</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{reseller.address}</span>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Zona Aproximada</p>
                  <p>{reseller.approximate_zone || "-"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Redes Sociales</p>
                  <div className="space-y-1 mt-1">
                    {reseller.social_media?.instagram && (
                      <p className="text-sm">Instagram: {reseller.social_media.instagram}</p>
                    )}
                    {reseller.social_media?.facebook && (
                      <p className="text-sm">Facebook: {reseller.social_media.facebook}</p>
                    )}
                    {reseller.social_media?.tiktok && (
                      <p className="text-sm">TikTok: {reseller.social_media.tiktok}</p>
                    )}
                    {!reseller.social_media?.instagram &&
                      !reseller.social_media?.facebook &&
                      !reseller.social_media?.tiktok && (
                        <p className="text-sm text-gray-400">Sin redes configuradas</p>
                      )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha de registro</p>
                  <p className="text-sm">{formatDate(reseller.created_at)}</p>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Elegibilidad para el mapa</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          reseller.status === "aprobada" && reseller.active
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span>Aprobada y activa</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          stats.has_location ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>Coordenadas cargadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          reseller.map_enabled ? "bg-green-500" : "bg-orange-500"
                        }`}
                      />
                      <span>Habilitada por admin</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          stats.is_purchase_eligible ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span>Compras ≥ $150.000 en 30 días</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "inventario" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Variante</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Precio Custom</TableHead>
                    <TableHead className="text-right">Precio Sugerido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !inventory.data?.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Sin inventario
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.data.items.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.product_title}</TableCell>
                        <TableCell className="text-sm text-gray-500">{item.variant_title || "-"}</TableCell>
                        <TableCell className="text-center font-mono">{item.available_quantity}</TableCell>
                        <TableCell className="text-right font-mono">
                          {item.custom_price ? formatCurrency(item.custom_price) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-400">
                          {item.suggested_price ? formatCurrency(item.suggested_price) : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "pedidos" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden Medusa</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !orders.data?.orders?.length ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Sin pedidos
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.data.orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-sm">{order.medusa_order_id}</TableCell>
                        <TableCell className="text-sm">
                          {order.items.map((i) => `${i.quantity}x ${i.product_title}`).join(", ")}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(order.created_at)}</TableCell>
                        <TableCell>
                          {order.status === "pagado" && (
                            <button
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                              disabled={markShipped.isPending}
                              onClick={() => markShipped.mutate(order._id)}
                            >
                              Marcar Enviado
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "ventas" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Productos</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !sales.data?.sales?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Sin ventas registradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.data.sales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell className="text-sm">{formatDate(sale.date)}</TableCell>
                        <TableCell className="text-sm">
                          {sale.items.map((i) => `${i.quantity}x ${i.product_title}`).join(", ")}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {sale.channel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sale.origin === "whatsapp_locator"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {sale.origin === "whatsapp_locator" ? "Localizador" : "Manual"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sale.status]}`}>
                            {sale.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(sale.total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function PurchaseHistoryChart({
  history,
  threshold,
}: {
  history: Array<{ month: string; total: number; threshold_met: boolean; order_count: number }>
  threshold: number
}) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-gray-400">Sin datos</p>
  }
  const max = Math.max(threshold, ...history.map((h) => h.total)) || threshold
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 h-32">
        {history.map((h) => {
          const pct = max > 0 ? (h.total / max) * 100 : 0
          const thresholdPct = max > 0 ? (threshold / max) * 100 : 0
          return (
            <div key={h.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full flex-1 bg-gray-100 rounded overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: `${pct}%`,
                    backgroundColor: h.threshold_met ? "#16a34a" : "#f97316",
                  }}
                />
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-red-400"
                  style={{ bottom: `${thresholdPct}%` }}
                  title={`Mínimo: ${threshold.toLocaleString("es-AR")}`}
                />
              </div>
              <div className="text-[11px] text-gray-500">{formatMonthKey(h.month)}</div>
              <div className="text-xs font-medium">
                {h.total.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="text-[10px] text-gray-400">
                {h.order_count} {h.order_count === 1 ? "pedido" : "pedidos"}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ClickStat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 border rounded p-2">
      <div className="flex items-center gap-1 text-[11px] text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-base font-semibold text-gray-900">{value}</div>
    </div>
  )
}
