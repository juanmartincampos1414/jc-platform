import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAssetComments, addAssetComment } from "@/lib/adapters/assets"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Intentar leer de asset_comments (tabla nueva)
  const assetComments = await getAssetComments(supabase, id)
  if (assetComments.length > 0) {
    return NextResponse.json({ comments: assetComments })
  }

  // Fallback: leer de post_comments (tabla vieja, el asset puede ser un social_post)
  const { data: legacyComments, error } = await supabase
    .from("post_comments")
    .select("id, content, created_at, user_id")
    .eq("post_id", id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: legacyComments ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { content, workspaceId } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: "Comentario vacío" }, { status: 400 })

  // Verificar si el id pertenece a un asset nuevo
  const { data: asset } = await supabase
    .from("assets")
    .select("id, workspace_id")
    .eq("id", id)
    .single()

  if (asset) {
    const { comment, error } = await addAssetComment(supabase, {
      assetId:     id,
      workspaceId: asset.workspace_id,
      userId:      user.id,
      content,
    })
    if (error) return NextResponse.json({ error }, { status: 500 })
    return NextResponse.json({ comment })
  }

  // Fallback: comentar en tabla vieja (social_posts)
  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: id, user_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}
