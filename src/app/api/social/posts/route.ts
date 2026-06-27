import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  const status = req.nextUrl.searchParams.get("status")
  const network = req.nextUrl.searchParams.get("network")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  let query = supabase
    .from("social_posts")
    .select("id, network, title, caption, media_urls, scheduled_at, status, created_at")
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: true })

  if (status && status !== "all") query = query.eq("status", status)
  if (network && network !== "all") query = query.eq("network", network)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data ?? [] })
}
