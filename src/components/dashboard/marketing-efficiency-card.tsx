"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/format"

interface MarketingEfficiencyProps {
  metaSpend?: number
  metaRoas?: number
  metaCtr?: number
  metaCpc?: number
  metaImpressions?: number
  metaClicks?: number
  realRevenue: number
  paidOrders: number
}

export function MarketingEfficiencyCard({
  metaSpend,
  metaRoas,
  metaCtr,
  metaCpc,
  metaImpressions,
  metaClicks,
  realRevenue,
  paidOrders,
}: MarketingEfficiencyProps) {
  if (!metaSpend && metaSpend !== 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Eficiencia de Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">
            Configurá Meta Ads en .env.local para ver datos
          </p>
        </CardContent>
      </Card>
    )
  }

  const realRoas = metaSpend && metaSpend > 0 ? realRevenue / metaSpend : 0
  const costPerSale = paidOrders > 0 && metaSpend ? metaSpend / paidOrders : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📈 Eficiencia de Marketing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Gasto Meta</p>
            <p className="text-lg font-bold">{formatCurrency(metaSpend || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Costo por Venta</p>
            <p className="text-lg font-bold">{formatCurrency(costPerSale)}</p>
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ROAS Meta (reportado)</span>
            <span className="text-sm font-medium">{metaRoas?.toFixed(2) || "—"}x</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">ROAS Real (Medusa)</span>
            <span className={`text-sm font-bold ${realRoas >= 1 ? "text-green-600" : "text-red-600"}`}>
              {realRoas.toFixed(2)}x
            </span>
          </div>
          {metaRoas && realRoas > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Diferencia</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                realRoas >= metaRoas
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {realRoas >= metaRoas ? "+" : ""}{((realRoas - metaRoas) / metaRoas * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">CTR</span>
            <p className="font-medium">{metaCtr?.toFixed(2) || "—"}%</p>
          </div>
          <div>
            <span className="text-gray-500">CPC</span>
            <p className="font-medium">{formatCurrency(metaCpc || 0)}</p>
          </div>
          <div>
            <span className="text-gray-500">Impresiones</span>
            <p className="font-medium">{formatNumber(metaImpressions || 0)}</p>
          </div>
          <div>
            <span className="text-gray-500">Clicks</span>
            <p className="font-medium">{formatNumber(metaClicks || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
