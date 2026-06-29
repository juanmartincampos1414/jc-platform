-- ============================================================
-- Migration 013 — Autonomous Operations
-- ============================================================
-- Introduce dos estructuras de dominio:
--
-- 1. workspaces.autonomy_policy (jsonb)
--    La política de autonomía del workspace. Pertenece al cliente.
--    Estructura:
--      {
--        "level":   0|1|2|3,         -- nivel global
--        "class_a": 0|1|2|3,         -- override para Clase A (default = level)
--        "class_b": 0|1|2|3,         -- override para Clase B (default = min(level, 2))
--        "class_c": 0|1|2|3          -- override para Clase C (default = 0, nunca 3)
--      }
--
-- 2. autonomous_actions (tabla nueva)
--    Audit trail inmutable de toda acción autónoma ejecutada.
--    Toda fila es append-only. No se modifica. Se puede revertir
--    creando una nueva fila de tipo revert.
-- ============================================================

-- Política de autonomía por workspace
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS autonomy_policy jsonb NOT NULL DEFAULT '{
    "level": 1,
    "class_a": 1,
    "class_b": 1,
    "class_c": 0
  }';

-- Audit trail de acciones autónomas
CREATE TABLE IF NOT EXISTS public.autonomous_actions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Qué acción
  action_type     text NOT NULL,          -- 'auto-schedule-approved-asset' | etc.
  action_class    text NOT NULL           -- 'A' | 'B' | 'C'
                  CHECK (action_class IN ('A','B','C')),

  -- Sobre qué entidad
  entity_type     text NOT NULL,          -- 'asset' | 'campaign' | etc.
  entity_id       uuid NOT NULL,

  -- Las tres condiciones al momento de ejecución (snapshot inmutable)
  confidence      numeric(4,3),           -- confidence del sistema al ejecutar
  policy_level    int NOT NULL,           -- nivel de política vigente
  policy_snapshot jsonb NOT NULL,         -- copia completa de autonomy_policy

  -- Payload y resultado
  payload         jsonb NOT NULL DEFAULT '{}',  -- qué cambió (before/after)
  result          text NOT NULL DEFAULT 'executed'
                  CHECK (result IN ('executed','failed','reverted')),
  error_message   text,

  -- Reversión
  reverted_at     timestamptz,
  reverted_by     uuid REFERENCES auth.users(id),
  revert_action_id uuid REFERENCES public.autonomous_actions(id),

  -- Trazabilidad
  triggered_by    text NOT NULL DEFAULT 'system',   -- 'system' | 'policy_change' | 'manual'
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_autonomous_actions_workspace
  ON public.autonomous_actions(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_actions_entity
  ON public.autonomous_actions(entity_type, entity_id);

-- RLS
ALTER TABLE public.autonomous_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autonomous_actions_read" ON public.autonomous_actions
  FOR SELECT USING (user_in_workspace(workspace_id));

CREATE POLICY "autonomous_actions_insert" ON public.autonomous_actions
  FOR INSERT WITH CHECK (user_in_workspace(workspace_id));

-- El sistema actualiza result y reverted_at en reversiones
CREATE POLICY "autonomous_actions_update" ON public.autonomous_actions
  FOR UPDATE USING (user_in_workspace(workspace_id));
