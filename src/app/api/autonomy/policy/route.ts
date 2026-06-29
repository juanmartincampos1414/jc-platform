import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { AutonomyPolicy } from "@/lib/autonomy/executor"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("workspaces")
    .select("autonomy_policy")
    .eq("id", workspaceId)
    .single()

  if (error || !data) return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 })

  return NextResponse.json({ policy: data.autonomy_policy })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspaceId, policy } = await req.json() as { workspaceId: string; policy: AutonomyPolicy }

  if (!workspaceId || !policy) {
    return NextResponse.json({ error: "Missing workspaceId or policy" }, { status: 400 })
  }

  // Validate levels are 0-3
  const levels = [policy.level, policy.class_a, policy.class_b, policy.class_c]
  if (levels.some(l => l === undefined || l < 0 || l > 3)) {
    return NextResponse.json({ error: "Niveles de política inválidos (deben ser 0-3)" }, { status: 400 })
  }

  // Clase C nunca puede ser 3 (Autonomous) — safety guardrail
  if (policy.class_c === 3) {
    return NextResponse.json({ error: "Clase C no puede ser Autonomous (nivel 3) — riesgo alto" }, { status: 400 })
  }

  const { error } = await supabase
    .from("workspaces")
    .update({ autonomy_policy: policy })
    .eq("id", workspaceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, policy })
}
