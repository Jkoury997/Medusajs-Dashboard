import { NextRequest, NextResponse } from "next/server"

// Backend marcela-koury-email-marketing (templates, campañas IA, carritos
// abandonados, campañas manuales, contactos). Auth por header X-API-Key.
const EMAIL_API_URL = process.env.EMAIL_MARKETING_API_URL || "http://localhost:5000"
const EMAIL_API_KEY = process.env.EMAIL_MARKETING_API_KEY || ""

const TIMEOUT_MS = 15_000

function assertApiKey() {
  if (!EMAIL_API_KEY) {
    console.warn("[email-proxy] EMAIL_MARKETING_API_KEY no está configurada")
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Devuelve la respuesta tal cual: JSON o HTML/imagen (para previews en iframe). */
async function passthrough(response: Response): Promise<NextResponse> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Error desconocido" }))
    return NextResponse.json(error, { status: response.status })
  }
  const contentType = response.headers.get("content-type") || ""
  if (contentType.startsWith("image/") || contentType.startsWith("text/html")) {
    const buffer = await response.arrayBuffer()
    return new NextResponse(buffer, { status: 200, headers: { "Content-Type": contentType } })
  }
  const data = await response.json()
  return NextResponse.json(data)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  assertApiKey()
  try {
    const { path } = await params
    const apiPath = path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${EMAIL_API_URL}/api/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const response = await fetchWithTimeout(url, {
      headers: { "X-API-Key": EMAIL_API_KEY, "Content-Type": "application/json" },
      next: { revalidate: 30 },
    })
    return passthrough(response)
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && error.name === "AbortError"
    const message = error instanceof Error ? error.message : "Error al consultar email-marketing"
    console.error("Email proxy error:", message)
    return NextResponse.json(
      { error: isTimeout ? "Email backend timeout (15s)" : message },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  assertApiKey()
  try {
    const { path } = await params
    const apiPath = path.join("/")
    const url = `${EMAIL_API_URL}/api/${apiPath}`

    let body: string | undefined
    try {
      body = JSON.stringify(await request.json())
    } catch {
      /* sin body */
    }

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: { "X-API-Key": EMAIL_API_KEY, "Content-Type": "application/json" },
      body,
      cache: "no-store",
    })
    return passthrough(response)
  } catch (error: unknown) {
    const isTimeout = error instanceof Error && error.name === "AbortError"
    const message = error instanceof Error ? error.message : "Error al consultar email-marketing"
    console.error("Email proxy POST error:", message)
    return NextResponse.json(
      { error: isTimeout ? "Email backend timeout (15s)" : message },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
