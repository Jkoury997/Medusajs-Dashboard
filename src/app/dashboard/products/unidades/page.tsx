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
import { aggregateProductUnits } from "@/lib/aggregations"
import { useAllOrders } from "@/hooks/use-orders"

export default function UnidadesPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const { data: orders, isLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })

  const products = useMemo(
    () => aggregateProductUnits(orders || []),
    [orders]
  )

  const totalUnits = useMemo(
    () => products.reduce((sum, p) => sum + p.quantity, 0),
    [products]
  )

  const avgUnitsPerProduct = products.length > 0 ? totalUnits / products.length : 0

  return (
    <div>
      <Header
        title="Unidades Compradas"
        description="Volumen de unidades vendidas por producto"
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
                    { header: "Unidades", accessor: (p) => p.quantity },
                    { header: "Ordenes", accessor: (p) => p.orderCount },
                    {
                      header: "% del Total",
                      accessor: (p) =>
                        totalUnits > 0
                          ? ((p.quantity / totalUnits) * 100).toFixed(1) + "%"
                          : "0%",
                    },
                  ],
                  `unidades_compradas_${new Date().toISOString().slice(0, 10)}`
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
                title="Total unidades vendidas"
                value={formatNumber(totalUnits)}
              />
              <MetricCard
                title="Productos distintos"
                value={formatNumber(products.length)}
              />
              <MetricCard
                title="Promedio unidades/producto"
                value={avgUnitsPerProduct.toFixed(1)}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Unidades</TableHead>
                      <TableHead className="text-right">Ordenes</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
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
                      products.map((product, i) => {
                        const pct =
                          totalUnits > 0
                            ? ((product.quantity / totalUnits) * 100).toFixed(1)
                            : "0"
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-gray-500">
                              {i + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatNumber(product.quantity)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(product.orderCount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {pct}%
                            </TableCell>
                          </TableRow>
                        )
                      })
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
