import { NextRequest, NextResponse } from "next/server"

const EMAIL_API_URL = process.env.EMAIL_MARKETING_API_URL || "http://localhost:5000"
const EMAIL_API_KEY = process.env.EMAIL_MARKETING_API_KEY || ""

async function proxyRoot(request: NextRequest, method: string) {
  try {
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${EMAIL_API_URL}/api/email-campaigns/${searchParams ? `?${searchParams}` : ""}`

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
        // No body
      }
    }

    console.log(`[campaigns-proxy ROOT] ${method} -> ${url}`)
    const response = await fetch(url, fetchOptions)
    const text = await response.text()
    console.log(`[campaigns-proxy ROOT] Response ${response.status}: ${text.substring(0, 500)}`)

    if (!response.ok) {
      const error = (() => { try { return JSON.parse(text) } catch { return { error: text || "Unknown error" } } })()
      return NextResponse.json(error, { status: response.status })
    }

    const data = (() => { try { return JSON.parse(text) } catch { return { error: "Invalid JSON response" } } })()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Campaigns proxy root error:", error)
    const message = error instanceof Error ? error.message : "Error al consultar campañas manuales"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return proxyRoot(request, "GET")
}

export async function POST(request: NextRequest) {
  return proxyRoot(request, "POST")
}
