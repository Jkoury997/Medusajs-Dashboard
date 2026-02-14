"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/format"

interface ProductConversionRow {
  name: string
  views: number
  clicks: number
  addedToCart: number
  actualSold: number
  actualRevenue: number
  viewToSaleRate: string
  opportunityScore: number
}

// Mostrar columna Clicks solo si al menos 1 producto tiene clicks > 0
function hasClicksData(data: ProductConversionRow[]): boolean {
  return data.some((r) => r.clicks > 0)
}

interface ProductConversionTableProps {
  data: ProductConversionRow[]
}

export function ProductConversionTable({ data }: ProductConversionTableProps) {
  if (data.length === 0) return null

  const showClicks = hasClicksData(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          🔀 Productos: Vistas vs Ventas Reales
          <span className="text-sm font-normal text-gray-500 ml-2">
            (Datos cruzados Events + Medusa)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Vistas</TableHead>
                {showClicks && <TableHead className="text-right">Clicks</TableHead>}
                <TableHead className="text-right">Al Carrito</TableHead>
                <TableHead className="text-right">Vendidos</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Conv.</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 15).map((row, i) => {
                const convRate = parseFloat(row.viewToSaleRate)
                let badge = null
                if (row.views > 10 && row.actualSold === 0) {
                  badge = (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                      Oportunidad
                    </span>
                  )
                } else if (convRate > 5) {
                  badge = (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                      Top Conversor
                    </span>
                  )
                } else if (row.views > 20 && convRate < 1) {
                  badge = (
                    <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                      Baja Conv.
                    </span>
                  )
                }

                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(row.views)}</TableCell>
                    {showClicks && <TableCell className="text-right">{formatNumber(row.clicks)}</TableCell>}
                    <TableCell className="text-right">{formatNumber(row.addedToCart)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(row.actualSold)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.actualRevenue)}</TableCell>
                    <TableCell className="text-right">{row.viewToSaleRate}</TableCell>
                    <TableCell className="text-center">{badge}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
