import Anthropic from "@anthropic-ai/sdk"
import OpenAI from "openai"

const SYSTEM_PROMPT = `Eres un experto en analytics de ecommerce y estrategia de crecimiento digital, especializado en INDUMENTARIA y MODA en Argentina.
Tu trabajo es analizar métricas de "Marcela Koury", una tienda online de ropa/indumentaria que vende tanto a minoristas como mayoristas.

Contexto del negocio:
- Es una tienda de indumentaria argentina (ropa de mujer principalmente)
- Tiene diferentes grupos de clientes: Mayoristas, Minoristas (público general y guests), Revendedoras, Comercios y Personal Interno
- Los precios están en ARS (pesos argentinos)
- Vende online con envíos a todo el país
- Las temporadas de moda son clave: primavera/verano y otoño/invierno
- Fechas clave: Hot Sale, CyberMonday, Día de la Madre, Black Friday, Fiestas

Reglas:
- Respondé siempre en español argentino
- Priorizá recomendaciones por impacto financiero estimado
- Sé específico: incluí números, porcentajes y acciones concretas basadas en los datos
- Categorizá las recomendaciones en: 🔴 Críticas (acción inmediata), 🟡 Alta Prioridad (esta semana), 🟢 Oportunidades (a explorar)
- Si detectás métricas preocupantes, alertá primero
- Incluí insights sobre retención de clientes y riesgo de churn
- Sugerí acciones concretas para cada insight
- Analizá la diferencia de comportamiento entre grupos de clientes (mayoristas vs minoristas)
- Sugerí campañas de WhatsApp personalizadas por segmento de cliente
- Tené en cuenta la estacionalidad de la moda argentina al recomendar acciones
- Cuando hables de la tasa de conversión de pagos, comparala con benchmarks de ecommerce argentino (~2-3%)

Formato de respuesta: Usá markdown con headers ## para cada categoría.`

export async function getAIRecommendations(
  metrics: Record<string, any>,
  provider: "anthropic" | "openai" = "openai"
): Promise<string> {
  const userMessage = `Analizá estas métricas de Marcela Koury (tienda de indumentaria) y dáme recomendaciones accionables:

${JSON.stringify(metrics, null, 2)}

Generá un análisis completo con:
1. ## 📊 Resumen Ejecutivo (3-5 bullets con los datos más importantes)
2. ## 🔴 Acciones Críticas (hacer hoy/mañana — incluí pasos concretos)
3. ## 🟡 Alta Prioridad (esta semana — con estimación de impacto)
4. ## 🟢 Oportunidades de Crecimiento (ideas para explorar)
5. ## 👥 Análisis de Clientes por Segmento (mayoristas vs minoristas vs revendedoras — cómo tratar a cada grupo)
6. ## 📱 Campañas WhatsApp Sugeridas (mensajes específicos por segmento de cliente según riesgo de churn)
7. ## ⚠️ Alertas y Riesgos (qué vigilar)

IMPORTANTE: Basá todas las recomendaciones en los DATOS REALES proporcionados. Usá los números específicos en tus análisis.`

  if (provider === "anthropic") {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    return textBlock?.text || "No se pudo generar el análisis."
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  })

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    max_tokens: 2048,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  })

  return completion.choices[0].message.content || "No se pudo generar el análisis."
}

// ============================================================
// REDACCIÓN DE MENSAJES DE WHATSAPP (1 a 1 con la clienta)
// ============================================================

const MESSAGE_SYSTEM_PROMPT = `Sos redactor de mensajes de WhatsApp para "Marcela Koury", una tienda de indumentaria de mujer en Argentina.
Escribís mensajes 1 a 1, cálidos, cercanos y en español argentino (tratá de "vos").
Reglas:
- Corto: 2 a 4 oraciones. Es un WhatsApp, no un email.
- Personal y humano, NADA de spam ni tono robótico o de plantilla.
- Como máximo 1-2 emojis, y solo si suman.
- Invitá a volver a comprar / responder de forma natural, sin presionar.
- No inventes datos (precios, códigos de descuento, productos) que no estén en la info dada.
- Devolvé SOLO el texto del mensaje, sin comillas ni encabezados ni explicaciones.`

export interface CustomerMessageInput {
  firstName?: string
  daysSinceLastOrder?: number | null
  orderCount?: number
  totalSpent?: number
  topProducts?: string[]
  lastNote?: string
  /** Objetivo del mensaje: reactivar, agradecer, novedades, etc. */
  goal?: string
}

export async function draftCustomerMessage(
  input: CustomerMessageInput,
  provider: "anthropic" | "openai" = "openai"
): Promise<string> {
  const userMessage = `Redactá un mensaje de WhatsApp para esta clienta de Marcela Koury, según su perfil:

${JSON.stringify(input, null, 2)}

Tené en cuenta:
- Si hace muchos días que no compra, el objetivo es reactivarla con calidez.
- Si compró hace poco o es recurrente, agradecé y ofrecé novedades/beneficio.
- Si nunca compró, dale la bienvenida y ofrecé ayuda.
Devolvé SOLO el texto del mensaje.`

  if (provider === "anthropic") {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 400,
      system: MESSAGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })
    const textBlock = message.content.find((block) => block.type === "text")
    return textBlock?.text?.trim() || ""
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    max_tokens: 400,
    messages: [
      { role: "system", content: MESSAGE_SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  })
  return completion.choices[0].message.content?.trim() || ""
}

export async function getAIPageInsight(
  metrics: Record<string, any>,
  focusInstruction: string,
  provider: "anthropic" | "openai" = "openai"
): Promise<string> {
  const userMessage = `Analizá estas métricas de Marcela Koury y dáme un insight BREVE y accionable:

${JSON.stringify(metrics, null, 2)}

${focusInstruction}

IMPORTANTE: Basá todo en los DATOS REALES proporcionados. Usá números específicos. Sé conciso y directo.`

  if (provider === "anthropic") {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })

    const textBlock = message.content.find((block) => block.type === "text")
    return textBlock?.text || "No se pudo generar el análisis."
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  })

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
  })

  return completion.choices[0].message.content || "No se pudo generar el análisis."
}
