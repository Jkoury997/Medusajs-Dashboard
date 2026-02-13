import { NextRequest, NextResponse } from "next/server"

const EVENTS_API_URL = process.env.EVENTS_API_URL || "http://localhost:4000"
const EVENTS_API_KEY = process.env.EVENTS_API_KEY || ""

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const apiPath = path.join("/")

    // Forward query parameters
    const searchParams = request.nextUrl.searchParams.toString()
    const url = `${EVENTS_API_URL}/api/${apiPath}${searchParams ? `?${searchParams}` : ""}`

    const response = await fetch(url, {
      headers: {
        "X-API-Key": EVENTS_API_KEY,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Events proxy error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch events data" },
      { status: 500 }
    )
  }
}
