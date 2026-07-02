-- ============================================================
-- Migration 018 — Reconciliar estados: jclaude_posts → assets
-- ============================================================
-- Asset Domain Migration — PASO 4b (prerrequisito del cutover de lectura)
-- Ver: docs/05-data-architecture/asset-domain-migration-plan.md
--
-- CONTEXTO
--   El dual-write previo solo sincronizaba la CREACIÓN, no las transiciones
--   de estado. Las aprobaciones/reprogramaciones del calendario JClaude
--   escribían únicamente jclaude_posts, dejando el asset vinculado con su
--   estado de creación ('draft') congelado. Desde el Paso 4a, las escrituras
--   NUEVAS ya sincronizan; esta migración reconcilia lo EXISTENTE de una vez.
--
-- PROPIEDADES
--   • Idempotente     → solo toca filas que DIFIEREN (IS DISTINCT FROM).
--                       Re-ejecutar no hace nada.
--   • No destructiva   → jclaude_posts intacto; assets se alinea a jclaude_posts.
--   • Sin cutover      → todavía nadie lee assets para el calendario/dashboard.
--
-- Aplicar en Supabase SQL Editor, DESPUÉS de 017 y del deploy del Paso 4a.
-- ============================================================

-- ------------------------------------------------------------
-- (Opcional) CHECK PRE — cuántos assets JClaude tienen estado divergente
-- ------------------------------------------------------------
-- SELECT count(*) AS assets_desincronizados
--   FROM public.assets a
--   JOIN public.jclaude_posts jp
--     ON a.source_table = 'jclaude_posts' AND a.source_id = jp.id
--   WHERE a.status IS DISTINCT FROM (CASE jp.status
--           WHEN 'draft' THEN 'draft' WHEN 'approved' THEN 'approved'
--           WHEN 'rejected' THEN 'rejected' WHEN 'needs_changes' THEN 'needs_changes'
--           WHEN 'scheduled' THEN 'scheduled' WHEN 'published' THEN 'published'
--           ELSE a.status END)
--      OR a.scheduled_at IS DISTINCT FROM jp.scheduled_at;

-- ============================================================
-- RECONCILIACIÓN
-- ============================================================
UPDATE public.assets a
SET
  status = CASE jp.status
    WHEN 'draft'         THEN 'draft'
    WHEN 'approved'      THEN 'approved'
    WHEN 'rejected'      THEN 'rejected'
    WHEN 'needs_changes' THEN 'needs_changes'
    WHEN 'scheduled'     THEN 'scheduled'
    WHEN 'published'     THEN 'published'
    ELSE a.status
  END,
  scheduled_at = jp.scheduled_at,
  file_urls = CASE
    WHEN jp.image_url IS NOT NULL THEN ARRAY[jp.image_url]
    ELSE a.file_urls
  END,
  updated_at = now()
FROM public.jclaude_posts jp
WHERE a.source_table = 'jclaude_posts'
  AND a.source_id = jp.id
  AND (
    a.status IS DISTINCT FROM (CASE jp.status
      WHEN 'draft'         THEN 'draft'
      WHEN 'approved'      THEN 'approved'
      WHEN 'rejected'      THEN 'rejected'
      WHEN 'needs_changes' THEN 'needs_changes'
      WHEN 'scheduled'     THEN 'scheduled'
      WHEN 'published'     THEN 'published'
      ELSE a.status END)
    OR a.scheduled_at IS DISTINCT FROM jp.scheduled_at
  );

-- ============================================================
-- VERIFICACIÓN POST (debe dar 0 desincronizados)
-- ============================================================
-- SELECT count(*) AS assets_desincronizados
--   FROM public.assets a
--   JOIN public.jclaude_posts jp
--     ON a.source_table = 'jclaude_posts' AND a.source_id = jp.id
--   WHERE a.status IS DISTINCT FROM (CASE jp.status
--           WHEN 'draft' THEN 'draft' WHEN 'approved' THEN 'approved'
--           WHEN 'rejected' THEN 'rejected' WHEN 'needs_changes' THEN 'needs_changes'
--           WHEN 'scheduled' THEN 'scheduled' WHEN 'published' THEN 'published'
--           ELSE a.status END)
--      OR a.scheduled_at IS DISTINCT FROM jp.scheduled_at;
--
-- Distribución de estados lado a lado (deben coincidir para contenido jclaude):
-- SELECT 'jclaude_posts' AS src, status, count(*) FROM public.jclaude_posts GROUP BY status
-- UNION ALL
-- SELECT 'assets(jclaude)', status, count(*) FROM public.assets
--   WHERE source_table = 'jclaude_posts' GROUP BY status
-- ORDER BY src, status;
