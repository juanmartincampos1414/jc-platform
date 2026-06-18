import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { influencer, brand } = await req.json()

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Sos un experto en influencer marketing. Analizá el fit entre este influencer y la marca cliente.

INFLUENCER:
- Nombre: ${influencer.name}
- Handle: ${influencer.handle}
- Red: ${influencer.network}
- Seguidores: ${influencer.followers?.toLocaleString("es-AR")}
- Engagement rate: ${influencer.engagementRate}%
- Categoría: ${influencer.category}
- Fee propuesto: $${influencer.feeProposal?.toLocaleString("es-AR") || "no definido"}
- Notas: ${influencer.notes || "ninguna"}

MARCA/CLIENTE:
${brand || "Marca de moda y lifestyle argentina, target femenino 25-40 años, segmento ABC1"}

Analizá y respondé en formato JSON con esta estructura exacta:
{
  "fit_score": número del 1 al 10,
  "fit_label": "Excelente fit|Buen fit|Fit moderado|Bajo fit",
  "audience_match": "análisis de si la audiencia del influencer coincide con el target de la marca",
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "risks": ["riesgo o consideración 1", "riesgo 2"],
  "fee_assessment": "si el fee es justo, caro o barato para el alcance y engagement",
  "recommendation": "recomendación final concreta: aprobar, negociar precio, o descartar y por qué"
}`
    }]
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "parse_error", raw: text })
  }
}
