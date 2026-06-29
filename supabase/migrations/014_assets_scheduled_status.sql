-- ============================================================
-- Migration 014 — Agregar 'scheduled' al CHECK constraint de assets.status
-- ============================================================
-- El executor autónomo necesita poder escribir status = 'scheduled'.
-- La migración 003 no lo incluía. Se recrea el constraint.
-- ============================================================

ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_status_check;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_status_check
  CHECK (status IN (
    'generating','draft','internal_review','sent_for_approval',
    'approved','rejected','needs_changes',
    'scheduled',
    'published','archived'
  ));
