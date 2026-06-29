import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Executive Object (dominio — no pertenece a Claude) ───────────────────────
// El Executive Engine construye este objeto desde datos reales.
// Claude recibe el objeto terminado y produce únicamente la narrativa ejecutiva.

export type ExecutiveObject = {
  // Las cinco preguntas
  status:               ExecutiveStatus         // ¿Qué está pasando?
  why:                  ExecutiveWhy            // ¿Por qué está pasando?
  delta:                ExecutiveDelta          // ¿Qué cambió desde la última vez?
  top_risk:             ExecutiveSignal | null  // ¿Qué riesgo merece atención?
  recommended_decision: ExecutiveDecision       // ¿Cuál es la decisión más importante esta semana?
  // Metadata
  evidence_used:        EvidenceRef[]
  confidence:           number
  generated_at:         string
}

type ExecutiveStatus = {
  summary:          string
  active_campaigns: number
  total_assets:     number
  pending_actions:  number
  system_confidence: number
}

type ExecutiveWhy = {
  dominant_pattern: string    // el patrón más fuerte que explica el estado actual
  supporting_facts: string[]  // hechos del dominio que respaldan el patrón
}

type ExecutiveDelta = {
  has_previous:     boolean
  changed:          string     // qué cambió (vacío si no hay snapshot previo)
  since:            string     // fecha del snapshot anterior
  confidence_trend: "up" | "down" | "stable" | "unknown"
}

type ExecutiveSignal = {
  signal:           string
  rationale:        string
  source_campaign:  string
  confidence:       number
}

type ExecutiveDecision = {
  decision:         string   // una sola decisión, formulada como acción concreta
  rationale:        string
  expected_impact:  string
  urgency:          "this_week" | "this_month" | "next_quarter"
  based_on:         string[] // IDs o labels de la evidencia que la respalda
}

type EvidenceRef = {
  type:   "campaign_strategy" | "memory" | "recommendation"
  id:     string
  label:  string
}

// ─── Executive Engine ─────────────────────────────────────────────────────────

