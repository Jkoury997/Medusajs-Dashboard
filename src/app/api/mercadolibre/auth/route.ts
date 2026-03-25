import { NextResponse } from "next/server"
import {
  getAuthorizationUrlWithPKCE,
  getConfig,
  ML_PKCE_COOKIE,
} from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/auth
 * Generates PKCE verifier, stores it in a cookie, and redirects to ML authorization.
 */
export async function GET() {
  const config = getConfig()

  if (!config.appId || !config.clientSecret) {
    return NextResponse.json(
      {
        error:
          "MercadoLibre no configurado. Seteá MERCADOLIBRE_APP_ID y MERCADOLIBRE_CLIENT_SECRET.",
      },
      { status: 400 }
    )
  }

  const { url, codeVerifier } = getAuthorizationUrlWithPKCE()

  const response = NextResponse.redirect(url)

  // Store the code_verifier in an httpOnly cookie for the callback
  response.cookies.set(ML_PKCE_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes — enough for the user to authorize
    path: "/",
  })

  return response
}
