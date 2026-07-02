-- ============================================================
-- ROLLBACK de la Migration 017 — Backfill de contenido en `assets`
-- ============================================================
-- Ver: 017_backfill_content_assets.sql
--
-- ⚠️ EN LA MAYORÍA DE LOS CASOS NO HACE FALTA EJECUTAR ESTO.
--    La 017 es aditiva y no-destructiva, y NADIE lee estas filas todavía
--    (el cutover de lectura es el Paso 4). El rollback sancionado por el plan
--    (asset-domain-migration-plan.md §5) es simplemente "ignorar `assets` y
--    seguir con jclaude_posts" — impacto en producción: nulo.
--
--    Este script es para limpieza física opcional (p. ej. antes de re-correr
--    un backfill corregido). jclaude_posts / social_posts NO se tocan.
--
-- Idempotente: se puede ejecutar varias veces sin error.
-- Aplicar en Supabase SQL Editor. Recomendado: backup antes.
-- ============================================================

-- 1. Borrar los assets insertados por la 017 (tagueados en metadata)
DELETE FROM public.assets
WHERE metadata->>'backfill' = '017';

-- 2. Borrar los creatives que quedaron huérfanos tras el paso 1
--    (los que la 017 creó en su Paso A: source jclaude_posts y sin ningún
--    asset que los referencie). jclaude_posts queda intacto, así que re-correr
--    la 017 los recrea. Si por casualidad se borra un creative pre-017 cuyo
--    único asset era un gap que la 017 había llenado, es inocuo: el estado
--    resultante es el "sin asset" que buscábamos, y la 017 lo restaura al re-correr.
DELETE FROM public.creatives cr
WHERE cr.source_table = 'jclaude_posts'
  AND NOT EXISTS (
    SELECT 1 FROM public.assets a WHERE a.creative_id = cr.id
  );

-- ============================================================
-- VERIFICACIÓN (debe dar 0 en ambas)
-- ============================================================
-- SELECT 'assets backfill 017 restantes' AS check, count(*)
--   FROM public.assets WHERE metadata->>'backfill' = '017'
-- UNION ALL
-- SELECT 'creatives jclaude huérfanos', count(*)
--   FROM public.creatives cr
--   WHERE cr.source_table = 'jclaude_posts'
--     AND NOT EXISTS (SELECT 1 FROM public.assets a WHERE a.creative_id = cr.id);
