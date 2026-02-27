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

export default function SinStockPage() {
  const { data, isLoading } = useProductsWithStock()
  const [search, setSearch] = useState("")

  const outOfStockProducts = useMemo(() => {
    if (!data) return []
    let result = data.products.filter((p) => p.allOutOfStock)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.external_id?.toLowerCase().includes(q)
      )
    }
    return result
  }, [data, search])

  const metrics = useMemo(() => {
    if (!data) return { outOfStock: 0, variantsAffected: 0, pctCatalog: "0" }
    const outOfStock = data.products.filter((p) => p.allOutOfStock).length
    const variantsAffected = data.products
      .filter((p) => p.allOutOfStock)
      .reduce((sum, p) => sum + p.variants.length, 0)
    const pctCatalog =
      data.products.length > 0
        ? ((outOfStock / data.products.length) * 100).toFixed(1)
        : "0"
    return { outOfStock, variantsAffected, pctCatalog }
  }, [data])

  return (
    <div>
      <Header
        title="Productos sin Stock"
        description="Productos con todas sus variantes agotadas"
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
                title="Productos sin stock"
                value={formatNumber(metrics.outOfStock)}
              />
              <MetricCard
                title="Variantes afectadas"
                value={formatNumber(metrics.variantsAffected)}
              />
              <MetricCard
                title="% del catalogo"
                value={`${metrics.pctCatalog}%`}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Input
                placeholder="Buscar por nombre o ID externo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              {outOfStockProducts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportToCSV(
                      outOfStockProducts,
                      [
                        { header: "Producto", accessor: (p) => p.title },
                        { header: "ID Externo", accessor: (p) => p.external_id || "" },
                        {
                          header: "Variantes",
                          accessor: (p) => p.variants.length,
                        },
                        { header: "Stock Total", accessor: () => 0 },
                      ],
                      `productos_sin_stock_${new Date().toISOString().slice(0, 10)}`
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
                      <TableHead>ID Externo</TableHead>
                      <TableHead className="text-center">Variantes</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outOfStockProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No hay productos completamente sin stock
                        </TableCell>
                      </TableRow>
                    ) : (
                      outOfStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.thumbnail ? (
                              <img
                                src={product.thumbnail}
                                alt={product.title}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                                N/A
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.title}
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm font-mono">
                            {product.external_id || "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            {product.variants.length}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className="bg-red-100 text-red-700"
                            >
                              Sin stock
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