export async function buildExecutiveObject(
  supabase: SupabaseClient,
  params: {
    workspaceId: string
    prevSnapshot: ExecutiveObject | null
  }
): Promise<ExecutiveObject> {
  const { workspaceId, prevSnapshot } = params

  // Leer todas las campañas activas con su Strategy Object
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, strategy, starts_at, ends_at")
    .eq("workspace_id", workspaceId)
    .in("status", ["active", "in_production", "in_review", "approved"])
    .order("created_at", { ascending: false })
    .limit(10)

  // Memorias del workspace (brand-level, sin campaign_id)
  const { data: memories } = await supabase
    .from("memories")
    .select("id, memory_type, title, content, confidence")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .is("campaign_id", null)
    .order("confidence", { ascending: false })
    .limit(15)

  // Recomendaciones pendientes (sin decidir) — señal de decisiones abiertas
  const { data: pendingRecs } = await supabase
    .from("recommendations")
    .select("id, title, body, action_type, source_campaign_id")
    .eq("workspace_id", workspaceId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10)

  const campaignList  = campaigns  ?? []
  const memoryList    = memories   ?? []
  const pendingList   = pendingRecs ?? []

  // ── Confidence global del workspace ──────────────────────────────────────
  const strategyConfidences = campaignList
    .filter(c => c.strategy?.confidence != null)
    .map(c => c.strategy.confidence as number)

  const memoryConfidences = memoryList.map(m => m.confidence as number)

  const allConfidences = [...strategyConfidences, ...memoryConfidences]
  const systemConfidence = allConfidences.length > 0
    ? Math.round((allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length) * 100)
    : 50

  // ── Status ────────────────────────────────────────────────────────────────
  const status: ExecutiveStatus = {
    summary:           `${campaignList.length} campaña${campaignList.length !== 1 ? "s" : ""} activa${campaignList.length !== 1 ? "s" : ""}. ${pendingList.length} acción${pendingList.length !== 1 ? "es" : ""} pendiente${pendingList.length !== 1 ? "s" : ""}.`,
    active_campaigns:  campaignList.length,
    total_assets:      0,
    pending_actions:   pendingList.length,
    system_confidence: systemConfidence,
  }

  // ── Why: patrón dominante ─────────────────────────────────────────────────
  // El patrón dominante viene del Strategy Object de la campaña con mayor confidence
  const leadCampaign = campaignList
    .filter(c => c.strategy != null)
    .sort((a, b) => (b.strategy?.confidence ?? 0) - (a.strategy?.confidence ?? 0))[0]

  const dominantPattern = leadCampaign?.strategy?.hypothesis
    ?? (memoryList[0]?.title
      ? `El sistema está consolidando conocimiento sobre ${memoryList[0].title}`
      : "El sistema está en fase de aprendizaje activo.")

  const supportingFacts = [
    ...campaignList
      .filter(c => c.strategy?.strengths?.[0])
      .slice(0, 2)
      .map(c => `${c.name}: ${c.strategy.strengths[0].signal}`),
    ...memoryList
      .filter(m => m.confidence >= 0.75)
      .slice(0, 2)
      .map(m => m.title),
  ].filter(Boolean).slice(0, 3)

  const why: ExecutiveWhy = {
    dominant_pattern: dominantPattern,
    supporting_facts: supportingFacts,
  }

  // ── Delta ─────────────────────────────────────────────────────────────────
  let delta: ExecutiveDelta = {
    has_previous:     false,
    changed:          "",
    since:            "",
    confidence_trend: "unknown",
  }

  if (prevSnapshot) {
    const prevConf = prevSnapshot.status.system_confidence
    const currConf = systemConfidence
    const diff     = currConf - prevConf

    const trend: ExecutiveDelta["confidence_trend"] =
      diff >= 5  ? "up" :
      diff <= -5 ? "down" : "stable"

    // Detectar nuevas campañas o campañas resueltas
    const prevCampaignCount = prevSnapshot.status.active_campaigns
    const campaignChange =
      campaignList.length > prevCampaignCount ? `${campaignList.length - prevCampaignCount} campaña nueva` :
      campaignList.length < prevCampaignCount ? `${prevCampaignCount - campaignList.length} campaña cerrada` :
      "mismas campañas activas"

    const confChange =
      trend === "up"     ? `Confianza del sistema subió ${diff}pp` :
      trend === "down"   ? `Confianza del sistema bajó ${Math.abs(diff)}pp` :
      "Confianza estable"

    delta = {
      has_previous:     true,
      changed:          `${confChange}. ${campaignChange}.`,
      since:            prevSnapshot.generated_at,
      confidence_trend: trend,
    }
  }

  // ── Top Risk ──────────────────────────────────────────────────────────────
  let top_risk: ExecutiveSignal | null = null

  // Riesgo = campaña con strategy que tiene risks de alta severidad
  for (const campaign of campaignList) {
    const risks = campaign.strategy?.risks ?? []
    const highRisk = risks.find((r: { confidence: number }) => r.confidence < 0.45)
    if (highRisk) {
      top_risk = {
        signal:          (highRisk as { signal: string }).signal,
        rationale:       `La campaña "${campaign.name}" muestra baja confianza en este criterio.`,
        source_campaign: campaign.name,
        confidence:      (highRisk as { confidence: number }).confidence,
      }
      break
    }
  }

  // Si no hay riesgo de campaña, usar memoria con baja confidence
  if (!top_risk && memoryList.some(m => m.confidence < 0.40)) {
    const weakMemory = memoryList.find(m => m.confidence < 0.40)!
    top_risk = {
      signal:          weakMemory.title,
      rationale:       "El sistema tiene evidencia insuficiente en este criterio. Las decisiones basadas en él son de baja confianza.",
      source_campaign: "Nivel workspace",
      confidence:      weakMemory.confidence,
    }
  }

  // ── Recommended Decision ──────────────────────────────────────────────────
  // Una sola decisión — la de mayor impacto esperado esta semana.
  // Prioridad: rec pendiente de la campaña con mayor confidence.
  let recommended_decision: ExecutiveDecision

  const topRec = pendingList[0]
  const sourceCampaign = topRec
    ? campaignList.find(c => c.id === topRec.source_campaign_id)
    : null

  if (topRec) {
    recommended_decision = {
      decision:        topRec.title,
      rationale:       topRec.body?.slice(0, 150) ?? "Recomendación activa del sistema.",
      expected_impact: sourceCampaign?.strategy?.expected_outcomes?.[0]
                       ?? "Impacto directo sobre el pipeline activo.",
      urgency:         "this_week",
      based_on:        [topRec.id],
    }
  } else if (top_risk) {
    recommended_decision = {
      decision:        `Revisar: ${top_risk.signal}`,
      rationale:       top_risk.rationale,
      expected_impact: "Reducir exposición al principal riesgo identificado.",
      urgency:         "this_week",
      based_on:        [],
    }
  } else {
    recommended_decision = {
      decision:        "Generar contenido del próximo mes en JClaude para activar el pipeline completo.",
      rationale:       "El sistema necesita más datos para producir recomendaciones de alta confianza.",
      expected_impact: "Activa el Knowledge Engine, aumenta confidence del sistema en 2-3 semanas.",
      urgency:         "this_week",
      based_on:        [],
    }
  }

  // ── Evidence ──────────────────────────────────────────────────────────────
  const evidence_used: EvidenceRef[] = [
    ...campaignList.slice(0, 3).map(c => ({
      type:  "campaign_strategy" as const,
      id:    c.id,
      label: c.name,
    })),
    ...memoryList.slice(0, 3).map(m => ({
      type:  "memory" as const,
      id:    m.id,
      label: m.title,
    })),
    ...pendingList.slice(0, 2).map(r => ({
      type:  "recommendation" as const,
      id:    r.id,
      label: r.title,
    })),
  ]

  return {
    status,
    why,
    delta,
    top_risk,
    recommended_decision,
    evidence_used,
    confidence: systemConfidence / 100,
    generated_at: new Date().toISOString(),
  }
}
