import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ profile: null })

  const supabase = await createClient()
  const { data } = await supabase
    .from("jclaude_profiles")
    .select("brand_name, industry, tone, target_audience, key_messages, connected_networks, social_credentials")
    .eq("workspace_id", workspaceId)
    .single()

  return NextResponse.json({ profile: data || null })
}
