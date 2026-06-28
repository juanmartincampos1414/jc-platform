import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emitEvent } from "@/lib/events"
import { processRecommendationAction } from "@/lib/learning/engine"

const ALLOWED_STATUSES = ["accepted", "rejected", "pending"] as const
type ActionStatus = typeof ALLOWED_STATUSES[number]

// PATCH /api/recommendations/[recommendationId]
// Body: { status, decision_reason?, workspaceId }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ recommendationId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { recommendationId } = await params
  const { status, decision_reason, workspaceId } = await req.json()

  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}` }, { status: 400 })
  }
  if (status === "rejected" && !decision_reason?.trim()) {
    return NextResponse.json({ error: "decision_reason is required when rejecting" }, { status: 400 })
  }

  // Verificar que la recommendation pertenece al workspace
  const { data: existing } = await supabase
    .from("recommendations")
    .select("id, status, source_campaign_id, brand_id, workspace_id, decision_id")
    .eq("id", recommendationId)
    .eq("workspace_id", workspaceId)
    .single()

  if (!existing) return NextResponse.json({ error: "Recommendation not found" }, { status: 404 })

  const update: Record<string, unknown> = {
    status,
    decided_by:  user.id,
    decided_at:  new Date().toISOString(),
    updated_at:  new Date().toISOString(),
  }
  if (decision_reason?.trim()) update.decision_reason = decision_reason.trim()

  const { data: updated, error } = await supabase
    .from("recommendations")
    .update(update)
    .eq("id", recommendationId)
    .select("id, title, status, decision_reason, decided_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const eventType = status === "accepted" ? "recommendation.accepted"
    : status === "rejected"  ? "recommendation.rejected"
    : "recommendation.pending"

  await emitEvent({
    workspaceId,
    eventType,
    entityType: "recommendation",
    entityId:   recommendationId,
    actorId:    user.id,
    actorType:  "user",
    brandId:    existing.brand_id,
    campaignId: existing.source_campaign_id,
    metadata:   { decision_reason: decision_reason ?? null },
  })

  // Learning: accepted/rejected alimentan el Knowledge Engine
  if ((status === "accepted" || status === "rejected") && existing.decision_id) {
    await processRecommendationAction(supabase, {
      recommendationId,
      decisionId:     existing.decision_id,
      workspaceId,
      brandId:        existing.brand_id,
      campaignId:     existing.source_campaign_id,
      action:         status,
      decisionReason: decision_reason,
    }).catch(err => console.error("[learning/engine] Error:", err))
  }

  return NextResponse.json({ recommendation: updated })
}
