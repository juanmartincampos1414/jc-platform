import { createClient } from "@/lib/supabase/server"

export async function emitActivity(event: {
  workspace_id: string
  user_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createClient()
    await supabase.from("activity_logs").insert({
      workspace_id: event.workspace_id,
      user_id: event.user_id ?? null,
      action: event.action,
      entity_type: event.entity_type ?? null,
      entity_id: event.entity_id ?? null,
      metadata: event.metadata ?? {},
    })
  } catch {
    // Activity log failures must never crash the main operation
  }
}
