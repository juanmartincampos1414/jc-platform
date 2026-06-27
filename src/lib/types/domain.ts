// Domain types — Sprint 1
// Source of truth: docs/03-product-architecture/domain-freeze.md
// Cualquier cambio requiere ADR.

// ============================================================
// ENUMS
// ============================================================

export type WorkspaceStatus = 'onboarding' | 'active' | 'suspended' | 'deleted'
export type WorkspacePlan   = 'starter' | 'pro' | 'enterprise'
export type UserRole        = 'jc_admin' | 'client_admin' | 'client_user'

export type BrandStatus = 'created' | 'profiling' | 'active' | 'archived'

export type CampaignStatus =
  | 'draft'
  | 'brief_approved'
  | 'in_production'
  | 'in_review'
  | 'approved'
  | 'publishing'
  | 'active'
  | 'completed'
  | 'archived'

export type CreativeType   = 'copy' | 'script' | 'concept' | 'brief_note'
export type CreativeStatus = 'generating' | 'draft' | 'revised' | 'approved' | 'deprecated'

export type AssetType =
  | 'post'
  | 'reel'
  | 'story'
  | 'carousel'
  | 'ad'
  | 'video'
  | 'image'
  | 'document'

export type AssetStatus =
  | 'generating'
  | 'draft'
  | 'internal_review'
  | 'sent_for_approval'
  | 'approved'
  | 'rejected'
  | 'needs_changes'
  | 'published'
  | 'archived'

export type Channel =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'twitter'
  | 'email'
  | 'web'

export type DistributionType   = 'organic' | 'paid' | 'influencer' | 'email' | 'web'
export type DistributionStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'archived'

export type PerformanceStatus = 'pending' | 'importing' | 'imported' | 'analyzed'

export type InsightType =
  | 'performance'
  | 'trend'
  | 'audience'
  | 'content'
  | 'competitive'
  | 'recommendation_trigger'
export type InsightStatus = 'generating' | 'draft' | 'published' | 'archived'

export type RecommendationStatus = 'generating' | 'pending' | 'accepted' | 'rejected' | 'expired'

export type MemoryType =
  | 'brand'
  | 'campaign'
  | 'creative'
  | 'audience'
  | 'trend'
  | 'performance'
  | 'decision'
  | 'knowledge'
  | 'competitor'
export type MemoryStatus = 'active' | 'deprecated' | 'archived'

export type AgentType =
  | 'brand'
  | 'strategy'
  | 'campaign_planner'
  | 'copy'
  | 'image'
  | 'video'
  | 'ads'
  | 'influencer_fit'
  | 'performance'
  | 'insights'
  | 'recommendation'
  | 'learning'
export type AgentStatus = 'queued' | 'running' | 'completed' | 'failed'

export type ActorType = 'user' | 'agent' | 'system'

// ============================================================
// ENTITIES
// ============================================================

export interface Workspace {
  id:           string
  name:         string
  slug:         string
  status:       WorkspaceStatus
  plan:         WorkspacePlan
  settings:     Record<string, unknown>
  created_at:   string
  updated_at:   string
  deleted_at:   string | null
}

export interface BrandVoice {
  tone?:         string
  style?:        string
  vocabulary?:   string[]
  avoided_words?: string[]
  key_messages?: string
  industry?:     string
}

export interface BrandIdentity {
  colors?:       string[]
  fonts?:        string[]
  logo_url?:     string
  visual_style?: string
}

export interface BrandAudience {
  primary_demo?:   string
  secondary_demo?: string
  pain_points?:    string[]
  motivations?:    string[]
}

export interface BrandRestriction {
  rule:   string
  reason: string
}

export interface BrandCompetitor {
  name:    string
  handle?: string
  notes?:  string
}

export interface Brand {
  id:           string
  workspace_id: string
  name:         string
  slug:         string
  status:       BrandStatus
  voice:        BrandVoice
  identity:     BrandIdentity
  audience:     BrandAudience
  restrictions: BrandRestriction[]
  competitors:  BrandCompetitor[]
  created_at:   string
  updated_at:   string
}

export interface CampaignKpi {
  metric: string
  target: string | number
}

export interface CampaignBrief {
  objective?:    string
  kpis?:         CampaignKpi[]
  audience?:     string
  tone_notes?:   string
  restrictions?: string[]
  channels?:     Channel[]
  approved_at?:  string
  approved_by?:  string
  migrated?:     boolean
}

