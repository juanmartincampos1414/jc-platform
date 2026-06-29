import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Autonomy Policy ─────────────────────────────────────────────────────────

export type AutonomyPolicy = {
  level:   0 | 1 | 2 | 3
  class_a: 0 | 1 | 2 | 3
  class_b: 0 | 1 | 2 | 3
  class_c: 0 | 1 | 2 | 3
}

export type ActionClass = "A" | "B" | "C"

const DEFAULT_POLICY: AutonomyPolicy = { level: 1, class_a: 1, class_b: 1, class_c: 0 }

function classLevel(policy: AutonomyPolicy, cls: ActionClass): number {
  if (cls === "A") return policy.class_a ?? policy.level
  if (cls === "B") return policy.class_b ?? policy.level
  return policy.class_c ?? 0
}

// ─── Three-condition check ────────────────────────────────────────────────────
// Regla 21: confidence AND policy AND action class — las tres son obligatorias.

type AuthorizationResult =
  | { authorized: true }
  | { authorized: false; reason: string }

export function checkAuthorization(params: {
  confidence:    number          // 0-1
  minConfidence: number          // umbral mínimo para esta acción
  policy:        AutonomyPolicy
  actionClass:   ActionClass
  requiredLevel: number          // nivel mínimo de política que requiere esta acción (generalmente 3)
}): AuthorizationResult {
  const { confidence, minConfidence, policy, actionClass, requiredLevel } = params

  if (confidence < minConfidence) {
    return { authorized: false, reason: `Confidence insuficiente: ${Math.round(confidence * 100)}% < ${Math.round(minConfidence * 100)}% requerido` }
  }

  const effectiveLevel = classLevel(policy, actionClass)
  if (effectiveLevel < requiredLevel) {
    return { authorized: false, reason: `Autonomy Policy nivel ${effectiveLevel} < ${requiredLevel} requerido para Clase ${actionClass}` }
  }

  return { authorized: true }
}

// ─── Audit logger ─────────────────────────────────────────────────────────────
// Toda ejecución autónoma — exitosa o fallida — genera un registro inmutable.

type LogActionParams = {
  workspaceId:    string
  actionType:     string
  actionClass:    ActionClass
  entityType:     string
  entityId:       string
  confidence:     number
  policy:         AutonomyPolicy
  payload:        Record<string, unknown>
  result:         "executed" | "failed"
  errorMessage?:  string
}

export async function logAutonomousAction(
  supabase: SupabaseClient,
  params: LogActionParams
): Promise<string | null> {
  const { data, error } = await supabase
    .from("autonomous_actions")
    .insert({
      workspace_id:    params.workspaceId,
      action_type:     params.actionType,
      action_class:    params.actionClass,
      entity_type:     params.entityType,
      entity_id:       params.entityId,
      confidence:      params.confidence,
      policy_level:    classLevel(params.policy, params.actionClass),
      policy_snapshot: params.policy,
      payload:         params.payload,
      result:          params.result,
      error_message:   params.errorMessage ?? null,
      triggered_by:    "system",
    })
    .select("id")
    .single()

  if (error) {
    console.error("[autonomy/executor] Failed to log action:", error)
    return null
  }
  return data?.id ?? null
}

// ─── Fetch workspace policy ───────────────────────────────────────────────────

export async function getAutonomyPolicy(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<AutonomyPolicy> {
  const { data } = await supabase
    .from("workspaces")
    .select("autonomy_policy")
    .eq("id", workspaceId)
    .single()

  if (!data?.autonomy_policy) return DEFAULT_POLICY
  return data.autonomy_policy as AutonomyPolicy
}

// ─── First autonomous action: auto-schedule-approved-asset ───────────────────
// Action Class: A — Low Risk
// Trigger: asset status changes to "approved" AND has a future scheduled_at
// Execute: set status = "scheduled"
// Revert: set status = "approved"

export const AUTO_SCHEDULE_ACTION = {
  type:          "auto-schedule-approved-asset" as const,
  class:         "A" as ActionClass,
  minConfidence: 0.0,    // Class A — no confidence requirement (it's a status change)
  requiredLevel: 3,      // requires Autonomous policy
}

export async function autoScheduleApprovedAsset(
  supabase: SupabaseClient,
  params: {
    assetId:     string
    workspaceId: string
    confidence:  number   // workspace system confidence at time of execution
  }
): Promise<{ executed: boolean; actionId: string | null; reason?: string }> {
  const { assetId, workspaceId, confidence } = params

  // 1. Fetch policy
  const policy = await getAutonomyPolicy(supabase, workspaceId)

  // 2. Three-condition check
  const auth = checkAuthorization({
    confidence,
    minConfidence: AUTO_SCHEDULE_ACTION.minConfidence,
    policy,
    actionClass:   AUTO_SCHEDULE_ACTION.class,
    requiredLevel: AUTO_SCHEDULE_ACTION.requiredLevel,
  })

  if (!auth.authorized) {
    return { executed: false, actionId: null, reason: auth.reason }
  }

  // 3. Fetch asset — confirm it's approved with future scheduled_at
  const { data: asset } = await supabase
    .from("assets")
    .select("id, status, scheduled_at, workspace_id, channel, caption")
    .eq("id", assetId)
    .eq("workspace_id", workspaceId)
    .single()

  if (!asset) {
    return { executed: false, actionId: null, reason: "Asset not found" }
  }
  if (asset.status !== "approved") {
    return { executed: false, actionId: null, reason: `Asset status is '${asset.status}', not 'approved'` }
  }
  if (!asset.scheduled_at || new Date(asset.scheduled_at) <= new Date()) {
    return { executed: false, actionId: null, reason: "No future scheduled_at — cannot schedule" }
  }

  // 4. Execute: change status approved → scheduled
  const { error: updateErr } = await supabase
    .from("assets")
    .update({ status: "scheduled", updated_at: new Date().toISOString() })
    .eq("id", assetId)

  const result: "executed" | "failed" = updateErr ? "failed" : "executed"

  // 5. Log — always, even if execution failed
  const actionId = await logAutonomousAction(supabase, {
    workspaceId,
    actionType:   AUTO_SCHEDULE_ACTION.type,
    actionClass:  AUTO_SCHEDULE_ACTION.class,
    entityType:   "asset",
    entityId:     assetId,
    confidence,
    policy,
    payload: {
      before:       { status: "approved" },
      after:        { status: "scheduled" },
      scheduled_at: asset.scheduled_at,
      channel:      asset.channel,
    },
    result,
    errorMessage: updateErr?.message,
  })

  if (updateErr) {
    return { executed: false, actionId, reason: updateErr.message }
  }

  return { executed: true, actionId }
}
