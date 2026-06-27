-- Migration 002: Crear tabla activity_logs para dashboard real y audit trail
-- Aplicar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace
  ON public.activity_logs(workspace_id, created_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_read_activity" ON public.activity_logs
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

CREATE POLICY "ws_insert_activity" ON public.activity_logs
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
