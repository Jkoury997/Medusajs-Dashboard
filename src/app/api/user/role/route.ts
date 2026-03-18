import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://backend.marcelakoury.com"

/**
 * GET /api/user/role
 * Obtiene el rol del usuario autenticado desde su metadata en Medusa.
 * Si no tiene metadata.dashboard_role, se asume "super_admin" (retrocompatibilidad).
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Obtener info del usuario actual via Medusa Admin API
    const meRes = await fetch(`${MEDUSA_BACKEND_URL}/admin/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!meRes.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener el usuario" },
        { status: meRes.status }
      )
    }

    const data = await meRes.json()
    const user = data.user

    // Si tiene rol en metadata, usarlo. Si no, es super_admin (retrocompatibilidad)
    const role = user?.metadata?.dashboard_role || "super_admin"

    return NextResponse.json({
      role,
      user_id: user?.id,
      email: user?.email,
      first_name: user?.first_name,
      last_name: user?.last_name,
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al obtener rol"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
