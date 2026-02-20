import { NextResponse } from "next/server"

const EMAIL_API_URL = process.env.EMAIL_MARKETING_API_URL || "http://localhost:5000"

export async function GET() {
  try {
    const res = await fetch(`${EMAIL_API_URL}/api/health`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { status: "error", error: "Backend unreachable" },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reach email marketing backend"
    return NextResponse.json(
      { status: "error", error: message },
      { status: 500 }
    )
  }
}
