import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const NETWORK_GUIDES: Record<string, string> = {
  instagram: "Instagram: máximo 2200 caracteres, tono visual y aspiracional, 8-12 hashtags relevantes al final, emojis moderados",
  facebook: "Facebook: conversacional y directo, puede ser más largo, 1-3 hashtags, call to action claro",
  tiktok: "TikTok: dinámico y juvenil, frases cortas con impacto, hashtags populares (#fyp), gancho en la primera línea",
  youtube: "YouTube: descripción optimizada para SEO, palabras clave del rubro, CTA al final",
  linkedin: "LinkedIn: tono profesional con storytelling, insights de valor, hashtags de industria",
}

export async function POST(req: NextRequest) {
  const { network, postType, profile } = await req.json()

  if (!network || !profile) {
    return NextResponse.json({ error: "Missing network or profile" }, { status: 400 })
  }

  const guide = NETWORK_GUIDES[network] || "Tono adaptado a la red social indicada"

  const trendingExtra = postType === "trending"
    ? `Además, basate en las tendencias actuales del sector ${profile.industry} en Argentina. El post debe aprovechar algún trend o tema de conversación relevante del momento.`
    : ""

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    messages: [{
      role: "user",
      content: `Sos un experto en marketing digital para el mercado argentino.

PERFIL DE MARCA:
- Nombre: ${profile.brand_name || "la marca"}
- Rubro: ${profile.industry || "no especificado"}
- Tono de comunicación: ${profile.tone || "profesional y cercano"}
- Audiencia objetivo: ${profile.target_audience || "público general"}
- Mensajes clave: ${profile.key_messages || "ninguno especificado"}

RED SOCIAL: ${network}
GUÍA DE ESTILO: ${guide}

${trendingExtra}

Generá 1 post completo listo para publicar. Incluí:
1. El copy/caption completo
2. Los hashtags separados
3. Un brief breve (1-2 oraciones) de qué imagen o video acompañaría el post

Respondé en formato JSON exacto:
{
  "copy": "texto del post sin hashtags",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3",
  "image_brief": "descripción breve de la imagen/video ideal para este post"
}`
    }]
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    if (!parsed) throw new Error("No JSON found")
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "Parse error", raw: text }, { status: 500 })
  }
}
