/**
 * Genera un link de WhatsApp con mensaje personalizado según el estado del cliente.
 */

interface WhatsAppParams {
  phone: string
  firstName: string
  orderCount: number
  daysSinceLastOrder: number | null
  totalSpent: number
}

/**
 * Limpia el número de teléfono para formato WhatsApp (solo dígitos, con código de país).
 * Si no tiene código de país, agrega +54 (Argentina).
 */
function cleanPhone(phone: string): string {
  // Remover todo excepto dígitos y +
  let cleaned = phone.replace(/[^\d+]/g, "")

  // Si empieza con +, remover el + y dejar los dígitos
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1)
  }

  // Si empieza con 0 (número local argentino), remover el 0 y agregar 54
  if (cleaned.startsWith("0")) {
    cleaned = "54" + cleaned.substring(1)
  }

  // Si no empieza con 54 (código de Argentina), agregarlo
  if (!cleaned.startsWith("54")) {
    cleaned = "54" + cleaned
  }

  return cleaned
}

/**
 * Genera un mensaje personalizado según el estado del cliente.
 */
function generateMessage({ firstName, orderCount, daysSinceLastOrder, totalSpent }: Omit<WhatsAppParams, "phone">): string {
  const name = firstName || "cliente"

  // Nunca compró
  if (orderCount === 0) {
    return `Hola ${name}! 👋 Soy de Marcela Koury. Vi que te registraste pero todavía no hiciste tu primera compra. ¿Hay algo en lo que te pueda ayudar? Tenemos novedades que te pueden interesar! 🛍️`
  }

  // Compró pero hace mucho (más de 90 días) - riesgo alto
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 90) {
    return `Hola ${name}! 👋 Soy de Marcela Koury. ¡Te extrañamos! Hace ${daysSinceLastOrder} días que no nos visitás. Tenemos muchas novedades y ofertas especiales para vos. ¿Te gustaría ver lo nuevo? 🛍️`
  }

  // Compró pero hace bastante (60-90 días) - riesgo medio
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 60) {
    return `Hola ${name}! 👋 Soy de Marcela Koury. Hace un tiempo que no te vemos por acá. Tenemos nuevos productos que creo que te van a encantar. ¿Querés que te cuente las novedades? ✨`
  }

  // Compró hace poco (30-60 días)
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 30) {
    return `Hola ${name}! 👋 Soy de Marcela Koury. ¡Gracias por tu última compra! Quería contarte que llegaron nuevos productos. ¿Te interesa verlos? 🆕`
  }

  // Cliente reciente (menos de 30 días) y recurrente
  if (orderCount > 1) {
    return `Hola ${name}! 👋 Soy de Marcela Koury. ¡Gracias por ser cliente fiel! Tenemos beneficios exclusivos para vos. ¿Querés que te cuente? 💎`
  }

  // Compró una sola vez, hace poco
  return `Hola ${name}! 👋 Soy de Marcela Koury. ¡Gracias por tu compra! Esperamos que te haya gustado. ¿Necesitás algo más? Estamos para ayudarte 😊`
}

/**
 * Genera la URL de WhatsApp con el mensaje personalizado.
 */
export function getWhatsAppUrl(params: WhatsAppParams): string {
  const phone = cleanPhone(params.phone)
  const message = generateMessage(params)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

/**
 * Genera la URL de WhatsApp con un mensaje custom.
 */
export function getWhatsAppUrlCustom(phone: string, message: string): string {
  const cleaned = cleanPhone(phone)
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}

/**
 * Devuelve una etiqueta corta describiendo el tipo de mensaje que se enviaría.
 */
export function getWhatsAppMessageType(orderCount: number, daysSinceLastOrder: number | null): string {
  if (orderCount === 0) return "Bienvenida"
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 90) return "Reactivación"
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 60) return "Seguimiento"
  if (daysSinceLastOrder !== null && daysSinceLastOrder > 30) return "Novedades"
  if (orderCount > 1) return "Fidelización"
  return "Agradecimiento"
}
