import { NextRequest, NextResponse } from "next/server"
import {
  getGA4Overview,
  getGA4TrafficSources,
  getGA4DeviceBreakdown,
} from "@/lib/ga4-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate") || "30daysAgo"
    const endDate = searchParams.get("endDate") || "today"
    const type = searchParams.get("type") || "overview"

    if (type === "overview") {
      const data = await getGA4Overview(startDate, endDate)
      return NextResponse.json(data)
    }

    if (type === "traffic") {
      const data = await getGA4TrafficSources(startDate, endDate)
      return NextResponse.json(data)
    }

    if (type === "devices") {
      const data = await getGA4DeviceBreakdown(startDate, endDate)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error: any) {
    console.error("GA4 API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch GA4 data" },
      { status: 500 }
    )
  }
}
