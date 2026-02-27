import { formatDateShort } from "./format"

// Labels para los estados de pago y fulfillment de Medusa v2
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  captured: "Pagado",
  authorized: "Autorizado",
  not_paid: "No pagado",
  canceled: "Cancelado",
  partially_captured: "Parcialmente pagado",
  refunded: "Reembolsado",
  partially_refunded: "Parcialmente reembolsado",
  requires_action: "Requiere acción",
}

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  not_fulfilled: "No preparado",
  fulfilled: "Preparado",
  partially_fulfilled: "Parcialmente preparado",
  shipped: "Enviado",
  partially_shipped: "Parcialmente enviado",
  delivered: "Entregado",
  partially_delivered: "Parcialmente entregado",
  canceled: "Cancelado",
  returned: "Devuelto",
  partially_returned: "Parcialmente devuelto",
}

export function getPaymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] || status
}

export function getFulfillmentStatusLabel(status: string): string {
  return FULFILLMENT_STATUS_LABELS[status] || status
}

/** Filtra solo órdenes con payment_status === "captured" (compras concretadas/pagadas) */
export function filterPaidOrders(orders: any[]): any[] {
  return orders.filter((o) => o.payment_status === "captured")
}

/**
 * Ingresos por día — solo órdenes pagadas (captured)
 */
export function aggregateRevenueByDay(
  orders: any[]
): { date: string; revenue: number; orders: number }[] {
  const paidOrders = filterPaidOrders(orders)
  const byDay = new Map<string, { revenue: number; orders: number }>()

  for (const order of paidOrders) {
    const date = formatDateShort(order.created_at)
    const existing = byDay.get(date) || { revenue: 0, orders: 0 }
    existing.revenue += order.total || 0
    existing.orders += 1
    byDay.set(date, existing)
  }

  return Array.from(byDay.entries())
    .map(([date, data]) => ({ date, ...data }))
    .reverse()
}

