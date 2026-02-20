"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  EmailTemplateType,
  EmailTemplateFields,
  EmailTemplateListResponse,
  EmailTemplateResolved,
} from "@/types/email-marketing"

// --- Queries ---

export function useTemplateList() {
  return useQuery({
    queryKey: ["email", "templates"],
    queryFn: async () => {
      const res = await fetch("/api/email-proxy/templates")
      if (!res.ok) throw new Error("Error al obtener lista de templates")
      return res.json() as Promise<EmailTemplateListResponse>
    },
  })
}

export function useTemplateResolved(type: EmailTemplateType, groupName?: string) {
  return useQuery({
    queryKey: ["email", "templates", type, groupName || "default"],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (groupName) params.set("group_name", groupName)
      const qs = params.toString()
      const res = await fetch(`/api/email-proxy/templates/${type}${qs ? `?${qs}` : ""}`)
      if (!res.ok) throw new Error(`Error al obtener template ${type}`)
      return res.json() as Promise<EmailTemplateResolved>
    },
    enabled: !!type,
  })
}

// --- Mutations ---

export function useUpsertTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      type,
      groupName,
      data,
    }: {
      type: EmailTemplateType
      groupName?: string
      data: Partial<EmailTemplateFields>
    }) => {
      const params = new URLSearchParams()
      if (groupName) params.set("group_name", groupName)
      const qs = params.toString()
      const res = await fetch(`/api/email-proxy/templates/${type}${qs ? `?${qs}` : ""}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Error al guardar template ${type}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "templates"] })
    },
  })
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      type,
      groupName,
    }: {
      type: EmailTemplateType
      groupName?: string
    }) => {
      const params = new URLSearchParams()
      if (groupName) params.set("group_name", groupName)
      const qs = params.toString()
      const res = await fetch(`/api/email-proxy/templates/${type}${qs ? `?${qs}` : ""}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Error al eliminar template ${type}`)
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email", "templates"] })
    },
  })
}

export function useTemplatePreview() {
  return useMutation({
    mutationFn: async ({
      type,
      groupName,
    }: {
      type: EmailTemplateType
      groupName?: string
    }) => {
      const params = new URLSearchParams()
      if (groupName) params.set("group_name", groupName)
      const qs = params.toString()
      const res = await fetch(`/api/email-proxy/templates/${type}/preview${qs ? `?${qs}` : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error("Error al generar preview del template")
      return res.json() as Promise<{ html: string; subject: string }>
    },
  })
}
