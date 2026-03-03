"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ContactDocument,
  ContactListResponse,
  ContactListFilters,
  CreateContactData,
  UpdateContactData,
  ContactGroupDocument,
  ContactGroupListResponse,
  CreateGroupData,
  UpdateGroupData,
  TagsResponse,
  BulkDeleteResponse,
  BulkModifyResponse,
  ContactImportDocument,
  ImportHistoryResponse,
  MedusaImportData,
} from "@/types/contacts"

const BASE = "/api/contacts-proxy"

// ============================================================
// CONTACTS — Queries
// ============================================================

export function useContactList(filters: ContactListFilters = {}) {
  return useQuery({
    queryKey: ["contacts", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.group_id) params.set("group_id", filters.group_id)
      if (filters.tag) params.set("tag", filters.tag)
      if (filters.subscription_status) params.set("subscription_status", filters.subscription_status)
      if (filters.source) params.set("source", filters.source)
      if (filters.search) params.set("search", filters.search)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset != null) params.set("offset", String(filters.offset))
      const res = await fetch(`${BASE}?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener lista de contactos")
      return res.json() as Promise<ContactListResponse>
    },
  })
}

export function useContactDetail(id: string | null) {
  return useQuery({
    queryKey: ["contacts", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle de contacto")
      return res.json() as Promise<ContactDocument>
    },
    enabled: !!id,
  })
}

export function useContactTags() {
  return useQuery({
    queryKey: ["contacts", "tags"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/tags`)
      if (!res.ok) throw new Error("Error al obtener tags")
      return res.json() as Promise<TagsResponse>
    },
  })
}

// ============================================================
// CONTACTS — Mutations
// ============================================================

export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const res = await fetch(BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear contacto")
      }
      return res.json() as Promise<ContactDocument>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactData }) => {
      const res = await fetch(`${BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar contacto")
      }
      return res.json() as Promise<ContactDocument>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar contacto")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

// ============================================================
// GROUPS — Queries
// ============================================================

export function useContactGroupList() {
  return useQuery({
    queryKey: ["contact-groups", "list"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/groups?limit=200`)
      if (!res.ok) throw new Error("Error al obtener grupos de contactos")
      return res.json() as Promise<ContactGroupListResponse>
    },
  })
}

export function useContactGroupDetail(id: string | null) {
  return useQuery({
    queryKey: ["contact-groups", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/groups/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle de grupo")
      return res.json() as Promise<ContactGroupDocument>
    },
    enabled: !!id,
  })
}

// ============================================================
// GROUPS — Mutations
// ============================================================

export function useCreateContactGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateGroupData) => {
      const res = await fetch(`${BASE}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al crear grupo")
      }
      return res.json() as Promise<ContactGroupDocument>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useUpdateContactGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGroupData }) => {
      const res = await fetch(`${BASE}/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar grupo")
      }
      return res.json() as Promise<ContactGroupDocument>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useDeleteContactGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/groups/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar grupo")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

// ============================================================
// BULK OPERATIONS
// ============================================================

export function useBulkDeleteContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contact_ids: string[]) => {
      const res = await fetch(`${BASE}/bulk/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al eliminar contactos")
      }
      return res.json() as Promise<BulkDeleteResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useBulkAddToGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contact_ids, group_id }: { contact_ids: string[]; group_id: string }) => {
      const res = await fetch(`${BASE}/bulk/add-to-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids, group_id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al agregar a grupo")
      }
      return res.json() as Promise<BulkModifyResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useBulkRemoveFromGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contact_ids, group_id }: { contact_ids: string[]; group_id: string }) => {
      const res = await fetch(`${BASE}/bulk/remove-from-group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids, group_id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al remover de grupo")
      }
      return res.json() as Promise<BulkModifyResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useBulkAddTags() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contact_ids, tags }: { contact_ids: string[]; tags: string[] }) => {
      const res = await fetch(`${BASE}/bulk/add-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids, tags }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al agregar tags")
      }
      return res.json() as Promise<BulkModifyResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contacts", "tags"] })
    },
  })
}

export function useBulkRemoveTags() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contact_ids, tags }: { contact_ids: string[]; tags: string[] }) => {
      const res = await fetch(`${BASE}/bulk/remove-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids, tags }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al remover tags")
      }
      return res.json() as Promise<BulkModifyResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contacts", "tags"] })
    },
  })
}

export function useBulkUpdateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contact_ids, status }: { contact_ids: string[]; status: "subscribed" | "unsubscribed" }) => {
      const res = await fetch(`${BASE}/bulk/update-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_ids, status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al actualizar suscripción")
      }
      return res.json() as Promise<BulkModifyResponse>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
    },
  })
}

// ============================================================
// IMPORT
// ============================================================

export function useImportCSV() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${BASE}/import/csv`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al importar CSV")
      }
      return res.json() as Promise<ContactImportDocument>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contact-imports"] })
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useImportMedusa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: MedusaImportData) => {
      const res = await fetch(`${BASE}/import/medusa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al importar desde Medusa")
      }
      return res.json() as Promise<ContactImportDocument>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] })
      qc.invalidateQueries({ queryKey: ["contact-imports"] })
      qc.invalidateQueries({ queryKey: ["contact-groups"] })
    },
  })
}

export function useImportHistory(limit = 20) {
  return useQuery({
    queryKey: ["contact-imports", "history", limit],
    queryFn: async () => {
      const res = await fetch(`${BASE}/imports?limit=${limit}`)
      if (!res.ok) throw new Error("Error al obtener historial de importaciones")
      return res.json() as Promise<ImportHistoryResponse>
    },
    retry: false,
  })
}

export function useImportDetail(id: string | null) {
  return useQuery({
    queryKey: ["contact-imports", "detail", id],
    queryFn: async () => {
      const res = await fetch(`${BASE}/imports/${id}`)
      if (!res.ok) throw new Error("Error al obtener detalle de importación")
      return res.json() as Promise<ContactImportDocument>
    },
    enabled: !!id,
  })
}
