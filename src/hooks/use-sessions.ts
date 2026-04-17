"use client"

import { useQuery } from "@tanstack/react-query"

type Range = { from: Date; to: Date }

function fromParam(d: Date) {
  return d.toISOString()
}
function toParam(d: Date) {
  return d.toISOString()
}

function buildQS(range: Range, extra: Record<string, string> = {}) {
  const qs = new URLSearchParams({
    from: fromParam(range.from),
    to: toParam(range.to),
    ...extra,
  })
  return qs.toString()
}

export type SessionsOverviewResponse = {
  overview: {
    sessions: number
    pageviews: number
    events: number
    converted_sessions: number
    conversion_rate: number
    revenue_total: number
    avg_duration_ms: number
    bounce_rate: number
  }
  series: Array<{ ts: string; sessions: number; pageviews: number; converted: number }>
  utm: Array<{ source: string; medium: string; campaign: string; sessions: number; converted: number; revenue: number }>
  range: { from: string; to: string }
}

export function useSessionsOverview(range: Range, bucket: "hour" | "day" = "day") {
  return useQuery<SessionsOverviewResponse>({
    queryKey: ["sessions-overview", range.from.toISOString(), range.to.toISOString(), bucket],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/sessions-overview?${buildQS(range, { bucket })}`)
      if (!res.ok) throw new Error("Error al cargar overview")
      return res.json()
    },
    refetchInterval: 60_000,
  })
}

export type SessionRow = {
  _id: string
  session_id: string
  customer_id: string | null
  customer_group: string
  first_seen_at: string
  last_seen_at: string
  landing_page: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  device_type: string | null
  os: string | null
  browser: string | null
  country: string | null
  city: string | null
  total_pageviews: number
  total_events: number
  total_duration_ms: number
  bounce: boolean
  converted_at: string | null
  revenue: number
}

export type SessionsListResponse = {
  sessions: SessionRow[]
  count: number
  limit: number
  offset: number
}

export type SessionsFilters = {
  converted?: "true" | "false"
  device?: string
  utm_source?: string
  country?: string
  limit?: number
  offset?: number
}

export function useSessionsList(range: Range, filters: SessionsFilters = {}) {
  return useQuery<SessionsListResponse>({
    queryKey: ["sessions-list", range.from.toISOString(), range.to.toISOString(), filters],
    queryFn: async () => {
      const extra: Record<string, string> = {}
      if (filters.converted) extra.converted = filters.converted
      if (filters.device) extra.device = filters.device
      if (filters.utm_source) extra.utm_source = filters.utm_source
      if (filters.country) extra.country = filters.country
      if (filters.limit !== undefined) extra.limit = String(filters.limit)
      if (filters.offset !== undefined) extra.offset = String(filters.offset)
      const res = await fetch(`/api/events-proxy/stats/sessions?${buildQS(range, extra)}`)
      if (!res.ok) throw new Error("Error al cargar sesiones")
      return res.json()
    },
  })
}

export type JourneyResponse = {
  session: SessionRow & Record<string, unknown>
  pageviews: Array<{
    _id: string
    path: string
    entered_at: string
    exited_at: string | null
    duration_ms: number | null
    scroll_depth_max: number
    click_count: number
    page_type: string | null
  }>
  events: Array<{
    _id: string
    event: string
    timestamp: string
    data: Record<string, unknown>
    source: string
  }>
  journey: Array<
    | {
        kind: "pageview"
        ts: string
        path: string
        duration_ms: number | null
        scroll_depth_max: number
        click_count: number
        page_type: string | null
        exited_at: string | null
      }
    | {
        kind: "event"
        ts: string
        event: string
        path: string | null
        data: Record<string, unknown>
      }
  >
}

export function useSessionJourney(sessionId: string | null) {
  return useQuery<JourneyResponse>({
    queryKey: ["session-journey", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/sessions/${encodeURIComponent(sessionId!)}`)
      if (!res.ok) throw new Error("Error al cargar journey")
      return res.json()
    },
    enabled: Boolean(sessionId),
  })
}

