-- ============================================================
-- SPRINT 5 — Learning from Actions
-- ============================================================
-- 1. Fix memories_update RLS: workspace members deben poder
--    actualizar memories de su workspace (el knowledge engine
--    corre en contexto de usuario, no admin)
-- 2. Agregar memory_type 'user_feedback' para almacenar
--    el feedback textual de rejections
-- ============================================================

-- ── Fix memories UPDATE RLS ───────────────────────────────────
DROP POLICY IF EXISTS "memories_update" ON public.memories;

CREATE POLICY "memories_update" ON public.memories
  FOR UPDATE USING (
    public.user_in_workspace(workspace_id) OR public.is_jc_admin()
  );

-- ── Expandir CHECK constraint — agregar user_feedback ─────────
ALTER TABLE public.memories
  DROP CONSTRAINT IF EXISTS memories_memory_type_check;

ALTER TABLE public.memories
  ADD CONSTRAINT memories_memory_type_check
  CHECK (memory_type IN (
    -- tipos originales
    'brand','campaign','creative','audience',
    'trend','performance','decision','knowledge','competitor',
    -- tipos del Knowledge Engine (Sprint 2A)
    'channel_affinity','content_mix','timing',
    'approval_signals','brand_voice','creative_style','campaign_pattern',
    -- tipos del Learning Engine (Sprint 5)
    'user_feedback'
  ));
