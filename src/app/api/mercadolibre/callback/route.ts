import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/callback?code=...
 * OAuth callback handler. Exchanges the auth code for tokens
 * and redirects to the ML settings page.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/mercadolibre?error=no_code", request.url)
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    console.log(
      `[ML OAuth] Connected successfully. User ID: ${tokens.user_id}, Nickname: ${tokens.seller_nickname || "N/A"}`
    )

    return NextResponse.redirect(
      new URL("/dashboard/mercadolibre?connected=true", request.url)
    )
  } catch (err: any) {
    console.error("[ML OAuth] Token exchange error:", err.message)
    return NextResponse.redirect(
      new URL(`/dashboard/mercadolibre?error=${encodeURIComponent(err.message)}`, request.url)
    )
  }
}
