-- ============================================================
-- SPRINT 2B FIX — Memories: metadata column + knowledge types
-- ============================================================
-- Dos problemas detectados en producción:
-- 1. CHECK constraint en memory_type no incluía los tipos del Knowledge Engine
-- 2. Columna metadata no existía — el engine la necesita para data + sample_size
-- ============================================================

-- ── Agregar columna metadata ───────────────────────────────────
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

-- ── Expandir CHECK constraint de memory_type ──────────────────
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
    'approval_signals','brand_voice','creative_style','campaign_pattern'
  ));
