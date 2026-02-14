import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL!

/**
 * POST /api/products/by-ids
 * Recibe { ids: string[] } y devuelve los productos de Medusa con nombre, thumbnail y external_id.
 * Usa la Store API (/store/products) que no requiere auth para datos públicos.
 */
export async function POST(request: NextRequest) {
  try {
    const { ids } = (await request.json()) as { ids: string[] }

    if (!ids?.length) {
      return NextResponse.json({ products: [] })
    }

    // Medusa v2 Store API: filtrar por id[]
    const params = new URLSearchParams()
    ids.forEach((id) => params.append("id[]", id))
    params.set("fields", "id,title,thumbnail,handle,metadata")
    params.set("limit", String(ids.length))

    const url = `${MEDUSA_BACKEND_URL}/store/products?${params.toString()}`

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
    })

    if (!res.ok) {
      // Fallback: intentar con la Admin API
      const adminUrl = `${MEDUSA_BACKEND_URL}/admin/products?${params.toString()}`
      const adminRes = await fetch(adminUrl, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MEDUSA_ADMIN_TOKEN || ""}`,
        },
      })

      if (!adminRes.ok) {
        console.error("Failed to fetch products from Medusa:", await adminRes.text())
        return NextResponse.json({ products: [] })
      }

      const adminData = await adminRes.json()
      return NextResponse.json({
        products: (adminData.products || []).map((p: any) => ({
          id: p.id,
          title: p.title || "",
          thumbnail: p.thumbnail || null,
          handle: p.handle || "",
          external_id: p.external_id || p.metadata?.external_id || "",
        })),
      })
    }

    const data = await res.json()
    return NextResponse.json({
      products: (data.products || []).map((p: any) => ({
        id: p.id,
        title: p.title || "",
        thumbnail: p.thumbnail || null,
        handle: p.handle || "",
        external_id: p.external_id || p.metadata?.external_id || "",
      })),
    })
  } catch (error: any) {
    console.error("Products by-ids error:", error)
    return NextResponse.json(
      { products: [], error: error.message },
      { status: 500 }
    )
  }
}
