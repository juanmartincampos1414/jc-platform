import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Estado de un job de generación de mes. La UI hace polling de este endpoint
// tras disparar /generate-month, hasta que status sea "completed" o "failed".
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId       = searchParams.get("jobId")
  const workspaceId = searchParams.get("workspaceId")

  if (!jobId || !workspaceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("agent_jobs")
    .select("status, error_message, output")
    .eq("id", jobId)
    .eq("workspace_id", workspaceId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 })
  }

  return NextResponse.json({
    status:        data.status,
    error_message: data.error_message ?? null,
    output:        data.output ?? null,
  })
}
