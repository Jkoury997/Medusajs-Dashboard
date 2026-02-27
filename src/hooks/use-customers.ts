"use client"

import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa-sdk"

interface CustomerFilters {
  has_account?: boolean
  q?: string
  limit?: number
  offset?: number
}

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        limit: filters.limit || 50,
        offset: filters.offset || 0,
        order: "-created_at",
      }

      if (filters.q) params.q = filters.q
      if (filters.has_account !== undefined) params.has_account = filters.has_account

      const response = await sdk.client.fetch("/admin/customers", {
        query: params,
      })

      return response as {
        customers: any[]
        count: number
        offset: number
        limit: number
      }
    },
  })
}

export function useAllCustomers() {
  return useQuery({
    queryKey: ["customers", "all"],
    queryFn: async () => {
      const allCustomers: any[] = []
      let offset = 0
      const limit = 100
      let total = Infinity

      while (offset < total) {
        const response = (await sdk.client.fetch("/admin/customers", {
          query: { limit, offset, order: "-created_at" },
        })) as { customers: any[]; count: number }

        allCustomers.push(...response.customers)
        total = response.count
        offset += limit
      }

      return allCustomers
    },
  })
}

export function useCustomerGroups() {
  return useQuery({
    queryKey: ["customer-groups"],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/customer-groups", {
        query: { limit: 100 },
      })

      return response as {
        customer_groups: any[]
        count: number
      }
    },
  })
}

/**
 * Crea un mapa de ID de grupo → nombre a partir de los customer groups nativos de Medusa.
 */
export function buildGroupNameMap(customerGroups: any[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const g of customerGroups) {
    if (g.id && g.name) {
      map.set(g.id, g.name)
    }
  }
  return map
}

/**
 * Resuelve el nombre del grupo de un cliente.
 * Si metadata.customer_group contiene un ID (ej: "Cusgroup_..."), lo traduce al nombre usando el mapa.
 * Si ya contiene un nombre legible (ej: "mayorista"), lo devuelve tal cual.
 */
export function resolveGroupName(groupValue: string, groupNameMap: Map<string, string>): string {
  // Si el valor coincide con un ID en el mapa, devolver el nombre
  if (groupNameMap.has(groupValue)) {
    return groupNameMap.get(groupValue)!
  }
  // Si no, ya es un nombre legible
  return groupValue
}

/**
 * Extrae los grupos únicos de metadata.customer_group de una lista de clientes.
 * Resuelve IDs de grupo a nombres usando el mapa de grupos nativos.
 * Retorna un array de strings (nombres) ordenado alfabéticamente.
 */
export function extractCustomerGroups(customers: any[], groupNameMap?: Map<string, string>): string[] {
  const groups = new Set<string>()
  for (const c of customers) {
    const group = c.metadata?.customer_group
    if (group && typeof group === "string") {
      const name = groupNameMap ? resolveGroupName(group, groupNameMap) : group
      groups.add(name)
    }
  }
  return Array.from(groups).sort()
}

// Grupo por defecto para clientes sin grupo asignado (invitados/compradores directos)
const DEFAULT_GROUP = "Minorista"

/**
 * Enriquece los clientes resolviendo el nombre del grupo en metadata.
 * Si no tiene grupo asignado, se asigna "Minorista" por defecto (compran como invitados).
 */
export function resolveCustomerGroups(customers: any[], groupNameMap: Map<string, string>): any[] {
  return customers.map((c) => {
    const group = c.metadata?.customer_group
    if (group && typeof group === "string") {
      const resolvedName = groupNameMap.size > 0 ? resolveGroupName(group, groupNameMap) : group
      return {
        ...c,
        metadata: {
          ...c.metadata,
          customer_group_resolved: resolvedName,
        },
      }
    }
    // Sin grupo asignado → Minorista por defecto
    return {
      ...c,
      metadata: {
        ...c.metadata,
        customer_group_resolved: DEFAULT_GROUP,
      },
    }
  })
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ["orders", "customer", customerId],
    queryFn: async () => {
      const response = await sdk.client.fetch("/admin/orders", {
        query: {
          customer_id: customerId,
          order: "-created_at",
          limit: 100,
          fields: "+shipping_address",
        },
      })

      return response as {
        orders: any[]
        count: number
      }
    },
    enabled: !!customerId,
  })
}
