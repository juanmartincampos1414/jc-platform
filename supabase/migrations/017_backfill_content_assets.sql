-- ============================================================
-- Migration 017 — Backfill: cerrar la brecha de contenido en `assets`
-- ============================================================
-- Asset Domain Migration — PASO 3 (Backfill)
-- Ver: docs/05-data-architecture/asset-domain-migration-plan.md
--      docs/09-decisions/ADR-007-content-without-campaign.md
--
-- CONTEXTO
--   La migración 004 (Sprint 1) ya hizo un backfill inicial de
--   jclaude_posts / social_posts → creatives + assets. Desde entonces se
--   generó más contenido, y el dual-write a `assets` de generate-month era
--   fire-and-forget (poco confiable), por lo que quedaron jclaude_posts /
--   social_posts SIN su asset correspondiente. Esta migración cierra esa
--   brecha para que `assets` contenga TODA la historia ANTES del cutover
--   de lectura (Paso 4).
--
-- PROPIEDADES (DoD Paso 3)
--   • Idempotente     → guardas WHERE NOT EXISTS por (source_table, source_id).
--                       Re-ejecutar no duplica.
--   • No destructiva   → solo INSERT. jclaude_posts / social_posts intactos.
--   • Sin cutover      → no cambia ninguna lectura. Nada lee estas filas todavía
--                       (el calendario sigue leyendo jclaude_posts). Impacto en
--                       producción: nulo.
--   • Rollback         → filas tagueadas con metadata->>'backfill' = '017'.
--                       Ver ROLLBACK_017.sql.
--
-- campaign_id: NULL (ADR-007 — el contenido de JClaude no pertenece a una
--   campaña; campaign_id es nullable desde la migración 016).
--
-- Aplicar en Supabase SQL Editor, DESPUÉS de 016.
-- ============================================================

-- ------------------------------------------------------------
-- (Opcional) CHECK PRE-BACKFILL — cuántas filas legacy no tienen asset
-- Ejecutar antes para dimensionar la brecha:
-- ------------------------------------------------------------
-- SELECT 'jclaude_posts sin asset' AS gap, count(*)
--   FROM public.jclaude_posts jp
--   WHERE NOT EXISTS (SELECT 1 FROM public.assets a
--                     WHERE a.source_table = 'jclaude_posts' AND a.source_id = jp.id)
-- UNION ALL
-- SELECT 'social_posts sin asset', count(*)
--   FROM public.social_posts sp
--   WHERE NOT EXISTS (SELECT 1 FROM public.assets a
--                     WHERE a.source_table = 'social_posts' AND a.source_id = sp.id);

-- ============================================================
-- PASO A — Creatives faltantes para jclaude_posts (el copy)
-- ============================================================
INSERT INTO public.creatives (
  workspace_id,
  campaign_id,
  creative_type,
  status,
  content,
  model,
  source_table,
  source_id,
  created_at,
  updated_at
)
SELECT
  jp.workspace_id,
  NULL                                                        AS campaign_id,   -- ADR-007
  'copy'                                                      AS creative_type,
  CASE jp.status
    WHEN 'draft'      THEN 'draft'
    WHEN 'approved'   THEN 'approved'
    WHEN 'scheduled'  THEN 'approved'
    WHEN 'published'  THEN 'approved'
    WHEN 'rejected'   THEN 'draft'
    ELSE 'draft'
  END                                                         AS status,
  jp.copy || COALESCE(chr(10) || chr(10) || jp.hashtags, '')  AS content,
  'claude-sonnet-4-6'                                         AS model,
  'jclaude_posts'                                             AS source_table,
  jp.id                                                       AS source_id,
  jp.created_at,
  jp.updated_at
FROM public.jclaude_posts jp
WHERE NOT EXISTS (
  SELECT 1 FROM public.creatives cr
  WHERE cr.source_table = 'jclaude_posts' AND cr.source_id = jp.id
);

