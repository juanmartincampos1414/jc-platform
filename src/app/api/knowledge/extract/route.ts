import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractAndStoreKnowledge } from "@/lib/knowledge/engine"

// POST /api/knowledge/extract
// Extrae Knowledge Objects de los assets de un workspace/brand y los almacena en memories.
// Se llama automáticamente al final de generate-month.
// También disponible para trigger manual desde admin.

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { workspaceId, brandId, campaignId } = await req.json()
  if (!workspaceId || !brandId) {
    return NextResponse.json({ error: "Missing workspaceId or brandId" }, { status: 400 })
  }

  try {
    const objects = await extractAndStoreKnowledge(supabase, workspaceId, brandId, campaignId)
    return NextResponse.json({
      extracted: objects.length,
      types: objects.map(o => o.type),
      objects,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
