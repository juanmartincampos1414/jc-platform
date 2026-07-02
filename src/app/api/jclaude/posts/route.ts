import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Asset Domain Migration — Paso 4a: sincronización de estados jclaude_posts → assets.
// El calendario todavía escribe jclaude_posts; este mapa mantiene el asset vinculado
// en sync para que el cutover de lectura (Paso 4c) muestre estados correctos.
const JCLAUDE_TO_ASSET_STATUS: Record<string, string> = {
  draft:         "draft",
  approved:      "approved",
  rejected:      "rejected",
  needs_changes: "needs_changes",
  scheduled:     "scheduled",
  published:     "published",
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspaceId")
  const month = searchParams.get("month") // "2025-07"

  if (!workspaceId || !month) {
    return NextResponse.json({ posts: [] })
  }

  const [year, mon] = month.split("-")
  const startDate = `${year}-${mon}-01`
  const daysInMonth = new Date(Number(year), Number(mon), 0).getDate()
  const endDate = `${year}-${mon}-${daysInMonth}T23:59:59`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("jclaude_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate)
    .order("scheduled_at", { ascending: true })

  if (error) return NextResponse.json({ posts: [], error: error.message })
  return NextResponse.json({ posts: data || [] })
}

export async function PATCH(req: NextRequest) {
  const { id, status, scheduled_at, image_url } = await req.json()

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
  }

  const supabase = await createClient()
  const update: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (scheduled_at) update.scheduled_at = scheduled_at
  if (image_url) update.image_url = image_url

  const { data, error } = await supabase
    .from("jclaude_posts")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Paso 4a — sincronizar el asset vinculado (best-effort; no rompe la respuesta).
  // Busca el asset por trazabilidad (source_table + source_id) y refleja estado /
  // scheduled_at / imagen. Mantiene assets como fuente de verdad consistente.
  const assetStatus = JCLAUDE_TO_ASSET_STATUS[status as string]
  const assetUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (assetStatus) assetUpdate.status = assetStatus
  if (scheduled_at) assetUpdate.scheduled_at = scheduled_at
  if (image_url) assetUpdate.file_urls = [image_url]
  const { error: assetErr } = await supabase
    .from("assets")
    .update(assetUpdate)
    .eq("source_table", "jclaude_posts")
    .eq("source_id", id)
  if (assetErr) console.error("[jclaude/posts] Asset status sync error:", assetErr.message)

  return NextResponse.json({ post: data })
}
