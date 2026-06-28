-- Migration 006: OS Behavior Layer — Sprint 1.5
-- Ajusta RLS, inicializa Brand Memories, repara Assets con creative_id = NULL
-- EJECUTAR DESPUÉS de 005_compatibility_views.sql

-- ============================================================
-- 1. RLS FIXES — agent_jobs y memories necesitan allow workspace members
-- ============================================================

-- agent_jobs: workspace members pueden insertar (sus propias ejecuciones IA)
DROP POLICY IF EXISTS "agent_jobs_insert" ON public.agent_jobs;
CREATE POLICY "agent_jobs_insert" ON public.agent_jobs
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- agent_jobs: workspace members pueden ver sus propios jobs (lectura)
DROP POLICY IF EXISTS "agent_jobs_read_client" ON public.agent_jobs;
CREATE POLICY "agent_jobs_read_client" ON public.agent_jobs
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- agent_jobs: solo sistema/admin puede actualizar (status transitions)
DROP POLICY IF EXISTS "agent_jobs_update" ON public.agent_jobs;
CREATE POLICY "agent_jobs_update" ON public.agent_jobs
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- memories: workspace members pueden insertar (Brand Memory init happens in their context)
DROP POLICY IF EXISTS "memories_insert" ON public.memories;
CREATE POLICY "memories_insert" ON public.memories
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- memories: update sigue siendo solo admin (contenido es curado por el sistema)
DROP POLICY IF EXISTS "memories_update" ON public.memories;
CREATE POLICY "memories_update" ON public.memories
  FOR UPDATE USING (public.is_jc_admin());

-- creatives: workspace members pueden actualizar (para vincular creative_id repairs)
DROP POLICY IF EXISTS "creatives_update" ON public.creatives;
CREATE POLICY "creatives_update" ON public.creatives
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- assets: workspace members pueden actualizar (para vincular creative_id repairs)
-- Ya existe "assets_update" con esta policy — reconfirmamos
DROP POLICY IF EXISTS "assets_update" ON public.assets;
CREATE POLICY "assets_update" ON public.assets
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- ============================================================
-- 2. BACKFILL — Brand Memories para brands existentes
-- ============================================================
INSERT INTO public.memories (workspace_id, brand_id, memory_type, status, title, content, source)
SELECT
  b.workspace_id,
  b.id,
  'brand',
  'active',
  'Brand Memory — ' || b.name,
  '',
  'system'
FROM public.brands b
WHERE NOT EXISTS (
  SELECT 1 FROM public.memories m
  WHERE m.brand_id = b.id AND m.memory_type = 'brand'
);

-- ============================================================
-- 3. REPAIR — Assets con creative_id = NULL
-- Para cada asset huérfano: crear Creative y vincular
-- ============================================================
DO $$
DECLARE
  r              RECORD;
  new_creative_id uuid;
  existing_cr_id  uuid;
BEGIN
  FOR r IN
    SELECT
      a.id            AS asset_id,
      a.workspace_id,
      a.campaign_id,
      a.caption,
      a.metadata,
      a.source_table,
      a.source_id,
      a.created_at,
      a.updated_at,
      a.status
    FROM public.assets a
    WHERE a.creative_id IS NULL
  LOOP
    -- Primero: buscar si ya existe un Creative vinculado a este source_id
    IF r.source_table IS NOT NULL AND r.source_id IS NOT NULL THEN
      SELECT id INTO existing_cr_id
      FROM public.creatives
      WHERE source_table = r.source_table AND source_id = r.source_id
      LIMIT 1;
    END IF;

    IF existing_cr_id IS NOT NULL THEN
      -- Ya existe el Creative: solo vincular el Asset
      UPDATE public.assets
      SET creative_id = existing_cr_id
      WHERE id = r.asset_id;

      existing_cr_id := NULL; -- reset para próxima iteración
    ELSE
      -- No existe Creative: crear uno y vincularlo
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
      ) VALUES (
        r.workspace_id,
        r.campaign_id,
        'copy',
        CASE r.status
          WHEN 'published' THEN 'approved'
          WHEN 'approved'  THEN 'approved'
          ELSE 'draft'
        END,
        COALESCE(r.caption, '') ||
          COALESCE(chr(10) || chr(10) || (r.metadata->>'hashtags'), ''),
        'claude-sonnet-4-6',
        r.source_table,
        r.source_id,
        r.created_at,
        r.updated_at
      )
      RETURNING id INTO new_creative_id;

      UPDATE public.assets
      SET creative_id = new_creative_id
      WHERE id = r.asset_id;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- VERIFICACIÓN (descomentar para confirmar)
-- ============================================================
-- SELECT 'brands' as t, count(*) FROM public.brands
-- UNION ALL SELECT 'campaigns', count(*) FROM public.campaigns
-- UNION ALL SELECT 'creatives', count(*) FROM public.creatives
-- UNION ALL SELECT 'assets', count(*) FROM public.assets
-- UNION ALL SELECT 'assets_with_null_creative', count(*) FROM public.assets WHERE creative_id IS NULL
-- UNION ALL SELECT 'memories', count(*) FROM public.memories
-- UNION ALL SELECT 'jclaude_posts (original)', count(*) FROM public.jclaude_posts
-- UNION ALL SELECT 'social_posts (original)', count(*) FROM public.social_posts;
