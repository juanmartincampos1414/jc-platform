import { createClient } from "@/lib/supabase/server"

// ─── Domain Event Types ───────────────────────────────────────────────────────

export type DomainEvent =
  | "brand.created"
  | "campaign.created"
  | "creative.created"
  | "asset.created"
  | "asset.approved"
  | "asset.rejected"
  | "asset.needs_changes"
  | "asset.repaired"
  | "month.generation.started"
  | "month.generation.completed"
  | "month.generation.failed"
  | "agent_job.started"
  | "agent_job.completed"
  | "agent_job.failed"
  | "memory.initialized"
  | "document.signed"
  | "distribution.created"
  | "recommendation.created"

// ─── emitEvent — domain events table ─────────────────────────────────────────
// These are immutable OS-level facts. Never deleted, never updated.

type EmitEventParams = {
  workspaceId:  string
  eventType:    DomainEvent
  entityType?:  string
  entityId?:    string
  actorId?:     string
  actorType?:   "user" | "agent" | "system"
  brandId?:     string
  campaignId?:  string
  metadata?:    Record<string, unknown>
}

export async function emitEvent(params: EmitEventParams): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("events").insert({
      workspace_id: params.workspaceId,
      event:        params.eventType,
      entity_type:  params.entityType ?? null,
      entity_id:    params.entityId   ?? null,
      actor_id:     params.actorId    ?? null,
      actor_type:   params.actorType  ?? "system",
      metadata: {
        brand_id:    params.brandId    ?? null,
        campaign_id: params.campaignId ?? null,
        ...(params.metadata ?? {}),
      },
    })
  } catch {
    // Event failures must never crash the main operation
  }
}

// ─── emitActivity — human-readable activity log ───────────────────────────────
// Backward-compatible with all existing call sites (src/lib/activity.ts re-exports this).

export async function emitActivity(event: {
  workspace_id: string
  user_id?:     string
  action:       string
  entity_type?: string
  entity_id?:   string
  metadata?:    Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("activity_logs").insert({
      workspace_id: event.workspace_id,
      user_id:      event.user_id     ?? null,
      action:       event.action,
      entity_type:  event.entity_type ?? null,
      entity_id:    event.entity_id   ?? null,
      metadata:     event.metadata    ?? {},
    })
  } catch {
    // Activity log failures must never crash the main operation
  }
}