export interface Campaign {
  id:              string
  workspace_id:    string
  brand_id:        string
  name:            string
  status:          CampaignStatus
  brief:           CampaignBrief
  starts_at:       string | null
  ends_at:         string | null
  budget_total:    number | null
  budget_currency: string
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export interface Creative {
  id:           string
  workspace_id: string
  campaign_id:  string
  creative_type: CreativeType
  status:       CreativeStatus
  content:      string
  prompt:       string | null
  model:        string | null
  agent_job_id: string | null
  version:      number
  parent_id:    string | null
  source_table: string | null
  source_id:    string | null
  created_by:   string | null
  created_at:   string
  updated_at:   string
}

export interface AssetMetadata {
  hashtags?:       string
  image_brief?:    string
  client_comment?: string
  source?:         'jclaude' | 'social_posts' | 'manual'
  title?:          string
  [key: string]:   unknown
}

export interface Asset {
  id:               string
  workspace_id:     string
  campaign_id:      string
  creative_id:      string | null
  asset_type:       AssetType
  channel:          Channel
  status:           AssetStatus
  caption:          string | null
  file_urls:        string[]
  thumbnail_url:    string | null
  scheduled_at:     string | null
  rejection_reason: string | null
  change_requests:  string | null
  metadata:         AssetMetadata
  approved_by:      string | null
  approved_at:      string | null
  agent_job_id:     string | null
  source_table:     string | null
  source_id:        string | null
  created_by:       string | null
  created_at:       string
  updated_at:       string
}

export interface AssetComment {
  id:           string
  workspace_id: string
  asset_id:     string
  user_id:      string
  content:      string
  created_at:   string
}

export interface Distribution {
  id:                 string
  workspace_id:       string
  campaign_id:        string
  asset_id:           string
  distribution_type:  DistributionType
  channel:            Channel
  status:             DistributionStatus
  scheduled_at:       string | null
  published_at:       string | null
  external_id:        string | null
  external_url:       string | null
  error_message:      string | null
  retry_count:        number
  metadata:           Record<string, unknown>
  created_by:         string | null
  created_at:         string
  updated_at:         string
}

export interface Performance {
  id:               string
  workspace_id:     string
  campaign_id:      string
  brand_id:         string
  distribution_id:  string | null
  asset_id:         string | null
  status:           PerformanceStatus
  impressions:      number
  reach:            number
  engagements:      number
  clicks:           number
  shares:           number
  saves:            number
  comments_count:   number
  spend:            number | null
  cpm:              number | null
  cpc:              number | null
  roas:             number | null
  conversions:      number | null
  raw_data:         Record<string, unknown>
  channel:          string
  period_start:     string
  period_end:       string
  imported_at:      string | null
  created_at:       string
}

export interface DataPoint {
  metric:     string
  value:      number | string
  comparison?: string
  period?:    string
}

export interface Insight {
  id:           string
  workspace_id: string
  campaign_id:  string
  brand_id:     string
  insight_type: InsightType
  status:       InsightStatus
  title:        string
  body:         string
  data_points:  DataPoint[]
  confidence:   number | null
  agent_job_id: string | null
  model:        string | null
  created_at:   string
  updated_at:   string
}

export interface Recommendation {
  id:                  string
  workspace_id:        string
  source_campaign_id:  string
  brand_id:            string
  status:              RecommendationStatus
  title:               string
  body:                string
  action_type:         string
  action_detail:       Record<string, unknown>
  decided_by:          string | null
  decided_at:          string | null
  decision_reason:     string | null
  target_campaign_id:  string | null
  agent_job_id:        string | null
  created_at:          string
  updated_at:          string
}

export interface Memory {
  id:           string
  workspace_id: string
  brand_id:     string
  campaign_id:  string | null
  memory_type:  MemoryType
  status:       MemoryStatus
  title:        string
  content:      string
  source:       string
  confidence:   number
  expires_at:   string | null
  superseded_by: string | null
  created_at:   string
  updated_at:   string
}

export interface AgentJob {
  id:            string
  workspace_id:  string
  campaign_id:   string | null
  agent_type:    AgentType
  status:        AgentStatus
  input:         Record<string, unknown>
  output:        Record<string, unknown> | null
  model:         string | null
  prompt_version: string | null
  tokens_input:  number | null
  tokens_output: number | null
  duration_ms:   number | null
  cost_usd:      number | null
  error_message: string | null
  triggered_by:  string | null
  started_at:    string | null
  completed_at:  string | null
  created_at:    string
}

export interface DomainEvent {
  id:           string
  workspace_id: string
  event:        string
  entity_type:  string | null
  entity_id:    string | null
  actor_id:     string | null
  actor_type:   ActorType
  metadata:     Record<string, unknown>
  created_at:   string
}

// ============================================================
// COMPOSITE TYPES (para respuestas de API)
// ============================================================

export interface AssetWithComments extends Asset {
  comments?: AssetComment[]
}

export interface CampaignSummary {
  campaign:            Campaign
  brand:               Pick<Brand, 'id' | 'name' | 'slug' | 'voice'>
  assets_total:        number
  assets_pending:      number
  assets_approved:     number
  assets_published:    number
  last_activity_at:    string | null
}

export interface DashboardStats {
  pending_assets:      number
  pending_documents:   number
  active_campaigns:    number
  published_this_month: number
}

// ============================================================
// LEGACY COMPATIBILITY TYPES
// Para código que todavía usa las tablas viejas durante la transición
// ============================================================

/** @deprecated Usar Asset con source_table='jclaude_posts' */
export interface LegacyJClaudePost {
  id:             string
  workspace_id:   string
  network:        string
  post_type:      string
  copy:           string
  hashtags:       string | null
  image_brief:    string | null
  image_url:      string | null
  status:         string
  client_comment: string | null
  scheduled_at:   string | null
  published_at:   string | null
  created_at:     string
  updated_at:     string
}

/** @deprecated Usar Asset con source_table='social_posts' */
export interface LegacySocialPost {
  id:           string
  workspace_id: string
  network:      string
  title:        string
  caption:      string | null
  media_urls:   string[]
  scheduled_at: string | null
  status:       string
  created_by:   string | null
  created_at:   string
  updated_at:   string
}
