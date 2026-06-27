import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const [pendingPosts, pendingDocs, pendingInfluencers, jclaudeDrafts, activity] = await Promise.all([
    supabase.from("social_posts").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).eq("status", "pending"),
    supabase.from("legal_documents").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).eq("status", "pending"),
    supabase.from("influencers").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).in("status", ["proposal_sent", "content_review"]),
    supabase.from("jclaude_posts").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).eq("status", "draft"),
    supabase.from("activity_logs").select("action, entity_type, metadata, created_at, user_id")
      .eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(10),
  ])

  return NextResponse.json({
    stats: {
      pendingPosts: pendingPosts.count ?? 0,
      pendingDocs: pendingDocs.count ?? 0,
      pendingInfluencers: pendingInfluencers.count ?? 0,
      jclaudeDrafts: jclaudeDrafts.count ?? 0,
    },
    activity: activity.data ?? [],
  })
}
