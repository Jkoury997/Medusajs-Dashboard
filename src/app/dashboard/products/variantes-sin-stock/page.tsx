"use client"

import { useMemo, useState } from "react"
import { Header } from "@/components/dashboard/header"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatNumber } from "@/lib/format"
import { exportToCSV } from "@/lib/export"
import { useProductsWithStock } from "@/hooks/use-inventory"

export default function VariantesSinStockPage() {
  const { data, isLoading } = useProductsWithStock()
  const [search, setSearch] = useState("")

  const outOfStockVariants = useMemo(() => {
    if (!data) return []
    let result = data.variants.filter(
      (v) => v.manage_inventory && v.inventory_quantity <= 0
    )
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.product_title.toLowerCase().includes(q) ||
          v.title.toLowerCase().includes(q) ||
          v.sku?.toLowerCase().includes(q)
      )
    }
    return result
  }, [data, search])

  const metrics = useMemo(() => {
    if (!data) return { totalVariants: 0, productsAffected: 0, pctVariants: "0" }
    const oosVariants = data.variants.filter(
      (v) => v.manage_inventory && v.inventory_quantity <= 0
    )
    const managedVariants = data.variants.filter((v) => v.manage_inventory)
    const productsAffected = new Set(oosVariants.map((v) => v.product_id)).size
    const pctVariants =
      managedVariants.length > 0
        ? ((oosVariants.length / managedVariants.length) * 100).toFixed(1)
        : "0"
    return {
      totalVariants: oosVariants.length,
      productsAffected,
      pctVariants,
    }
  }, [data])

  return (
    <div>
      <Header
        title="Variantes sin Stock"
        description="Variantes individuales con stock agotado"
      />
      <div className="p-6 space-y-6">
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
                title="Variantes sin stock"
                value={formatNumber(metrics.totalVariants)}
              />
              <MetricCard
                title="Productos afectados"
                value={formatNumber(metrics.productsAffected)}
              />
              <MetricCard
                title="% de variantes"
                value={`${metrics.pctVariants}%`}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Buscar por producto, variante o SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              {outOfStockVariants.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportToCSV(
                      outOfStockVariants,
                      [
                        { header: "Producto", accessor: (v) => v.product_title },
                        { header: "Variante", accessor: (v) => v.title },
                        { header: "SKU", accessor: (v) => v.sku || "" },
                        { header: "Barcode", accessor: (v) => v.barcode || "" },
                        { header: "Stock", accessor: () => 0 },
                      ],
                      `variantes_sin_stock_${new Date().toISOString().slice(0, 10)}`
                    )
                  }
                >
                  Exportar CSV
                </Button>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Imagen</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Variante</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockVariants.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No hay variantes sin stock
                        </TableCell>
                      </TableRow>
                    ) : (
                      outOfStockVariants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell>
                            {variant.product_thumbnail ? (
                              <img
                                src={variant.product_thumbnail}
                                alt={variant.product_title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                N/A
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {variant.product_title}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {variant.title}
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm font-mono">
                            {variant.sku || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-700"
                            >
                              0
                            </Badge>
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
