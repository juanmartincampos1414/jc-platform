import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Reversión de acciones autónomas.
// El modelo: no borramos. Creamos un nuevo evento "reverted" y devolvemos
// el asset al estado anterior. El audit trail queda completo.

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { actionId } = await params

  // Fetch the action to revert
  const { data: action, error: fetchErr } = await supabase
    .from("autonomous_actions")
    .select("*")
    .eq("id", actionId)
    .single()

  if (fetchErr || !action) {
    return NextResponse.json({ error: "Acción no encontrada" }, { status: 404 })
  }

  // Validate ownership
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", action.workspace_id)
    .single()

  if (!workspace) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  if (action.result === "reverted") {
    return NextResponse.json({ error: "Esta acción ya fue revertida" }, { status: 400 })
  }

  // Execute revert depending on action type
  if (action.action_type === "auto-schedule-approved-asset") {
    const { error: revertErr } = await supabase
      .from("assets")
      .update({
        status:     "approved",  // restore to before state
        updated_at: new Date().toISOString(),
      })
      .eq("id", action.entity_id)
      .eq("workspace_id", action.workspace_id)

    if (revertErr) {
      return NextResponse.json({ error: revertErr.message }, { status: 500 })
    }
  } else {
    return NextResponse.json(
      { error: `Reversión no implementada para tipo: ${action.action_type}` },
      { status: 400 }
    )
  }

  // Mark original action as reverted
  const now = new Date().toISOString()
  await supabase
    .from("autonomous_actions")
    .update({ result: "reverted", reverted_at: now, reverted_by: user.id })
    .eq("id", actionId)

  // Create revert audit event
  await supabase.from("autonomous_actions").insert({
    workspace_id:      action.workspace_id,
    action_type:       `revert:${action.action_type}`,
    action_class:      action.action_class,
    entity_type:       action.entity_type,
    entity_id:         action.entity_id,
    confidence:        action.confidence,
    policy_level:      action.policy_level,
    policy_snapshot:   action.policy_snapshot,
    payload:           { reverted_action_id: actionId, restored_to: action.payload?.before },
    result:            "executed",
    triggered_by:      "manual",
    revert_action_id:  actionId,
  })

  return NextResponse.json({ success: true, reverted_at: now })
}
