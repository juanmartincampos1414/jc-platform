import type { SupabaseClient } from "@supabase/supabase-js"
import type { Asset, AssetComment, AssetStatus, Channel, AssetType } from "@/lib/types/domain"
import { emitActivity, emitEvent } from "@/lib/events"

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAssets(
  supabase: SupabaseClient,
  workspaceId: string,
  filters: {
    campaignId?: string
    status?: AssetStatus | "all"
    channel?: Channel | "all"
    assetType?: AssetType | "all"
    scheduledMonth?: { year: number; month: number }
    source?: "jclaude" | "social_posts" | "all"
    limit?: number
  } = {}
): Promise<Asset[]> {
  let query = supabase
    .from("assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: true })

  if (filters.campaignId) query = query.eq("campaign_id", filters.campaignId)
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status)
  if (filters.channel && filters.channel !== "all") query = query.eq("channel", filters.channel)
  if (filters.assetType && filters.assetType !== "all") query = query.eq("asset_type", filters.assetType)
  if (filters.scheduledMonth) {
    const { year, month } = filters.scheduledMonth
    const start = `${year}-${String(month).padStart(2, "0")}-01`
    const end   = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}T23:59:59`
    query = query.gte("scheduled_at", start).lte("scheduled_at", end)
  }
  if (filters.source && filters.source !== "all") {
    query = query.eq("metadata->>source", filters.source)
  }
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as Asset[]
}

export async function getAsset(
  supabase: SupabaseClient,
  assetId: string
): Promise<Asset | null> {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("id", assetId)
    .single()
  if (error) return null
  return data as Asset
}

export async function getAssetComments(
  supabase: SupabaseClient,
  assetId: string
): Promise<AssetComment[]> {
  const { data, error } = await supabase
    .from("asset_comments")
    .select("*")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: true })
  if (error) return []
  return (data ?? []) as AssetComment[]
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function updateAssetStatus(
  supabase: SupabaseClient,
  params: {
    assetId:         string
    workspaceId:     string
    userId:          string
    brandId?:        string
    campaignId?:     string
    status:          "approved" | "rejected" | "needs_changes" | "sent_for_approval"
    rejectionReason?: string
    changeRequests?:  string
  }
): Promise<{ error?: string }> {
  if (
    (params.status === "rejected" || params.status === "needs_changes") &&
    !params.rejectionReason?.trim()
  ) {
    return { error: "rejection_reason es obligatorio al rechazar o pedir cambios" }
  }

  const update: Record<string, unknown> = {
    status:     params.status,
    updated_at: new Date().toISOString(),
  }
  if (params.status === "approved") {
    update.approved_by = params.userId
    update.approved_at = new Date().toISOString()
  }
  if (params.rejectionReason) update.rejection_reason = params.rejectionReason
  if (params.changeRequests)  update.change_requests  = params.changeRequests

  const { error } = await supabase
    .from("assets")
    .update(update)
    .eq("id", params.assetId)
    .eq("workspace_id", params.workspaceId)

  if (error) return { error: error.message }

  const eventType = params.status === "approved"
    ? "asset.approved"
    : params.status === "rejected"
    ? "asset.rejected"
    : "asset.needs_changes"

  await Promise.all([
    emitEvent({
      workspaceId: params.workspaceId,
      eventType:   eventType as "asset.approved" | "asset.rejected" | "asset.needs_changes",
      entityType:  "asset",
      entityId:    params.assetId,
      actorId:     params.userId,
      actorType:   "user",
      brandId:     params.brandId,
      campaignId:  params.campaignId,
      metadata: {
        rejection_reason: params.rejectionReason ?? null,
        change_requests:  params.changeRequests  ?? null,
      },
    }),
    emitActivity({
      workspace_id: params.workspaceId,
      user_id:      params.userId,
      action:       `asset.${params.status}`,
      entity_type:  "asset",
      entity_id:    params.assetId,
      metadata: {
        rejection_reason: params.rejectionReason ?? null,
        change_requests:  params.changeRequests  ?? null,
      },
    }),
  ])

  return {}
}

export async function addAssetComment(
  supabase: SupabaseClient,
  params: {
    assetId:     string
    workspaceId: string
    userId:      string
    content:     string
  }
): Promise<{ comment?: AssetComment; error?: string }> {
  const { data, error } = await supabase
    .from("asset_comments")
    .insert({
      asset_id:     params.assetId,
      workspace_id: params.workspaceId,
      user_id:      params.userId,
      content:      params.content.trim(),
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { comment: data as AssetComment }
}

// ─── Dual-write helpers ───────────────────────────────────────────────────────

export async function insertCreativeForPost(
  supabase: SupabaseClient,
  params: {
    workspaceId:  string
    campaignId:   string | null   // null = contenido sin campaña (ADR-007)
    content:      string   // copy + hashtags concatenados
    agentJobId?:  string
    sourceTable?: string
    sourceId?:    string
  }
): Promise<{ creativeId?: string; error?: string }> {
  const { data, error } = await supabase
    .from("creatives")
    .insert({
      workspace_id:  params.workspaceId,
      campaign_id:   params.campaignId ?? null,
      creative_type: "copy",
      status:        "draft",
      content:       params.content,
      model:         "claude-sonnet-4-6",
      agent_job_id:  params.agentJobId  ?? null,
      source_table:  params.sourceTable ?? null,
      source_id:     params.sourceId    ?? null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  return { creativeId: data.id }
}

export async function insertAssetForCreative(
  supabase: SupabaseClient,
  params: {
    workspaceId:  string
    campaignId:   string | null   // null = contenido sin campaña (ADR-007)
    creativeId:   string   // obligatorio — assets sin creative_id viola el dominio
    channel:      string
    assetType:    string
    caption:      string
    hashtags:     string
    imageBrief:   string
    scheduledAt:  string
    agentJobId?:  string
    sourceTable?: string
    sourceId?:    string
  }
): Promise<{ assetId?: string; error?: string }> {
  const normalizedType    = (["post","reel","story","carousel","video"].includes(params.assetType) ? params.assetType : "post") as AssetType
  const normalizedChannel = (["instagram","facebook","tiktok","youtube","linkedin","twitter"].includes(params.channel) ? params.channel : "instagram") as Channel

  const { data, error } = await supabase
    .from("assets")
    .insert({
      workspace_id:  params.workspaceId,
      campaign_id:   params.campaignId ?? null,
      creative_id:   params.creativeId,
      agent_job_id:  params.agentJobId  ?? null,
      asset_type:    normalizedType,
      channel:       normalizedChannel,
      status:        "draft" as AssetStatus,
      caption:       params.caption,
      file_urls:     [],
      scheduled_at:  params.scheduledAt,
      metadata: {
        hashtags:    params.hashtags,
        image_brief: params.imageBrief,
        source:      "jclaude",
      },
      source_table:  params.sourceTable ?? null,
      source_id:     params.sourceId    ?? null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  return { assetId: data.id }
}

// Kept for backward compatibility — Sprint 2 removes this
export async function insertAssetFromJClaudePost(
  supabase: SupabaseClient,
  params: {
    workspaceId:  string
    campaignId:   string
    channel:      string
    assetType:    string
    caption:      string
    hashtags:     string
    imageBrief:   string
    scheduledAt:  string
    metadata?:    Record<string, unknown>
    sourceId?:    string
  }
): Promise<{ assetId?: string; error?: string }> {
  const normalizedType    = (["post","reel","story","carousel","video"].includes(params.assetType) ? params.assetType : "post") as AssetType
  const normalizedChannel = (["instagram","facebook","tiktok","youtube","linkedin","twitter"].includes(params.channel) ? params.channel : "instagram") as Channel

  const { data, error } = await supabase
    .from("assets")
    .insert({
      workspace_id:  params.workspaceId,
      campaign_id:   params.campaignId,
      asset_type:    normalizedType,
      channel:       normalizedChannel,
      status:        "draft" as AssetStatus,
      caption:       params.caption,
      file_urls:     [],
      scheduled_at:  params.scheduledAt,
      metadata: {
        hashtags:    params.hashtags,
        image_brief: params.imageBrief,
        source:      "jclaude",
        ...params.metadata,
      },
      ...(params.sourceId ? { source_table: "jclaude_posts", source_id: params.sourceId } : {}),
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  return { assetId: data.id }
}

export async function deleteDraftAssets(
  supabase: SupabaseClient,
  workspaceId: string,
  campaignId:  string,
  dateRange:   { start: string; end: string }
): Promise<void> {
  await supabase
    .from("assets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("campaign_id", campaignId)
    .eq("status", "draft")
    .gte("scheduled_at", dateRange.start)
    .lte("scheduled_at", dateRange.end + "T23:59:59")
}
