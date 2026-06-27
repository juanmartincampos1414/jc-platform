import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCampaignStats } from "@/lib/adapters/campaigns"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  // Stats desde dominio nuevo (assets + campaigns)
  const [stats, pendingInfluencers, eventsRes] = await Promise.all([
    getCampaignStats(supabase, workspaceId),
    supabase.from("influencers").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).in("status", ["proposal_sent", "content_review"]),
    supabase.from("events")
      .select("event, entity_type, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // Fallback a activity_logs si events todavía está vacío (pre-backfill)
  let activityData = eventsRes.data ?? []
  if (activityData.length === 0) {
    const { data: legacy } = await supabase
      .from("activity_logs")
      .select("action, entity_type, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(10)
    activityData = (legacy ?? []).map(r => ({ ...r, event: r.action }))
  }

  return NextResponse.json({
    stats: {
      pendingPosts:        stats.pendingAssets,
      pendingDocs:         stats.pendingDocs,
      pendingInfluencers:  pendingInfluencers.count ?? 0,
      jclaudeDrafts:       stats.jclaudeDrafts,
      activeCampaigns:     stats.activeCampaigns,
    },
    activity: activityData,
  })
}
