import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { workspaceId, month, year, profile, subscription } = await req.json()

  if (!workspaceId || !profile) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const supabase = await createClient()

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`

  await supabase
    .from("jclaude_posts")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate + "T23:59:59")

  // Cap at 12 posts to stay well within Vercel 60s timeout
  const postsLimit = Math.min(subscription?.posts_limit || 8, 12)
  const networksAvailable = ["instagram", "facebook"].slice(0, subscription?.networks_limit || 2)
  const monthName = new Date(year, month - 1, 1).toLocaleString("es-AR", { month: "long" })
  const daysInMonth = new Date(year, month, 0).getDate()

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Creá un calendario de contenido para ${monthName} ${year} para una marca argentina.

MARCA: ${profile.brand_name || "la marca"} | Rubro: ${profile.industry || "general"} | Tono: ${profile.tone || "profesional"} | Audiencia: ${profile.target_audience || "general"}

REGLAS:
- Exactamente ${postsLimit} posts distribuidos en el mes (días 1 al ${daysInMonth})
- Redes: ${networksAvailable.join(", ")}
- Tipos: post, reel, story
- Horarios: 09:00, 12:00, 18:00 o 20:00
- Copy máximo 150 caracteres por post
- Hashtags: máximo 8

Respondé ÚNICAMENTE con este JSON, sin texto adicional, sin markdown:
{"posts":[{"date":"${year}-${String(month).padStart(2,"0")}-01","time":"09:00","network":"instagram","post_type":"post","copy":"texto del post","hashtags":"#hash1 #hash2","image_brief":"descripción imagen"}]}`
    }]
  })

  const raw = message.content[0].type === "text" ? message.content[0].text : ""

  // Robust JSON extraction
  let plan: { date: string; time: string; network: string; post_type: string; copy: string; hashtags: string; image_brief: string }[] = []

  // Try 1: parse directly
  try { const p = JSON.parse(raw.trim()); plan = p?.posts || [] } catch {}

  // Try 2: strip markdown fences line by line
  if (plan.length === 0) {
    try {
      const lines = raw.split("\n").filter(l => !l.trim().startsWith("```"))
      const p = JSON.parse(lines.join("\n").trim())
      plan = p?.posts || []
    } catch {}
  }

  // Try 3: extract first {...} block
  if (plan.length === 0) {
    try {
      const start = raw.indexOf("{")
      const end = raw.lastIndexOf("}")
      if (start !== -1 && end !== -1) {
        const p = JSON.parse(raw.slice(start, end + 1))
        plan = p?.posts || []
      }
    } catch {}
  }

  if (plan.length === 0) {
    console.error("All parse attempts failed. Raw:", raw.slice(0, 300))
    return NextResponse.json({ error: "No se pudo parsear la respuesta de IA", raw: raw.slice(0, 200) }, { status: 500 })
  }

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
