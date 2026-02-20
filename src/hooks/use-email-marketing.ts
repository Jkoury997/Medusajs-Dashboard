"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  AbandonedCartStats,
  AbandonedCartList,
  AbandonedCartListFilters,
  EmailConfigAll,
  EmailConfigUpdateData,
  ProcessResult,
  ForceSendResult,
  DeleteCartResult,
} from "@/types/email-marketing"

// --- Queries ---

export function useAbandonedCartStats() {
  return useQuery({
    queryKey: ["email", "abandoned-carts", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/email-proxy/abandoned-carts/stats")
      if (!res.ok) throw new Error("Error al obtener estadísticas de carritos abandonados")
      return res.json() as Promise<AbandonedCartStats>
    },
  })
}

export function useAbandonedCartList(filters: AbandonedCartListFilters = {}) {
  return useQuery({
    queryKey: ["email", "abandoned-carts", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.recovered) params.set("recovered", filters.recovered)
      if (filters.email_1) params.set("email_1", filters.email_1)
      if (filters.email_2) params.set("email_2", filters.email_2)
      if (filters.customer_group) params.set("customer_group", filters.customer_group)
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset) params.set("offset", String(filters.offset))

      const res = await fetch(`/api/email-proxy/abandoned-carts/list?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener lista de carritos abandonados")
      return res.json() as Promise<AbandonedCartList>
    },
  })
}

export function useEmailConfig() {
  return useQuery({
    queryKey: ["email", "config"],
    queryFn: async () => {
      const res = await fetch("/api/email-proxy/config")
      if (!res.ok) throw new Error("Error al obtener configuración de email marketing")
      return res.json() as Promise<EmailConfigAll>
    },
  })
}

// --- Mutations ---

export function useProcessAbandonedCarts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/email-proxy/abandoned-carts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Error al procesar carritos abandonados")
      return res.json() as Promise<ProcessResult>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "abandoned-carts"] })
    },
  })
}

export function useUpdateGlobalConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: EmailConfigUpdateData) => {
      const res = await fetch("/api/email-proxy/config/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Error al actualizar configuración global")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "config"] })
      queryClient.invalidateQueries({ queryKey: ["email", "campaigns", "config"] })
    },
  })
}

export function useUpdateGroupConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      group,
      data,
    }: {
      group: string
      data: EmailConfigUpdateData
    }) => {
      const res = await fetch(`/api/email-proxy/config/group/${group}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Error al actualizar configuración de ${group}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "config"] })
    },
  })
}

export function useForceSendEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      cart_id,
      email_type = "next",
    }: {
      cart_id: string
      email_type?: "next" | "email_1" | "email_2"
    }) => {
      const res = await fetch("/api/email-proxy/abandoned-carts/force-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id, email_type }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al enviar email")
      }
      return res.json() as Promise<ForceSendResult>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "abandoned-carts"] })
    },
  })
}

export function useDeleteAbandonedCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cartId: string) => {
      const res = await fetch(`/api/email-proxy/abandoned-carts/${cartId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar carrito")
      }
      return res.json() as Promise<DeleteCartResult>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "abandoned-carts"] })
    },
  })
}

export function useDeleteGroupConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (group: string) => {
      const res = await fetch(`/api/email-proxy/config/group/${group}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Error al eliminar configuración de ${group}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "config"] })
    },
  })
}
