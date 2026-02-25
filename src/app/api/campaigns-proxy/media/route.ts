import { NextRequest, NextResponse } from "next/server"

const EMAIL_API_URL = process.env.EMAIL_MARKETING_API_URL || "http://localhost:5000"
const EMAIL_API_KEY = process.env.EMAIL_MARKETING_API_KEY || ""

// GET /api/campaigns-proxy/media — list media
export async function GET() {
  try {
    const res = await fetch(`${EMAIL_API_URL}/api/email-campaigns/media`, {
      headers: { "X-API-Key": EMAIL_API_KEY },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(err, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Media proxy GET error:", error)
    return NextResponse.json({ error: "Error al obtener media" }, { status: 500 })
  }
}

// POST /api/campaigns-proxy/media — upload file (FormData)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const res = await fetch(`${EMAIL_API_URL}/api/email-campaigns/media`, {
      method: "POST",
      headers: { "X-API-Key": EMAIL_API_KEY },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(err, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error("Media proxy POST error:", error)
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
