// Adapter layer — campaigns y brands
// Resuelve o crea el Brand/Campaign por defecto de un workspace.
// Durante Sprint 1 cada workspace tiene exactamente una Brand y una Campaign "General".

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Brand, Campaign } from "@/lib/types/domain"

// ─── Get or create Default Brand ─────────────────────────────

export async function getOrCreateDefaultBrand(
  supabase: SupabaseClient,
  workspaceId: string,
  workspaceName?: string
): Promise<Brand> {
  // Buscar brand existente
  const { data: existing } = await supabase
    .from("brands")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (existing) return existing as Brand

  // Obtener nombre del workspace si no vino como parámetro
  let name = workspaceName
  if (!name) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name, slug")
      .eq("id", workspaceId)
      .single()
    name = ws?.name ?? "Marca"
  }

  // Obtener perfil de jclaude_profiles si existe
  const { data: profile } = await supabase
    .from("jclaude_profiles")
    .select("brand_name, tone, key_messages, target_audience, industry")
    .eq("workspace_id", workspaceId)
    .single()

  const slug = workspaceId.slice(0, 8) // slug único basado en workspace_id

  const { data: created, error } = await supabase
    .from("brands")
    .insert({
      workspace_id: workspaceId,
      name:         profile?.brand_name || name,
      slug,
      status:       "active",
      voice: {
        tone:         profile?.tone         ?? "",
        key_messages: profile?.key_messages ?? "",
        industry:     profile?.industry     ?? "",
      },
      audience: {
        primary_demo: profile?.target_audience ?? "",
      },
    })
    .select()
    .single()

  if (error) throw new Error(`Error creando Brand: ${error.message}`)
  return created as Brand
}

// ─── Get or create Default Campaign ──────────────────────────

export async function getOrCreateDefaultCampaign(
  supabase: SupabaseClient,
  workspaceId: string,
  brandId: string,
  year: number
): Promise<Campaign> {
  const name = `Contenido General — ${year}`

  const { data: existing } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("brand_id", brandId)
    .eq("name", name)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (existing) return existing as Campaign

  const { data: created, error } = await supabase
    .from("campaigns")
    .insert({
      workspace_id: workspaceId,
      brand_id:     brandId,
      name,
      status:       "active",
      brief: {
        objective: "Contenido mensual generado por JClaude.",
        channels:  ["instagram", "facebook"],
      },
      starts_at: `${year}-01-01T00:00:00Z`,
    })
    .select()
    .single()

  if (error) throw new Error(`Error creando Campaign: ${error.message}`)
  return created as Campaign
}

// ─── Get campaign stats ───────────────────────────────────────

export async function getCampaignStats(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<{
  pendingAssets:   number
  pendingDocs:     number
  activeCampaigns: number
  jclaudeDrafts:   number
}> {
  const [pendingAssets, pendingDocs, activeCampaigns, jclaudeDrafts] = await Promise.all([
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "sent_for_approval"),
    supabase
      .from("legal_documents")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "pending"),
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", ["active", "in_production", "in_review", "publishing"]),
    supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "draft")
      .eq("metadata->>source", "jclaude"),
  ])

  return {
    pendingAssets:   pendingAssets.count   ?? 0,
    pendingDocs:     pendingDocs.count     ?? 0,
    activeCampaigns: activeCampaigns.count ?? 0,
    jclaudeDrafts:   jclaudeDrafts.count  ?? 0,
  }
}
