"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { useAllOrders } from "@/hooks/use-orders"
import {
  DateRangePicker,
  getDefaultDateRange,
  type DateRange,
} from "@/components/dashboard/date-range-picker"
import { TopProducts } from "@/components/charts/top-products"
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
import { aggregateTopProducts } from "@/lib/aggregations"
import { formatCurrency, formatNumber } from "@/lib/format"
import { exportToCSV, formatCurrencyCSV } from "@/lib/export"
import { AIInsightWidget } from "@/components/dashboard/ai-insight-widget"

export default function ProductsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange())

  const { data: orders, isLoading } = useAllOrders({
    from: dateRange.from,
    to: dateRange.to,
  })

  const products = useMemo(
    () => aggregateTopProducts(orders || []),
    [orders]
  )

  return (
    <div>
      <Header
        title="Productos"
        description="Performance de productos por ventas"
      />
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          {products.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => {
              const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
              exportToCSV(products, [
                { header: "Producto", accessor: (p) => p.name },
                { header: "Unidades", accessor: (p) => p.quantity },
                { header: "Ingresos", accessor: (p) => formatCurrencyCSV(p.revenue) },
                { header: "Precio Promedio", accessor: (p) => formatCurrencyCSV(p.quantity > 0 ? p.revenue / p.quantity : 0) },
                { header: "% del Total", accessor: (p) => totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) + "%" : "0%" },
              ], `productos_${new Date().toISOString().slice(0, 10)}`)
            }}>
              Exportar CSV
            </Button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <>
            <TopProducts data={products} />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Precio Prom.</TableHead>
                    <TableHead className="text-right">% del Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, i) => {
                    const totalRevenue = products.reduce(
                      (sum, p) => sum + p.revenue,
                      0
                    )
                    const pct =
                      totalRevenue > 0
                        ? ((product.revenue / totalRevenue) * 100).toFixed(1)
                        : "0"
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-gray-500">{i + 1}</TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(product.quantity)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(product.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            product.quantity > 0
                              ? product.revenue / product.quantity
                              : 0
                          )}
                        </TableCell>
                        <TableCell className="text-right">{pct}%</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <AIInsightWidget
          pageContext="products"
          metricsBuilder={() => {
            if (!products.length) return null
            const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
            return {
              topProductos: products.slice(0, 10).map((p) => ({
                nombre: p.name,
                unidades: p.quantity,
                ingresos: p.revenue,
                porcentaje: totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) + "%" : "0%",
              })),
              slowMovers: products.slice(-5).map((p) => ({
                nombre: p.name,
                unidades: p.quantity,
                ingresos: p.revenue,
              })),
              totalProductos: products.length,
              ingresoTotal: totalRevenue,
              concentracionTop5: totalRevenue > 0
                ? ((products.slice(0, 5).reduce((s, p) => s + p.revenue, 0) / totalRevenue) * 100).toFixed(1) + "%"
                : "0%",
            }
          }}
          isDataLoading={isLoading}
        />
      </div>
    </div>
  )
}
