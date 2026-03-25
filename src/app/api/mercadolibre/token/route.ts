import { NextResponse } from "next/server"
import {
  loadTokens,
  clearTokens,
  isTokenExpired,
  getValidToken,
  getConfig,
} from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/token
 * Returns the current connection status (without exposing the actual token).
 */
export async function GET() {
  const config = getConfig()

  if (!config.appId || !config.clientSecret) {
    return NextResponse.json({
      connected: false,
      configured: false,
      message: "Variables de entorno no configuradas (MERCADOLIBRE_APP_ID, MERCADOLIBRE_CLIENT_SECRET)",
    })
  }

  const tokens = loadTokens()

  if (!tokens) {
    return NextResponse.json({
      connected: false,
      configured: true,
      message: "No conectado a MercadoLibre",
    })
  }

  // Try to validate/refresh the token
  const validToken = await getValidToken()

  if (!validToken) {
    return NextResponse.json({
      connected: false,
      configured: true,
      message: "Token expirado y no se pudo refrescar. Reconectá la cuenta.",
    })
  }

  // Reload tokens (may have been refreshed)
  const currentTokens = loadTokens()

  return NextResponse.json({
    connected: true,
    configured: true,
    user_id: currentTokens?.user_id,
    seller_nickname: currentTokens?.seller_nickname,
    expires_at: currentTokens?.expires_at,
    is_expired: currentTokens ? isTokenExpired(currentTokens) : true,
  })
}

/**
 * DELETE /api/mercadolibre/token
 * Disconnects the ML account by clearing stored tokens.
 */
export async function DELETE() {
  clearTokens()
  return NextResponse.json({ success: true, message: "Cuenta de MercadoLibre desconectada" })
}
