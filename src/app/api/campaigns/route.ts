import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/campaigns?workspaceId=...
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name, status, starts_at, ends_at, brief, created_at, updated_at, brand_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enriquecer con counts
  const enriched = await Promise.all((campaigns ?? []).map(async (c) => {
    const [assets, decisions, events] = await Promise.all([
      supabase.from("assets").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
      supabase.from("decisions").select("id", { count: "exact", head: true }).eq("campaign_id", c.id).eq("status", "active"),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("campaign_id", c.id),
    ])
    return {
      ...c,
      asset_count:    assets.count ?? 0,
      decision_count: decisions.count ?? 0,
      event_count:    events.count ?? 0,
    }
  }))

  return NextResponse.json({ campaigns: enriched })
}
