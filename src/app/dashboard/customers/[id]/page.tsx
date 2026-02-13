"use client"

import { use } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"
import { useCustomerOrders } from "@/hooks/use-customers"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDate, daysSince } from "@/lib/format"
import { getWhatsAppUrl, getWhatsAppMessageType } from "@/lib/whatsapp"
import { getPaymentStatusLabel, getFulfillmentStatusLabel } from "@/lib/aggregations"

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

  const { data: customerData, isLoading: customerLoading } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const response = await sdk.client.fetch(`/admin/customers/${id}`)
      return response as { customer: any }
    },
  })

  const { data: ordersData, isLoading: ordersLoading } = useCustomerOrders(id)

  const customer = customerData?.customer
  const orders = ordersData?.orders || []
  const isLoading = customerLoading || ordersLoading

  const totalSpent = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
  const avgOrderValue = orders.length > 0 ? totalSpent / orders.length : 0
  const lastOrderDate = orders.length > 0 ? orders[0].created_at : null
  const daysSinceLastOrder = lastOrderDate ? daysSince(lastOrderDate) : null

  const productFrequency = new Map<string, { name: string; count: number; revenue: number }>()
  for (const order of orders) {
    if (!order.items) continue
    for (const item of order.items) {
      const key = item.product_id || item.title
      const existing = productFrequency.get(key) || {
        name: item.product_title || item.title,
        count: 0,
        revenue: 0,
      }
      existing.count += item.quantity || 0
      existing.revenue += item.total || 0
      productFrequency.set(key, existing)
    }
  }
  const topProducts = Array.from(productFrequency.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  if (isLoading) {
    return (
      <div>
        <Header title="Detalle de Cliente" />
        <div className="p-6 space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header
        title={`${customer?.first_name || ""} ${customer?.last_name || ""}`}
        description={customer?.email}
      />
      <div className="p-6 space-y-6">
        <div className="flex gap-3 items-center">
          <Link href="/dashboard/customers">
            <Button variant="outline" size="sm">
              ← Volver a Clientes
            </Button>
          </Link>

          {customer?.phone && (
            <a
              href={getWhatsAppUrl({
                phone: customer.phone,
                firstName: customer.first_name || "",
                orderCount: orders.length,
                daysSinceLastOrder,
                totalSpent,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp ({getWhatsAppMessageType(orders.length, daysSinceLastOrder)})
              </Button>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Gastado (LTV)"
            value={formatCurrency(totalSpent)}
            icon="💰"
          />
          <MetricCard
            title="Total Órdenes"
            value={String(orders.length)}
            icon="📦"
          />
          <MetricCard
            title="Ticket Promedio"
            value={formatCurrency(avgOrderValue)}
            icon="🧾"
          />
          <MetricCard
            title="Días sin Comprar"
            value={daysSinceLastOrder !== null ? `${daysSinceLastOrder} días` : "N/A"}
            icon={
              daysSinceLastOrder !== null && daysSinceLastOrder > 60
                ? "🔴"
                : "🟢"
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Nombre</span>
                <span className="text-sm font-medium">
                  {customer?.first_name} {customer?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Email</span>
                <span className="text-sm font-medium">{customer?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Teléfono</span>
                <span className="text-sm font-medium flex items-center gap-2">
                  {customer?.phone ? (
                    <>
                      {customer.phone}
                      <a
                        href={getWhatsAppUrl({
                          phone: customer.phone,
                          firstName: customer.first_name || "",
                          orderCount: orders.length,
                          daysSinceLastOrder,
                          totalSpent,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                        title="Enviar WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    </>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Empresa</span>
                <span className="text-sm font-medium">
                  {customer?.company_name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">DNI</span>
                <span className="text-sm font-medium">
                  {customer?.metadata?.dni || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Registrado</span>
                <span className="text-sm font-medium">
                  {customer?.created_at ? formatDate(customer.created_at) : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Grupo</span>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {customer?.metadata?.customer_group
                      ? customer.metadata.customer_group.charAt(0).toUpperCase() +
                        customer.metadata.customer_group.slice(1)
                      : "Minorista"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Productos Más Comprados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Sin compras registradas</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.count} unidades
                        </p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(p.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historial de Órdenes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Envío</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Sin órdenes registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.display_id}
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={order.payment_status === "captured" ? "default" : "outline"}>
                          {getPaymentStatusLabel(order.payment_status || order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.fulfillment_status === "delivered" ? "default" : "outline"}>
                          {getFulfillmentStatusLabel(order.fulfillment_status || "unknown")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.items?.length || 0} items
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.total || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
