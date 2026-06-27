-- Migration 003: Crear tablas del dominio v2
-- Sprint 1 — Domain Migration
-- Las tablas existentes NO se tocan. Todo es aditivo.
-- Aplicar en Supabase SQL Editor

-- ============================================================
-- BRANDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.brands (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL,
  status          text NOT NULL DEFAULT 'created'
                  CHECK (status IN ('created','profiling','active','archived')),
  -- Brand Profile (embedded)
  voice           jsonb NOT NULL DEFAULT '{}',
  identity        jsonb NOT NULL DEFAULT '{}',
  audience        jsonb NOT NULL DEFAULT '{}',
  restrictions    jsonb NOT NULL DEFAULT '[]',
  competitors     jsonb NOT NULL DEFAULT '[]',
  -- Metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES public.brands(id),
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN (
                    'draft','brief_approved','in_production','in_review',
                    'approved','publishing','active','completed','archived'
                  )),
  brief           jsonb NOT NULL DEFAULT '{}',
  starts_at       timestamptz,
  ends_at         timestamptz,
  budget_total    numeric(12,2),
  budget_currency text NOT NULL DEFAULT 'ARS',
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CREATIVES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.creatives (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_type   text NOT NULL DEFAULT 'copy'
                  CHECK (creative_type IN ('copy','script','concept','brief_note')),
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('generating','draft','revised','approved','deprecated')),
  content         text NOT NULL DEFAULT '',
  prompt          text,
  model           text,
  agent_job_id    uuid,   -- FK agregado después cuando agent_jobs exista
  version         integer NOT NULL DEFAULT 1,
  parent_id       uuid REFERENCES public.creatives(id),
  -- Referencia a tabla vieja para trazabilidad
  source_table    text,   -- 'jclaude_posts'
  source_id       uuid,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assets (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id     uuid REFERENCES public.creatives(id),
  asset_type      text NOT NULL DEFAULT 'post'
                  CHECK (asset_type IN ('post','reel','story','carousel','ad','video','image','document')),
  channel         text NOT NULL DEFAULT 'instagram'
                  CHECK (channel IN ('instagram','facebook','tiktok','youtube','linkedin','twitter','email','web')),
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN (
                    'generating','draft','internal_review','sent_for_approval',
                    'approved','rejected','needs_changes','published','archived'
                  )),
  -- Content
  caption         text,
  file_urls       text[] NOT NULL DEFAULT '{}',
  thumbnail_url   text,
  -- Scheduling
  scheduled_at    timestamptz,
  -- Rejection tracking (invariante: obligatorio al rechazar)
  rejection_reason text,
  change_requests  text,
  -- Extra data (hashtags, image_brief, etc.)
  metadata        jsonb NOT NULL DEFAULT '{}',
  -- Approval
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  -- AI provenance
  agent_job_id    uuid,
  -- Referencia a tablas viejas para trazabilidad
  source_table    text,   -- 'jclaude_posts' | 'social_posts'
  source_id       uuid,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ASSET COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.asset_comments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  asset_id    uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- DISTRIBUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.distributions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id         uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  asset_id            uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  distribution_type   text NOT NULL DEFAULT 'organic'
                      CHECK (distribution_type IN ('organic','paid','influencer','email','web')),
  channel             text NOT NULL
                      CHECK (channel IN ('instagram','facebook','tiktok','youtube','linkedin','twitter','email','web')),
  status              text NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','publishing','published','failed','archived')),
  scheduled_at        timestamptz,
  published_at        timestamptz,
  external_id         text,
  external_url        text,
  error_message       text,
  retry_count         integer NOT NULL DEFAULT 0,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PERFORMANCES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.performances (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id       uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  brand_id          uuid NOT NULL REFERENCES public.brands(id),
  distribution_id   uuid REFERENCES public.distributions(id) ON DELETE CASCADE,
  asset_id          uuid REFERENCES public.assets(id),
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','importing','imported','analyzed')),
  impressions       bigint NOT NULL DEFAULT 0,
  reach             bigint NOT NULL DEFAULT 0,
  engagements       bigint NOT NULL DEFAULT 0,
  clicks            bigint NOT NULL DEFAULT 0,
  shares            bigint NOT NULL DEFAULT 0,
  saves             bigint NOT NULL DEFAULT 0,
  comments_count    integer NOT NULL DEFAULT 0,
  spend             numeric(12,2),
  cpm               numeric(10,4),
  cpc               numeric(10,4),
  roas              numeric(10,4),
  conversions       integer,
  raw_data          jsonb NOT NULL DEFAULT '{}',
  channel           text NOT NULL DEFAULT 'instagram',
  period_start      timestamptz NOT NULL DEFAULT now(),
  period_end        timestamptz NOT NULL DEFAULT now(),
  imported_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.insights (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES public.brands(id),
  insight_type    text NOT NULL DEFAULT 'performance'
                  CHECK (insight_type IN (
                    'performance','trend','audience','content',
                    'competitive','recommendation_trigger'
                  )),
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('generating','draft','published','archived')),
  title           text NOT NULL DEFAULT '',
  body            text NOT NULL DEFAULT '',
  data_points     jsonb NOT NULL DEFAULT '[]',
  confidence      numeric(3,2) DEFAULT 1.00,
  agent_job_id    uuid,
  model           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recommendations (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_campaign_id  uuid NOT NULL REFERENCES public.campaigns(id),
  brand_id            uuid NOT NULL REFERENCES public.brands(id),
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('generating','pending','accepted','rejected','expired')),
  title               text NOT NULL DEFAULT '',
  body                text NOT NULL DEFAULT '',
  action_type         text NOT NULL DEFAULT 'test_new_format',
  action_detail       jsonb NOT NULL DEFAULT '{}',
  decided_by          uuid REFERENCES auth.users(id),
  decided_at          timestamptz,
  decision_reason     text,
  target_campaign_id  uuid REFERENCES public.campaigns(id),
  agent_job_id        uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- MEMORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES public.brands(id),
  campaign_id     uuid REFERENCES public.campaigns(id),
  memory_type     text NOT NULL
                  CHECK (memory_type IN (
                    'brand','campaign','creative','audience',
                    'trend','performance','decision','knowledge','competitor'
                  )),
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','deprecated','archived')),
  title           text NOT NULL,
  content         text NOT NULL,
  source          text NOT NULL DEFAULT 'system',
  confidence      numeric(3,2) NOT NULL DEFAULT 1.00,
  expires_at      timestamptz,
  superseded_by   uuid REFERENCES public.memories(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memories_brand_type
  ON public.memories(brand_id, memory_type, status)
  WHERE status = 'active';

-- ============================================================
-- AGENT JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid REFERENCES public.campaigns(id),
  agent_type      text NOT NULL
                  CHECK (agent_type IN (
                    'brand','strategy','campaign_planner','copy','image','video',
                    'ads','influencer_fit','performance','insights','recommendation','learning'
                  )),
  status          text NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','running','completed','failed')),
  input           jsonb NOT NULL DEFAULT '{}',
  output          jsonb,
  model           text,
  prompt_version  text,
  tokens_input    integer,
  tokens_output   integer,
  duration_ms     integer,
  cost_usd        numeric(10,6),
  error_message   text,
  triggered_by    uuid REFERENCES auth.users(id),
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- EVENTS (renaming activity_logs conceptually)
-- Las events son inmutables — no UPDATE, no DELETE
-- activity_logs sigue existiendo como alias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event           text NOT NULL,
  entity_type     text,
  entity_id       uuid,
  actor_id        uuid REFERENCES auth.users(id),
  actor_type      text NOT NULL DEFAULT 'user'
                  CHECK (actor_type IN ('user','agent','system')),
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_workspace_time
  ON public.events(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_entity
  ON public.events(entity_type, entity_id);

-- Agregar columna type a legal_documents (Sprint 0 la referenciaba pero no existía)
ALTER TABLE public.legal_documents
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'contract'
  CHECK (type IN ('contract','proposal','invoice','nda','other'));

-- ============================================================
-- ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_brands_workspace
  ON public.brands(workspace_id) WHERE status != 'archived';

CREATE INDEX IF NOT EXISTS idx_campaigns_brand
  ON public.campaigns(brand_id, status);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace
  ON public.campaigns(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_assets_campaign
  ON public.assets(campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_assets_workspace_status
  ON public.assets(workspace_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_distributions_asset
  ON public.distributions(asset_id, status);

CREATE INDEX IF NOT EXISTS idx_distributions_scheduled
  ON public.distributions(workspace_id, scheduled_at)
  WHERE status = 'scheduled';

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Brands
CREATE POLICY "brands_read" ON public.brands
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "brands_insert" ON public.brands
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "brands_update" ON public.brands
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- Campaigns
CREATE POLICY "campaigns_read" ON public.campaigns
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "campaigns_insert" ON public.campaigns
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "campaigns_update" ON public.campaigns
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- Creatives (solo JC admin y sistema)
CREATE POLICY "creatives_read_jc" ON public.creatives
  FOR SELECT USING (public.is_jc_admin());
CREATE POLICY "creatives_insert" ON public.creatives
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "creatives_update" ON public.creatives
  FOR UPDATE USING (public.is_jc_admin());

-- Assets (clientes ven los que están en sent_for_approval o posterior)
CREATE POLICY "assets_read_jc" ON public.assets
  FOR SELECT USING (public.is_jc_admin());
CREATE POLICY "assets_read_client" ON public.assets
  FOR SELECT USING (
    public.user_in_workspace(workspace_id)
    AND status IN ('sent_for_approval','approved','rejected','needs_changes','published')
  );
CREATE POLICY "assets_insert" ON public.assets
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "assets_update" ON public.assets
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- Asset comments
CREATE POLICY "asset_comments_read" ON public.asset_comments
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "asset_comments_insert" ON public.asset_comments
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- Distributions
CREATE POLICY "distributions_read" ON public.distributions
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "distributions_insert" ON public.distributions
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "distributions_update" ON public.distributions
  FOR UPDATE USING (public.is_jc_admin());

-- Performances (solo lectura para clientes)
CREATE POLICY "performances_read" ON public.performances
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "performances_insert" ON public.performances
  FOR INSERT WITH CHECK (public.is_jc_admin());

-- Insights
CREATE POLICY "insights_read_jc" ON public.insights
  FOR SELECT USING (public.is_jc_admin());
CREATE POLICY "insights_read_client" ON public.insights
  FOR SELECT USING (
    public.user_in_workspace(workspace_id) AND status = 'published'
  );
CREATE POLICY "insights_insert" ON public.insights
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "insights_update" ON public.insights
  FOR UPDATE USING (public.is_jc_admin());

-- Recommendations
CREATE POLICY "recommendations_read" ON public.recommendations
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "recommendations_insert" ON public.recommendations
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "recommendations_update" ON public.recommendations
  FOR UPDATE USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());

-- Memories (clientes solo ven resumen via API, no acceso directo a tabla)
CREATE POLICY "memories_read" ON public.memories
  FOR SELECT USING (public.is_jc_admin());
CREATE POLICY "memories_insert" ON public.memories
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "memories_update" ON public.memories
  FOR UPDATE USING (public.is_jc_admin());

-- Agent jobs (solo JC admin)
CREATE POLICY "agent_jobs_read" ON public.agent_jobs
  FOR SELECT USING (public.is_jc_admin());
CREATE POLICY "agent_jobs_insert" ON public.agent_jobs
  FOR INSERT WITH CHECK (public.is_jc_admin());
CREATE POLICY "agent_jobs_update" ON public.agent_jobs
  FOR UPDATE USING (public.is_jc_admin());

-- Events (lectura para workspace members, insert para todos dentro del workspace)
CREATE POLICY "events_read" ON public.events
  FOR SELECT USING (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
CREATE POLICY "events_insert" ON public.events
  FOR INSERT WITH CHECK (public.user_in_workspace(workspace_id) OR public.is_jc_admin());
-- NO update, NO delete policies para events (inmutables)
