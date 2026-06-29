import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getAssets } from "@/lib/adapters/assets"
import type { AssetStatus, Channel } from "@/lib/types/domain"

// Mapeo de status legacy social_posts → asset status para filtros de UI
const LEGACY_TO_ASSET_STATUS: Record<string, AssetStatus> = {
  pending:      "sent_for_approval",
  approved:     "approved",
  rejected:     "rejected",
  needs_changes: "needs_changes",
  published:    "published",
  draft:        "draft",
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  const status      = req.nextUrl.searchParams.get("status")
  const network     = req.nextUrl.searchParams.get("network")
  const monthParam  = req.nextUrl.searchParams.get("month")
  const yearParam   = req.nextUrl.searchParams.get("year")

  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  // Resolver filtro de status (acepta tanto nombres legacy como nombres nuevos)
  const resolvedStatus = status && status !== "all"
    ? (LEGACY_TO_ASSET_STATUS[status] ?? status as AssetStatus)
    : undefined

  const scheduledMonth = monthParam && yearParam
    ? { year: parseInt(yearParam), month: parseInt(monthParam) }
    : undefined

  try {
    const assets = await getAssets(supabase, workspaceId, {
      status:         resolvedStatus ?? undefined,
      channel:        (network && network !== "all" ? network as Channel : undefined),
      scheduledMonth,
    })

    // Transformar al shape que espera la UI de Social Media
    const posts = assets.map(a => ({
      id:           a.id,
      network:      a.channel,
      title:        (a.metadata?.title as string) ?? a.caption?.slice(0, 50) ?? "",
      caption:      a.caption ?? "",
      media_urls:   a.file_urls,
      scheduled_at: a.scheduled_at,
      status:       mapAssetStatusToLegacy(a.status),
      created_at:   a.created_at,
      // campos extendidos del dominio nuevo
      asset_type:   a.asset_type,
      asset_status: a.status,
      campaign_id:  a.campaign_id,
    }))

    return NextResponse.json({ posts })
  } catch (err) {
    // Fallback a tabla vieja si assets no tiene datos todavía
    const { data, error } = await supabase
      .from("social_posts")
      .select("id, network, title, caption, media_urls, scheduled_at, status, created_at")
      .eq("workspace_id", workspaceId)
      .order("scheduled_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.warn("[social/posts] Fallback to social_posts:", err)
    return NextResponse.json({ posts: data ?? [] })
  }
}

function mapAssetStatusToLegacy(status: AssetStatus): string {
  const map: Record<AssetStatus, string> = {
    generating:          "draft",
    draft:               "draft",
    internal_review:     "draft",
    sent_for_approval:   "pending",
    approved:            "approved",
    rejected:            "rejected",
    needs_changes:       "needs_changes",
    scheduled:           "approved",
    published:           "published",
    archived:            "published",
  }
  return map[status] ?? status
}
