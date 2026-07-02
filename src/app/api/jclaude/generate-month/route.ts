import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse, after } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getOrCreateDefaultBrand, getOrCreateDefaultCampaign } from "@/lib/adapters/campaigns"
import { insertCreativeForPost, insertAssetForCreative, deleteDraftAssets } from "@/lib/adapters/assets"
import { emitEvent, emitActivity } from "@/lib/events"
import { loadBrandKnowledgeContext, extractAndStoreKnowledge } from "@/lib/knowledge/engine"
import { loadDecisionContext } from "@/lib/decision/engine"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL     = "claude-sonnet-4-6"
const PROMPT_V  = "generate-month-v4"   // v4: knowledge + decision-aware

type PostPlan = {
  date: string; time: string; network: string; post_type: string
  copy: string; hashtags: string; image_brief: string
}

type VideoPlan = {
  date: string; time: string; network: string
  caption: string; hashtags: string; brief: string
}

export async function POST(req: NextRequest) {
  const { workspaceId, month, year, profile, subscription } = await req.json()

  if (!workspaceId || !profile) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const startDate  = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate    = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`
  const monthName  = new Date(year, month - 1, 1).toLocaleString("es-AR", { month: "long" })
  const daysInMonth = new Date(year, month, 0).getDate()
  const postsLimit     = Math.min(subscription?.posts_limit || 8, 12)
  const networks       = ["instagram", "facebook"].slice(0, subscription?.networks_limit || 2)
  const videosPerWeek  = subscription?.videos_limit ?? 0
  const weeksInMonth   = Math.ceil(daysInMonth / 7)
  const videosPerMonth = videosPerWeek * weeksInMonth

  // ── 1. Resolver Brand y Campaign ──────────────────────────────
  let brand: import("@/lib/types/domain").Brand | undefined
  let campaign: import("@/lib/types/domain").Campaign | undefined
  try {
    brand    = await getOrCreateDefaultBrand(supabase, workspaceId, profile.brand_name)
    campaign = await getOrCreateDefaultCampaign(supabase, workspaceId, brand.id, year)
  } catch (err) {
    console.error("[generate-month] Domain resolution error:", err)
  }

  // ── 1b. Cargar Knowledge + Decision Context ──────────────────
  // Knowledge: qué sabe el sistema sobre la brand
  // Decisions: qué decidió el sistema sobre cómo actuar
  // Claude consume ambos. No genera ninguno de los dos.
  let knowledgeContext = ""
  let decisionContext  = ""
  if (brand) {
    try {
      const [kCtx, dCtx] = await Promise.all([
        loadBrandKnowledgeContext(supabase, workspaceId, brand.id, brand.name),
        loadDecisionContext(supabase, workspaceId, brand.id),
      ])
      knowledgeContext = kCtx.promptContext
      decisionContext  = dCtx.promptContext
    } catch {
      // Load failure nunca bloquea la generación
    }
  }

  // ── 2. Borrar drafts del mes en ambas tablas ──────────────────
  await Promise.all([
    supabase.from("jclaude_posts")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("status", "draft")
      .gte("scheduled_at", startDate)
      .lte("scheduled_at", endDate + "T23:59:59"),
    campaign
      ? deleteDraftAssets(supabase, workspaceId, campaign.id, { start: startDate, end: endDate })
      : Promise.resolve(),
  ])

  // ── 3. Registrar Agent Job ────────────────────────────────────
  const jobStartedAt = new Date().toISOString()
  const jobStart     = Date.now()

  const { data: agentJob } = await supabase
    .from("agent_jobs")
    .insert({
      workspace_id:   workspaceId,
      campaign_id:    campaign?.id ?? null,
      agent_type:     "copy",
      status:         "running",
      model:          MODEL,
      prompt_version: PROMPT_V,
      input:          { workspaceId, month, year, postsLimit, networks, profile: { brand_name: profile.brand_name, industry: profile.industry } },
      triggered_by:   user.id,
      started_at:     jobStartedAt,
    })
    .select("id")
    .single()

  await emitEvent({
    workspaceId,
    eventType:  "agent_job.started",
    entityType: "agent_job",
    entityId:   agentJob?.id,
    actorId:    user.id,
    actorType:  "user",
    brandId:    brand?.id,
    campaignId: campaign?.id,
    metadata:   { model: MODEL, prompt_version: PROMPT_V },
  })

  await emitEvent({
    workspaceId,
    eventType:  "month.generation.started",
    entityType: "campaign",
    entityId:   campaign?.id,
    actorId:    user.id,
    actorType:  "user",
    brandId:    brand?.id,
    campaignId: campaign?.id,
    metadata:   { month, year },
  })

  // ── 4. Llamar a Claude ────────────────────────────────────────
  const tClaude = Date.now()
  console.log(`[gm-timing] pre-claude_ms=${tClaude - jobStart} ctxchars=${(knowledgeContext?.length ?? 0) + (decisionContext?.length ?? 0)} posts=${postsLimit} videos=${videosPerMonth}`)
  let message: Awaited<ReturnType<typeof anthropic.messages.create>>
  try {
    message = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `Creá un calendario de contenido para ${monthName} ${year} para una marca argentina.

MARCA: ${profile.brand_name || "la marca"} | Rubro: ${profile.industry || "general"} | Tono: ${profile.tone || "profesional"} | Audiencia: ${profile.target_audience || "general"}
${knowledgeContext}${decisionContext}
REGLAS POSTS:
- Exactamente ${postsLimit} posts distribuidos en el mes (días 1 al ${daysInMonth})
- Redes: ${networks.join(", ")}
- Tipos: post, reel, story
- Horarios: 09:00, 12:00, 18:00 o 20:00
- Copy máximo 150 caracteres por post
- Hashtags: máximo 8
${videosPerMonth > 0 ? `
REGLAS VIDEOS (Reels con generación IA):
- Exactamente ${videosPerMonth} videos distribuidos en el mes (1 por semana aproximadamente)
- Red: ${networks[0]} (canal principal)
- Horario: 18:00 o 20:00 (mayor engagement)
- Caption máximo 100 caracteres
- Brief: descripción detallada y visual del video para generación con IA (qué se ve, movimiento, ambiente, colores, duración ~5s)
` : ""}
Respondé ÚNICAMENTE con este JSON, sin texto adicional, sin markdown:
${videosPerMonth > 0
  ? `{"posts":[{"date":"${year}-${String(month).padStart(2,"0")}-01","time":"09:00","network":"instagram","post_type":"post","copy":"texto","hashtags":"#hash1","image_brief":"descripción imagen"}],"videos":[{"date":"${year}-${String(month).padStart(2,"0")}-07","time":"18:00","network":"instagram","caption":"texto del video","hashtags":"#hash1","brief":"descripción detallada para IA del video"}]}`
  : `{"posts":[{"date":"${year}-${String(month).padStart(2,"0")}-01","time":"09:00","network":"instagram","post_type":"post","copy":"texto del post","hashtags":"#hash1 #hash2","image_brief":"descripción imagen"}]}`
}`
      }],
    })
  } catch (claudeErr) {
    const errMsg = claudeErr instanceof Error ? claudeErr.message : String(claudeErr)
    await supabase.from("agent_jobs").update({
      status: "failed", error_message: errMsg,
      duration_ms: Date.now() - jobStart, completed_at: new Date().toISOString(),
    }).eq("id", agentJob?.id)
    await emitEvent({
      workspaceId, eventType: "month.generation.failed",
      actorId: user.id, actorType: "user", brandId: brand?.id, campaignId: campaign?.id,
      metadata: { error: errMsg, month, year },
    })
    return NextResponse.json({ error: "Error llamando a Claude", detail: errMsg }, { status: 500 })
  }

  console.log(`[gm-timing] claude_ms=${Date.now() - tClaude} in=${message.usage.input_tokens} out=${message.usage.output_tokens}`)

  // ── 5. Parsear respuesta ──────────────────────────────────────
  const raw = message.content[0].type === "text" ? message.content[0].text : ""
  let plan: PostPlan[]  = []
  let videos: VideoPlan[] = []

  const parseFull = (text: string) => {
    try { const p = JSON.parse(text.trim()); plan = p?.posts || []; videos = p?.videos || []; return true } catch { return false }
  }
  if (!parseFull(raw)) {
    try {
      const lines = raw.split("\n").filter(l => !l.trim().startsWith("```"))
      parseFull(lines.join("\n").trim())
    } catch {}
  }
  if (plan.length === 0) {
    try {
      const s = raw.indexOf("{"); const e = raw.lastIndexOf("}")
      if (s !== -1 && e !== -1) parseFull(raw.slice(s, e + 1))
    } catch {}
  }

  if (plan.length === 0) {
    console.error("[generate-month] Parse failed. Raw:", raw.slice(0, 300))
    await supabase.from("agent_jobs").update({
      status: "failed", error_message: "Parse failed",
      duration_ms: Date.now() - jobStart, completed_at: new Date().toISOString(),
    }).eq("id", agentJob?.id)
    await emitEvent({
      workspaceId, eventType: "month.generation.failed",
      actorId: user.id, actorType: "user", brandId: brand?.id, campaignId: campaign?.id,
      metadata: { error: "parse_failed", month, year },
    })
    return NextResponse.json({ error: "No se pudo parsear la respuesta de IA", raw: raw.slice(0, 200) }, { status: 500 })
  }

  // ── 6. Escribir tabla legacy (jclaude_posts) ──────────────────
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

  const { data: inserted, error: legacyError } = await supabase
    .from("jclaude_posts")
    .insert(legacyRows)
    .select()

  if (legacyError) {
    return NextResponse.json({ error: legacyError.message }, { status: 500 })
  }

  // ── 7. Dual-write: Creative → Asset (cadena correcta) ─────────
  // Video assets: insertar placeholders con status "generating".
  // El cliente llama /api/jclaude/generate-video por cada uno en background.
  type VideoAssetRef = { assetId: string; brief: string; network: string; caption: string }
  const videoAssetRefs: VideoAssetRef[] = []

  // Contenido de JClaude puede no tener campaña (ADR-007): campaign_id = null
  const resolvedCampaignId = campaign?.id ?? null

  if (videos.length > 0) {
    for (const v of videos) {
      const { creativeId } = await insertCreativeForPost(supabase, {
        workspaceId,
        campaignId:  resolvedCampaignId,
        content:     v.caption + (v.hashtags ? `\n\n${v.hashtags}` : ""),
        agentJobId:  agentJob?.id,
      }).catch(() => ({ creativeId: undefined, error: "video creative error" }))

      if (!creativeId) continue

      const { assetId } = await insertAssetForCreative(supabase, {
        workspaceId,
        campaignId:  resolvedCampaignId,
        creativeId,
        channel:     v.network,
        assetType:   "video",
        caption:     v.caption,
        hashtags:    v.hashtags,
        imageBrief:  v.brief,
        scheduledAt: `${v.date}T${v.time}:00`,
        agentJobId:  agentJob?.id,
      }).catch(() => ({ assetId: undefined, error: "video asset error" }))

      if (!assetId) continue

      // Marcar como "generating" para que la UI muestre el estado correcto
      await supabase.from("assets").update({
        status:     "generating",
        metadata:   { brief: v.brief, source: "seedance", video_pending: true },
        updated_at: new Date().toISOString(),
      }).eq("id", assetId)

      videoAssetRefs.push({ assetId, brief: v.brief, network: v.network, caption: v.caption })
    }
  }

  if (inserted) {
    // Best-effort, no bloquea la respuesta (evita timeout). La consistencia
    // la garantiza el backfill idempotente (Asset Domain Migration Plan, Paso 3).
    void Promise.all(
      plan.map(async (p, i) => {
        const legacyId = inserted[i]?.id

        // 7a. Insertar Creative
        const { creativeId, error: crErr } = await insertCreativeForPost(supabase, {
          workspaceId,
          campaignId:  resolvedCampaignId,
          content:     p.copy + (p.hashtags ? `\n\n${p.hashtags}` : ""),
          agentJobId:  agentJob?.id,
          sourceTable: legacyId ? "jclaude_posts" : undefined,
          sourceId:    legacyId,
        })

        if (crErr || !creativeId) {
          console.error("[generate-month] Creative insert error:", crErr)
          return
        }

        await emitEvent({
          workspaceId,
          eventType:  "creative.created",
          entityType: "creative",
          entityId:   creativeId,
          actorType:  "agent",
          brandId:    brand?.id,
          campaignId: resolvedCampaignId ?? undefined,
          metadata:   { agent_job_id: agentJob?.id },
        })

        // 7b. Insertar Asset vinculado al Creative
        const { assetId, error: assetErr } = await insertAssetForCreative(supabase, {
          workspaceId,
          campaignId:  resolvedCampaignId,
          creativeId,
          channel:     p.network,
          assetType:   p.post_type,
          caption:     p.copy,
          hashtags:    p.hashtags,
          imageBrief:  p.image_brief,
          scheduledAt: `${p.date}T${p.time}:00`,
          agentJobId:  agentJob?.id,
          sourceTable: legacyId ? "jclaude_posts" : undefined,
          sourceId:    legacyId,
        })

        if (assetErr || !assetId) {
          console.error("[generate-month] Asset insert error:", assetErr)
          return
        }

        await emitEvent({
          workspaceId,
          eventType:  "asset.created",
          entityType: "asset",
          entityId:   assetId,
          actorType:  "agent",
          brandId:    brand?.id,
          campaignId: resolvedCampaignId ?? undefined,
          metadata:   { creative_id: creativeId, agent_job_id: agentJob?.id },
        })
      })
    ).catch(err => console.error("[generate-month] Domain dual-write error:", err))
  }

  // ── 8. Actualizar Agent Job como completado ───────────────────
  const durationMs = Date.now() - jobStart
  await supabase.from("agent_jobs").update({
    status:        "completed",
    output:        { count: plan.length },
    duration_ms:   durationMs,
    tokens_input:  message.usage.input_tokens,
    tokens_output: message.usage.output_tokens,
    completed_at:  new Date().toISOString(),
  }).eq("id", agentJob?.id)

  // ── 9. Emitir eventos finales ─────────────────────────────────
  await Promise.all([
    emitEvent({
      workspaceId,
      eventType:  "agent_job.completed",
      entityType: "agent_job",
      entityId:   agentJob?.id,
      actorType:  "agent",
      brandId:    brand?.id,
      campaignId: campaign?.id,
      metadata:   { duration_ms: durationMs, count: plan.length, tokens_input: message.usage.input_tokens, tokens_output: message.usage.output_tokens },
    }),
    emitEvent({
      workspaceId,
      eventType:  "month.generation.completed",
      entityType: "campaign",
      entityId:   campaign?.id,
      actorId:    user.id,
      actorType:  "user",
      brandId:    brand?.id,
      campaignId: campaign?.id,
      metadata:   { month, year, count: plan.length, agent_job_id: agentJob?.id },
    }),
    emitActivity({
      workspace_id: workspaceId,
      user_id:      user.id,
      action:       "month.generated",
      entity_type:  "campaign",
      entity_id:    campaign?.id,
      metadata:     { month, year, count: inserted?.length ?? 0, campaign_id: campaign?.id, brand_id: brand?.id },
    }),
  ])

  // ── 10. Knowledge Extraction + Decision Generation ───────────
  // Corre DESPUÉS de enviar la respuesta (Next `after`): no cuenta contra el
  // tiempo del request → evita el timeout de 60s. El contenido ya está generado;
  // el pipeline de conocimiento se procesa en background.
  if (brand) {
    const brandId = brand.id
    const campaignId = campaign?.id
    after(async () => {
      try {
        await extractAndStoreKnowledge(supabase, workspaceId, brandId, campaignId)
      } catch (err) {
        console.error("[generate-month] Knowledge/Decision pipeline error:", err)
      }
    })
  }

  console.log(`[gm-timing] total_ms=${Date.now() - jobStart} posts_inserted=${inserted?.length ?? 0} videos=${videoAssetRefs.length}`)

  return NextResponse.json({
    posts:        inserted,
    count:        inserted?.length,
    videos:       videoAssetRefs,       // cliente llama generate-video por cada uno
    videos_count: videoAssetRefs.length,
  })
}
