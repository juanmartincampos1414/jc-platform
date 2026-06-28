// Learning Engine
// Convierte acciones del usuario sobre Recommendations en aprendizaje persistente.
//
// accepted → aumenta confidence de los Knowledge Objects asociados (+0.10)
// rejected → reduce confidence (-0.15) + guarda decision_reason como user_feedback
//
// El aprendizaje es automático: futuros Decisions y prompts de Claude
// lo incorporan sin intervención manual.

import type { SupabaseClient } from "@supabase/supabase-js"
import { emitEvent } from "@/lib/events"

const CONFIDENCE_DELTA: Record<"accepted" | "rejected", number> = {
  accepted:  0.10,
  rejected: -0.15,
}

type Params = {
  recommendationId: string
  decisionId:       string
  workspaceId:      string
  brandId:          string
  campaignId:       string
  action:           "accepted" | "rejected"
  decisionReason?:  string
}

export async function processRecommendationAction(
  supabase: SupabaseClient,
  params: Params
): Promise<void> {
  // Cargar la Decision para obtener tipo y Knowledge Objects asociados
  const { data: decision } = await supabase
    .from("decisions")
    .select("decision_type, supporting_knowledge, confidence")
    .eq("id", params.decisionId)
    .single()

  if (!decision) return

  const knowledgeTypes = (
    decision.supporting_knowledge as Array<{ type: string }> ?? []
  ).map(k => k.type).filter(Boolean)

  const delta = CONFIDENCE_DELTA[params.action]

  // Ajustar confidence de cada Memory asociada al Knowledge Object
  if (knowledgeTypes.length > 0) {
    const { data: memories } = await supabase
      .from("memories")
      .select("id, memory_type, confidence")
      .eq("brand_id", params.brandId)
      .eq("status", "active")
      .in("memory_type", knowledgeTypes)

    for (const mem of memories ?? []) {
      const newConf = Math.min(1.0, Math.max(0.0, Number(mem.confidence) + delta))
      await supabase
        .from("memories")
        .update({
          confidence:  parseFloat(newConf.toFixed(2)),
          updated_at:  new Date().toISOString(),
        })
        .eq("id", mem.id)
    }
  }

  // Si hay rejection reason, persistirlo como user_feedback Memory
  // Esto aparece en el promptContext de Claude en futuras generaciones
  if (params.action === "rejected" && params.decisionReason?.trim()) {
    await supabase
      .from("memories")
      .insert({
        workspace_id: params.workspaceId,
        brand_id:     params.brandId,
        campaign_id:  params.campaignId,
        memory_type:  "user_feedback",
        status:       "active",
        title:        `Preferencia del cliente: rechazó decisión de ${decision.decision_type}`,
        content:      `El cliente rechazó la recomendación de tipo "${decision.decision_type}". `
                    + `Motivo declarado: ${params.decisionReason.trim()} `
                    + `Tener esto en cuenta al generar contenido futuro.`,
        source:       "user",
        confidence:   1.0,   // feedback directo del usuario = máxima confianza
        metadata: {
          decision_type:     decision.decision_type,
          decision_id:       params.decisionId,
          recommendation_id: params.recommendationId,
          action:            "rejected",
          reason:            params.decisionReason.trim(),
        },
      })
  }

  await emitEvent({
    workspaceId:  params.workspaceId,
    eventType:    "memory.feedback_applied",
    entityType:   "recommendation",
    entityId:     params.recommendationId,
    actorType:    "system",
    brandId:      params.brandId,
    campaignId:   params.campaignId,
    metadata: {
      action:                    params.action,
      decision_type:             decision.decision_type,
      knowledge_types_adjusted:  knowledgeTypes,
      confidence_delta:          delta,
      has_rejection_reason:      !!(params.action === "rejected" && params.decisionReason),
    },
  })
}
