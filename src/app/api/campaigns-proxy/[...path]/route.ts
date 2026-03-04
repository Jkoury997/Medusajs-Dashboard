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
    const apiPath = path.map((segment) => encodeURIComponent(segment)).join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${EMAIL_API_URL}/api/email-campaigns/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const headers: Record<string, string> = {
      "X-API-Key": EMAIL_API_KEY,
    }

    const fetchOptions: RequestInit = { method, headers }

    // Detect multipart upload (media/upload)
    const isMultipart = apiPath.startsWith("media/upload") && method === "POST"

    if (["POST", "PUT", "PATCH"].includes(method)) {
      if (isMultipart) {
        const contentType = request.headers.get("content-type")
        if (contentType) headers["Content-Type"] = contentType
        fetchOptions.body = await request.arrayBuffer()
      } else {
        headers["Content-Type"] = "application/json"
        try {
          const body = await request.json()
          fetchOptions.body = JSON.stringify(body)
        } catch {
          // No body — fine for action endpoints like /pause, /resume
          headers["Content-Type"] = "application/json"
        }
      }
    } else {
      headers["Content-Type"] = "application/json"
    }

    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
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
