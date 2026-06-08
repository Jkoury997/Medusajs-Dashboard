export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

/** Convierte a Date válido o null (evita "Invalid time value" al formatear). */
function toValidDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date: string | Date | null | undefined): string {
  const d = toValidDate(date)
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d)
}

export function formatDateShort(date: string | Date | null | undefined): string {
  const d = toValidDate(date)
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(d)
}

export function daysSince(date: string | Date | null | undefined): number {
  const then = toValidDate(date)
  if (!then) return 0
  const diff = Date.now() - then.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
