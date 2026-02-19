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
    const url = `${EMAIL_API_URL}/api/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const headers: Record<string, string> = {
      "X-API-Key": EMAIL_API_KEY,
      "Content-Type": "application/json",
    }

    const fetchOptions: RequestInit = { method, headers }

    // Forward body for POST, PUT, PATCH
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try {
        const body = await request.json()
        fetchOptions.body = JSON.stringify(body)
      } catch {
        // No body — that's fine for POST /process
      }
    }

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Email proxy error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch email marketing data" },
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
