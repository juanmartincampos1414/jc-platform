import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const NETWORK_GUIDES: Record<string, string> = {
  instagram: "Instagram: tono visual y aspiracional, 8-12 hashtags, emojis moderados",
  facebook: "Facebook: conversacional, 1-3 hashtags, call to action claro",
  tiktok: "TikTok: dinámico, frases cortas, gancho en la primera línea, #fyp",
  linkedin: "LinkedIn: profesional, storytelling, hashtags de industria",
}

export async function POST(req: NextRequest) {
  const { workspaceId, month, year, profile, subscription } = await req.json()

  if (!workspaceId || !profile) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const supabase = await createClient()

  // Delete existing drafts for this month (keep approved/published)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`

  await supabase
    .from("jclaude_posts")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate + "T23:59:59")

  const postsLimit = Math.min(subscription?.posts_limit || 8, 30)
  const networksAvailable = ["instagram", "facebook"].slice(0, subscription?.networks_limit || 2)
  const hasTrending = subscription?.trending || false

  const monthName = new Date(year, month - 1, 1).toLocaleString("es-AR", { month: "long" })
  const daysInMonth = new Date(year, month, 0).getDate()

  const networkGuideStr = networksAvailable
    .map(n => `- ${n}: ${NETWORK_GUIDES[n] || "tono adaptado"}`)
    .join("\n")

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8000,
    messages: [{
      role: "user",
      content: `Sos un experto en marketing digital para Argentina. Tenés que crear el calendario de contenido completo para ${monthName} ${year}.

PERFIL DE MARCA:
- Nombre: ${profile.brand_name || "la marca"}
- Rubro: ${profile.industry || "general"}
- Tono: ${profile.tone || "profesional y cercano"}
- Audiencia: ${profile.target_audience || "público general"}
- Mensajes clave: ${profile.key_messages || "ninguno"}

PARÁMETROS:
- Total de publicaciones para el mes: ${postsLimit}
- Redes disponibles: ${networksAvailable.join(", ")}
- El mes tiene ${daysInMonth} días
${hasTrending ? "- Incluí al menos 3 posts de contenido trending/viral para el rubro" : ""}

GUÍAS POR RED:
${networkGuideStr}

TIPOS DE CONTENIDO a distribuir:
- post: publicación estática con imagen
- reel: video corto (copy como guión/descripción)
- story: historia efímera (copy breve, máximo 2 líneas)

INSTRUCCIONES:
1. Distribuí las ${postsLimit} publicaciones de forma estratégica en el mes (no todos los días, dejá días de descanso)
2. Variá los tipos (post, reel, story) y las redes
3. Programá en horarios de alto engagement: 9:00, 12:00, 18:00, 20:00
4. Para días especiales del mes (si los hay) aprovechalos temáticamente
5. Cada post debe tener copy completo listo para publicar

Respondé SOLO con JSON válido, sin texto antes ni después:
{
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "network": "instagram|facebook|tiktok",
      "post_type": "post|reel|story",
      "copy": "texto completo del post",
      "hashtags": "#hash1 #hash2",
      "image_brief": "descripción breve de imagen/video ideal"
    }
  ]
}`
    }]
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  let plan: { date: string; time: string; network: string; post_type: string; copy: string; hashtags: string; image_brief: string }[] = []
  try {
    // Strip opening and closing markdown fences unconditionally
    let cleaned = text.trim()
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "")
    cleaned = cleaned.replace(/\s*```\s*$/, "")
    cleaned = cleaned.trim()

    const parsed = JSON.parse(cleaned)
    plan = parsed?.posts || parsed?.calendar || (Array.isArray(parsed) ? parsed : [])
  } catch (e) {
    console.error("Parse error:", e, "Raw:", text.slice(0, 500))
    return NextResponse.json({ error: "Parse error from AI", raw: text.slice(0, 500) }, { status: 500 })
  }

  if (plan.length === 0) {
    return NextResponse.json({ error: "No posts generated", raw: text.slice(0, 300) }, { status: 500 })
  }

  // Save to Supabase
  const rows = plan.map(p => ({
    workspace_id: workspaceId,
    network: p.network,
    post_type: p.post_type,
    copy: p.copy,
    hashtags: p.hashtags,
    image_brief: p.image_brief,
    status: "draft",
    scheduled_at: `${p.date}T${p.time}:00`,
  }))

  const { data: inserted, error } = await supabase
    .from("jclaude_posts")
    .insert(rows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: inserted, count: inserted?.length })
}
