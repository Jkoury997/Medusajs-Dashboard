import { NextRequest, NextResponse } from "next/server"
import {
  getOverviewMetrics,
  getActiveListings,
  getUnansweredQuestions,
  getSellerReputation,
  getSellerInfo,
  loadTokens,
} from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/metrics?type=overview&startDate=...&endDate=...
 *
 * Types:
 *   - overview: Sales metrics for the date range
 *   - listings: Active listing count
 *   - questions: Unanswered questions count
 *   - reputation: Seller reputation
 *   - seller: Seller profile info
 */
export async function GET(request: NextRequest) {
  try {
    const tokens = loadTokens()
    if (!tokens) {
      return NextResponse.json(
        { error: "MercadoLibre no conectado" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "overview"
    const startDate = searchParams.get("startDate") || new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
    const endDate = searchParams.get("endDate") || new Date().toISOString().split("T")[0]

    if (type === "overview") {
      const data = await getOverviewMetrics(startDate, endDate)
      return NextResponse.json(data)
    }

    if (type === "listings") {
      const data = await getActiveListings()
      return NextResponse.json(data)
    }

    if (type === "questions") {
      const data = await getUnansweredQuestions()
      return NextResponse.json(data)
    }

    if (type === "reputation") {
      const data = await getSellerReputation()
      return NextResponse.json(data)
    }

    if (type === "seller") {
      const data = await getSellerInfo()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 })
  } catch (error: any) {
    console.error("[ML Metrics] Error:", error.message)
    return NextResponse.json(
      { error: error.message || "Error al obtener metricas de MercadoLibre" },
      { status: 500 }
    )
  }
}
