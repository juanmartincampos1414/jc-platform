-- Migration 004: Backfill — poblar tablas nuevas desde datos existentes
-- Sprint 1 — Domain Migration
-- EJECUTAR DESPUÉS de 003_create_domain_tables.sql
-- Los datos originales NO se tocan.
-- Aplicar en Supabase SQL Editor

-- ============================================================
-- PASO 1: Crear Brand por workspace
-- Fuente: jclaude_profiles (si existe) + workspaces
-- ============================================================
INSERT INTO public.brands (workspace_id, name, slug, status, voice, audience)
SELECT
  w.id                                                    AS workspace_id,
  COALESCE(NULLIF(jp.brand_name, ''), w.name)             AS name,
  w.slug                                                  AS slug,
  'active'                                                AS status,
  jsonb_build_object(
    'tone',         COALESCE(jp.tone, 'profesional'),
    'key_messages', COALESCE(jp.key_messages, ''),
    'industry',     COALESCE(jp.industry, '')
  )                                                       AS voice,
  jsonb_build_object(
    'primary_demo', COALESCE(jp.target_audience, '')
  )                                                       AS audience
FROM public.workspaces w
LEFT JOIN public.jclaude_profiles jp ON jp.workspace_id = w.id
ON CONFLICT (workspace_id, slug) DO NOTHING;

-- ============================================================
-- PASO 2: Crear Campaign "Contenido General" por workspace
-- Una campaign por workspace para alojar el contenido existente
-- ============================================================
INSERT INTO public.campaigns (workspace_id, brand_id, name, status, brief, starts_at)
SELECT
  w.id                                                      AS workspace_id,
  b.id                                                      AS brand_id,
  'Contenido General — ' || to_char(now(), 'YYYY')          AS name,
  'active'                                                  AS status,
  jsonb_build_object(
    'objective', 'Contenido generado durante la migración al dominio v2.',
    'migrated',  true
  )                                                         AS brief,
  date_trunc('year', now())                                 AS starts_at
FROM public.workspaces w
JOIN public.brands b ON b.workspace_id = w.id
ON CONFLICT DO NOTHING;

-- ============================================================
-- PASO 3: Backfill jclaude_posts → creatives + assets
-- ============================================================

-- 3a. Insertar un Creative por jclaude_post (el copy)
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
  c.id                                                        AS campaign_id,
  'copy'                                                      AS creative_type,
  CASE jp.status
    WHEN 'draft'      THEN 'draft'
    WHEN 'approved'   THEN 'approved'
    WHEN 'scheduled'  THEN 'approved'
    WHEN 'published'  THEN 'approved'
    WHEN 'rejected'   THEN 'draft'
    ELSE 'draft'
  END                                                         AS status,
  jp.copy || COALESCE(chr(10) || chr(10) || jp.hashtags, '') AS content,
  'claude-sonnet-4-6'                                         AS model,
  'jclaude_posts'                                             AS source_table,
  jp.id                                                       AS source_id,
  jp.created_at,
  jp.updated_at
FROM public.jclaude_posts jp
JOIN public.campaigns c ON c.workspace_id = jp.workspace_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.creatives cr
  WHERE cr.source_table = 'jclaude_posts' AND cr.source_id = jp.id
);

-- 3b. Insertar un Asset por jclaude_post
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
  c.id                                                         AS campaign_id,
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
    WHEN 'rejected'  THEN 'rejected'
    WHEN 'scheduled' THEN 'approved'
    WHEN 'published' THEN 'published'
    ELSE 'draft'
  END                                                          AS status,
  jp.copy                                                      AS caption,
  CASE
    WHEN jp.image_url IS NOT NULL THEN ARRAY[jp.image_url]
    ELSE '{}'::text[]
  END                                                          AS file_urls,
  jp.scheduled_at,
  jsonb_build_object(
    'hashtags',      COALESCE(jp.hashtags, ''),
    'image_brief',   COALESCE(jp.image_brief, ''),
    'client_comment',COALESCE(jp.client_comment, ''),
    'source',        'jclaude'
  )                                                            AS metadata,
  'jclaude_posts'                                              AS source_table,
  jp.id                                                        AS source_id,
  jp.created_at,
  jp.updated_at
FROM public.jclaude_posts jp
JOIN public.campaigns c ON c.workspace_id = jp.workspace_id
JOIN public.creatives cr
  ON cr.source_table = 'jclaude_posts' AND cr.source_id = jp.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.assets a
  WHERE a.source_table = 'jclaude_posts' AND a.source_id = jp.id
);