-- ============================================================
-- PASO B — Assets faltantes para jclaude_posts (vinculados al creative)
-- ============================================================
INSERT INTO public.assets (
  workspace_id,
  campaign_id,
  creative_id,
  asset_type,
  channel,
  status,
  caption,
  file_urls,
  scheduled_at,
  metadata,
  source_table,
  source_id,
  created_at,
  updated_at
)
SELECT
  jp.workspace_id,
  NULL                                                         AS campaign_id,   -- ADR-007
  cr.id                                                        AS creative_id,
  CASE jp.post_type
    WHEN 'reel'      THEN 'reel'
    WHEN 'story'     THEN 'story'
    WHEN 'carousel'  THEN 'carousel'
    ELSE 'post'
  END                                                          AS asset_type,
  CASE jp.network
    WHEN 'instagram' THEN 'instagram'
    WHEN 'facebook'  THEN 'facebook'
    WHEN 'tiktok'    THEN 'tiktok'
    WHEN 'youtube'   THEN 'youtube'
    ELSE 'instagram'
  END                                                          AS channel,
  CASE jp.status
    WHEN 'draft'     THEN 'draft'
    WHEN 'approved'  THEN 'approved'
    WHEN 'scheduled' THEN 'scheduled'
    WHEN 'published' THEN 'published'
    WHEN 'rejected'  THEN 'rejected'
    ELSE 'draft'
  END                                                          AS status,
  jp.copy                                                      AS caption,
  CASE
    WHEN jp.image_url IS NOT NULL THEN ARRAY[jp.image_url]
    ELSE '{}'::text[]
  END                                                          AS file_urls,
  jp.scheduled_at,
  jsonb_build_object(
    'hashtags',       COALESCE(jp.hashtags, ''),
    'image_brief',    COALESCE(jp.image_brief, ''),
    'client_comment', COALESCE(jp.client_comment, ''),
    'source',         'jclaude',
    'backfill',       '017'
  )                                                            AS metadata,
  'jclaude_posts'                                              AS source_table,
  jp.id                                                        AS source_id,
  jp.created_at,
  jp.updated_at
FROM public.jclaude_posts jp
JOIN public.creatives cr
  ON cr.source_table = 'jclaude_posts' AND cr.source_id = jp.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.assets a
  WHERE a.source_table = 'jclaude_posts' AND a.source_id = jp.id
);

-- ============================================================
-- PASO C — Assets faltantes para social_posts (sin creative — aprobaciones manuales)
-- ============================================================
INSERT INTO public.assets (
  workspace_id,
  campaign_id,
  asset_type,
  channel,
  status,
  caption,
  file_urls,
  scheduled_at,
  metadata,
  source_table,
  source_id,
  created_at,
  updated_at
)
SELECT
  sp.workspace_id,
  NULL                                                          AS campaign_id,   -- ADR-007
  'post'                                                        AS asset_type,
  CASE sp.network
    WHEN 'instagram' THEN 'instagram'
    WHEN 'facebook'  THEN 'facebook'
    WHEN 'tiktok'    THEN 'tiktok'
    WHEN 'youtube'   THEN 'youtube'
    WHEN 'linkedin'  THEN 'linkedin'
    WHEN 'twitter'   THEN 'twitter'
    ELSE 'instagram'
  END                                                           AS channel,
  CASE sp.status
    WHEN 'draft'          THEN 'draft'
    WHEN 'pending'        THEN 'sent_for_approval'
    WHEN 'approved'       THEN 'approved'
    WHEN 'rejected'       THEN 'rejected'
    WHEN 'needs_changes'  THEN 'needs_changes'
    WHEN 'scheduled'      THEN 'scheduled'
    WHEN 'published'      THEN 'published'
    ELSE 'draft'
  END                                                           AS status,
  COALESCE(sp.caption, sp.title)                                AS caption,
  COALESCE(sp.media_urls, '{}'::text[])                         AS file_urls,
  sp.scheduled_at,
  jsonb_build_object(
    'title',    COALESCE(sp.title, ''),
    'source',   'social_posts',
    'backfill', '017'
  )                                                             AS metadata,
  'social_posts'                                                AS source_table,
  sp.id                                                         AS source_id,
  sp.created_at,
  sp.updated_at
FROM public.social_posts sp
WHERE NOT EXISTS (
  SELECT 1 FROM public.assets a
  WHERE a.source_table = 'social_posts' AND a.source_id = sp.id
);

-- ============================================================
-- VERIFICACIÓN POST-BACKFILL (ejecutar para confirmar histórico completo)
-- ============================================================
-- Debe dar 0 filas: no debe quedar ningún legacy sin su asset.
-- SELECT 'jclaude_posts sin asset' AS gap, count(*)
--   FROM public.jclaude_posts jp
--   WHERE NOT EXISTS (SELECT 1 FROM public.assets a
--                     WHERE a.source_table = 'jclaude_posts' AND a.source_id = jp.id)
-- UNION ALL
-- SELECT 'social_posts sin asset', count(*)
--   FROM public.social_posts sp
--   WHERE NOT EXISTS (SELECT 1 FROM public.assets a
--                     WHERE a.source_table = 'social_posts' AND a.source_id = sp.id);
--
-- Conteos globales (assets debe cubrir todo el contenido legacy):
-- SELECT 'jclaude_posts (total)'  AS t, count(*) FROM public.jclaude_posts
-- UNION ALL SELECT 'social_posts (total)', count(*) FROM public.social_posts
-- UNION ALL SELECT 'assets (total)',       count(*) FROM public.assets
-- UNION ALL SELECT 'assets backfill 017',  count(*) FROM public.assets WHERE metadata->>'backfill' = '017';
