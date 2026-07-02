-- ============================================================
-- Migration 016 — Contenido sin campaña (ADR-007)
-- ============================================================
-- El contenido de JClaude (calendario mensual) no pertenece a una campaña.
-- Para que assets sea la única fuente de verdad del contenido, campaign_id
-- pasa a nullable en assets y creatives. No destructivo (afloja un constraint).
-- Ver: docs/09-decisions/ADR-007-content-without-campaign.md
-- ============================================================

alter table public.assets    alter column campaign_id drop not null;
alter table public.creatives alter column campaign_id drop not null;
