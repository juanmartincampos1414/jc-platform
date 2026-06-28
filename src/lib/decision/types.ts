// Decision Engine — Types
// Una Decision es una conclusión del sistema basada en evidencia y conocimiento.
// Toda Recommendation debe derivar de una Decision.
// Nunca existe una Decision sin trazabilidad.

export type DecisionType =
  | "content"
  | "channel"
  | "timing"
  | "budget"
  | "audience"
  | "creative"
  | "publishing"
  | "performance"

export type DecisionStatus = "active" | "expired" | "superseded" | "rejected"

export type SupportingKnowledge = {
  type: string
  title: string
  content: string
  confidence: number
}

export type SupportingEvidence = {
  source: string        // "assets" | "events" | "memories"
  description: string
  sample_size: number
}

export type Decision = {
  id?: string
  workspace_id: string
  brand_id: string
  campaign_id?: string
  decision_type: DecisionType
  status: DecisionStatus
  confidence: number
  rationale: string                        // Explicación human-readable
  supporting_knowledge: SupportingKnowledge[]
  supporting_evidence: SupportingEvidence[]
  source_events: string[]                  // event IDs o tipos
  expires_at?: string
  generated_at: string
}

export type DecisionContext = {
  brandId: string
  brandName: string
  decisions: Decision[]
  promptContext: string   // texto listo para inyectar en Claude
  generatedAt: string
}

// Responde las 4 preguntas de calidad de toda Decision
export type DecisionQuality = {
  hasEvidence: boolean
  hasKnowledge: boolean
  hasConfidence: boolean       // confidence > 0.4
  hasExpiry: boolean
  isValid: boolean             // todas true
}

export function assessDecisionQuality(d: Decision): DecisionQuality {
  const hasEvidence    = d.supporting_evidence.length > 0
  const hasKnowledge   = d.supporting_knowledge.length > 0
  const hasConfidence  = d.confidence > 0.4
  const hasExpiry      = !!d.expires_at
  return {
    hasEvidence, hasKnowledge, hasConfidence, hasExpiry,
    isValid: hasEvidence && hasKnowledge && hasConfidence,
  }
}
