import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const { data, error } = await supabase
    .from("legal_documents")
    .select("id, title, description, type, file_url, status, signed_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data ?? [] })
}
