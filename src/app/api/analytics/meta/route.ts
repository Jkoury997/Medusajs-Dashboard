import { NextRequest, NextResponse } from "next/server"
import {
  getMetaAccountOverview,
  getMetaCampaignInsights,
} from "@/lib/meta-client"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate") || "2024-01-01"
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]
    const type = searchParams.get("type") || "overview"

    if (type === "overview") {
      const data = await getMetaAccountOverview(startDate, endDate)
      return NextResponse.json(data)
    }

    if (type === "campaigns") {
      const data = await getMetaCampaignInsights(startDate, endDate)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error: any) {
    console.error("Meta API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch Meta data" },
      { status: 500 }
    )
  }
}
