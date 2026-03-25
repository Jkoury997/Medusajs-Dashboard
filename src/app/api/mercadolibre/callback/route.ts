import { NextRequest, NextResponse } from "next/server"
import {
  exchangeCodeForTokens,
  encryptTokens,
  ML_TOKEN_COOKIE,
  ML_PKCE_COOKIE,
} from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/callback?code=...
 * OAuth callback. Reads PKCE verifier from cookie, exchanges code for tokens,
 * stores encrypted tokens in a cookie, and redirects to ML page.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/mercadolibre?error=no_code", request.url)
    )
  }

  // Read the PKCE code_verifier from the cookie
  const codeVerifier = request.cookies.get(ML_PKCE_COOKIE)?.value

  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL(
        "/dashboard/mercadolibre?error=pkce_verifier_missing_try_again",
        request.url
      )
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code, codeVerifier)

    console.log(
      `[ML OAuth] Connected. User ID: ${tokens.user_id}, Nickname: ${tokens.seller_nickname || "N/A"}`
    )

    const response = NextResponse.redirect(
      new URL("/dashboard/mercadolibre?connected=true", request.url)
    )

    // Store encrypted tokens in a cookie
    response.cookies.set(ML_TOKEN_COOKIE, encryptTokens(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 180 * 24 * 3600, // 180 days (refresh token lasts ~6 months)
      path: "/",
    })

    // Clear the PKCE cookie
    response.cookies.delete(ML_PKCE_COOKIE)

    return response
  } catch (err: any) {
    console.error("[ML OAuth] Token exchange error:", err.message)
    return NextResponse.redirect(
      new URL(
        `/dashboard/mercadolibre?error=${encodeURIComponent(err.message)}`,
        request.url
      )
    )
  }
}
