import { NextRequest, NextResponse } from "next/server"
import {
  decryptTokens,
  isTokenExpired,
  getValidTokenFromCookie,
  encryptTokens,
  getConfig,
  ML_TOKEN_COOKIE,
} from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/token
 * Returns connection status (without exposing the actual token).
 * Also refreshes the token if expired and updates the cookie.
 */
export async function GET(request: NextRequest) {
  const config = getConfig()

  if (!config.appId || !config.clientSecret) {
    return NextResponse.json({
      connected: false,
      configured: false,
      message:
        "Variables de entorno no configuradas (MERCADOLIBRE_APP_ID, MERCADOLIBRE_CLIENT_SECRET)",
    })
  }

  const cookieValue = request.cookies.get(ML_TOKEN_COOKIE)?.value

  if (!cookieValue) {
    return NextResponse.json({
      connected: false,
      configured: true,
      message: "No conectado a MercadoLibre",
    })
  }

  const { token, tokens, refreshed } =
    await getValidTokenFromCookie(cookieValue)

  if (!token || !tokens) {
    // Token invalid or refresh failed — clear the cookie
    const response = NextResponse.json({
      connected: false,
      configured: true,
      message: "Token expirado y no se pudo refrescar. Reconectá la cuenta.",
    })
    response.cookies.delete(ML_TOKEN_COOKIE)
    return response
  }

  const response = NextResponse.json({
    connected: true,
    configured: true,
    user_id: tokens.user_id,
    seller_nickname: tokens.seller_nickname,
    expires_at: tokens.expires_at,
    is_expired: isTokenExpired(tokens),
  })

  // If token was refreshed, update the cookie
  if (refreshed) {
    response.cookies.set(ML_TOKEN_COOKIE, encryptTokens(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 180 * 24 * 3600,
      path: "/",
    })
  }

  return response
}

/**
 * DELETE /api/mercadolibre/token
 * Disconnects by clearing the token cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Cuenta de MercadoLibre desconectada",
  })
  response.cookies.delete(ML_TOKEN_COOKIE)
  return response
}
