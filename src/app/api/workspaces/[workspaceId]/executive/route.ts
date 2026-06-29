import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { buildExecutiveObject, type ExecutiveObject } from "@/lib/executive/engine"

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL     = "claude-sonnet-4-6"

// GET — devuelve snapshot persistido sin recalcular (Refresh Strategy: Cached)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("executive_snapshot, executive_narrative, executive_generated_at")
    .eq("id", workspaceId)
    .single()

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  return NextResponse.json({
    snapshot:     workspace.executive_snapshot     ?? null,
    narrative:    workspace.executive_narrative    ?? null,
    generated_at: workspace.executive_generated_at ?? null,
  })
}

// POST — regenera: Engine → ExecutiveObject → Claude Narrative Renderer → persiste
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  const { workspaceId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verificar acceso al workspace
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, executive_snapshot")
    .eq("id", workspaceId)
    .single()

  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 })

  // ── 1. Executive Engine: construye el ExecutiveObject ────────────────────
  const executiveObject = await buildExecutiveObject(supabase, {
    workspaceId,
    prevSnapshot: (workspace.executive_snapshot as ExecutiveObject | null),
  })

  // ── 2. Claude: Narrative Renderer ────────────────────────────────────────
  // Claude responde exactamente las 5 preguntas del panel ejecutivo.
  // No razona sobre la estrategia — la recibe terminada en el ExecutiveObject.
  const narrativePrompt = `Eres el Executive Narrative Renderer del sistema JC AI Agency.

Recibirás un ExecutiveObject estructurado construido por el sistema a partir de datos reales del workspace. Tu responsabilidad es producir una narrativa ejecutiva que responda exactamente cinco preguntas en ese orden, separadas por líneas en blanco.

Reglas:
- Una oración por pregunta. Máximo dos.
- Lenguaje de negocio. No de tecnología.
- No inventes información. Todo viene del objeto.
- La decisión recomendada debe formularse como acción concreta.

Las cinco preguntas (respondelas en este orden exacto, sin títulos):

1. ¿Qué está pasando? (estado actual del negocio)
2. ¿Por qué está pasando? (patrón dominante)
3. ¿Qué cambió desde la última vez? (si no hay anterior, decir que es el primer análisis)
4. ¿Qué riesgo merece atención esta semana?
5. ¿Cuál es la decisión más importante que debería tomar esta semana?

ExecutiveObject:
${JSON.stringify(executiveObject, null, 2)}

Workspace: ${workspace.name}

Produce únicamente las cinco respuestas, una por párrafo, sin numeración ni títulos.`

  let narrative = ""

  try {
    const message = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 500,
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

  // ── 3. Persiste: mueve current → prev, guarda nuevo ──────────────────────
  const { error: updateErr } = await supabase
    .from("workspaces")
    .update({
      executive_snapshot_prev: workspace.executive_snapshot ?? null,
      executive_snapshot:      executiveObject,
      executive_narrative:     narrative,
      executive_generated_at:  executiveObject.generated_at,
      updated_at:              new Date().toISOString(),
    })
    .eq("id", workspaceId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    snapshot:  executiveObject,
    narrative,
  })
}
