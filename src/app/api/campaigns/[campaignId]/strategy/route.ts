import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { buildStrategyObject } from "@/lib/strategy/engine"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL     = "claude-sonnet-4-6"

// POST /api/campaigns/[campaignId]/strategy
// 1. Strategy Engine construye el Strategy Object desde datos del dominio.
// 2. Claude recibe el objeto y produce únicamente la narrativa ejecutiva.
// 3. Ambos se persisten en campaigns.strategy + campaigns.strategy_narrative.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const { workspaceId } = await req.json()

  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verificar acceso y obtener brandId
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, brand_id, brief")
    .eq("id", campaignId)
    .eq("workspace_id", workspaceId)
    .single()

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

  // ── 1. Strategy Engine: construye el objeto estructurado ─────────────────
  const strategyObject = await buildStrategyObject(supabase, {
    campaignId,
    workspaceId,
    brandId: campaign.brand_id,
  })

  // ── 2. Claude: Narrative Renderer ─────────────────────────────────────────
  // Claude recibe el Strategy Object terminado. Su única responsabilidad
  // es expresarlo en lenguaje ejecutivo claro. No razona sobre la estrategia.
  const narrativePrompt = `Eres el Narrative Renderer del sistema JC AI Agency.

Recibirás un Strategy Object estructurado que el sistema construyó a partir de datos reales de la campaña. Tu única responsabilidad es expresar ese objeto en lenguaje ejecutivo claro y natural.

No inventes información. No añadas criterios que no estén en el objeto. No hagas recomendaciones que no aparezcan en recommended_next_actions.

La narrativa debe:
- Tener 3 párrafos (máximo 4).
- Ser legible por un CMO o dueño de empresa en menos de 60 segundos.
- Hablar del negocio, no del sistema.
- Usar los datos del objeto como fuente única de verdad.

Campaign: ${campaign.name}

Strategy Object:
${JSON.stringify(strategyObject, null, 2)}

Produce únicamente la narrativa ejecutiva. Sin títulos, sin bullets, sin markdown.`

  let narrative = ""

  try {
    const message = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 600,
      messages:   [{ role: "user", content: narrativePrompt }],
    })

    narrative = message.content
      .filter(b => b.type === "text")
      .map(b => (b as { type: "text"; text: string }).text)
      .join("")
      .trim()
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Narrative generation failed: ${errMsg}` }, { status: 500 })
  }

  // ── 3. Persistir ambos: objeto + narrativa ────────────────────────────────
  const { error: updateErr } = await supabase
    .from("campaigns")
    .update({
      strategy:              strategyObject,
      strategy_narrative:    narrative,
      strategy_generated_at: strategyObject.generated_at,
      updated_at:            new Date().toISOString(),
    })
    .eq("id", campaignId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    strategy:   strategyObject,
    narrative,
  })
}

// GET /api/campaigns/[campaignId]/strategy
// Devuelve strategy + narrative ya guardados sin recalcular.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const { campaignId } = await params
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("strategy, strategy_narrative, strategy_generated_at")
    .eq("id", campaignId)
    .eq("workspace_id", workspaceId)
    .single()

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

  return NextResponse.json({
    strategy:   campaign.strategy   ?? null,
    narrative:  campaign.strategy_narrative ?? null,
    generated_at: campaign.strategy_generated_at ?? null,
  })
}
