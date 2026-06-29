import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Strategy Object (dominio del producto — no pertenece a Claude) ──────────

export type StrategyObject = {
  summary:                string
  objectives:             string[]
  hypothesis:             string
  strengths:              StrategicSignal[]
  risks:                  StrategicSignal[]
  expected_outcomes:      string[]
  recommended_next_actions: StrategicAction[]
  confidence:             number              // 0-1, promedio ponderado de evidencia
  knowledge_used:         KnowledgeRef[]
  evidence_used:          EvidenceRef[]
  generated_at:           string
}

type StrategicSignal = {
  signal:     string
  confidence: number
  source:     "memory" | "decision" | "recommendation"
}

type StrategicAction = {
  action:   string
  priority: "high" | "medium" | "low"
  rationale: string
}

type KnowledgeRef = {
  memory_type: string
  title:       string
  confidence:  number
}

type EvidenceRef = {
  type:  "memory" | "decision" | "recommendation"
  id:    string
  title: string
}

// ─── Strategy Engine ─────────────────────────────────────────────────────────
// Lee Memory, Decision y Recommendation de la campaña y construye el
// Strategy Object sin invocar Claude. Claude solo recibe el objeto terminado.

export async function buildStrategyObject(
  supabase: SupabaseClient,
  params: { campaignId: string; workspaceId: string; brandId: string }
): Promise<StrategyObject> {
  const { campaignId, workspaceId, brandId } = params

  const [memoriesRes, decisionsRes, recommendationsRes] = await Promise.all([
    supabase
      .from("memories")
      .select("id, memory_type, title, content, confidence")
      .eq("workspace_id", workspaceId)
      .eq("brand_id", brandId)
      .eq("status", "active")
      .order("confidence", { ascending: false })
      .limit(20),

    supabase
      .from("decisions")
      .select("id, decision_type, rationale, confidence, supporting_knowledge, outcome")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(10),

    supabase
      .from("recommendations")
      .select("id, title, body, action_type, status, decision_reason")
      .eq("source_campaign_id", campaignId)
      .in("status", ["accepted", "pending"])
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  const memories        = memoriesRes.data        ?? []
  const decisions       = decisionsRes.data        ?? []
  const recommendations = recommendationsRes.data  ?? []

  // ── Strengths: memorias con confidence alta ───────────────────────────────
  const strengths: StrategicSignal[] = memories
    .filter(m => m.confidence >= 0.70)
    .slice(0, 4)
    .map(m => ({
      signal:     m.title,
      confidence: m.confidence,
      source:     "memory" as const,
    }))

  // ── Risks: memorias con baja confidence o decisions rechazadas ────────────
  const lowConfidenceMemories = memories
    .filter(m => m.confidence < 0.50)
    .slice(0, 2)
    .map(m => ({
      signal:     `Criterio en observación: ${m.title}`,
      confidence: m.confidence,
      source:     "memory" as const,
    }))

  const rejectedDecisions = decisions
    .filter(d => d.outcome === "rejected" || d.outcome === "overridden")
    .slice(0, 2)
    .map(d => ({
      signal:     `Decisión revertida: ${d.rationale?.slice(0, 80) ?? "sin detalle"}`,
      confidence: d.confidence ?? 0.5,
      source:     "decision" as const,
    }))

  const risks: StrategicSignal[] = [...lowConfidenceMemories, ...rejectedDecisions]

  // ── Next Actions: de recommendations pendientes o aceptadas ───────────────
  const recommended_next_actions: StrategicAction[] = recommendations
    .slice(0, 3)
    .map(r => ({
      action:    r.title,
      priority:  r.status === "accepted" ? "high" : "medium",
      rationale: r.body?.slice(0, 120) ?? "",
    }))

  // ── Confidence global: promedio ponderado ─────────────────────────────────
  const allConfidences = [
    ...memories.map(m => m.confidence),
    ...decisions.filter(d => d.confidence != null).map(d => d.confidence),
  ]
  const confidence = allConfidences.length > 0
    ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
    : 0.5

  // ── Referencias de evidencia ──────────────────────────────────────────────
  const knowledge_used: KnowledgeRef[] = memories.slice(0, 6).map(m => ({
    memory_type: m.memory_type,
    title:       m.title,
    confidence:  m.confidence,
  }))

  const evidence_used: EvidenceRef[] = [
    ...memories.slice(0, 4).map(m => ({ type: "memory" as const, id: m.id, title: m.title })),
    ...decisions.slice(0, 3).map(d => ({ type: "decision" as const, id: d.id, title: d.rationale?.slice(0, 60) ?? "Decisión" })),
    ...recommendations.slice(0, 3).map(r => ({ type: "recommendation" as const, id: r.id, title: r.title })),
  ]

  // ── Objectives desde el knowledge del sistema ─────────────────────────────
  const channelMemory  = memories.find(m => m.memory_type === "brand")
  const timingMemory   = memories.find(m => m.memory_type === "trend")

  const objectives: string[] = [
    strengths[0] ? `Capitalizar: ${strengths[0].signal}` : "Consolidar presencia de marca",
    risks[0]     ? `Resolver: ${risks[0].signal}` : "Mantener coherencia creativa",
    recommended_next_actions[0]?.action ?? "Continuar con el plan de contenido activo",
  ].filter(Boolean)

  const hypothesis = decisions[0]?.rationale
    ?? (channelMemory ? `La campaña se apoya en ${channelMemory.title}` : "El sistema está construyendo su hipótesis estratégica.")

  const expected_outcomes = recommendations
    .filter(r => r.status === "accepted")
    .slice(0, 3)
    .map(r => r.body?.slice(0, 100) ?? r.title)

  return {
    summary:                 `Estrategia construida sobre ${memories.length} conocimientos del sistema, ${decisions.length} decisiones y ${recommendations.length} recomendaciones activas.`,
    objectives,
    hypothesis,
    strengths,
    risks,
    expected_outcomes:       expected_outcomes.length > 0 ? expected_outcomes : ["El sistema espera resultados una vez que haya más datos de la campaña."],
    recommended_next_actions,
    confidence:              Math.round(confidence * 100) / 100,
    knowledge_used,
    evidence_used,
    generated_at:            new Date().toISOString(),
  }
}
