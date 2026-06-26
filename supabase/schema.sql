-- JC AIgency Platform — Database Schema
-- Run this in Supabase SQL Editor

-- Extensions
create extension if not exists "uuid-ossp";

-- ========================================
-- WORKSPACES (one per client)
-- ========================================
create table public.workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  active_services text[] default '{"legales"}',
  active_networks text[] default '{"instagram"}',
  monthly_fee numeric(12,2),
  ads_budget_monthly numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- WORKSPACE USERS (links auth.users to workspaces)
-- ========================================
create table public.workspace_users (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('jc_admin', 'client_admin', 'client_user')),
  -- Permissions: JSON object {section: permission_level}
  -- permission_level: 'none' | 'view' | 'comment' | 'approve' | 'edit'
  permissions jsonb default '{}',
  full_name text,
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- ========================================
-- LEGAL DOCUMENTS
-- ========================================
create table public.legal_documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  signed_file_url text,
  status text default 'pending' check (status in ('pending', 'signed')),
  signed_by uuid references auth.users(id),
  signed_at timestamptz,
  signature_data text, -- base64 or typed name
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ========================================
-- SOCIAL POSTS
-- ========================================
create table public.social_posts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  network text not null check (network in ('instagram','facebook','tiktok','youtube','linkedin','twitter','pinterest','spotify')),
  title text not null,
  caption text,
  media_urls text[] default '{}',
  scheduled_at timestamptz,
  status text default 'draft' check (status in ('draft','pending','approved','rejected','needs_changes','published')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.post_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.social_posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);

-- ========================================
-- INFLUENCERS
-- ========================================
create table public.influencers (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  handle text not null,
  network text not null,
  followers integer,
  engagement_rate numeric(5,2),
  category text,
  profile_url text,
  profile_image_url text,
  fee_proposal numeric(12,2),
  status text default 'scouting' check (status in ('scouting','proposal_sent','approved','rejected','in_production','content_review','published')),
  content_url text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- AD ACCOUNTS
-- ========================================
create table public.ad_accounts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  platform text not null check (platform in ('meta','google','tiktok')),
  account_id text not null,
  account_name text,
  connected boolean default false,
  access_token text, -- encrypted in prod
  monthly_budget numeric(12,2),
  created_at timestamptz default now()
);

-- ========================================
-- BILLING RECORDS
-- ========================================
create table public.billing_records (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  month text not null, -- "2025-06"
  monthly_fee numeric(12,2),
  ads_investment_approved numeric(12,2),
  ads_investment_executed numeric(12,2),
  invoice_status text default 'pending' check (invoice_status in ('pending','sent','paid','overdue')),
  invoice_url text,
  invoice_date date,
  payment_date date,
  notes text,
  created_at timestamptz default now()
);

-- ========================================
-- WEB PROJECTS
-- ========================================
create table public.web_projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  url text,
  status text default 'in_progress' check (status in ('in_progress','live','paused','completed')),
  notes text,
  estimated_delivery date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- EXTRAS
-- ========================================
create table public.extras (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  name text not null,
  status text default 'pending' check (status in ('pending','in_progress','completed')),
  date date,
  notes text,
  created_at timestamptz default now()
);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

-- Enable RLS on all tables
alter table public.workspaces enable row level security;
alter table public.workspace_users enable row level security;
alter table public.legal_documents enable row level security;
alter table public.social_posts enable row level security;
alter table public.post_comments enable row level security;
alter table public.influencers enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.billing_records enable row level security;
alter table public.web_projects enable row level security;
alter table public.extras enable row level security;

-- Helper: check if user belongs to workspace
create or replace function public.user_in_workspace(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.workspace_users
    where workspace_id = ws_id and user_id = auth.uid()
  )
$$;

-- Helper: check if user is JC admin
create or replace function public.is_jc_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.workspace_users
    where user_id = auth.uid() and role = 'jc_admin'
  )
$$;

-- Workspace policies
create policy "workspace_member_read" on public.workspaces
  for select using (public.user_in_workspace(id) or public.is_jc_admin());

create policy "jc_admin_all_workspaces" on public.workspaces
  for all using (public.is_jc_admin()) with check (public.is_jc_admin());

-- Workspace users policies
create policy "see_own_workspace_members" on public.workspace_users
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());

create policy "jc_manage_workspace_users" on public.workspace_users
  for all using (public.is_jc_admin()) with check (public.is_jc_admin());

-- Legal documents
create policy "workspace_member_read_legal" on public.legal_documents
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "workspace_member_update_legal" on public.legal_documents
  for update using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_legal" on public.legal_documents
  for insert with check (public.is_jc_admin());
create policy "jc_delete_legal" on public.legal_documents
  for delete using (public.is_jc_admin());

