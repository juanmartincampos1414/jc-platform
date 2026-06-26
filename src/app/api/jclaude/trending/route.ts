import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { industry, networks } = await req.json()

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Sos un experto en tendencias de marketing digital en Argentina.

Rubro: ${industry || "general"}
Redes activas: ${(networks || ["instagram"]).join(", ")}

Identificá 4 ideas de contenido trending o de alto engagement para este rubro en Argentina ahora mismo. Pensá en fechas especiales próximas, tendencias de consumo, temas de conversación actuales, o formatos virales.

Para cada idea incluí:
- El concepto del post
- Por qué es trending o relevante ahora
- La red ideal para publicarlo
- Un gancho/título atractivo

Respondé en formato JSON:
{
  "ideas": [
    {
      "concept": "descripción del concepto",
      "why_trending": "por qué es relevante ahora",
      "best_network": "instagram|facebook|tiktok|linkedin",
      "hook": "primer texto gancho del post"
    }
  ]
}`
    }]
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { ideas: [] }
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ ideas: [] })
  }
}
