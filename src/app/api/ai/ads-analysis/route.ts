import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { platform, metrics, campaigns, budget, month } = await req.json()

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Sos un experto en performance marketing y media buying. Analizá los siguientes resultados publicitarios y dá recomendaciones concretas.

Plataforma: ${platform}
Período: ${month}
Presupuesto aprobado: $${budget?.approved?.toLocaleString("es-AR") || "N/A"}
Presupuesto ejecutado: $${budget?.executed?.toLocaleString("es-AR") || "N/A"}

Métricas generales:
- Impresiones: ${metrics?.impressions?.toLocaleString("es-AR") || 0}
- Clics: ${metrics?.clicks?.toLocaleString("es-AR") || 0}
- CTR: ${metrics?.ctr || 0}%
- Conversiones: ${metrics?.conversions || 0}
- CPA: $${metrics?.cpa?.toLocaleString("es-AR") || 0}
- ROAS: ${metrics?.roas || 0}x

Campañas activas:
${campaigns?.map((c: {name: string; spend: number; budget: number; roas: number; cpa: number; status: string}) => `- ${c.name}: spend $${c.spend?.toLocaleString("es-AR")}, ROAS ${c.roas}x, CPA $${c.cpa?.toLocaleString("es-AR")}, estado: ${c.status}`).join("\n") || "Sin datos de campañas"}

Respondé en formato JSON con esta estructura exacta:
{
  "summary": "resumen ejecutivo en 2-3 oraciones",
  "score": número del 1 al 10 indicando performance general,
  "highlights": ["punto positivo 1", "punto positivo 2"],
  "warnings": ["alerta o problema 1", "alerta o problema 2"],
  "recommendations": [
    { "priority": "alta|media|baja", "action": "acción concreta a tomar", "expected_impact": "impacto esperado" }
  ]
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
