-- Migration 005: Compatibility views
-- Sprint 1 — Domain Migration
-- Estas views hacen que el código viejo siga funcionando
-- mientras se migra gradualmente a las nuevas tablas.
-- EJECUTAR DESPUÉS de 004_backfill_domain_tables.sql

-- ============================================================
-- VIEW: jclaude_posts_v (adapta assets al shape de jclaude_posts)
-- Permite que el código existente que lee jclaude_posts
-- funcione leyendo desde la tabla assets nueva.
-- ============================================================
CREATE OR REPLACE VIEW public.jclaude_posts_v AS
SELECT
  a.id,
  a.workspace_id,
  a.channel                           AS network,
  a.asset_type                        AS post_type,
  a.caption                           AS copy,
  a.metadata->>'hashtags'             AS hashtags,
  a.metadata->>'image_brief'          AS image_brief,
  (a.file_urls)[1]                    AS image_url,
  CASE a.status
    WHEN 'draft'            THEN 'draft'
    WHEN 'internal_review'  THEN 'draft'
    WHEN 'sent_for_approval'THEN 'draft'
    WHEN 'approved'         THEN 'approved'
    WHEN 'rejected'         THEN 'rejected'
    WHEN 'needs_changes'    THEN 'draft'
    WHEN 'published'        THEN 'published'
    ELSE 'draft'
  END                                 AS status,
  a.metadata->>'client_comment'       AS client_comment,
  a.scheduled_at,
  NULL::timestamptz                   AS published_at,
  a.metadata->>'mp_external_ref'      AS mp_external_ref,
  a.created_at,
  a.updated_at
FROM public.assets a
WHERE a.metadata->>'source' = 'jclaude'
   OR a.source_table = 'jclaude_posts';

-- ============================================================
-- VIEW: social_posts_v (adapta assets+distributions al shape de social_posts)
-- ============================================================
CREATE OR REPLACE VIEW public.social_posts_v AS
SELECT
  a.id,
  a.workspace_id,
  a.channel                           AS network,
  a.metadata->>'title'                AS title,
  a.caption,
  a.file_urls                         AS media_urls,
  a.scheduled_at,
  CASE a.status
    WHEN 'draft'            THEN 'draft'
    WHEN 'internal_review'  THEN 'draft'
    WHEN 'sent_for_approval'THEN 'pending'
    WHEN 'approved'         THEN 'approved'
    WHEN 'rejected'         THEN 'rejected'
    WHEN 'needs_changes'    THEN 'needs_changes'
    WHEN 'published'        THEN 'published'
    ELSE 'draft'
  END                                 AS status,
  a.created_by,
  a.created_at,
  a.updated_at
FROM public.assets a;

-- ============================================================
-- ROLLBACK HINT
-- Para revertir las views (no afecta datos):
-- DROP VIEW IF EXISTS public.jclaude_posts_v;
-- DROP VIEW IF EXISTS public.social_posts_v;
-- ============================================================
