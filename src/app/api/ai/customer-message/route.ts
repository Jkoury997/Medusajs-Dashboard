import { NextRequest, NextResponse } from "next/server"
import { draftCustomerMessage, type CustomerMessageInput } from "@/lib/ai-client"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer, provider = "anthropic" } = body as {
      customer?: CustomerMessageInput
      provider?: "openai" | "anthropic"
    }

    if (!customer) {
      return NextResponse.json({ error: "Datos del cliente requeridos" }, { status: 400 })
    }

    const message = await draftCustomerMessage(customer, provider)
    return NextResponse.json({ message })
  } catch (error: unknown) {
    console.error("AI customer-message error:", error)
    const msg = error instanceof Error ? error.message : "No se pudo generar el mensaje"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
