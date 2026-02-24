import { NextRequest, NextResponse } from "next/server"

const EMAIL_API_URL = process.env.EMAIL_MARKETING_API_URL || "http://localhost:5000"
const EMAIL_API_KEY = process.env.EMAIL_MARKETING_API_KEY || ""

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params
    const apiPath = path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${EMAIL_API_URL}/api/email-campaigns/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const headers: Record<string, string> = {
      "X-API-Key": EMAIL_API_KEY,
      "Content-Type": "application/json",
    }

    const fetchOptions: RequestInit = { method, headers }

    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        const body = await request.json()
        fetchOptions.body = JSON.stringify(body)
      } catch {
        // No body — fine for action endpoints like /pause, /resume
      }
    }

    console.log(`[campaigns-proxy PATH] ${method} -> ${url}`)
    const response = await fetch(url, fetchOptions)
    const text = await response.text()
    console.log(`[campaigns-proxy PATH] Response ${response.status}: ${text.substring(0, 500)}`)

    if (!response.ok) {
      const error = (() => { try { return JSON.parse(text) } catch { return { error: text || "Unknown error" } } })()
      return NextResponse.json(error, { status: response.status })
    }

    const data = (() => { try { return JSON.parse(text) } catch { return { error: "Invalid JSON response" } } })()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Campaigns proxy error:", error)
    const message = error instanceof Error ? error.message : "Error al consultar campañas manuales"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "PATCH")
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "DELETE")
}
