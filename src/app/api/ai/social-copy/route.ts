import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { network, title, context, brand } = await req.json()

  const networkGuides: Record<string, string> = {
    instagram: "Instagram: máximo 2200 caracteres, tono visual y aspiracional, 5-10 hashtags relevantes al final, uso de emojis moderado",
    facebook: "Facebook: tono más conversacional y directo, puede ser más largo, menos hashtags (1-3), call to action claro",
    tiktok: "TikTok: muy dinámico y juvenil, frases cortas y punch, trending sounds/challenges si aplica, hashtags populares (#fyp #foryou)",
    youtube: "YouTube: descripción optimizada para SEO, incluir palabras clave, timestamps si aplica, links y CTAs",
    linkedin: "LinkedIn: tono profesional, storytelling, insights de valor, hashtags de industria",
  }

  const guide = networkGuides[network] || "Tono adaptado a la red social indicada"

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Sos un experto en marketing digital y copywriting para redes sociales.

Marca/cliente: ${brand || "marca de moda argentina"}
Red social: ${network}
Título del post: ${title}
Contexto adicional: ${context || "ninguno"}

Guía de estilo para ${network}: ${guide}

Generá 3 opciones de copy/caption diferentes para este post. Cada opción debe tener:
- Un estilo diferente (ej: aspiracional, urgente, storytelling)
- El texto completo listo para publicar
- Hashtags incluidos al final si corresponde

Respondé en formato JSON con esta estructura exacta:
{
  "options": [
    { "style": "nombre del estilo", "copy": "texto completo del post" },
    { "style": "nombre del estilo", "copy": "texto completo del post" },
    { "style": "nombre del estilo", "copy": "texto completo del post" }
  ]
}`
    }]
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { options: [] }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ options: [], raw: text })
  }
}
