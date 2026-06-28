import type { SupabaseClient } from "@supabase/supabase-js"
import type { Brand, Campaign } from "@/lib/types/domain"
import { emitEvent } from "@/lib/events"

// ─── Get or create Default Brand ─────────────────────────────────────────────

export async function getOrCreateDefaultBrand(
  supabase: SupabaseClient,
  workspaceId: string,
  workspaceName?: string
): Promise<Brand> {
  const { data: existing } = await supabase
    .from("brands")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .single()

  if (existing) {
    // Ensure brand memory exists even if brand was created before Sprint 1.5
    await ensureBrandMemory(supabase, existing as Brand)
    return existing as Brand
  }

  let name = workspaceName
  if (!name) {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("name, slug")
      .eq("id", workspaceId)
      .single()
    name = ws?.name ?? "Marca"
  }

  const { data: profile } = await supabase
    .from("jclaude_profiles")
    .select("brand_name, tone, key_messages, target_audience, industry")
    .eq("workspace_id", workspaceId)
    .single()

  const slug = workspaceId.slice(0, 8)

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

  const brand = created as Brand

  await Promise.all([
    emitEvent({
      workspaceId,
      eventType:  "brand.created",
      entityType: "brand",
      entityId:   brand.id,
      actorType:  "system",
      brandId:    brand.id,
    }),
    ensureBrandMemory(supabase, brand),
  ])

  return brand
}

// ─── Ensure Brand Memory exists ───────────────────────────────────────────────

export async function ensureBrandMemory(
  supabase: SupabaseClient,
  brand: Brand
): Promise<void> {
  const { data: existing } = await supabase
    .from("memories")
    .select("id")
    .eq("brand_id", brand.id)
    .eq("memory_type", "brand")
    .limit(1)
    .single()

  if (existing) return

  const { data: memory } = await supabase
    .from("memories")
    .insert({
      workspace_id: brand.workspace_id,
      brand_id:     brand.id,
      memory_type:  "brand",
      status:       "active",
      title:        `Brand Memory — ${brand.name}`,
      content:      "",
      source:       "system",
    })
    .select("id")
    .single()

  if (memory) {
    await emitEvent({
      workspaceId: brand.workspace_id,
      eventType:   "memory.initialized",
      entityType:  "memory",
      entityId:    memory.id,
      actorType:   "system",
      brandId:     brand.id,
    })
  }
}

// ─── Get or create Default Campaign ──────────────────────────────────────────

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

  const campaign = created as Campaign

  await emitEvent({
    workspaceId,
    eventType:   "campaign.created",
    entityType:  "campaign",
    entityId:    campaign.id,
    actorType:   "system",
    brandId,
    campaignId:  campaign.id,
  })

  return campaign
}

// ─── Get campaign stats ───────────────────────────────────────────────────────

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
