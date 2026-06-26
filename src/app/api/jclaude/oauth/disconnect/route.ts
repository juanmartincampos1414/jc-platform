import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const { workspaceId } = await req.json()
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const supabase = await createClient()
  await supabase.from("jclaude_profiles").upsert({
    workspace_id: workspaceId,
    social_credentials: {},
    connected_networks: [],
    updated_at: new Date().toISOString(),
  }, { onConflict: "workspace_id" })

  return NextResponse.json({ success: true })
}
