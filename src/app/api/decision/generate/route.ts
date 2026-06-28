import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateAndStoreDecisions } from "@/lib/decision/engine"
import { generateAndStoreRecommendations } from "@/lib/recommendation/engine"

// POST /api/decision/generate
// Genera Decisions a partir del Knowledge activo de una Brand.
// Se llama automáticamente después de extractAndStoreKnowledge.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspaceId, brandId, campaignId } = await req.json()
  if (!workspaceId || !brandId) {
    return NextResponse.json({ error: "Missing workspaceId or brandId" }, { status: 400 })
  }

  try {
    const decisions = await generateAndStoreDecisions(supabase, workspaceId, brandId, campaignId)

    // Si hay campaignId, también derivar Recommendations desde las Decisions
    if (campaignId) {
      await generateAndStoreRecommendations(supabase, workspaceId, brandId, campaignId)
    }

    return NextResponse.json({
      generated: decisions.length,
      types: decisions.map(d => d.decision_type),
      decisions,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const brandId     = req.nextUrl.searchParams.get("brandId")
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!brandId || !workspaceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("decisions")
    .select("*")
    .eq("brand_id", brandId)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("confidence", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ decisions: data ?? [] })
}
