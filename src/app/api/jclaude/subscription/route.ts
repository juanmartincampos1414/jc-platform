import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspaceId")

  if (!workspaceId) return NextResponse.json({ subscription: null })

  const supabase = await createClient()
  const { data } = await supabase
    .from("jclaude_subscriptions")
    .select("plan, status, posts_limit, networks_limit, autopublish, trending, videos_limit")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .single()

  return NextResponse.json({ subscription: data || null })
}
