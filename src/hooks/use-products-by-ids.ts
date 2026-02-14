"use client"

import { useQuery } from "@tanstack/react-query"

export interface ProductInfo {
  id: string
  title: string
  thumbnail: string | null
  handle: string
  external_id: string
}

/**
 * Dado un array de product IDs, consulta Medusa para obtener nombre, thumbnail y external_id.
 * Los resultados se devuelven como un Map<product_id, ProductInfo> para lookup rápido.
 */
export function useProductsByIds(productIds: string[]) {
  return useQuery({
    queryKey: ["products", "by-ids", productIds],
    queryFn: async () => {
      if (!productIds.length) return new Map<string, ProductInfo>()

      const res = await fetch("/api/products/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: productIds }),
      })

      if (!res.ok) {
        console.error("Error al obtener productos por IDs")
        return new Map<string, ProductInfo>()
      }

      const data = (await res.json()) as { products: ProductInfo[] }
      const map = new Map<string, ProductInfo>()
      for (const p of data.products) {
        map.set(p.id, p)
      }
      return map
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos — los productos no cambian tan seguido
  })
}
