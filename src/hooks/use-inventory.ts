"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

export interface VariantWithStock {
  id: string
  title: string
  sku: string | null
  barcode: string | null
  manage_inventory: boolean
  inventory_quantity: number
  product_id: string
  product_title: string
  product_thumbnail: string | null
}

export interface ProductWithStock {
  id: string
  title: string
  thumbnail: string | null
  handle: string
  variants: VariantWithStock[]
  totalStock: number
  allOutOfStock: boolean
}

/**
 * Trae todos los productos con sus variantes y niveles de stock.
 * Calcula totalStock y allOutOfStock por producto.
 */
export function useProductsWithStock() {
  return useQuery({
    queryKey: ["products", "with-stock"],
    queryFn: async () => {
      const allProducts: ProductWithStock[] = []
      const allVariants: VariantWithStock[] = []
      let offset = 0
      const limit = 50
      let total = Infinity

      while (offset < total) {
        const response = (await sdk.client.fetch("/admin/products", {
          query: {
            limit,
            offset,
            fields: "id,title,thumbnail,handle,*variants",
          },
        })) as { products: any[]; count: number }

        for (const product of response.products || []) {
          const variants: VariantWithStock[] = (product.variants || []).map(
            (v: any) => ({
              id: v.id,
              title: v.title,
              sku: v.sku || null,
              barcode: v.barcode || null,
              manage_inventory: v.manage_inventory ?? true,
              inventory_quantity: v.inventory_quantity ?? 0,
              product_id: product.id,
              product_title: product.title,
              product_thumbnail: product.thumbnail,
            })
          )

          const managedVariants = variants.filter((v) => v.manage_inventory)
          const totalStock = managedVariants.reduce(
            (sum, v) => sum + v.inventory_quantity,
            0
          )
          const allOutOfStock =
            managedVariants.length > 0 &&
            managedVariants.every((v) => v.inventory_quantity <= 0)

          allProducts.push({
            id: product.id,
            title: product.title,
            thumbnail: product.thumbnail,
            handle: product.handle,
            variants,
            totalStock,
            allOutOfStock,
          })

          allVariants.push(...variants)
        }

        total = response.count
        offset += limit
      }

      return { products: allProducts, variants: allVariants }
    },
    staleTime: 5 * 60 * 1000,
  })
}
