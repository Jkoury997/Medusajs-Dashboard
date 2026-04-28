"use client"

import { useQuery } from "@tanstack/react-query"
import type {
  EventStats,
  FunnelStats,
  ProductStats,
  SearchStats,
  EventsList,
  EventFilters,
  HeatmapStats,
  ScrollDepthStats,
  ProductVisibilityStats,
  InspireStats,
  CheckoutFunnelStats,
  CartAbandonmentStats,
  SearchQualityStats,
  CustomerCohortsStats,
  AIScoreResponse,
  HotLeadsResponse,
  PriceSuggestionsResponse,
  AIROISummary,
  AIROIBySegment,
  AIDiscountHistoryResponse,
  PriceAnalysisFull,
} from "@/types/events"
import { eventsGet } from "@/lib/events-skills-client"

function formatDateParam(date: Date): string {
  return date.toISOString().split("T")[0]
}

// El backend filtra con timestamp < to, así que sumamos 1 día para incluir el día completo
function formatToParam(date: Date): string {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  return next.toISOString().split("T")[0]
}

export function useEventStats(from: Date, to: Date, pageUrl?: string) {
  return useQuery({
    queryKey: ["events", "stats", from.toISOString(), to.toISOString(), pageUrl || ""],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      if (pageUrl) params.set("page_url", pageUrl)
      const res = await fetch(`/api/events-proxy/stats?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de eventos")
      return res.json() as Promise<EventStats>
    },
    enabled: pageUrl !== undefined ? !!pageUrl : true,
  })
}

export function useEventFunnel(from: Date, to: Date, pageUrl?: string) {
  return useQuery({
    queryKey: ["events", "funnel", from.toISOString(), to.toISOString(), pageUrl || ""],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      if (pageUrl) params.set("page_url", pageUrl)
      const res = await fetch(`/api/events-proxy/stats/funnel?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener funnel de conversión")
      return res.json() as Promise<FunnelStats>
    },
    enabled: pageUrl !== undefined ? !!pageUrl : true,
  })
}

export function useEventProducts(from: Date, to: Date, limit: number = 20, pageUrl?: string) {
  return useQuery({
    queryKey: ["events", "products", from.toISOString(), to.toISOString(), limit, pageUrl || ""],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
        limit: String(limit),
      })
      if (pageUrl) params.set("page_url", pageUrl)
      const res = await fetch(`/api/events-proxy/stats/products?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de productos")
      return res.json() as Promise<ProductStats>
    },
    enabled: pageUrl !== undefined ? !!pageUrl : true,
  })
}

export function useEventSearch(from: Date, to: Date, limit: number = 20, pageUrl?: string) {
  return useQuery({
    queryKey: ["events", "search", from.toISOString(), to.toISOString(), limit, pageUrl || ""],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
        limit: String(limit),
      })
      if (pageUrl) params.set("page_url", pageUrl)
      const res = await fetch(`/api/events-proxy/stats/search?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de búsquedas")
      return res.json() as Promise<SearchStats>
    },
    enabled: pageUrl !== undefined ? !!pageUrl : true,
  })
}

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ["events", "list", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.event) params.set("event", filters.event)
      if (filters.from) params.set("from", filters.from)
      if (filters.to) params.set("to", filters.to)
      if (filters.customer_id) params.set("customer_id", filters.customer_id)
      if (filters.session_id) params.set("session_id", filters.session_id)
      if (filters.source) params.set("source", filters.source)
      if (filters.limit) params.set("limit", String(filters.limit))
      if (filters.offset) params.set("offset", String(filters.offset))
      if (filters.sort) params.set("sort", filters.sort)

      const res = await fetch(`/api/events-proxy/events?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener eventos")
      return res.json() as Promise<EventsList>
    },
  })
}

export function useHeatmap(pageUrl: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ["events", "heatmap", pageUrl, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        page_url: pageUrl,
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      const res = await fetch(`/api/events-proxy/stats/heatmap?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener datos de heatmap")
      return res.json() as Promise<HeatmapStats>
    },
    enabled: !!pageUrl,
  })
}

export function useScrollDepth(pageUrl: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ["events", "scroll-depth", pageUrl, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        page_url: pageUrl,
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      const res = await fetch(`/api/events-proxy/stats/scroll-depth?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener datos de scroll")
      return res.json() as Promise<ScrollDepthStats>
    },
    enabled: !!pageUrl,
  })
}

export function useProductVisibility(pageUrl: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ["events", "product-visibility", pageUrl, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        page_url: pageUrl,
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      const res = await fetch(`/api/events-proxy/stats/product-visibility?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener datos de visibilidad de productos")
      return res.json() as Promise<ProductVisibilityStats>
    },
    enabled: !!pageUrl,
  })
}

