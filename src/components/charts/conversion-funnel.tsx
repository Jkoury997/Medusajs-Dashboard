"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FunnelStats } from "@/types/events"

const STEP_LABELS: Record<string, string> = {
  "product.viewed": "Vista de Producto",
  "product.added_to_cart": "Agregado al Carrito",
  "cart.created": "Carrito Creado",
  "checkout.started": "Checkout Iniciado",
  "order.placed": "Orden Realizada",
  "payment.captured": "Pago Capturado",
  "shipment.created": "Envío Creado",
  "delivery.created": "Entrega Confirmada",
}

const FUNNEL_COLORS = [
  "#ff75a8", "#ff8fb8", "#ffaacb", "#ffc4dd",
  "#16a34a", "#22c55e", "#4ade80", "#86efac",
]

interface ConversionFunnelProps {
  data: FunnelStats
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  const steps = data.funnel.map((step) => ({
    name: STEP_LABELS[step.step] || step.step,
    count: step.count,
  }))

  if (steps.length === 0) return null

  const rates = data.conversion_rates
  const maxCount = steps[0].count

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Embudo de Conversión
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Total: {rates.total_view_to_purchase})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-1">
          {steps.map((step, index) => {
            const widthPercent = maxCount > 0
              ? Math.max(20, (step.count / maxCount) * 100)
              : 100
            const dropPercent = index > 0 && steps[index - 1].count > 0
              ? ((1 - step.count / steps[index - 1].count) * 100).toFixed(1)
              : null
            const color = FUNNEL_COLORS[index % FUNNEL_COLORS.length]

            return (
              <div key={index} className="w-full flex flex-col items-center">
                <div
                  className="relative flex items-center justify-between px-4 py-3 rounded-sm transition-all"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    minHeight: 44,
                  }}
                >
                  <span className="text-white text-sm font-medium truncate">
                    {step.name}
                  </span>
                  <span className="text-white text-sm font-bold ml-2 whitespace-nowrap">
                    {step.count.toLocaleString("es-AR")}
                  </span>
                </div>
                {dropPercent && (
                  <span className="text-xs text-gray-400 my-0.5">
                    ▼ -{dropPercent}%
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-600">
          <span>Vista → Carrito: <strong>{rates.view_to_cart}</strong></span>
          <span>Carrito → Checkout: <strong>{rates.cart_to_checkout}</strong></span>
          <span>Checkout → Orden: <strong>{rates.checkout_to_order}</strong></span>
          <span>Orden → Pago: <strong>{rates.order_to_payment}</strong></span>
          <span>Pago → Envío: <strong>{rates.payment_to_ship}</strong></span>
          <span>Envío → Entrega: <strong>{rates.ship_to_delivery}</strong></span>
        </div>
      </CardContent>
    </Card>
  )
}
