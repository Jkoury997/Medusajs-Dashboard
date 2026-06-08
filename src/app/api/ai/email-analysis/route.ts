import { NextRequest, NextResponse } from "next/server"
import { analyzeEmailVariant, type EmailVariantAnalysisInput } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { input, provider = "anthropic" } = body as {
      input?: EmailVariantAnalysisInput
      provider?: "anthropic" | "openai"
    }

    if (!input?.variant) {
      return NextResponse.json({ error: "Datos de la plantilla requeridos" }, { status: 400 })
    }

    const analysis = await analyzeEmailVariant(input, provider)
    return NextResponse.json({ analysis })
  } catch (error: unknown) {
    console.error("AI email-analysis error:", error)
    const msg = error instanceof Error ? error.message : "No se pudo generar el análisis"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
