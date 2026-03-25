import { NextRequest, NextResponse } from "next/server"
import {
  getValidTokenFromCookie,
  encryptTokens,
  decryptTokens,
  getOverviewMetrics,
  getActiveListings,
  getUnansweredQuestions,
  getSellerReputation,
  getSellerInfo,
  ML_TOKEN_COOKIE,
} from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/metrics?type=overview&startDate=...&endDate=...
 *
 * Types: overview | listings | questions | reputation | seller
 */
export async function GET(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get(ML_TOKEN_COOKIE)?.value

    const { token, tokens, refreshed } =
      await getValidTokenFromCookie(cookieValue)

    if (!token || !tokens) {
      return NextResponse.json(
        { error: "MercadoLibre no conectado" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "overview"
    const startDate =
      searchParams.get("startDate") ||
      new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]
    const endDate =
      searchParams.get("endDate") ||
      new Date().toISOString().split("T")[0]

    let data: any

    switch (type) {
      case "overview":
        data = await getOverviewMetrics(token, tokens.user_id, startDate, endDate)
        break
      case "listings":
        data = await getActiveListings(token, tokens.user_id)
        break
      case "questions":
        data = await getUnansweredQuestions(token, tokens.user_id)
        break
      case "reputation":
        data = await getSellerReputation(token, tokens.user_id)
        break
      case "seller":
        data = await getSellerInfo(token, tokens.user_id)
        break
      default:
        return NextResponse.json({ error: "Tipo invalido" }, { status: 400 })
    }

    const response = NextResponse.json(data)

    // Update cookie if token was refreshed
    if (refreshed && tokens) {
      response.cookies.set(ML_TOKEN_COOKIE, encryptTokens(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 180 * 24 * 3600,
        path: "/",
      })
    }

    return response
  } catch (error: any) {
    console.error("[ML Metrics] Error:", error.message)
    return NextResponse.json(
      { error: error.message || "Error al obtener metricas de MercadoLibre" },
      { status: 500 }
    )
  }
}
