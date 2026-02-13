import { NextRequest, NextResponse } from "next/server"
import { getAIRecommendations, getAIPageInsight } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metrics, provider = "openai", focusInstruction } = body

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
  } catch (error: any) {
    console.error("AI API error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}
