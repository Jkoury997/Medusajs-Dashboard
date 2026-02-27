"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent } from "@/components/ui/card"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/format"
import { exportToCSV } from "@/lib/export"
import { aggregateAvgUnitsPerPurchase } from "@/lib/aggregations"
import { useAllOrders } from "@/hooks/use-orders"

export default function PromedioPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const { data: orders, isLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })

  const products = useMemo(
    () => aggregateAvgUnitsPerPurchase(orders || []),
    [orders]
  )

  const globalAvg = useMemo(() => {
    if (!products.length) return 0
    const totalQty = products.reduce((sum, p) => sum + p.totalQuantity, 0)
    const totalOrders = new Set(
      products.flatMap((p) =>
        Array.from({ length: p.orderCount }, (_, i) => `${p.product_id}_${i}`)
      )
    ).size
    // Usar suma ponderada: total unidades / total lineas de producto
    const totalLines = products.reduce((sum, p) => sum + p.orderCount, 0)
    return totalLines > 0 ? totalQty / totalLines : 0
  }, [products])

  const topProduct = products.length > 0 ? products[0] : null
  const bulkProducts = products.filter((p) => p.avgPerPurchase >= 2).length

  return (
    <div>
      <Header
        title="Promedio por Compra"
        description="Cantidad promedio de unidades por transaccion, por producto"
      />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {products.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCSV(
                  products,
                  [
                    { header: "Producto", accessor: (p) => p.name },
                    { header: "Total Unidades", accessor: (p) => p.totalQuantity },
                    { header: "Ordenes", accessor: (p) => p.orderCount },
                    {
                      header: "Promedio/Compra",
                      accessor: (p) => p.avgPerPurchase.toFixed(1),
                    },
                  ],
                  `promedio_por_compra_${new Date().toISOString().slice(0, 10)}`
                )
              }
            >
              Exportar CSV
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Promedio general"
                value={globalAvg.toFixed(1)}
              />
              <MetricCard
                title={topProduct ? `Mayor: ${topProduct.name.slice(0, 25)}` : "Mayor promedio"}
                value={
                  topProduct
                    ? `${topProduct.avgPerPurchase.toFixed(1)} u.`
                    : "-"
                }
              />
              <MetricCard
                title="Productos con prom. >= 2"
                value={formatNumber(bulkProducts)}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">
                        Total Unidades
                      </TableHead>
                      <TableHead className="text-right">Ordenes</TableHead>
                      <TableHead className="text-right">
                        Promedio/Compra
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No hay datos de ventas en el periodo seleccionado
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-gray-500">
                            {i + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(product.totalQuantity)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(product.orderCount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {product.avgPerPurchase.toFixed(1)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
