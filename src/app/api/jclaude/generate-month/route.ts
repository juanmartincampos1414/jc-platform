import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateDefaultBrand, getOrCreateDefaultCampaign } from "@/lib/adapters/campaigns"
import { insertAssetFromJClaudePost, deleteDraftAssets } from "@/lib/adapters/assets"
import { emitActivity } from "@/lib/activity"

export const maxDuration = 60

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { workspaceId, month, year, profile, subscription } = await req.json()

  if (!workspaceId || !profile) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate   = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`

  // ── Dual-write: borrar drafts en tabla vieja Y nueva ─────────
  await Promise.all([
    supabase.from("jclaude_posts")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("status", "draft")
      .gte("scheduled_at", startDate)
      .lte("scheduled_at", endDate + "T23:59:59"),
  ])

  // Obtener Brand y Campaign por defecto (se crean si no existen)
  let brand, campaign
  try {
    brand    = await getOrCreateDefaultBrand(supabase, workspaceId, profile.brand_name)
    campaign = await getOrCreateDefaultCampaign(supabase, workspaceId, brand.id, year)
    await deleteDraftAssets(supabase, workspaceId, campaign.id, { start: startDate, end: endDate })
  } catch (err) {
    // Si falla la resolución del dominio nuevo, logueamos pero seguimos con tabla vieja
    console.error("[generate-month] Domain resolution error:", err)
  }

  // ── Llamada a Claude ──────────────────────────────────────────
  const postsLimit       = Math.min(subscription?.posts_limit || 8, 12)
  const networksAvailable = ["instagram", "facebook"].slice(0, subscription?.networks_limit || 2)
  const monthName        = new Date(year, month - 1, 1).toLocaleString("es-AR", { month: "long" })
  const daysInMonth      = new Date(year, month, 0).getDate()

  const message = await client.messages.create({
    model:      "claude-sonnet-4-6",
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

  type PostPlan = { date: string; time: string; network: string; post_type: string; copy: string; hashtags: string; image_brief: string }
  let plan: PostPlan[] = []

  try { const p = JSON.parse(raw.trim()); plan = p?.posts || [] } catch {}
  if (plan.length === 0) {
    try {
      const lines = raw.split("\n").filter(l => !l.trim().startsWith("```"))
      const p = JSON.parse(lines.join("\n").trim())
      plan = p?.posts || []
    } catch {}
  }
  if (plan.length === 0) {
    try {
      const start = raw.indexOf("{"); const end = raw.lastIndexOf("}")
      if (start !== -1 && end !== -1) { const p = JSON.parse(raw.slice(start, end + 1)); plan = p?.posts || [] }
    } catch {}
  }

  if (plan.length === 0) {
    console.error("[generate-month] Parse failed. Raw:", raw.slice(0, 300))
    return NextResponse.json({ error: "No se pudo parsear la respuesta de IA", raw: raw.slice(0, 200) }, { status: 500 })
  }

  // ── Dual-write: tabla vieja (jclaude_posts) ───────────────────
  const legacyRows = plan.map(p => ({
    workspace_id: workspaceId,
    network:      p.network,
    post_type:    p.post_type,
    copy:         p.copy,
    hashtags:     p.hashtags,
    image_brief:  p.image_brief,
    status:       "draft",
    scheduled_at: `${p.date}T${p.time}:00`,
  }))

  const { data: inserted, error } = await supabase
    .from("jclaude_posts")
    .insert(legacyRows)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Dual-write: tabla nueva (assets) ─────────────────────────
  if (campaign && inserted) {
    const assetInserts = plan.map((p, i) =>
      insertAssetFromJClaudePost(supabase, {
        workspaceId,
        campaignId:   campaign.id,
        channel:      p.network,
        assetType:    p.post_type,
        caption:      p.copy,
        hashtags:     p.hashtags,
        imageBrief:   p.image_brief,
        scheduledAt:  `${p.date}T${p.time}:00`,
        sourceId:     inserted[i]?.id,
      })
    )
    // Fire-and-forget — no bloqueamos la respuesta si falla la nueva tabla
    Promise.all(assetInserts).catch(err =>
      console.error("[generate-month] Asset dual-write error:", err)
    )
  }

  // ── Evento ────────────────────────────────────────────────────
  await emitActivity({
    workspace_id: workspaceId,
    user_id:      user.id,
    action:       "month.generated",
    entity_type:  "campaign",
    entity_id:    campaign?.id,
    metadata: {
      month,
      year,
      count:       inserted?.length ?? 0,
      campaign_id: campaign?.id,
      brand_id:    brand?.id,
    },
  })

  return NextResponse.json({ posts: inserted, count: inserted?.length })
}