-- ============================================================
-- PASO 4: Backfill social_posts → assets
-- (los social_posts son aprobaciones manuales, sin Creative asociado)
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
  c.id                                                          AS campaign_id,
  'post'                                                        AS asset_type,
  sp.network                                                    AS channel,
  CASE sp.status
    WHEN 'draft'          THEN 'draft'
    WHEN 'pending'        THEN 'sent_for_approval'
    WHEN 'approved'       THEN 'approved'
    WHEN 'rejected'       THEN 'rejected'
    WHEN 'needs_changes'  THEN 'needs_changes'
    WHEN 'published'      THEN 'published'
    ELSE 'draft'
  END                                                           AS status,
  COALESCE(sp.caption, sp.title)                                AS caption,
  COALESCE(sp.media_urls, '{}'::text[])                         AS file_urls,
  sp.scheduled_at,
  jsonb_build_object(
    'title',  sp.title,
    'source', 'social_posts'
  )                                                             AS metadata,
  'social_posts'                                                AS source_table,
  sp.id                                                         AS source_id,
  sp.created_at,
  sp.updated_at
FROM public.social_posts sp
JOIN public.campaigns c ON c.workspace_id = sp.workspace_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.assets a
  WHERE a.source_table = 'social_posts' AND a.source_id = sp.id
);

-- ============================================================
-- PASO 5: Backfill post_comments → asset_comments
-- ============================================================
INSERT INTO public.asset_comments (workspace_id, asset_id, user_id, content, created_at)
SELECT
  a.workspace_id,
  a.id       AS asset_id,
  pc.user_id,
  pc.content,
  pc.created_at
FROM public.post_comments pc
JOIN public.assets a ON a.source_table = 'social_posts' AND a.source_id = pc.post_id
WHERE pc.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.asset_comments ac
    WHERE ac.asset_id = a.id AND ac.user_id = pc.user_id AND ac.created_at = pc.created_at
  );

-- ============================================================
-- PASO 6: Backfill activity_logs → events
-- ============================================================
INSERT INTO public.events (
  id,
  workspace_id,
  event,
  entity_type,
  entity_id,
  actor_id,
  actor_type,
  metadata,
  created_at
)
SELECT
  id,
  workspace_id,
  action        AS event,
  entity_type,
  entity_id,
  user_id       AS actor_id,
  'user'        AS actor_type,
  metadata,
  created_at
FROM public.activity_logs
WHERE NOT EXISTS (
  SELECT 1 FROM public.events e WHERE e.id = activity_logs.id
);

-- ============================================================
-- PASO 7: Crear Distributions para posts publicados/scheduled
-- ============================================================
INSERT INTO public.distributions (
  workspace_id,
  campaign_id,
  asset_id,
  distribution_type,
  channel,
  status,
  scheduled_at,
  published_at,
  external_url,
  created_at,
  updated_at
)
SELECT
  a.workspace_id,
  a.campaign_id,
  a.id              AS asset_id,
  'organic'         AS distribution_type,
  a.channel,
  CASE a.status
    WHEN 'published' THEN 'published'
    WHEN 'approved'  THEN 'scheduled'
    ELSE 'scheduled'
  END               AS status,
  a.scheduled_at,
  CASE a.status
    WHEN 'published' THEN a.updated_at
    ELSE NULL
  END               AS published_at,
  (a.metadata->>'external_url')  AS external_url,
  a.created_at,
  a.updated_at
FROM public.assets a
WHERE a.status IN ('approved', 'published')
  AND a.scheduled_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.distributions d WHERE d.asset_id = a.id
  );

-- ============================================================
-- VERIFICACIÓN (ejecutar para confirmar backfill)
-- ============================================================
-- SELECT 'brands' as table_name, count(*) FROM public.brands
-- UNION ALL SELECT 'campaigns', count(*) FROM public.campaigns
-- UNION ALL SELECT 'creatives', count(*) FROM public.creatives
-- UNION ALL SELECT 'assets', count(*) FROM public.assets
-- UNION ALL SELECT 'asset_comments', count(*) FROM public.asset_comments
-- UNION ALL SELECT 'distributions', count(*) FROM public.distributions
-- UNION ALL SELECT 'events', count(*) FROM public.events
-- UNION ALL SELECT 'jclaude_posts (original)', count(*) FROM public.jclaude_posts
-- UNION ALL SELECT 'social_posts (original)', count(*) FROM public.social_posts;
