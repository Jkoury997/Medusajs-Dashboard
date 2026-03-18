import { NextRequest, NextResponse } from "next/server"

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://backend.marcelakoury.com"

/**
 * GET /api/admin/users
 * Lista todos los usuarios admin de Medusa con sus roles.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const res = await fetch(`${MEDUSA_BACKEND_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudieron obtener los usuarios" },
        { status: res.status }
      )
    }

    const data = await res.json()
    const users = (data.users || []).map(
      (u: {
        id: string
        email: string
        first_name?: string
        last_name?: string
        metadata?: Record<string, unknown>
      }) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.metadata?.dashboard_role || "super_admin",
      })
    )

    return NextResponse.json({ users })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al listar usuarios"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/users
 * Actualiza el rol de un usuario.
 * Body: { user_id: string, role: string }
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { user_id, role } = body

    if (!user_id || !role) {
      return NextResponse.json(
        { error: "user_id y role son requeridos" },
        { status: 400 }
      )
    }

    // Primero obtener el usuario actual para preservar su metadata
    const getUserRes = await fetch(
      `${MEDUSA_BACKEND_URL}/admin/users/${user_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!getUserRes.ok) {
      return NextResponse.json(
        { error: "No se pudo obtener el usuario" },
        { status: getUserRes.status }
      )
    }

    const userData = await getUserRes.json()
    const existingMetadata = userData.user?.metadata || {}

    // Actualizar metadata con el nuevo rol
    const updateRes = await fetch(
      `${MEDUSA_BACKEND_URL}/admin/users/${user_id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {
            ...existingMetadata,
            dashboard_role: role,
          },
        }),
      }
    )

    if (!updateRes.ok) {
      const errorData = await updateRes.text()
      return NextResponse.json(
        { error: `Error al actualizar: ${errorData}` },
        { status: updateRes.status }
      )
    }

    return NextResponse.json({ success: true, user_id, role })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar rol"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
