"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { MediaItem } from "@/types/campaigns"

const BASE = "/api/campaigns-proxy/media"

export function useMediaList() {
  return useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const res = await fetch(BASE)
      if (!res.ok) throw new Error("Error al obtener media")
      const data = await res.json()
      return (data.media ?? []) as MediaItem[]
    },
  })
}

export function useUploadMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch(BASE, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(err.error || "Error al subir archivo")
      }
      return res.json() as Promise<MediaItem>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] })
    },
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${BASE}/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar media")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] })
    },
  })
}
