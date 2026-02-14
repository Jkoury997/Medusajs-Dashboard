"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

export interface ProductInfo {
  id: string
  title: string
  thumbnail: string | null
  handle: string
  external_id: string
}

/**
 * Dado un array de product IDs, consulta Medusa Admin API para obtener
 * nombre, thumbnail y external_id. Usa el mismo SDK autenticado con JWT
 * que usan las órdenes y clientes.
 */
export function useProductsByIds(productIds: string[]) {
  return useQuery({
    queryKey: ["products", "by-ids", productIds],
    queryFn: async () => {
      if (!productIds.length) return new Map<string, ProductInfo>()

      const map = new Map<string, ProductInfo>()

      // Medusa Admin API acepta id[] como filtro
      // Hacemos batches de 50 para no sobrepasar límites
      const batchSize = 50
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)

        const response = (await sdk.client.fetch("/admin/products", {
          query: {
            id: batch,
            fields: "id,title,thumbnail,handle,external_id,metadata",
            limit: batchSize,
          },
        })) as { products: any[] }

        for (const p of response.products || []) {
          map.set(p.id, {
            id: p.id,
            title: p.title || "",
            thumbnail: p.thumbnail || null,
            handle: p.handle || "",
            external_id: p.external_id || p.metadata?.external_id || "",
          })
        }
      }

      return map
    },
    enabled: productIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
