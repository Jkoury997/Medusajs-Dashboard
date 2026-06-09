export type AIPageContext =
  | "overview"
  | "orders"
  | "products"
  | "customers"
  | "customer-followup"
  | "marketing"
  | "analytics"
  | "unified"
  | "free-shipping"

export const PAGE_PROMPTS: Record<
  AIPageContext,
  { focusInstruction: string; label: string; icon: string }
> = {
  overview: {
    focusInstruction: `Enfocá el análisis en un RESUMEN EJECUTIVO BREVE del estado general del negocio.
Incluí: salud de ingresos, tendencias de ventas, alerta de clientes en riesgo, y las 2-3 acciones más urgentes.
Formato: máximo 300 palabras. Usá bullets concisos.`,
    label: "Resumen general del negocio",
    icon: "📊",
  },
  orders: {
    focusInstruction: `Enfocá el análisis en ÓRDENES Y FULFILLMENT.
Incluí: tendencias de órdenes, tasa de conversión de pago, reembolsos, tiempos de fulfillment, patrones de estados.
Si hay muchas órdenes no pagadas o canceladas, alertá. Sugerí mejoras en el proceso de checkout.
Formato: máximo 300 palabras.`,
    label: "Análisis de órdenes",
    icon: "📦",
  },
  products: {
    focusInstruction: `Enfocá el análisis en PRODUCTOS.
Incluí: bestsellers vs slow movers, concentración de ingresos (si pocos productos generan mucho), sugerencias de cross-sell/upsell.
Si hay productos con alto volumen pero bajo ticket, o viceversa, señalalo.
Formato: máximo 300 palabras.`,
    label: "Análisis de productos",
    icon: "🏷️",
  },
  customers: {
    focusInstruction: `Enfocá el análisis en CLIENTES Y RETENCIÓN.
Incluí: distribución de churn, clientes en riesgo con mayor LTV, estrategias de retención por segmento (mayoristas vs minoristas vs revendedoras).
Sugerí acciones de WhatsApp específicas para cada segmento en riesgo.
Formato: máximo 300 palabras.`,
    label: "Análisis de clientes",
    icon: "👥",
  },
  "customer-followup": {
    focusInstruction: `Actuá como un COACH DE VENTAS del equipo de Marcela Koury.
Tenés la COLA DE SEGUIMIENTO de clientes (a quién contactar) con sus datos reales.
Tu objetivo: más recompra, más ventas y más productividad del equipo, sin quemar contactos.
Generá un PLAN DE ACCIÓN PARA HOY, motivador y concreto:
1. 🎯 A quién contactar primero: nombrá 3-5 clientas CONCRETAS de los datos, con el porqué (días sin comprar, valor gastado, contacto vencido).
2. 💬 Para cada una, en una línea: qué decirle / qué ofrecerle (reactivación, novedad, beneficio según su perfil).
3. 🚀 1-2 tips de productividad y ventas para hoy (cómo priorizar, mejor horario, cómo no ser invasivo).
4. ⚠️ En riesgo: clientas valiosas que se están por perder y hay que recuperar ya.
Tono de coach: directo, alentador y accionable. Máximo 280 palabras. Usá nombres y números REALES de los datos.`,
    label: "Coach de seguimiento",
    icon: "🧠",
  },
  marketing: {
    focusInstruction: `Enfocá el análisis en MARKETING Y CANALES.
Incluí: optimización de ROAS, CTR, CPC por campaña, recomendaciones de presupuesto, canales con mejor conversión en GA4.
Compará gasto en ads vs ingresos generados. Si el ROAS es bajo, sugerí ajustes.
Formato: máximo 300 palabras.`,
    label: "Optimización de marketing",
    icon: "📈",
  },
  analytics: {
    focusInstruction: `Enfocá el análisis en COMPORTAMIENTO DE USUARIOS Y FUNNEL.
Incluí: cuellos de botella en el funnel de conversión, tasa de abandono de checkout, búsquedas sin resultados que indican demanda no satisfecha.
Sugerí mejoras en UX basadas en los datos de eventos del storefront.
Formato: máximo 300 palabras.`,
    label: "Comportamiento y funnel",
    icon: "📡",
  },
  "free-shipping": {
    focusInstruction: `Sos analista de pricing/logística de Marcela Koury / MakeYou. Te paso datos reales del checkout: embudo de caída, distribución del ticket, costo real de envío por canal × customer_group, recomendación de umbral retail, y by_cohort (ticket + umbral por grupo).
Tu tarea: recomendar el **umbral de envío gratis ÓPTIMO por customer_group Y por canal** (retail/invitado, consumidor final, revendedora, mayorista), porque cada grupo maneja tickets muy distintos.
Reglas:
1. 🎯 Para CADA grupo con datos suficientes: un umbral concreto en ARS + el porqué (su ticket mediano y su costo de envío real). Retail ~1.2× su mediana; revendedora/mayorista tienen tickets mucho más altos y a veces ya viajan gratis (retiro) → puede no convenir promo o un umbral mucho más alto.
2. 💸 Breakeven: cuánto se absorbe de envío vs el ticket de ese grupo. Si el envío es chico vs el ticket, el envío gratis paga; si es grande (mayorista), no.
3. ⚠️ CAVEAT del embudo: NO asumas que la baja en los pasos contacto/envío es un bloqueo. Muchos clientes están logueados o ya tienen dirección/pago guardado y SALTEAN esos pasos yendo directo a pago/orden (o salen y vuelven directo al pago). Lo confiable es checkout→orden y la recomendación de umbral, no el conteo por paso intermedio.
4. 🚀 Cerrá con 2-3 acciones concretas (qué umbral activar por grupo/canal primero).
Formato: máximo 350 palabras, headers ## y bullets, montos en ARS reales.`,
    label: "Recomendación de envío gratis por grupo",
    icon: "🚚",
  },
  unified: {
    focusInstruction: `Sos el analista de datos de Marcela Koury. Tenés TODOS los datos cruzados del negocio.
Generá un REPORTE EJECUTIVO COMPLETO que cruce:
1. ROAS Real (ingresos Medusa vs gasto Meta) vs ROAS reportado por Meta
2. Embudo completo: sesiones GA4 → eventos storefront → órdenes pagadas (identificá el cuello de botella)
3. Productos con muchas vistas pero pocas ventas (oportunidades perdidas)
4. Segmentos de clientes: cuál genera más, cuál tiene más riesgo de churn
5. Búsquedas sin resultados = demanda no satisfecha del catálogo
6. Tasa de abandono de checkout y valor perdido estimado
7. Las 3 ACCIONES más urgentes con impacto directo en ingresos

Formato: máximo 500 palabras. Usá headers ## y bullets. Sé específico con números reales.`,
    label: "Reporte integral del negocio",
    icon: "🎯",
  },
}
