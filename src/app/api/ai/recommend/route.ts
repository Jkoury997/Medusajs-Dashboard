import { NextRequest, NextResponse } from "next/server"
import { getAIRecommendations, getAIPageInsight } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metrics, provider = "anthropic", focusInstruction } = body

    if (!metrics) {
      return NextResponse.json(
        { error: "Metrics data is required" },
        { status: 400 }
      )
    }

    const recommendations = focusInstruction
      ? await getAIPageInsight(metrics, focusInstruction, provider)
      : await getAIRecommendations(metrics, provider)

    return NextResponse.json({ recommendations })
  } catch (error: unknown) {
    console.error("AI API error:", error)
    // Surface a STRING message siempre (evita "[object Object]" en el cliente).
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : (() => {
              try {
                return JSON.stringify(error)
              } catch {
                return "Failed to generate recommendations"
              }
            })()
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
