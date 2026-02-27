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
  external_id: string | null
  variants: VariantWithStock[]
  totalStock: number
  allOutOfStock: boolean
}

/**
 * Trae todos los inventory items con location_levels y construye
 * un mapa SKU → stock total (stocked_quantity sumado en todas las locations).
 */
async function fetchInventoryMap(): Promise<Map<string, number>> {
  const stockBySku = new Map<string, number>()
  let offset = 0
  const limit = 100
  let total = Infinity

  while (offset < total) {
    const response = (await sdk.client.fetch("/admin/inventory-items", {
      query: {
        limit,
        offset,
        fields: "id,sku,*location_levels",
      },
    })) as { inventory_items: any[]; count: number }

    for (const item of response.inventory_items || []) {
      if (!item.sku) continue
      const stock = (item.location_levels || []).reduce(
        (sum: number, ll: any) => sum + (ll.stocked_quantity ?? 0),
        0
      )
      stockBySku.set(item.sku, (stockBySku.get(item.sku) || 0) + stock)
    }

    total = response.count
    offset += limit
  }

  return stockBySku
}

/**
 * Trae todos los productos con sus variantes y niveles de stock reales
 * cruzando con inventory_items por SKU.
 */
export function useProductsWithStock() {
  return useQuery({
    queryKey: ["products", "with-stock"],
    queryFn: async () => {
      // Paso 1: traer mapa SKU → stock desde inventory_items
      const stockBySku = await fetchInventoryMap()

      // Paso 2: traer productos con variantes
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
            fields: "id,title,thumbnail,external_id,*variants",
          },
        })) as { products: any[]; count: number }

        for (const product of response.products || []) {
          const variants: VariantWithStock[] = (product.variants || []).map(
            (v: any) => {
              const managesInventory = v.manage_inventory ?? true
              // Buscar stock real por SKU en el mapa de inventory
              const stockFromInventory =
                managesInventory && v.sku ? stockBySku.get(v.sku) ?? 0 : 0

              return {
                id: v.id,
                title: v.title,
                sku: v.sku || null,
                barcode: v.barcode || null,
                manage_inventory: managesInventory,
                inventory_quantity: stockFromInventory,
                product_id: product.id,
                product_title: product.title,
                product_thumbnail: product.thumbnail,
              }
            }
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
            external_id: product.external_id || null,
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
