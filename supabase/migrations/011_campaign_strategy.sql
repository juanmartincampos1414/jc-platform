-- ============================================================
-- Migration 011 — Campaign Strategy Object
-- ============================================================
-- Agrega dos columnas a campaigns:
--   strategy        jsonb  — Strategy Object estructurado (dominio del producto)
--   strategy_narrative text — Narrativa generada por Claude a partir del Strategy Object
--
-- Separación de responsabilidades:
--   strategy          → pertenece al producto
--   strategy_narrative → pertenece al modelo (regenerable en cualquier momento)
-- ============================================================

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS strategy           jsonb,
  ADD COLUMN IF NOT EXISTS strategy_narrative text,
  ADD COLUMN IF NOT EXISTS strategy_generated_at timestamptz;
