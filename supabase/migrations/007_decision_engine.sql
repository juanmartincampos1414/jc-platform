-- ============================================================
-- SPRINT 2B — Decision Engine
-- ============================================================
-- Decisions son conclusiones del sistema basadas en evidencia y
-- conocimiento. Toda Recommendation debe derivar de una Decision.
-- Nunca existe una Decision sin trazabilidad.
-- ============================================================

-- ── decisions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.decisions (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id         uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id             uuid NOT NULL REFERENCES public.brands(id),
  campaign_id          uuid REFERENCES public.campaigns(id),
  decision_type        text NOT NULL CHECK (decision_type IN (
                         'content','channel','timing','budget',
                         'audience','creative','publishing','performance'
                       )),
  status               text NOT NULL DEFAULT 'active'
                         CHECK (status IN ('active','expired','superseded','rejected')),
  confidence           numeric(3,2) NOT NULL DEFAULT 0.0
                         CHECK (confidence >= 0.0 AND confidence <= 1.0),
  rationale            text NOT NULL DEFAULT '',
  supporting_knowledge jsonb NOT NULL DEFAULT '[]',
  supporting_evidence  jsonb NOT NULL DEFAULT '[]',
  source_events        jsonb NOT NULL DEFAULT '[]',
  expires_at           timestamptz,
  generated_at         timestamptz NOT NULL DEFAULT now(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- ── Agregar decision_id a recommendations ─────────────────────
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS decision_id uuid REFERENCES public.decisions(id);

-- ── RLS decisions ─────────────────────────────────────────────
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decisions_read" ON public.decisions
  FOR SELECT USING (user_in_workspace(workspace_id) OR is_jc_admin());

CREATE POLICY "decisions_insert" ON public.decisions
  FOR INSERT WITH CHECK (user_in_workspace(workspace_id) OR is_jc_admin());

CREATE POLICY "decisions_update" ON public.decisions
  FOR UPDATE USING (user_in_workspace(workspace_id) OR is_jc_admin());

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_decisions_workspace ON public.decisions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_decisions_brand ON public.decisions(brand_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON public.decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_confidence ON public.decisions(confidence DESC);
