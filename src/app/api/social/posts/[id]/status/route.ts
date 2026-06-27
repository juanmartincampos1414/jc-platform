import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { emitActivity } from "@/lib/activity"

const VALID_STATUSES = ["approved", "rejected", "needs_changes", "pending"] as const
type PostStatus = typeof VALID_STATUSES[number]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { status, comment, workspaceId } = await req.json()

  if (!VALID_STATUSES.includes(status as PostStatus)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
  }

  const { data: post } = await supabase
    .from("social_posts")
    .select("id, network, workspace_id")
    .eq("id", id)
    .single()

  if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 })

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  const { error } = await supabase.from("social_posts").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (comment?.trim()) {
    await supabase.from("post_comments").insert({
      post_id: id,
      user_id: user.id,
      content: comment.trim(),
    })
  }

  await emitActivity({
    workspace_id: post.workspace_id,
    user_id: user.id,
    action: `post.${status}`,
    entity_type: "post",
    entity_id: id,
    metadata: { network: post.network, comment: comment ?? null },
  })

  return NextResponse.json({ success: true })
}
