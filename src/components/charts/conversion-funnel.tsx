"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FunnelStats } from "@/types/events"
import { formatNumber } from "@/lib/format"

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

interface ConversionFunnelProps {
  data: FunnelStats
}

export function ConversionFunnel({ data }: ConversionFunnelProps) {
  // Filtrar pasos con 0 (excepto el primero que siempre se muestra)
  const allSteps = data.funnel.map((step) => ({
    name: STEP_LABELS[step.step] || step.step,
    key: step.step,
    count: step.count,
  }))

  // Mostrar el primer paso siempre + los que tienen count > 0
  const steps = allSteps.filter((s, i) => i === 0 || s.count > 0)

  if (steps.length === 0) return null

  const maxCount = steps[0].count
  const rates = data.conversion_rates

  // Gradiente de rosa fuerte a rosa claro
  const getColor = (index: number, total: number) => {
    const hue = 340 // rosa
    const saturation = 85
    const lightness = 55 + (index / Math.max(total - 1, 1)) * 25
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // Conversion rates que tienen sentido (filtrar las que muestran 0.0%)
  const rateEntries = [
    { label: "Vista → Carrito", value: rates.view_to_cart },
    { label: "Carrito → Checkout", value: rates.cart_to_checkout },
    { label: "Checkout → Orden", value: rates.checkout_to_order },
    { label: "Orden → Pago", value: rates.order_to_payment },
    { label: "Pago → Envío", value: rates.payment_to_ship },
    { label: "Envío → Entrega", value: rates.ship_to_delivery },
  ].filter((r) => r.value !== "0.0%")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Embudo de Conversión
          {rates.total_view_to_purchase !== "0.0%" && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Vista → Compra: {rates.total_view_to_purchase})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-0.5">
          {steps.map((step, index) => {
            const widthPercent = maxCount > 0
              ? Math.max(25, (step.count / maxCount) * 100)
              : 100

            const prevStep = index > 0 ? steps[index - 1] : null
            const dropPercent = prevStep && prevStep.count > 0
              ? ((1 - step.count / prevStep.count) * 100).toFixed(1)
              : null
            const passPercent = prevStep && prevStep.count > 0
              ? ((step.count / prevStep.count) * 100).toFixed(1)
              : null

            const color = getColor(index, steps.length)

            return (
              <div key={index} className="w-full flex flex-col items-center">
                {dropPercent && parseFloat(dropPercent) > 0 && (
                  <div className="flex items-center gap-2 my-1">
                    <span className="text-xs text-red-400">▼ -{dropPercent}%</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-green-500">✓ {passPercent}% pasan</span>
                  </div>
                )}
                <div
                  className="relative flex items-center justify-between px-4 py-3.5 rounded-md transition-all shadow-sm"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: color,
                    minHeight: 48,
                  }}
                >
                  <span className="text-white text-sm font-medium truncate">
                    {step.name}
                  </span>
                  <span className="text-white text-sm font-bold ml-2 whitespace-nowrap">
                    {formatNumber(step.count)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {rateEntries.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-gray-600">
            {rateEntries.map((r) => (
              <span key={r.label}>
                {r.label}: <strong>{r.value}</strong>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
