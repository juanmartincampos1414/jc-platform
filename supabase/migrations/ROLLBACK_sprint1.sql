-- ROLLBACK Sprint 1 — Domain Migration
-- Ejecutar SOLO si es necesario revertir completamente.
-- Los datos originales (jclaude_posts, social_posts, etc.) NO fueron tocados.
-- Este rollback elimina las tablas nuevas y las views.

-- ============================================================
-- PASO 1: Eliminar views
-- ============================================================
DROP VIEW IF EXISTS public.social_posts_v;
DROP VIEW IF EXISTS public.jclaude_posts_v;

-- ============================================================
-- PASO 2: Eliminar tablas nuevas (orden inverso por FKs)
-- ============================================================
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.agent_jobs CASCADE;
DROP TABLE IF EXISTS public.memories CASCADE;
DROP TABLE IF EXISTS public.recommendations CASCADE;
DROP TABLE IF EXISTS public.insights CASCADE;
DROP TABLE IF EXISTS public.performances CASCADE;
DROP TABLE IF EXISTS public.distributions CASCADE;
DROP TABLE IF EXISTS public.asset_comments CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.creatives CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.brands CASCADE;

-- ============================================================
-- PASO 3: Revertir columna type en legal_documents
-- ============================================================
ALTER TABLE public.legal_documents DROP COLUMN IF EXISTS type;

-- ============================================================
-- VERIFICACIÓN post-rollback
-- ============================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
-- Deben aparecer SOLO las tablas originales.

-- ============================================================
-- NOTAS
-- - activity_logs NO se toca (no fue eliminada en Sprint 1)
-- - jclaude_posts NO se toca
-- - social_posts NO se toca
-- - post_comments NO se toca
-- - jclaude_profiles NO se toca
-- - Todos los datos originales siguen intactos
-- ============================================================
