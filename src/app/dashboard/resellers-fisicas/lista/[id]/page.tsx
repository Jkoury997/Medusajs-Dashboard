"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import {
  usePhysicalResellerDetail,
  usePhysicalResellerInventory,
  usePhysicalResellerOrders,
  usePhysicalResellerSales,
  useMarkOrderShipped,
} from "@/hooks/use-resellers-fisicas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Store, Smartphone, MapPin, Package, ShoppingCart, Boxes } from "lucide-react"

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

export default function ResellerFisicaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<TabId>("info")

  const { data, isLoading, error } = usePhysicalResellerDetail(id)
  const inventory = usePhysicalResellerInventory(id)
  const orders = usePhysicalResellerOrders({ reseller_id: id, limit: 50 })
  const sales = usePhysicalResellerSales({ reseller_id: id, limit: 50 })
  const markShipped = useMarkOrderShipped()

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{reseller.business_name}</h1>
        <span
          className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[reseller.status]}`}
        >
          {reseller.status.charAt(0).toUpperCase() + reseller.status.slice(1)}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Stock</p>
          <p className="text-lg font-bold">{stats.total_stock}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Productos</p>
          <p className="text-lg font-bold">{stats.inventory_items}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Ventas Mes</p>
          <p className="text-lg font-bold">{stats.sales_this_month}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Facturación Mes</p>
          <p className="text-lg font-bold">{formatCurrency(stats.revenue_this_month)}</p>
        </div>
        <div className="bg-white border rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Pedidos Totales</p>
          <p className="text-lg font-bold">{stats.total_orders}</p>
        </div>
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
                    ) : (
                      <Smartphone className="w-4 h-4 text-purple-500" />
                    )}
                    <span>{reseller.type === "tienda_fisica" ? "Tienda Física" : "Solo Redes"}</span>
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
