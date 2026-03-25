import { NextResponse } from "next/server"
import { getAuthorizationUrl, getConfig } from "@/lib/mercadolibre-client"

/**
 * GET /api/mercadolibre/auth
 * Redirects the user to MercadoLibre's authorization page.
 */
export async function GET() {
  const config = getConfig()

  if (!config.appId || !config.clientSecret) {
    return NextResponse.json(
      {
        error: "MercadoLibre no configurado. Seteá MERCADOLIBRE_APP_ID y MERCADOLIBRE_CLIENT_SECRET en las variables de entorno.",
      },
      { status: 400 }
    )
  }

  const url = getAuthorizationUrl()
  return NextResponse.redirect(url)
}
