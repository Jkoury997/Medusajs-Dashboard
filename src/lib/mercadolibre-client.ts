/**
 * MercadoLibre API Client
 *
 * Handles OAuth 2.0 flow, token management, and API calls.
 * Tokens are stored in a local JSON file (gitignored).
 *
 * Required env vars:
 *   MERCADOLIBRE_APP_ID       - App ID from ML Developers
 *   MERCADOLIBRE_CLIENT_SECRET - Client secret from ML Developers
 *   MERCADOLIBRE_REDIRECT_URI  - OAuth callback URL (e.g. http://localhost:3000/api/mercadolibre/callback)
 */

import fs from "fs"
import path from "path"

// ============================================================
// CONFIG
// ============================================================

const ML_AUTH_URL = "https://auth.mercadolibre.com.ar/authorization"
const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
const ML_API_BASE = "https://api.mercadolibre.com"

const TOKEN_FILE = path.join(process.cwd(), ".mercadolibre-tokens.json")

export function getConfig() {
  return {
    appId: process.env.MERCADOLIBRE_APP_ID || "",
    clientSecret: process.env.MERCADOLIBRE_CLIENT_SECRET || "",
    redirectUri:
      process.env.MERCADOLIBRE_REDIRECT_URI ||
      "http://localhost:3000/api/mercadolibre/callback",
  }
}

// ============================================================
// TOKEN STORAGE (file-based)
// ============================================================

export interface MLTokens {
  access_token: string
  refresh_token: string
  user_id: number
  expires_at: number // Unix timestamp (ms)
  seller_nickname?: string
}

export function loadTokens(): MLTokens | null {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null
    const raw = fs.readFileSync(TOKEN_FILE, "utf-8")
    return JSON.parse(raw) as MLTokens
  } catch {
    return null
  }
}

export function saveTokens(tokens: MLTokens): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8")
}

export function clearTokens(): void {
  try {
    if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE)
  } catch {}
}

export function isTokenExpired(tokens: MLTokens): boolean {
  // Consider expired 5 minutes before actual expiry
  return Date.now() > tokens.expires_at - 5 * 60 * 1000
}

// ============================================================
// OAUTH FLOW
// ============================================================

/**
 * Generate the URL to redirect the user for ML authorization.
 */
export function getAuthorizationUrl(): string {
  const { appId, redirectUri } = getConfig()
  const params = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: redirectUri,
  })
  return `${ML_AUTH_URL}?${params}`
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<MLTokens> {
  const { appId, clientSecret, redirectUri } = getConfig()

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: appId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ML token exchange failed: ${err.message || err.error || res.statusText}`)
  }

  const data = await res.json()

  const tokens: MLTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
    expires_at: Date.now() + data.expires_in * 1000,
  }

  // Fetch seller info
  try {
    const userInfo = await mlApiFetch(`/users/${tokens.user_id}`, tokens.access_token)
    tokens.seller_nickname = userInfo.nickname
  } catch {}

  saveTokens(tokens)
  return tokens
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(tokens: MLTokens): Promise<MLTokens> {
  const { appId, clientSecret } = getConfig()

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: appId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ML token refresh failed: ${err.message || err.error || res.statusText}`)
  }

  const data = await res.json()

  const newTokens: MLTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user_id || tokens.user_id,
    expires_at: Date.now() + data.expires_in * 1000,
    seller_nickname: tokens.seller_nickname,
  }

  saveTokens(newTokens)
  return newTokens
}

/**
 * Get a valid access token, refreshing if necessary.
 * Returns null if not connected.
 */
export async function getValidToken(): Promise<string | null> {
  let tokens = loadTokens()
  if (!tokens) return null

  if (isTokenExpired(tokens)) {
    try {
      tokens = await refreshAccessToken(tokens)
    } catch (err) {
      console.error("[ML] Failed to refresh token:", err)
      clearTokens()
      return null
    }
  }

  return tokens.access_token
}

// ============================================================
// API HELPERS
// ============================================================

