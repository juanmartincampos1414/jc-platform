-- ============================================================
-- Migration 012 — Executive Intelligence
-- ============================================================
-- Agrega al workspace la capacidad de persistir el snapshot
-- ejecutivo. Dos columnas:
--
--   executive_snapshot      jsonb  — ExecutiveObject estructurado (dominio)
--   executive_snapshot_prev jsonb  — snapshot anterior para calcular delta
--   executive_narrative     text   — narrativa ejecutiva generada por Claude
--   executive_generated_at  timestamptz
--
-- Separación de responsabilidades:
--   executive_snapshot  → pertenece al producto (construido por Executive Engine)
--   executive_narrative → pertenece al modelo (regenerable sin perder el objeto)
--   executive_snapshot_prev → lo mueve el sistema automáticamente antes de cada regeneración
-- ============================================================

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS executive_snapshot      jsonb,
  ADD COLUMN IF NOT EXISTS executive_snapshot_prev jsonb,
  ADD COLUMN IF NOT EXISTS executive_narrative     text,
  ADD COLUMN IF NOT EXISTS executive_generated_at  timestamptz;