-- Social posts
create policy "workspace_member_read_posts" on public.social_posts
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "workspace_member_update_posts" on public.social_posts
  for update using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_posts" on public.social_posts
  for insert with check (public.is_jc_admin());
create policy "jc_delete_posts" on public.social_posts
  for delete using (public.is_jc_admin());

-- Post comments
create policy "workspace_member_read_comments" on public.post_comments
  for select using (exists (select 1 from public.social_posts p where p.id = post_id and public.user_in_workspace(p.workspace_id)));
create policy "workspace_member_insert_comments" on public.post_comments
  for insert with check (exists (select 1 from public.social_posts p where p.id = post_id and public.user_in_workspace(p.workspace_id)));

-- Influencers
create policy "workspace_member_read_influencers" on public.influencers
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "workspace_member_update_influencers" on public.influencers
  for update using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_influencers" on public.influencers
  for insert with check (public.is_jc_admin());
create policy "jc_delete_influencers" on public.influencers
  for delete using (public.is_jc_admin());

-- Ad accounts
create policy "workspace_member_read_ad_accounts" on public.ad_accounts
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_ad_accounts" on public.ad_accounts
  for insert with check (public.is_jc_admin());
create policy "jc_update_ad_accounts" on public.ad_accounts
  for update using (public.is_jc_admin());
create policy "jc_delete_ad_accounts" on public.ad_accounts
  for delete using (public.is_jc_admin());

-- Billing records
create policy "workspace_member_read_billing" on public.billing_records
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_billing" on public.billing_records
  for insert with check (public.is_jc_admin());
create policy "jc_update_billing" on public.billing_records
  for update using (public.is_jc_admin());
create policy "jc_delete_billing" on public.billing_records
  for delete using (public.is_jc_admin());

-- Web projects
create policy "workspace_member_read_webs" on public.web_projects
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_webs" on public.web_projects
  for insert with check (public.is_jc_admin());
create policy "jc_update_webs" on public.web_projects
  for update using (public.is_jc_admin());
create policy "jc_delete_webs" on public.web_projects
  for delete using (public.is_jc_admin());

-- Extras
create policy "workspace_member_read_extras" on public.extras
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_insert_extras" on public.extras
  for insert with check (public.is_jc_admin());
create policy "jc_update_extras" on public.extras
  for update using (public.is_jc_admin());
create policy "jc_delete_extras" on public.extras
  for delete using (public.is_jc_admin());

-- ========================================
-- SEED: Demo workspace for development
-- ========================================
-- insert into public.workspaces (name, slug, active_services, active_networks)
-- values ('Cliente Demo', 'ws-1', '{"legales","social_media","ads","influencers","webs","extras"}', '{"instagram","facebook","tiktok","google"}');

-- ========================================
-- JCLAUDE — Premium AI Content Module
-- ========================================

-- Subscriptions (MercadoPago)
create table if not exists public.jclaude_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  plan text not null check (plan in ('starter', 'pro', 'enterprise')),
  status text not null default 'pending' check (status in ('pending', 'active', 'paused', 'cancelled')),
  mp_preapproval_id text,
  mp_subscription_id text,
  posts_limit int not null default 8,
  networks_limit int not null default 2,
  autopublish bool not null default false,
  trending bool not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Brand profiles (setup de la marca por workspace)
create table if not exists public.jclaude_profiles (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null unique,
  brand_name text,
  industry text,
  tone text,
  target_audience text,
  key_messages text,
  connected_networks jsonb default '[]',
  social_credentials jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generated posts queue
create table if not exists public.jclaude_posts (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  network text not null,
  post_type text not null default 'standard' check (post_type in ('standard', 'trending')),
  copy text not null,
  hashtags text,
  image_brief text,
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected', 'scheduled', 'published')),
  client_comment text,
  scheduled_at timestamptz,
  published_at timestamptz,
  mp_external_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.jclaude_subscriptions enable row level security;
alter table public.jclaude_profiles enable row level security;
alter table public.jclaude_posts enable row level security;

create policy "ws_read_jclaude_sub" on public.jclaude_subscriptions
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_manage_jclaude_sub" on public.jclaude_subscriptions
  for all using (public.is_jc_admin()) with check (public.is_jc_admin());

create policy "ws_read_jclaude_profile" on public.jclaude_profiles
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "ws_upsert_jclaude_profile" on public.jclaude_profiles
  for insert with check (public.user_in_workspace(workspace_id));
create policy "ws_update_jclaude_profile" on public.jclaude_profiles
  for update using (public.user_in_workspace(workspace_id));

create policy "ws_read_jclaude_posts" on public.jclaude_posts
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "ws_insert_jclaude_posts" on public.jclaude_posts
  for insert with check (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "ws_update_jclaude_posts" on public.jclaude_posts
  for update using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "jc_delete_jclaude_posts" on public.jclaude_posts
  for delete using (public.is_jc_admin());
