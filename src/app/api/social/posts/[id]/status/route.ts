import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { updateAssetStatus } from "@/lib/adapters/assets"
import { emitActivity } from "@/lib/activity"
import type { AssetStatus } from "@/lib/types/domain"
import { autoScheduleApprovedAsset } from "@/lib/autonomy/executor"

// Mapa de status legacy (UI) → status de dominio (assets)
const STATUS_MAP: Record<string, AssetStatus> = {
  approved:      "approved",
  rejected:      "rejected",
  needs_changes: "needs_changes",
  pending:       "sent_for_approval",
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status, comment, workspaceId, rejectionReason } = await req.json()

  const domainStatus = STATUS_MAP[status]
  if (!domainStatus) return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  if (!workspaceId)  return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  // Intentar update en tabla nueva (assets)
  const assetResult = await updateAssetStatus(supabase, {
    assetId:          id,
    workspaceId,
    userId:           user.id,
    status:           domainStatus as "approved" | "rejected" | "needs_changes" | "sent_for_approval",
    rejectionReason:  rejectionReason ?? comment,
  })

  if (assetResult.error) {
    // Puede que el asset no exista en tabla nueva (todavía sin backfill), fallback a tabla vieja
    const legacyStatus = status // la tabla vieja tiene los mismos nombres de status
    const { data: post } = await supabase
      .from("social_posts")
      .select("id, network, workspace_id")
      .eq("id", id)
      .single()

    if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })

    const { error: updateError } = await supabase
      .from("social_posts")
      .update({ status: legacyStatus, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    if (comment?.trim()) {
      await supabase.from("post_comments").insert({
        post_id: id, user_id: user.id, content: comment.trim(),
      })
    }

    await emitActivity({
      workspace_id: post.workspace_id,
      user_id:      user.id,
      action:       `post.${status}`,
      entity_type:  "post",
      entity_id:    id,
      metadata:     { network: post.network, comment: comment ?? null, source: "legacy" },
    })

    return NextResponse.json({ success: true, source: "legacy" })
  }

  // Agregar comentario en asset_comments si vino uno
  if (comment?.trim()) {
    await supabase.from("asset_comments").insert({
      asset_id:     id,
      workspace_id: workspaceId,
      user_id:      user.id,
      content:      comment.trim(),
    })
  }

  // Autonomous action — fire-and-forget, nunca bloquea la respuesta al cliente
  if (domainStatus === "approved") {
    autoScheduleApprovedAsset(supabase, {
      assetId:     id,
      workspaceId,
      confidence:  1.0,
    }).catch(err => console.error("[autonomy] autoScheduleApprovedAsset error:", err))
  }

  return NextResponse.json({ success: true, source: "domain" })
}