export function aggregateByStatus(
  orders: any[]
): { status: string; count: number }[] {
  const byStatus = new Map<string, number>()

  for (const order of orders) {
    const status = order.payment_status || order.status || "unknown"
    const label = getPaymentStatusLabel(status)
    byStatus.set(label, (byStatus.get(label) || 0) + 1)
  }

  return Array.from(byStatus.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
}

export function aggregateByFulfillmentStatus(
  orders: any[]
): { status: string; count: number }[] {
  const byStatus = new Map<string, number>()

  for (const order of orders) {
    const status = order.fulfillment_status || "unknown"
    const label = getFulfillmentStatusLabel(status)
    byStatus.set(label, (byStatus.get(label) || 0) + 1)
  }

  return Array.from(byStatus.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Top productos — solo de órdenes pagadas (captured)
 */
export function aggregateTopProducts(
  orders: any[]
): { product_id: string; name: string; revenue: number; quantity: number }[] {
  const paidOrders = filterPaidOrders(orders)
  const byProduct = new Map<
    string,
    { product_id: string; name: string; revenue: number; quantity: number }
  >()

  for (const order of paidOrders) {
    if (!order.items) continue
    for (const item of order.items) {
      const id = item.product_id || item.variant_id || item.title
      const existing = byProduct.get(id) || {
        product_id: id,
        name: item.product_title || item.title || "Sin nombre",
        revenue: 0,
        quantity: 0,
      }
      existing.revenue += item.total || item.unit_price * item.quantity || 0
      existing.quantity += item.quantity || 0
      byProduct.set(id, existing)
    }
  }

  return Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue)
}

/**
 * Métricas del dashboard — ingresos y AOV calculados solo sobre órdenes pagadas (captured)
 */
export function calculateMetrics(orders: any[], previousOrders: any[]) {
  const paidOrders = filterPaidOrders(orders)
  const prevPaidOrders = filterPaidOrders(previousOrders)

  // Ingresos solo de órdenes pagadas
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const paidCount = paidOrders.length
  const aov = paidCount > 0 ? totalRevenue / paidCount : 0

  const prevRevenue = prevPaidOrders.reduce((sum, o) => sum + (o.total || 0), 0)
  const prevPaidCount = prevPaidOrders.length
  const prevAov = prevPaidCount > 0 ? prevRevenue / prevPaidCount : 0

  const revenueChange =
    prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
  const paidOrdersChange =
    prevPaidCount > 0
      ? ((paidCount - prevPaidCount) / prevPaidCount) * 100
      : 0
  const aovChange = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0

  // Total de órdenes (todas, no solo pagadas)
  const totalOrders = orders.length
  const prevTotalOrders = previousOrders.length
  const ordersChange =
    prevTotalOrders > 0
      ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100
      : 0

  const uniqueCustomers = new Set(
    paidOrders.map((o) => o.customer_id).filter(Boolean)
  )
  const prevUniqueCustomers = new Set(
    prevPaidOrders.map((o) => o.customer_id).filter(Boolean)
  )

  return {
    totalRevenue,
    totalOrders,
    paidOrders: paidCount,
    aov,
    uniqueCustomers: uniqueCustomers.size,
    revenueChange,
    ordersChange,
    paidOrdersChange,
    aovChange,
    customersChange:
      prevUniqueCustomers.size > 0
        ? ((uniqueCustomers.size - prevUniqueCustomers.size) /
            prevUniqueCustomers.size) *
          100
        : 0,
  }
}

/**
 * Métricas de clientes — totalSpent y orderCount solo de órdenes pagadas (captured)
 */
export function getCustomerMetrics(customers: any[], orders: any[]) {
  // Solo usar órdenes pagadas para calcular métricas de clientes
  const paidOrders = filterPaidOrders(orders)

  // Indexar órdenes pagadas por customer_id
  const ordersByCustomerId = new Map<string, any[]>()
  // Fallback: indexar por email
  const ordersByEmail = new Map<string, any[]>()

  for (const order of paidOrders) {
    if (order.customer_id) {
      const existing = ordersByCustomerId.get(order.customer_id) || []
      existing.push(order)
      ordersByCustomerId.set(order.customer_id, existing)
    }
    if (order.email) {
      const emailKey = order.email.toLowerCase()
      const existing = ordersByEmail.get(emailKey) || []
      existing.push(order)
      ordersByEmail.set(emailKey, existing)
    }
  }

  return customers.map((customer) => {
    // Primero intentar match por customer_id, si no hay, fallback por email
    let customerOrders = ordersByCustomerId.get(customer.id) || []
    if (customerOrders.length === 0 && customer.email) {
      customerOrders = ordersByEmail.get(customer.email.toLowerCase()) || []
    }

    const totalSpent = customerOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0
    )
    const orderCount = customerOrders.length

    const sortedOrders = [...customerOrders].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const lastOrderDate =
      sortedOrders.length > 0 ? sortedOrders[0].created_at : null

    const daysSinceLastOrder = lastOrderDate
      ? Math.floor(
          (Date.now() - new Date(lastOrderDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

    // Si el cliente no tiene teléfono, buscar en shipping_address de sus órdenes
    const phone =
      customer.phone ||
      customerOrders.find((o) => o.shipping_address?.phone)?.shipping_address
        ?.phone ||
      null

    return {
      ...customer,
      phone,
      orderCount,
      totalSpent,
      avgOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
      lastOrderDate,
      daysSinceLastOrder,
    }
  })
}

/**
 * Ingresos por grupo de cliente (solo órdenes pagadas).
 * Requiere clientes enriquecidos con customer_group_resolved y órdenes.
 */
export function aggregateRevenueByGroup(
  orders: any[],
  customers: any[]
): { group: string; revenue: number; orders: number }[] {
  const paidOrders = filterPaidOrders(orders)

  // Mapear customer_id → grupo resuelto
  const customerGroupMap = new Map<string, string>()
  const emailGroupMap = new Map<string, string>()
  for (const c of customers) {
    const group = c.metadata?.customer_group_resolved || "Minorista"
    if (c.id) customerGroupMap.set(c.id, group)
    if (c.email) emailGroupMap.set(c.email.toLowerCase(), group)
  }

  const byGroup = new Map<string, { revenue: number; orders: number }>()

  for (const order of paidOrders) {
    let group = "Minorista"
    if (order.customer_id && customerGroupMap.has(order.customer_id)) {
      group = customerGroupMap.get(order.customer_id)!
    } else if (order.email) {
      group = emailGroupMap.get(order.email.toLowerCase()) || "Minorista"
    }

    const existing = byGroup.get(group) || { revenue: 0, orders: 0 }
    existing.revenue += order.total || 0
    existing.orders += 1
    byGroup.set(group, existing)
  }

  return Array.from(byGroup.entries())
    .map(([group, data]) => ({ group, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
}

/**
 * Distribución de clientes por riesgo de churn (días sin comprar).
 */
export function aggregateChurnDistribution(
  customersWithMetrics: any[]
): { label: string; count: number; color: string }[] {
  let active = 0    // 0-30 días
  let warning = 0   // 31-60 días
  let risk = 0      // 61-90 días
  let critical = 0  // 90+ días
  let never = 0     // sin compras

  for (const c of customersWithMetrics) {
    if (c.daysSinceLastOrder === null || c.orderCount === 0) {
      never++
    } else if (c.daysSinceLastOrder <= 30) {
      active++
    } else if (c.daysSinceLastOrder <= 60) {
      warning++
    } else if (c.daysSinceLastOrder <= 90) {
      risk++
    } else {
      critical++
    }
  }

  return [
    { label: "Activo (0-30d)", count: active, color: "#22c55e" },
    { label: "Alerta (31-60d)", count: warning, color: "#eab308" },
    { label: "Riesgo (61-90d)", count: risk, color: "#f97316" },
    { label: "Critico (90d+)", count: critical, color: "#ef4444" },
    { label: "Sin compras", count: never, color: "#9ca3af" },
  ].filter((d) => d.count > 0)
}