/**
 * Construye la URL del reporte visual de heatmap (HTML).
 * No necesita React Query porque es un iframe que carga solo.
 */
export function buildHeatmapHtmlUrl(pageUrl: string, from: Date, to: Date): string | null {
  if (!pageUrl) return null
  const params = new URLSearchParams({
    page_url: pageUrl,
    from: formatDateParam(from),
    to: formatToParam(to),
  })
  return `/api/events-proxy/stats/heatmap-image?${params.toString()}`
}

export function useInspireStats(from: Date, to: Date, limit: number = 30) {
  return useQuery({
    queryKey: ["events", "inspire", from.toISOString(), to.toISOString(), limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
        limit: String(limit),
      })
      const res = await fetch(`/api/events-proxy/stats/inspire?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de Inspirate")
      return res.json() as Promise<InspireStats>
    },
  })
}

export function useCheckoutFunnel(from: Date, to: Date) {
  return useQuery({
    queryKey: ["events", "checkout-funnel", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      const res = await fetch(`/api/events-proxy/stats/checkout-funnel?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener funnel de checkout")
      return res.json() as Promise<CheckoutFunnelStats>
    },
  })
}

export function useCartAbandonment(from: Date, to: Date) {
  return useQuery({
    queryKey: ["events", "cart-abandonment", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      const res = await fetch(`/api/events-proxy/stats/cart-abandonment?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener estadísticas de abandono")
      return res.json() as Promise<CartAbandonmentStats>
    },
  })
}

export function useSearchQuality(from: Date, to: Date, limit: number = 30) {
  return useQuery({
    queryKey: ["events", "search-quality", from.toISOString(), to.toISOString(), limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
        limit: String(limit),
      })
      const res = await fetch(`/api/events-proxy/stats/search-quality?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener calidad de búsqueda")
      return res.json() as Promise<SearchQualityStats>
    },
  })
}

export function useCustomerCohorts(from: Date, to: Date) {
  return useQuery({
    queryKey: ["events", "customer-cohorts", from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: formatDateParam(from),
        to: formatToParam(to),
      })
      const res = await fetch(`/api/events-proxy/stats/customer-cohorts?${params.toString()}`)
      if (!res.ok) throw new Error("Error al obtener cohortes de clientes")
      return res.json() as Promise<CustomerCohortsStats>
    },
  })
}

// ============================================================
// AI Pricing & Discounts
// ============================================================

export function useAIScore(customerId: string | null) {
  return useQuery({
    queryKey: ["ai", "score", customerId],
    queryFn: () => eventsGet<AIScoreResponse>(`ai/score/${customerId}`),
    enabled: !!customerId,
  })
}

export function useAIHotLeads(limit: number = 50) {
  return useQuery({
    queryKey: ["ai", "hot-leads", limit],
    queryFn: () => eventsGet<HotLeadsResponse>("ai/intent/hot-leads", { limit }),
    refetchInterval: 60_000,
  })
}

export function useAIPriceSuggestions(limit: number = 20) {
  return useQuery({
    queryKey: ["ai", "price-suggestions", limit],
    queryFn: () =>
      eventsGet<PriceSuggestionsResponse>("ai/price/suggestions", { limit }),
  })
}

export function useAIROISummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ["ai", "roi-summary", from, to],
    queryFn: () => eventsGet<AIROISummary>("ai/roi/summary", { from, to }),
  })
}

export function useAIROIBySegment(from?: string, to?: string) {
  return useQuery({
    queryKey: ["ai", "roi-by-segment", from, to],
    queryFn: () => eventsGet<AIROIBySegment>("ai/roi/by-segment", { from, to }),
  })
}

export function useAIDiscountHistory(customerId: string | null, limit: number = 20) {
  return useQuery({
    queryKey: ["ai", "discount-history", customerId, limit],
    queryFn: () =>
      eventsGet<AIDiscountHistoryResponse>(`ai/discount/history/${customerId}`, { limit }),
    enabled: !!customerId,
  })
}

export function useAIPriceAnalysis(productId: string | null) {
  return useQuery({
    queryKey: ["ai", "price-analysis", productId],
    queryFn: () => eventsGet<PriceAnalysisFull>(`ai/price/${productId}`),
    enabled: !!productId,
  })
}
