-- ============================================================
-- Migration 010 — Seedance Video Limit
-- ============================================================
-- Agrega videos_limit a jclaude_subscriptions.
-- Valor por plan:
--   starter:    1 video/semana
--   pro:        2 videos/semana
--   enterprise: 3 videos/semana
-- El campo representa videos POR SEMANA (no por mes).
-- generate-month calcula videos/mes = videos_limit * semanas_del_mes.
-- ============================================================

ALTER TABLE public.jclaude_subscriptions
  ADD COLUMN IF NOT EXISTS videos_limit int NOT NULL DEFAULT 0;

-- Actualizar suscripciones existentes según su plan
UPDATE public.jclaude_subscriptions SET videos_limit = 1 WHERE plan = 'starter';
UPDATE public.jclaude_subscriptions SET videos_limit = 2 WHERE plan = 'pro';
UPDATE public.jclaude_subscriptions SET videos_limit = 3 WHERE plan = 'enterprise';