export type LiveResponse = {
  sessions: Array<{
    session_id: string
    customer_id: string | null
    customer_group: string
    last_seen_at: string
    country: string | null
    device_type: string | null
    current_path: string | null
    total_pageviews: number
  }>
  count: number
}

export function useLiveSessions() {
  return useQuery<LiveResponse>({
    queryKey: ["live-sessions"],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/live`)
      if (!res.ok) throw new Error("Error al cargar live")
      return res.json()
    },
    refetchInterval: 10_000,
  })
}

export type UtmResponse = {
  utm: Array<{ source: string; medium: string; campaign: string; sessions: number; converted: number; revenue: number }>
}

export function useUtmBreakdown(range: Range) {
  return useQuery<UtmResponse>({
    queryKey: ["utm-breakdown", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/utm-breakdown?${buildQS(range)}`)
      if (!res.ok) throw new Error("Error al cargar UTM")
      return res.json()
    },
  })
}

export type DevicesResponse = {
  devices: Array<{ device_type: string; os: string; browser: string; sessions: number }>
}

export function useDevicesBreakdown(range: Range) {
  return useQuery<DevicesResponse>({
    queryKey: ["devices-breakdown", range.from.toISOString(), range.to.toISOString()],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/devices?${buildQS(range)}`)
      if (!res.ok) throw new Error("Error al cargar devices")
      return res.json()
    },
  })
}

export type TopPagesResponse = {
  pages: Array<{
    path: string
    page_type: string | null
    views: number
    avg_duration_ms: number
    avg_scroll_depth: number
    avg_clicks: number
    bounce_rate: number
    conversion_rate: number
  }>
}

export function useTopPagesWithDuration(range: Range, limit = 20) {
  return useQuery<TopPagesResponse>({
    queryKey: ["top-pages-duration", range.from.toISOString(), range.to.toISOString(), limit],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/top-pages?${buildQS(range, { limit: String(limit) })}`)
      if (!res.ok) throw new Error("Error al cargar páginas")
      return res.json()
    },
  })
}

export type LandingPagesResponse = {
  pages: Array<{
    path: string
    sessions: number
    bounce_rate: number
    conversion_rate: number
    revenue: number
    avg_duration_ms: number
    avg_pageviews: number
  }>
}

export function useLandingPages(range: Range, limit = 20) {
  return useQuery<LandingPagesResponse>({
    queryKey: ["landing-pages", range.from.toISOString(), range.to.toISOString(), limit],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/landing-pages?${buildQS(range, { limit: String(limit) })}`)
      if (!res.ok) throw new Error("Error al cargar landing pages")
      return res.json()
    },
  })
}

export type ExitPagesResponse = {
  pages: Array<{
    path: string
    views: number
    exits: number
    exit_rate: number
    exits_bounce: number
    exits_converted: number
    abandonment_rate: number
    avg_duration_before_exit: number
    avg_scroll: number
  }>
}

export function useExitPages(range: Range, limit = 20) {
  return useQuery<ExitPagesResponse>({
    queryKey: ["exit-pages", range.from.toISOString(), range.to.toISOString(), limit],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/exit-pages?${buildQS(range, { limit: String(limit) })}`)
      if (!res.ok) throw new Error("Error al cargar exit pages")
      return res.json()
    },
  })
}

export type BouncePagesResponse = {
  pages: Array<{
    path: string
    sessions: number
    bounces: number
    bounce_rate: number
    avg_duration_ms: number
  }>
}

export function useBouncePages(range: Range, limit = 20) {
  return useQuery<BouncePagesResponse>({
    queryKey: ["bounce-pages", range.from.toISOString(), range.to.toISOString(), limit],
    queryFn: async () => {
      const res = await fetch(`/api/events-proxy/stats/bounce-pages?${buildQS(range, { limit: String(limit) })}`)
      if (!res.ok) throw new Error("Error al cargar bounce pages")
      return res.json()
    },
  })
}
