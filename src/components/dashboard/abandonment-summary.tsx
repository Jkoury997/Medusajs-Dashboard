"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/format"
import type { EventItem } from "@/types/events"

interface AbandonmentSummaryProps {
  abandonedCount: number
  abandonRate: string
  estimatedLostValue: number
  recentAbandoned: EventItem[]
}

export function AbandonmentSummary({
  abandonedCount,
  abandonRate,
  estimatedLostValue,
  recentAbandoned,
}: AbandonmentSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">🛒 Abandonos de Checkout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{abandonedCount}</p>
            <p className="text-xs text-gray-500">Abandonados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{abandonRate}%</p>
            <p className="text-xs text-gray-500">Tasa</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{formatCurrency(estimatedLostValue)}</p>
            <p className="text-xs text-gray-500">Valor Perdido</p>
          </div>
        </div>

        {recentAbandoned.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Últimos abandonos</h4>
            <div className="space-y-2">
              {recentAbandoned.slice(0, 5).map((event, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                    <span className="text-gray-700 ml-2">
                      {(event.data?.email as string) || event.customer_id || "Anónimo"}
                    </span>
                  </div>
                  <span className="font-medium">
                    {event.data?.total ? formatCurrency(event.data.total as number) : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {abandonedCount === 0 && (
          <p className="text-sm text-gray-400">No hay checkouts abandonados en el período</p>
        )}
      </CardContent>
    </Card>
  )
}
