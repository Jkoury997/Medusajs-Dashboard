import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.RESELLER_FISICAS_API_URL || "http://localhost:7001"
const API_KEY = process.env.RESELLER_FISICAS_API_KEY || ""

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
) {
  try {
    const { path } = await params
    const apiPath = path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${API_URL}/api/admin/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const headers: Record<string, string> = {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    }

    const fetchOptions: RequestInit = { method, headers }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      try {
        const body = await request.json()
        fetchOptions.body = JSON.stringify(body)
      } catch {
        // No body
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
    console.error("Reseller fisicas proxy error:", error)
    const message = error instanceof Error ? error.message : "Error al consultar API de revendedoras físicas"
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
