// Decision Engine
// Transforma Knowledge Objects en Decisions.
// Las Decisions son independientes de Claude y de la UI.
// Pipeline: Events + Assets → Knowledge → Decision → Recommendation

import type { SupabaseClient } from "@supabase/supabase-js"
import type { KnowledgeObject } from "@/lib/knowledge/types"
import type { Decision, DecisionContext, DecisionType, SupportingEvidence, SupportingKnowledge } from "./types"
import { assessDecisionQuality } from "./types"
import { emitEvent } from "@/lib/events"

// ─── Derivar Decisions desde Knowledge Objects ────────────────────────────────

function deriveContentDecision(objects: KnowledgeObject[], sampleSize: number): Decision | null {
  const mix = objects.find(o => o.type === "content_mix")
  if (!mix || mix.confidence < 0.3) return null

  const data = mix.data as { counts: Record<string, number>; sorted: [string, number][] }
  const total = Object.values(data.counts ?? {}).reduce((s, n) => s + n, 0)
  const dominant = (data.sorted ?? Object.entries(data.counts ?? {}).sort((a, b) => b[1] - a[1]))[0]
  if (!dominant) return null

  const [topType, topCount] = dominant
  const topPct = total > 0 ? Math.round((topCount / total) * 100) : 0
  const rationale = `El formato "${topType}" representa el ${topPct}% del contenido generado. Priorizar este formato en nuevas campañas.`

  return {
    workspace_id: "",  // se rellena en buildDecisions
    brand_id: "",
    decision_type: "content",
    status: "active",
    confidence: mix.confidence,
    rationale,
    supporting_knowledge: [{ type: mix.type, title: mix.title, content: mix.content, confidence: mix.confidence }],
    supporting_evidence: [{ source: "assets", description: mix.content, sample_size: sampleSize }],
    source_events: ["asset.created"],
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

function deriveChannelDecision(objects: KnowledgeObject[], sampleSize: number): Decision | null {
  const affinity = objects.find(o => o.type === "channel_affinity")
  if (!affinity || affinity.confidence < 0.3) return null

  const data = affinity.data as {
    counts: Record<string, number>
    dominant: string
    dominant_pct: number
    sorted: [string, number][]
  }
  const dominant    = data.dominant
  const dominantPct = data.dominant_pct   // ya es porcentaje 0-100
  const total       = Object.values(data.counts ?? {}).reduce((s, n) => s + n, 0)
  const lowChannels = (data.sorted ?? []).filter(([, n]) => total > 0 && n / total < 0.1).map(([ch]) => ch)

  const rationale = lowChannels.length > 0
    ? `Concentrar esfuerzos en ${dominant} (${dominantPct}%). Reducir frecuencia en: ${lowChannels.join(", ")}.`
    : `${dominant} es el canal dominante con ${dominantPct}% del contenido.`

  return {
    workspace_id: "", brand_id: "",
    decision_type: "channel",
    status: "active",
    confidence: affinity.confidence,
    rationale,
    supporting_knowledge: [{ type: affinity.type, title: affinity.title, content: affinity.content, confidence: affinity.confidence }],
    supporting_evidence: [{ source: "assets", description: affinity.content, sample_size: sampleSize }],
    source_events: ["asset.created"],
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

function deriveTimingDecision(objects: KnowledgeObject[], sampleSize: number): Decision | null {
  const timing = objects.find(o => o.type === "timing")
  if (!timing || timing.confidence < 0.3) return null

  const data = timing.data as { preferred_hours?: number[]; preferred_days?: number[] }
  const hours = data.preferred_hours ?? []
  const days  = data.preferred_days ?? []
  if (hours.length === 0) return null

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
  const topHours = hours.slice(0, 2).map(h => `${h}:00hs`).join(" y ")
  const topDays  = days.slice(0, 3).map(d => dayNames[d] ?? d).join(", ")

  const rationale = `Publicar preferentemente a las ${topHours}${topDays ? `. Días de mayor actividad: ${topDays}` : ""}.`

  return {
    workspace_id: "", brand_id: "",
    decision_type: "timing",
    status: "active",
    confidence: timing.confidence,
    rationale,
    supporting_knowledge: [{ type: timing.type, title: timing.title, content: timing.content, confidence: timing.confidence }],
    supporting_evidence: [{ source: "assets", description: timing.content, sample_size: sampleSize }],
    source_events: ["asset.created"],
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

function deriveCreativeDecision(objects: KnowledgeObject[], sampleSize: number): Decision | null {
  const approval = objects.find(o => o.type === "approval_signals")
  const voice    = objects.find(o => o.type === "brand_voice")
  if (!approval || approval.confidence < 0.3) return null

  const data = approval.data as { approved?: number; rejected?: number; approval_rate?: number; avg_approved_copy_length?: number }
  const rate = data.approval_rate ?? 0

  const parts: string[] = []
  if (rate > 0) parts.push(`Tasa de aprobación actual: ${Math.round(rate * 100)}%.`)
  if (data.avg_approved_copy_length) parts.push(`El copy aprobado tiene en promedio ${Math.round(data.avg_approved_copy_length)} caracteres.`)
  if (voice) {
    const vd = voice.data as { avg_hashtags?: number }
    if (vd.avg_hashtags) parts.push(`Usar aproximadamente ${Math.round(vd.avg_hashtags)} hashtags por post.`)
  }

  const rationale = parts.join(" ")
  const supporting: SupportingKnowledge[] = [
    { type: approval.type, title: approval.title, content: approval.content, confidence: approval.confidence },
  ]
  if (voice) supporting.push({ type: voice.type, title: voice.title, content: voice.content, confidence: voice.confidence })

  return {
    workspace_id: "", brand_id: "",
    decision_type: "creative",
    status: "active",
    confidence: approval.confidence,
    rationale,
    supporting_knowledge: supporting,
    supporting_evidence: [{ source: "assets", description: approval.content, sample_size: sampleSize }],
    source_events: ["asset.approved", "asset.rejected"],
    generated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

// ─── Build Decisions ──────────────────────────────────────────────────────────

function buildDecisions(
  objects: KnowledgeObject[],
  workspaceId: string,
  brandId: string,
  campaignId: string | undefined,
  sampleSize: number
): Decision[] {
  const derivers = [
    deriveContentDecision,
    deriveChannelDecision,
    deriveTimingDecision,
    deriveCreativeDecision,
  ]

  return derivers
    .map(fn => fn(objects, sampleSize))
    .filter((d): d is Decision => d !== null && assessDecisionQuality(d).isValid)
    .map(d => ({ ...d, workspace_id: workspaceId, brand_id: brandId, campaign_id: campaignId }))
}

// ─── Store & Serve ────────────────────────────────────────────────────────────

export async function generateAndStoreDecisions(
  supabase: SupabaseClient,
  workspaceId: string,
  brandId: string,
  campaignId?: string
): Promise<Decision[]> {
  // Cargar Knowledge Objects activos de la brand
  const { data: memories } = await supabase
    .from("memories")
    .select("memory_type, title, content, confidence, metadata")
    .eq("brand_id", brandId)
    .eq("status", "active")
    .neq("memory_type", "brand")

  if (!memories || memories.length === 0) return []

  const objects: KnowledgeObject[] = memories.map(m => ({
    type:        m.memory_type as KnowledgeObject["type"],
    title:       m.title,
    content:     m.content,
    data:        (m.metadata as Record<string, unknown>)?.data as Record<string, unknown> ?? {},
    confidence:  m.confidence ?? 0,
    source:      "observed",
    sample_size: (m.metadata as Record<string, unknown>)?.sample_size as number ?? 0,
  }))

  const sampleSize = Math.max(...objects.map(o => o.sample_size))
  const decisions  = buildDecisions(objects, workspaceId, brandId, campaignId, sampleSize)
  if (decisions.length === 0) return []

  // Marcar las anteriores del mismo tipo como superseded
  for (const d of decisions) {
    await supabase
      .from("decisions")
      .update({ status: "superseded" })
      .eq("brand_id", brandId)
      .eq("decision_type", d.decision_type)
      .eq("status", "active")
  }

  // Insertar nuevas
  const { data: inserted } = await supabase
    .from("decisions")
    .insert(decisions.map(d => ({
      workspace_id:         d.workspace_id,
      brand_id:             d.brand_id,
      campaign_id:          d.campaign_id ?? null,
      decision_type:        d.decision_type,
      status:               d.status,
      confidence:           d.confidence,
      rationale:            d.rationale,
      supporting_knowledge: d.supporting_knowledge,
      supporting_evidence:  d.supporting_evidence,
      source_events:        d.source_events,
      expires_at:           d.expires_at ?? null,
      generated_at:         d.generated_at,
    })))
    .select("id")

  await emitEvent({
    workspaceId,
    eventType:  "recommendation.created",
    entityType: "brand",
    entityId:   brandId,
    actorType:  "agent",
    brandId,
    campaignId,
    metadata: {
      decision_count: decisions.length,
      decision_types: decisions.map(d => d.decision_type),
    },
  })

  return decisions
}

export async function loadDecisionContext(
  supabase: SupabaseClient,
  workspaceId: string,
  brandId: string
): Promise<DecisionContext> {
  const { data } = await supabase
    .from("decisions")
    .select("*")
    .eq("brand_id", brandId)
    .eq("status", "active")
    .gte("confidence", 0.4)
    .order("confidence", { ascending: false })
    .limit(6)

  const decisions = (data ?? []) as Decision[]

  const promptContext = decisions.length === 0
    ? ""
    : [
        "\nDECISIONES DEL SISTEMA (basadas en historial de la marca):",
        ...decisions.map(d => `- [${d.decision_type.toUpperCase()}] ${d.rationale}`),
        "Respetar estas decisiones al generar el contenido.",
      ].join("\n")

  return {
    brandId,
    brandName: "",
    decisions,
    promptContext,
    generatedAt: new Date().toISOString(),
  }
}
