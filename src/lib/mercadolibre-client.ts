/**
 * MercadoLibre API Client
 *
 * Handles OAuth 2.0 + PKCE flow, token management, and API calls.
 * Tokens are stored via encrypted cookies (compatible with Vercel serverless).
 *
 * Required env vars:
 *   MERCADOLIBRE_APP_ID        - App ID from ML Developers
 *   MERCADOLIBRE_CLIENT_SECRET  - Client secret from ML Developers
 *   MERCADOLIBRE_REDIRECT_URI   - OAuth callback URL
 *   ML_COOKIE_SECRET            - 32+ char secret for encrypting token cookie
 */

import crypto from "crypto"

// ============================================================
// CONFIG
// ============================================================

const ML_AUTH_URL = "https://auth.mercadolibre.com.ar/authorization"
const ML_TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
const ML_API_BASE = "https://api.mercadolibre.com"

export const ML_TOKEN_COOKIE = "ml_tokens"
export const ML_PKCE_COOKIE = "ml_pkce_verifier"

export function getConfig() {
  return {
    appId: process.env.MERCADOLIBRE_APP_ID || "",
    clientSecret: process.env.MERCADOLIBRE_CLIENT_SECRET || "",
    redirectUri:
      process.env.MERCADOLIBRE_REDIRECT_URI ||
      "https://medusajs-dashboard.vercel.app/api/mercadolibre/callback",
    cookieSecret:
      process.env.ML_COOKIE_SECRET || "default-dev-secret-change-me-in-prod!!",
  }
}

// ============================================================
// PKCE HELPERS
// ============================================================

/**
 * Generate a random code_verifier (43-128 chars, URL-safe).
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url")
}

/**
 * Derive code_challenge from code_verifier using S256.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url")
}

// ============================================================
// COOKIE ENCRYPTION (AES-256-GCM)
// ============================================================

function getEncryptionKey(): Buffer {
  const secret = getConfig().cookieSecret
  return crypto.createHash("sha256").update(secret).digest()
}

export function encryptTokens(data: MLTokens): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const json = JSON.stringify(data)
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:encrypted (all base64url)
  return `${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`
}

export function decryptTokens(cookieValue: string): MLTokens | null {
  try {
    const key = getEncryptionKey()
    const [ivB64, tagB64, encB64] = cookieValue.split(":")
    const iv = Buffer.from(ivB64, "base64url")
    const tag = Buffer.from(tagB64, "base64url")
    const encrypted = Buffer.from(encB64, "base64url")
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return JSON.parse(decrypted.toString("utf8")) as MLTokens
  } catch {
    return null
  }
}

// ============================================================
// TOKEN TYPES
// ============================================================

export interface MLTokens {
  access_token: string
  refresh_token: string
  user_id: number
  expires_at: number // Unix timestamp (ms)
  seller_nickname?: string
}

export function isTokenExpired(tokens: MLTokens): boolean {
  return Date.now() > tokens.expires_at - 5 * 60 * 1000
}

// ============================================================
// OAUTH FLOW (with PKCE)
// ============================================================

/**
 * Generate the authorization URL + code_verifier for PKCE.
 * The caller must store code_verifier in a cookie for the callback.
 */
export function getAuthorizationUrlWithPKCE(): {
  url: string
  codeVerifier: string
} {
  const { appId, redirectUri } = getConfig()
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  })

  return {
    url: `${ML_AUTH_URL}?${params}`,
    codeVerifier,
  }
}

/**
 * Exchange an authorization code for tokens (with PKCE code_verifier).
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<MLTokens> {
  const { appId, clientSecret, redirectUri } = getConfig()

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: appId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `ML token exchange failed: ${err.message || err.error || res.statusText}`
    )
  }

  const data = await res.json()

  const tokens: MLTokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user_id,
    expires_at: Date.now() + data.expires_in * 1000,
  }

  // Fetch seller nickname
  try {
    const userInfo = await mlApiFetch(
      `/users/${tokens.user_id}`,
      tokens.access_token
    )
    tokens.seller_nickname = userInfo.nickname
  } catch {}

  return tokens
}

/**
 * Refresh an expired access token.
 */
export async function refreshAccessToken(
  tokens: MLTokens
): Promise<MLTokens> {
  const { appId, clientSecret } = getConfig()

  const res = await fetch(ML_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: appId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(
      `ML token refresh failed: ${err.message || err.error || res.statusText}`
    )
  }

  const data = await res.json()

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    user_id: data.user_id || tokens.user_id,
    expires_at: Date.now() + data.expires_in * 1000,
    seller_nickname: tokens.seller_nickname,
  }
}

