import { NextRequest, NextResponse } from "next/server"

const RESELLER_API_URL = process.env.RESELLER_API_URL || "http://localhost:7000"
const RESELLER_API_KEY = process.env.RESELLER_API_KEY || ""

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params
    const apiPath = path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${RESELLER_API_URL}/api/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const headers: Record<string, string> = {
      "x-api-key": RESELLER_API_KEY,
      "Content-Type": "application/json",
    }

    const fetchOptions: RequestInit = { method, headers }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      try {
        const body = await request.json()
        fetchOptions.body = JSON.stringify(body)
      } catch {
        // No body — fine for action endpoints
      }
    }

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Reseller proxy error:", error)
    const message = error instanceof Error ? error.message : "Error al consultar API de revendedoras"
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, "DELETE")
}
