"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ============================================================
// CONNECTION STATUS
// ============================================================

export interface MLConnectionStatus {
  connected: boolean
  configured: boolean
  user_id?: number
  seller_nickname?: string
  expires_at?: number
  is_expired?: boolean
  message?: string
}

export function useMLConnection() {
  return useQuery({
    queryKey: ["mercadolibre", "connection"],
    queryFn: async () => {
      const res = await fetch("/api/mercadolibre/token")
      if (!res.ok) throw new Error("Error al verificar conexion ML")
      return res.json() as Promise<MLConnectionStatus>
    },
    refetchInterval: 5 * 60 * 1000, // Check every 5 min
  })
}

export function useMLDisconnect() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mercadolibre/token", { method: "DELETE" })
      if (!res.ok) throw new Error("Error al desconectar ML")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mercadolibre"] })
    },
  })
}

// ============================================================
// METRICS
// ============================================================

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0]
}

export interface MLOverviewMetrics {
  total_orders: number
  paid_orders: number
  pending_orders: number
  cancelled_orders: number
  total_revenue: number
  avg_ticket: number
  unique_buyers: number
  top_products: { title: string; quantity: number; revenue: number }[]
  revenue_by_day: Record<string, { revenue: number; orders: number }>
  shipping_status: Record<string, number>
  currency: string
}

export function useMLOverview(from: Date, to: Date, enabled = true) {
  return useQuery({
    queryKey: ["mercadolibre", "overview", formatDateParam(from), formatDateParam(to)],
    queryFn: async () => {
      const res = await fetch(
        `/api/mercadolibre/metrics?type=overview&startDate=${formatDateParam(from)}&endDate=${formatDateParam(to)}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Error al obtener metricas ML")
      }
      return res.json() as Promise<MLOverviewMetrics>
    },
    enabled,
  })
}

export function useMLListings(enabled = true) {
  return useQuery({
    queryKey: ["mercadolibre", "listings"],
    queryFn: async () => {
      const res = await fetch("/api/mercadolibre/metrics?type=listings")
      if (!res.ok) throw new Error("Error al obtener publicaciones ML")
      return res.json() as Promise<{ total_active: number }>
    },
    enabled,
  })
}

export function useMLQuestions(enabled = true) {
  return useQuery({
    queryKey: ["mercadolibre", "questions"],
    queryFn: async () => {
      const res = await fetch("/api/mercadolibre/metrics?type=questions")
      if (!res.ok) throw new Error("Error al obtener preguntas ML")
      return res.json() as Promise<{ unanswered: number }>
    },
    enabled,
    refetchInterval: 2 * 60 * 1000, // Every 2 min
  })
}

export interface MLReputation {
  level_id: string
  power_seller_status: string | null
  transactions_completed: number
  transactions_canceled: number
  ratings_positive: number
  ratings_neutral: number
  ratings_negative: number
  metrics: Record<string, any>
}

export function useMLReputation(enabled = true) {
  return useQuery({
    queryKey: ["mercadolibre", "reputation"],
    queryFn: async () => {
      const res = await fetch("/api/mercadolibre/metrics?type=reputation")
      if (!res.ok) throw new Error("Error al obtener reputacion ML")
      return res.json() as Promise<MLReputation>
    },
    enabled,
  })
}
