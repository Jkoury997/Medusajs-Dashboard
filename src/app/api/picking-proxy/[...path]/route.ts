import { NextRequest, NextResponse } from "next/server"

const PICKING_API_URL = process.env.PICKING_API_URL || "http://localhost:6000"
// STATS_API_KEY del pickup-system: autoriza SOLO lecturas (GET).
const PICKING_API_KEY = process.env.PICKING_API_KEY || ""
// ADMIN_PIN del pickup-system: habilita las mutaciones (POST/PUT/DELETE) y la
// lectura de datos sensibles (PINs de usuarios) iniciando sesión como admin.
const PICKING_ADMIN_PIN = process.env.PICKING_ADMIN_PIN || ""

// Métodos que llevan body hacia el pickup-system (incluye DELETE: api-keys
// recibe el id en el body).
const BODY_METHODS = ["POST", "PUT", "PATCH", "DELETE"]

// ============================================================
// SESIÓN ADMIN (cacheada — dura ~12h en el pickup-system)
// ============================================================

let cachedSession: { token: string; expiresAt: number } | null = null
let loginInFlight: Promise<string | null> | null = null

/** Decodifica el expiry embebido en el token (userId:role:expires:sig). */
function parseTokenExpiry(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64").toString()
    const exp = parseInt(decoded.split(":")[2], 10)
    return Number.isFinite(exp) ? exp : null
  } catch {
    return null
  }
}

/** Hace login admin en el pickup-system y devuelve el token de sesión. */
async function loginAdmin(): Promise<string | null> {
  if (!PICKING_ADMIN_PIN) return null
  try {
    const res = await fetch(`${PICKING_API_URL}/api/picking/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: PICKING_ADMIN_PIN }),
    })
    if (!res.ok) {
      console.error("Picking proxy: login admin falló", res.status)
      return null
    }
    const setCookie =
      (typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie().join("; ")
        : res.headers.get("set-cookie")) || ""
    const match = setCookie.match(/picking-session=([^;]+)/)
    return match ? decodeURIComponent(match[1]) : null
  } catch (error) {
    console.error("Picking proxy: error en login admin", error)
    return null
  }
}

/** Devuelve un token admin válido (cacheado), o null si no hay PIN configurado. */
async function getAdminToken(force = false): Promise<string | null> {
  if (!PICKING_ADMIN_PIN) return null
  if (force) cachedSession = null
  // 1 min de margen antes de la expiración real
  if (cachedSession && cachedSession.expiresAt - 60_000 > Date.now()) {
    return cachedSession.token
  }
  if (!loginInFlight) {
    loginInFlight = (async () => {
      const token = await loginAdmin()
      if (token) {
        cachedSession = {
          token,
          expiresAt: parseTokenExpiry(token) ?? Date.now() + 11 * 60 * 60 * 1000,
        }
      }
      return token
    })().finally(() => {
      loginInFlight = null
    })
  }
  return loginInFlight
}

// ============================================================
// PROXY
// ============================================================

function buildHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "x-publishable-api-key": PICKING_API_KEY,
    "Content-Type": "application/json",
  }
  // La cookie admin autoriza mutaciones y revela datos sensibles en GET.
  if (token) headers["Cookie"] = `picking-session=${token}`
  return headers
}

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params
    const apiPath = path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${PICKING_API_URL}/api/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    // Leer el body una sola vez (reutilizable en el reintento por 401).
    let body: string | undefined
    if (BODY_METHODS.includes(method)) {
      try {
        body = JSON.stringify(await request.json())
      } catch {
        // Sin body — válido para endpoints de acción.
      }
    }

    const isMutation = method !== "GET" && method !== "HEAD"

    const doFetch = (token: string | null) => {
      const fetchOptions: RequestInit = { method, headers: buildHeaders(token) }
      if (body !== undefined) fetchOptions.body = body
      return fetch(url, fetchOptions)
    }

    let token = await getAdminToken()
    let response = await doFetch(token)

    // Si una mutación falla por sesión vencida/expulsada, re-login una vez.
    if (isMutation && (response.status === 401 || response.status === 403) && PICKING_ADMIN_PIN) {
      token = await getAdminToken(true)
      if (token) response = await doFetch(token)
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Error desconocido" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Picking proxy error:", error)
    const message = error instanceof Error ? error.message : "Error al consultar API de picking"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "GET")
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "POST")
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "PUT")
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "DELETE")
}
