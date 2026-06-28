import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/campaigns/[campaignId]?workspaceId=...
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { campaignId } = await params
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const [campaign, assets, decisions, memories, events] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status, starts_at, ends_at, brief, created_at, updated_at, brand_id, brands(name, industry)")
      .eq("id", campaignId)
      .eq("workspace_id", workspaceId)
      .single(),

    supabase
      .from("assets")
      .select("id, channel, asset_type, status, caption, scheduled_at, created_at, metadata")
      .eq("campaign_id", campaignId)
      .order("scheduled_at", { ascending: true }),

    supabase
      .from("decisions")
      .select("id, decision_type, status, confidence, rationale, supporting_knowledge, supporting_evidence, generated_at")
      .eq("campaign_id", campaignId)
      .order("confidence", { ascending: false }),

    supabase
      .from("memories")
      .select("id, memory_type, title, content, confidence, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .neq("memory_type", "brand")
      .order("confidence", { ascending: false }),

    supabase
      .from("events")
      .select("id, event_type, entity_type, entity_id, actor_type, metadata, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(30),
  ])

  if (campaign.error || !campaign.data) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
  }

  return NextResponse.json({
    campaign:  campaign.data,
    assets:    assets.data ?? [],
    decisions: decisions.data ?? [],
    knowledge: memories.data ?? [],
    activity:  events.data ?? [],
  })
}
