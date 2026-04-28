import { NextRequest, NextResponse } from "next/server"

const EVENTS_API_URL = process.env.EVENTS_API_URL || "http://localhost:4000"
const EVENTS_API_KEY = process.env.EVENTS_API_KEY || ""

const TIMEOUT_MS = 10_000

function assertApiKey() {
  if (!EVENTS_API_KEY) {
    console.warn("[events-proxy] EVENTS_API_KEY no está configurada")
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  assertApiKey()
  try {
    const { path } = await params
    const apiPath = path.join("/")

    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${EVENTS_API_URL}/api/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const response = await fetchWithTimeout(url, {
      headers: {
        "X-API-Key": EVENTS_API_KEY,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(error, { status: response.status })
    }

    const contentType = response.headers.get("content-type") || ""
    if (contentType.startsWith("image/") || contentType.startsWith("text/html")) {
      const buffer = await response.arrayBuffer()
      return new NextResponse(buffer, {
        status: 200,
        headers: { "Content-Type": contentType },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch events data"
    const isTimeout = error instanceof Error && error.name === "AbortError"
    console.error("Events proxy error:", message)
    return NextResponse.json(
      { error: isTimeout ? "Events backend timeout (10s)" : message },
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
    const body = await request.json()

    const url = `${EVENTS_API_URL}/api/${apiPath}`

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "X-API-Key": EVENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post events data"
    const isTimeout = error instanceof Error && error.name === "AbortError"
    console.error("Events proxy POST error:", message)
    return NextResponse.json(
      { error: isTimeout ? "Events backend timeout (10s)" : message },
      { status: isTimeout ? 504 : 500 }
    )
  }
}
