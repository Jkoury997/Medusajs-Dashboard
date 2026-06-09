export type AIPageContext =
  | "overview"
  | "orders"
  | "products"
  | "customers"
  | "customer-followup"
  | "marketing"
  | "analytics"
  | "unified"
  | "email-intelligence"

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
  "email-intelligence": {
    focusInstruction: `Sos el analista del AGENTE DE EMAIL con IA de Marcela Koury / MakeYou. Tenés las métricas reales del email marketing automatizado.
Analizá y dame un diagnóstico ACCIONABLE:
1. 📊 Estado general: envíos, open rate, CTR, conversiones, revenue atribuido vs el período anterior (usá los deltas: qué mejoró y qué empeoró).
2. ✉️ Entregabilidad: si bounce rate >2% o quejas (spam) >0.1%, ALERTÁ fuerte — afecta la reputación del dominio. Sugerí qué hacer (limpiar lista, pausar campaña, revisar contenido).
3. 🏆 Por campaña: cuál convierte mejor y cuál habría que pausar o revisar (CTR/conv bajos).
4. 🎯 Por SEGMENTO: mirá by_sales_channel (marca) y by_customer_group. Si un canal o grupo convierte mucho mejor o peor, decilo con números y recomendá una acción concreta (ej: "mayoristas en MakeYou convierten 3× → subí el cap o mandales más", "minoristas en MK con CTR bajo → revisar copy").
5. 🚀 Las 3 acciones más urgentes con impacto en revenue.
Formato: máximo 350 palabras, headers ## y bullets, números reales.`,
    label: "Analista del agente de email",
    icon: "✉️",
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
