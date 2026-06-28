// Knowledge Engine
// Flujo: Assets/Events → Extractors → Knowledge Objects → memories table
// También construye el BrandKnowledgeContext listo para inyectar en prompts de Claude

import type { SupabaseClient } from "@supabase/supabase-js"
import type { BrandKnowledgeContext, KnowledgeObject } from "./types"
import { runAllExtractors } from "./extractors"
import { emitEvent } from "@/lib/events"
import { generateAndStoreDecisions } from "@/lib/decision/engine"

// ─── Extract & Store ──────────────────────────────────────────────────────────
// Extrae conocimiento de los assets de un workspace/brand y lo persiste en memories.
// Idempotente: sobreescribe el knowledge existente del mismo tipo para este brand.

export async function extractAndStoreKnowledge(
  supabase: SupabaseClient,
  workspaceId: string,
  brandId: string,
  campaignId?: string
): Promise<KnowledgeObject[]> {
  // Cargar todos los assets del workspace (o campaign específica)
  let query = supabase
    .from("assets")
    .select("id, channel, asset_type, status, caption, scheduled_at, metadata")
    .eq("workspace_id", workspaceId)

  if (campaignId) query = query.eq("campaign_id", campaignId)

  const { data: assets, error } = await query
  if (error || !assets || assets.length === 0) return []

  const objects = runAllExtractors(assets)
  if (objects.length === 0) return []

  const now = new Date().toISOString()

  // Persistir cada Knowledge Object en memories
  // Estrategia: upsert por (brand_id, memory_type, title) — reemplaza el anterior
  for (const obj of objects) {
    // Marcar el anterior como deprecated
    await supabase
      .from("memories")
      .update({ status: "deprecated" })
      .eq("brand_id", brandId)
      .eq("memory_type", obj.type)
      .eq("status", "active")

    // Insertar el nuevo
    await supabase
      .from("memories")
      .insert({
        workspace_id: workspaceId,
        brand_id:     brandId,
        campaign_id:  campaignId ?? null,
        memory_type:  obj.type,
        status:       "active",
        title:        obj.title,
        content:      obj.content,
        source:       obj.source,
        confidence:   obj.confidence,
        metadata: {
          data:        obj.data,
          sample_size: obj.sample_size,
          period:      obj.period ?? null,
          extracted_at: now,
        },
      })
  }

  await emitEvent({
    workspaceId,
    eventType:  "memory.initialized",
    entityType: "brand",
    entityId:   brandId,
    actorType:  "agent",
    brandId,
    campaignId,
    metadata: {
      knowledge_types: objects.map(o => o.type),
      asset_count:     assets.length,
    },
  })

  // Pipeline: Knowledge → Decision (fire-and-forget)
  generateAndStoreDecisions(supabase, workspaceId, brandId, campaignId)
    .catch(err => console.error("[knowledge/engine] Decision generation error:", err))

  return objects
}

// ─── Load Brand Knowledge Context ────────────────────────────────────────────
// Lee el conocimiento activo de una Brand y construye el contexto para inyectar en Claude.

export async function loadBrandKnowledgeContext(
  supabase: SupabaseClient,
  workspaceId: string,
  brandId: string,
  brandName: string
): Promise<BrandKnowledgeContext> {
  const { data: memories } = await supabase
    .from("memories")
    .select("memory_type, title, content, confidence, metadata")
    .eq("brand_id", brandId)
    .eq("status", "active")
    .neq("memory_type", "brand")   // brand identity se maneja por separado
    .order("confidence", { ascending: false })

  const objects: KnowledgeObject[] = (memories ?? []).map(m => ({
    type:        m.memory_type as KnowledgeObject["type"],
    title:       m.title,
    content:     m.content,
    data:        (m.metadata as Record<string, unknown>)?.data as Record<string, unknown> ?? {},
    confidence:  m.confidence ?? 0,
    source:      "observed",
    sample_size: (m.metadata as Record<string, unknown>)?.sample_size as number ?? 0,
  }))

  // Construir texto de contexto para el prompt de Claude
  // Solo incluir conocimientos con confidence > 0.3 (al menos 6 assets analizados)
  const relevant = objects.filter(o => o.confidence > 0.3)

  const promptContext = relevant.length === 0
    ? ""
    : [
        "\nCONOCIMIENTO PREVIO DE ESTA MARCA (basado en campañas anteriores):",
        ...relevant.map(o => `- ${o.title}: ${o.content}`),
        "Usar este conocimiento para informar el calendario. No copiar literalmente.",
      ].join("\n")

  const { data: assetCount } = await supabase
    .from("assets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)

  return {
    brandId,
    brandName,
    objects,
    promptContext,
    extractedAt:  new Date().toISOString(),
    totalAssets:  (assetCount as unknown as { count: number })?.count ?? 0,
  }
}
