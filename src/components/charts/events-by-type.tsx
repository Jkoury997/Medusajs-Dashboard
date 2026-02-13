"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const EVENT_LABELS: Record<string, string> = {
  "order.placed": "Orden Realizada",
  "order.completed": "Orden Completada",
  "order.canceled": "Orden Cancelada",
  "order.fulfillment_created": "Preparación Creada",
  "order.return_requested": "Devolución Solicitada",
  "payment.captured": "Pago Capturado",
  "payment.refunded": "Pago Reembolsado",
  "shipment.created": "Envío Creado",
  "delivery.created": "Entrega Confirmada",
  "customer.created": "Cliente Creado",
  "cart.created": "Carrito Creado",
  "cart.updated": "Carrito Actualizado",
  "cart.viewed": "Carrito Visto",
  "product.viewed": "Producto Visto",
  "product.clicked": "Producto Clickeado",
  "product.added_to_cart": "Agregado al Carrito",
  "product.removed_from_cart": "Quitado del Carrito",
  "product.variant_selected": "Variante Seleccionada",
  "category.viewed": "Categoría Vista",
  "collection.viewed": "Colección Vista",
  "checkout.started": "Checkout Iniciado",
  "checkout.abandoned": "Checkout Abandonado",
  "search.performed": "Búsqueda Realizada",
  "search.no_results": "Búsqueda sin Resultados",
  "search.result_clicked": "Resultado Clickeado",
  "page.viewed": "Página Vista",
}

interface EventsByTypeProps {
  data: Record<string, number>
}

export function EventsByType({ data }: EventsByTypeProps) {
  const chartData = Object.entries(data)
    .map(([name, count]) => ({ name: EVENT_LABELS[name] || name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Eventos por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: Math.max(300, chartData.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                fontSize={11}
                width={160}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => [
                  Number(value).toLocaleString("es-AR"),
                  "Eventos",
                ]}
              />
              <Bar dataKey="count" fill="#ff75a8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