/**
 * Get a valid access token from cookie value, refreshing if needed.
 * Returns { token, newTokens } — newTokens is set if a refresh happened
 * (caller should update the cookie).
 */
export async function getValidTokenFromCookie(
  cookieValue: string | undefined
): Promise<{
  token: string | null
  tokens: MLTokens | null
  refreshed: boolean
}> {
  if (!cookieValue) return { token: null, tokens: null, refreshed: false }

  let tokens = decryptTokens(cookieValue)
  if (!tokens) return { token: null, tokens: null, refreshed: false }

  if (isTokenExpired(tokens)) {
    try {
      tokens = await refreshAccessToken(tokens)
      return { token: tokens.access_token, tokens, refreshed: true }
    } catch (err) {
      console.error("[ML] Failed to refresh token:", err)
      return { token: null, tokens: null, refreshed: false }
    }
  }

  return { token: tokens.access_token, tokens, refreshed: false }
}

// ============================================================
// API HELPERS
// ============================================================

async function mlApiFetch(
  endpoint: string,
  accessToken: string
): Promise<any> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${ML_API_BASE}${endpoint}`
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
 * Make an authenticated ML API call using a pre-validated access token.
 */
export async function mlApi(
  endpoint: string,
  accessToken: string
): Promise<any> {
  return mlApiFetch(endpoint, accessToken)
}

// ============================================================
// DATA FETCHERS (all require accessToken + userId)
// ============================================================

export async function getSellerInfo(accessToken: string, userId: number) {
  return mlApi(`/users/${userId}`, accessToken)
}

export async function getOrders(
  accessToken: string,
  userId: number,
  dateFrom: string,
  dateTo: string
) {
  const allOrders: any[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const params = new URLSearchParams({
      seller: String(userId),
      "order.date_created.from": `${dateFrom}T00:00:00.000-03:00`,
      "order.date_created.to": `${dateTo}T23:59:59.999-03:00`,
      sort: "date_desc",
      limit: String(limit),
      offset: String(offset),
    })

    const data = await mlApi(`/orders/search?${params}`, accessToken)
    allOrders.push(...(data.results || []))

    if (offset + limit >= (data.paging?.total || 0)) break
    offset += limit
    if (offset >= 500) break
  }

  return allOrders
}

export async function getOverviewMetrics(
  accessToken: string,
  userId: number,
  dateFrom: string,
  dateTo: string
) {
  const orders = await getOrders(accessToken, userId, dateFrom, dateTo)

  const paid = orders.filter((o: any) => o.status === "paid")
  const cancelled = orders.filter((o: any) => o.status === "cancelled")
  const pending = orders.filter(
    (o: any) => !["paid", "cancelled"].includes(o.status)
  )

  const totalRevenue = paid.reduce(
    (sum: number, o: any) => sum + (o.total_amount || 0),
    0
  )
  const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0
  const buyerIds = new Set(
    paid.map((o: any) => o.buyer?.id).filter(Boolean)
  )

  const productMap: Record<
    string,
    { title: string; quantity: number; revenue: number }
  > = {}
  for (const order of paid) {
    for (const item of order.order_items || []) {
      const key = item.item?.id || item.item?.title || "unknown"
      if (!productMap[key]) {
        productMap[key] = {
          title: item.item?.title || key,
          quantity: 0,
          revenue: 0,
        }
      }
      productMap[key].quantity += item.quantity || 1
      productMap[key].revenue += (item.unit_price || 0) * (item.quantity || 1)
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  for (const order of paid) {
    const day = order.date_created?.split("T")[0] || "unknown"
    if (!revenueByDay[day]) revenueByDay[day] = { revenue: 0, orders: 0 }
    revenueByDay[day].revenue += order.total_amount || 0
    revenueByDay[day].orders++
  }

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

export async function getActiveListings(
  accessToken: string,
  userId: number
) {
  const data = await mlApi(
    `/users/${userId}/items/search?status=active&limit=0`,
    accessToken
  )
  return { total_active: data.paging?.total || 0 }
}

export async function getUnansweredQuestions(
  accessToken: string,
  userId: number
) {
  const data = await mlApi(
    `/my/received_questions/search?status=UNANSWERED&seller_id=${userId}`,
    accessToken
  )
  return { unanswered: data.total || 0 }
}

export async function getSellerReputation(
  accessToken: string,
  userId: number
) {
  const user = await mlApi(`/users/${userId}`, accessToken)
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
