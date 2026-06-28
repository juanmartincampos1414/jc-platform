// Recommendation Engine
// Transforma Decisions en Recommendations accionables.
// Toda Recommendation tiene un decision_id — sin trazabilidad no existe.

import type { SupabaseClient } from "@supabase/supabase-js"
import { emitEvent } from "@/lib/events"

type DecisionRow = {
  id: string
  decision_type: string
  confidence: number
  rationale: string
  status: string
}

const DECISION_TO_RECOMMENDATION: Record<string, { title: string; action_type: string }> = {
  content:  { title: "Optimizar mix de formatos de contenido",    action_type: "test_new_format"      },
  channel:  { title: "Rebalancear distribución de canales",       action_type: "shift_channel_focus"  },
  timing:   { title: "Ajustar horarios de publicación",           action_type: "adjust_timing"        },
  creative: { title: "Optimizar copy y hashtags",                 action_type: "improve_creative"     },
  budget:   { title: "Revisar asignación de presupuesto",         action_type: "review_budget"        },
  audience: { title: "Refinar segmentación de audiencia",         action_type: "refine_audience"      },
  publishing: { title: "Mejorar flujo de publicación",            action_type: "improve_publishing"   },
  performance: { title: "Revisar métricas de performance",        action_type: "review_performance"   },
}

export async function generateAndStoreRecommendations(
  supabase: SupabaseClient,
  workspaceId: string,
  brandId: string,
  campaignId: string
): Promise<void> {
  // Cargar Decisions activas — solo las de confianza suficiente
  const { data: decisions } = await supabase
    .from("decisions")
    .select("id, decision_type, confidence, rationale, status")
    .eq("brand_id", brandId)
    .eq("status", "active")
    .gte("confidence", 0.3)

  if (!decisions || decisions.length === 0) return

  // Expirar Recommendations pendientes anteriores de esta campaign
  await supabase
    .from("recommendations")
    .update({ status: "expired" })
    .eq("source_campaign_id", campaignId)
    .eq("status", "pending")

  // Derivar una Recommendation por Decision
  const recs = (decisions as DecisionRow[]).map(d => {
    const template = DECISION_TO_RECOMMENDATION[d.decision_type] ?? {
      title: `Acción derivada: ${d.decision_type}`,
      action_type: "review",
    }
    return {
      workspace_id:       workspaceId,
      source_campaign_id: campaignId,
      brand_id:           brandId,
      decision_id:        d.id,
      status:             "pending",
      title:              template.title,
      body:               d.rationale,
      action_type:        template.action_type,
      action_detail: {
        decision_type: d.decision_type,
        confidence:    d.confidence,
      },
    }
  })

  await supabase.from("recommendations").insert(recs)

  await emitEvent({
    workspaceId,
    eventType:  "recommendation.created",
    entityType: "campaign",
    entityId:   campaignId,
    actorType:  "agent",
    brandId,
    campaignId,
    metadata:  { count: recs.length, types: recs.map(r => r.action_type) },
  })
}