async function mlApiFetch(endpoint: string, accessToken: string): Promise<any> {
  const url = endpoint.startsWith("http") ? endpoint : `${ML_API_BASE}${endpoint}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`ML API ${endpoint}: ${err.message || res.statusText}`)
  }

  return res.json()
}

/**
 * Make an authenticated ML API call, auto-refreshing token if needed.
 */
export async function mlApi(endpoint: string): Promise<any> {
  const token = await getValidToken()
  if (!token) throw new Error("MercadoLibre no conectado")
  return mlApiFetch(endpoint, token)
}

// ============================================================
// DATA FETCHERS
// ============================================================

/**
 * Get seller profile info.
 */
export async function getSellerInfo() {
  const tokens = loadTokens()
  if (!tokens) throw new Error("MercadoLibre no conectado")
  return mlApi(`/users/${tokens.user_id}`)
}

/**
 * Get orders for a date range.
 * ML API returns paginated results, we fetch all pages.
 */
export async function getOrders(dateFrom: string, dateTo: string) {
  const tokens = loadTokens()
  if (!tokens) throw new Error("MercadoLibre no conectado")

  const sellerId = tokens.user_id
  const allOrders: any[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const params = new URLSearchParams({
      "seller": String(sellerId),
      "order.date_created.from": `${dateFrom}T00:00:00.000-03:00`,
      "order.date_created.to": `${dateTo}T23:59:59.999-03:00`,
      "sort": "date_desc",
      "limit": String(limit),
      "offset": String(offset),
    })

    const data = await mlApi(`/orders/search?${params}`)
    allOrders.push(...(data.results || []))

    if (offset + limit >= (data.paging?.total || 0)) break
    offset += limit

    // Safety: max 10 pages (500 orders)
    if (offset >= 500) break
  }

  return allOrders
}

/**
 * Get overview metrics for a date range.
 */
export async function getOverviewMetrics(dateFrom: string, dateTo: string) {
  const orders = await getOrders(dateFrom, dateTo)

  const paid = orders.filter((o: any) => o.status === "paid")
  const cancelled = orders.filter((o: any) => o.status === "cancelled")
  const pending = orders.filter((o: any) => !["paid", "cancelled"].includes(o.status))

  const totalRevenue = paid.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0)
  const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0

  // Unique buyers
  const buyerIds = new Set(paid.map((o: any) => o.buyer?.id).filter(Boolean))

  // Top products
  const productMap: Record<string, { title: string; quantity: number; revenue: number }> = {}
  for (const order of paid) {
    for (const item of order.order_items || []) {
      const key = item.item?.id || item.item?.title || "unknown"
      if (!productMap[key]) {
        productMap[key] = { title: item.item?.title || key, quantity: 0, revenue: 0 }
      }
      productMap[key].quantity += item.quantity || 1
      productMap[key].revenue += (item.unit_price || 0) * (item.quantity || 1)
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  // Revenue by day
  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  for (const order of paid) {
    const day = order.date_created?.split("T")[0] || "unknown"
    if (!revenueByDay[day]) revenueByDay[day] = { revenue: 0, orders: 0 }
    revenueByDay[day].revenue += order.total_amount || 0
    revenueByDay[day].orders++
  }

  // Shipping status breakdown
  const shippingStatus: Record<string, number> = {}
  for (const order of paid) {
    const shipStatus = order.shipping?.status || "unknown"
    shippingStatus[shipStatus] = (shippingStatus[shipStatus] || 0) + 1
  }

  return {
    total_orders: orders.length,
    paid_orders: paid.length,
    pending_orders: pending.length,
    cancelled_orders: cancelled.length,
    total_revenue: totalRevenue,
    avg_ticket: Math.round(avgTicket),
    unique_buyers: buyerIds.size,
    top_products: topProducts,
    revenue_by_day: revenueByDay,
    shipping_status: shippingStatus,
    currency: "ARS",
  }
}

/**
 * Get active listings count.
 */
export async function getActiveListings() {
  const tokens = loadTokens()
  if (!tokens) throw new Error("MercadoLibre no conectado")

  const data = await mlApi(`/users/${tokens.user_id}/items/search?status=active&limit=0`)
  return {
    total_active: data.paging?.total || 0,
  }
}

/**
 * Get unanswered questions count.
 */
export async function getUnansweredQuestions() {
  const tokens = loadTokens()
  if (!tokens) throw new Error("MercadoLibre no conectado")

  const data = await mlApi(`/my/received_questions/search?status=UNANSWERED&seller_id=${tokens.user_id}`)
  return {
    unanswered: data.total || 0,
  }
}

/**
 * Get seller reputation.
 */
export async function getSellerReputation() {
  const tokens = loadTokens()
  if (!tokens) throw new Error("MercadoLibre no conectado")

  const user = await mlApi(`/users/${tokens.user_id}`)
  const rep = user.seller_reputation || {}

  return {
    level_id: rep.level_id || "unknown",
    power_seller_status: rep.power_seller_status || null,
    transactions_completed: rep.transactions?.completed || 0,
    transactions_canceled: rep.transactions?.canceled || 0,
    ratings_positive: rep.transactions?.ratings?.positive || 0,
    ratings_neutral: rep.transactions?.ratings?.neutral || 0,
    ratings_negative: rep.transactions?.ratings?.negative || 0,
    metrics: rep.metrics || {},
  }
}
