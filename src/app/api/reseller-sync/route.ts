import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/reseller-sync
 *
 * Webhook endpoint for the Reseller API to call when a customer is linked
 * to a reseller. It adds the customer to the appropriate Medusa Customer Group
 * so that the automatic promotion (discount) applies to their purchases.
 *
 * Body:
 *   { customer_email: string, reseller_type_name: string }
 *
 * Auth:
 *   x-api-key header must match RESELLER_API_KEY
 *
 * Flow:
 *   1. Look up customer in Medusa by email
 *   2. Find the customer group "reseller-{type_name}" in Medusa
 *   3. Add the customer to the group
 */

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://backend.marcelakoury.com"
const RESELLER_API_KEY = process.env.RESELLER_API_KEY || ""
const MEDUSA_ADMIN_TOKEN = process.env.MEDUSA_ADMIN_TOKEN || ""

async function medusaAdmin(path: string, options: RequestInit = {}) {
  const url = `${MEDUSA_BACKEND_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MEDUSA_ADMIN_TOKEN}`,
      ...((options.headers as Record<string, string>) || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Medusa ${res.status}: ${body}`)
  }
  return res.json()
}

export async function POST(request: NextRequest) {
  try {
    // Auth: validate the request is from the Reseller API
    const apiKey = request.headers.get("x-api-key") || ""
    if (!RESELLER_API_KEY || apiKey !== RESELLER_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { customer_email, reseller_type_name } = body

    if (!customer_email || !reseller_type_name) {
      return NextResponse.json(
        { error: "Missing customer_email or reseller_type_name" },
        { status: 400 }
      )
    }

    // 1. Find the customer in Medusa by email
    const customersRes = await medusaAdmin(
      `/admin/customers?q=${encodeURIComponent(customer_email)}&limit=1`
    )
    const customer = customersRes.customers?.[0]
    if (!customer) {
      return NextResponse.json(
        { error: `Customer not found in Medusa: ${customer_email}` },
        { status: 404 }
      )
    }

    // 2. Find the customer group "reseller-{type_name}"
    const groupName = `reseller-${reseller_type_name}`
    const groupsRes = await medusaAdmin(
      `/admin/customer-groups?q=${encodeURIComponent(groupName)}&limit=10`
    )
    const group = groupsRes.customer_groups?.find(
      (g: { name: string }) => g.name === groupName
    )
    if (!group) {
      return NextResponse.json(
        {
          error: `Customer group "${groupName}" not found in Medusa. Run sync from the dashboard first.`,
        },
        { status: 404 }
      )
    }

    // 3. Add customer to the group
    await medusaAdmin(`/admin/customer-groups/${group.id}/customers`, {
      method: "POST",
      body: JSON.stringify({ add: [customer.id] }),
    })

    return NextResponse.json({
      success: true,
      customer_id: customer.id,
      customer_email,
      group_id: group.id,
      group_name: groupName,
    })
  } catch (error: unknown) {
    console.error("Reseller sync error:", error)
    const message =
      error instanceof Error ? error.message : "Error syncing customer"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
