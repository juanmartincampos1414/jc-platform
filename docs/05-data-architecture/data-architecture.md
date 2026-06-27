# Data Architecture
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

## 1. Tablas actuales

### Existentes y funcionales
| Tabla | Estado | Rows (aprox.) |
|---|---|---|
| `workspaces` | ✅ Real | < 10 |
| `workspace_users` | ✅ Real | < 20 |
| `jclaude_subscriptions` | ✅ Real | < 10 |
| `jclaude_profiles` | ✅ Real | < 10 |
| `jclaude_posts` | ✅ Real | < 100 |

### Existentes pero sin datos reales (UI usa mocks)
| Tabla | Estado |
|---|---|
| `legal_documents` | Tabla existe, sin registros reales de uso |
| `social_posts` | Tabla existe, sin registros reales |
| `post_comments` | Tabla existe, sin registros reales |
| `influencers` | Tabla existe, sin registros reales |
| `ad_accounts` | Tabla existe, sin registros reales |
| `billing_records` | Tabla existe, sin registros reales |
| `web_projects` | Tabla existe, sin registros reales |
| `extras` | Tabla existe, sin registros reales |

---

## 2. Tablas a crear

### Sprint 0 (crítico)
```sql
-- Activity feed del dashboard
create table public.activity_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  action text not null,         -- 'post.approved', 'document.signed', 'month.generated'
  entity_type text,             -- 'post', 'document', 'influencer', 'subscription'
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_activity_logs_workspace on public.activity_logs(workspace_id, created_at desc);
```

```sql
-- Storage tracking para assets
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type text not null check (type in ('image', 'video', 'pdf', 'document', 'audio')),
  name text,
  file_url text not null,        -- URL de Supabase Storage (permanente)
  storage_path text not null,    -- path dentro del bucket
  bucket text not null,          -- 'jc-assets' o 'legal-documents'
  mime_type text,
  size_bytes integer,
  width integer,
  height integer,
  duration_seconds numeric,
  source text check (source in ('ai_generated', 'uploaded')),
  ai_job_id uuid,
  post_id uuid references public.jclaude_posts(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
```

### Sprint 1 (JClaude hardening)
```sql
-- Prompts versionados
create table public.jclaude_prompts (
  id uuid primary key default uuid_generate_v4(),
  agent text not null,
  name text not null,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'active', 'deprecated')),
  system_prompt text,
  user_prompt_template text not null,
  output_schema jsonb,
  model text not null default 'claude-sonnet-4-6',
  temperature numeric(3,2) default 0.7,
  max_tokens integer default 4096,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(agent, version)
);

-- Trazabilidad de llamadas IA
create table public.ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  agent text not null,
  prompt_version_id uuid references public.jclaude_prompts(id),
  model text not null,
  input jsonb,
  output jsonb,
  tokens_input integer,
  tokens_output integer,
  cost_usd numeric(10,6),
  duration_ms integer,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  error text,
  created_at timestamptz default now()
);

-- Memoria persistente de marca
create table public.brand_memories (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type text not null check (type in ('brand', 'campaign', 'audience', 'approval_pattern', 'performance', 'decision', 'competitor')),
  key text not null,
  value text not null,
  confidence numeric(3,2) default 0.7,
  source text not null check (source in ('ai_generated', 'human_input', 'performance_data')),
  source_id uuid,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_brand_memories_workspace_type on public.brand_memories(workspace_id, type);
```

### Sprint 2 (Campaign foundation)
```sql
create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  name text not null,
  objective text,
  status text default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date date,
  end_date date,
  budget numeric(12,2),
  channels text[] default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.campaign_briefs (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  title text not null,
  description text,
  target_audience text,
  key_messages text[],
  tone text,
  dos text[],
  donts text[],
  reference_urls text[],
  status text default 'draft' check (status in ('draft', 'approved', 'rejected')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

create table public.performance_snapshots (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('post', 'ad', 'campaign')),
  entity_id uuid not null,
  platform text not null,
  period_start date,
  period_end date,
  metrics jsonb not null,   -- { impressions, clicks, ctr, conversions, cpa, roas, reach, engagement }
  imported_at timestamptz default now()
);
```

---

## 3. Modificaciones a tablas existentes

### `jclaude_posts` — agregar campos
```sql
alter table public.jclaude_posts
  add column if not exists campaign_id uuid references public.campaigns(id),
  add column if not exists ai_job_id uuid references public.ai_jobs(id),
  add column if not exists video_url text,
  add column if not exists created_by text default 'ai' check (created_by in ('ai', 'human'));
```

### `legal_documents` — agregar type
```sql
alter table public.legal_documents
  add column if not exists type text default 'offer_letter' 
    check (type in ('offer_letter', 'contract', 'nda', 'service_order', 'budget', 'other'));
```

### `social_posts` — agregar campaign_id y source
```sql
alter table public.social_posts
  add column if not exists campaign_id uuid references public.campaigns(id),
  add column if not exists source text default 'manual' check (source in ('manual', 'jclaude'));
```

---

## 4. Problemas de seguridad actuales

### Tokens OAuth en plaintext
**Problema:** `social_credentials jsonb` en `jclaude_profiles` guarda los tokens de Meta en texto plano.

**Solución inmediata (Sprint 0):** Encriptar usando Supabase Vault:
```sql
-- Habilitar Vault en Supabase (desde dashboard)
-- Luego en el código:
-- Antes de guardar: encrypt_token(token)
-- Al leer: decrypt_token(encrypted_token)
```

**Solución alternativa (más simple):** Usar `pgcrypto` con una clave de encryption guardada en variable de entorno:
```sql
-- Con pgcrypto
create extension if not exists pgcrypto;
-- Al insertar: pgp_sym_encrypt(token, env_key)
-- Al leer: pgp_sym_decrypt(encrypted_token, env_key)
```

### `access_token` en `ad_accounts` sin encrypt
```sql
-- Agregar columna encriptada y migrar
alter table public.ad_accounts
  add column access_token_encrypted text;
-- Migrar datos existentes con la función de encryption
```

---

## 5. Supabase Storage — configuración pendiente

### Buckets a crear
```
jc-assets (público)
  ├── images/ (imágenes generadas por IA)
  ├── videos/ (videos generados por Seedance)
  └── uploads/ (archivos subidos por usuarios)

legal-documents (privado)
  └── [workspace_id]/ (documentos por workspace)
```

### Políticas de Storage
```sql
-- jc-assets: solo lectura pública, escritura autenticada
create policy "Public read jc-assets"
  on storage.objects for select
  using (bucket_id = 'jc-assets');

create policy "Authenticated upload jc-assets"
  on storage.objects for insert
  with check (bucket_id = 'jc-assets' and auth.role() = 'authenticated');

-- legal-documents: solo el workspace owner puede leer
create policy "Workspace read legal docs"
  on storage.objects for select
  using (
    bucket_id = 'legal-documents' and
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 6. Migrations — plan de versioning

### Estado actual
Un solo archivo `supabase/schema.sql` — no versionado, no hay historial.

### Plan de migración (Sprint 0)
```
supabase/
  migrations/
    001_initial_schema.sql        ← mover contenido actual de schema.sql
    002_add_activity_logs.sql
    003_add_assets.sql
    004_add_jclaude_prompts.sql
    005_add_ai_jobs.sql
    006_add_brand_memories.sql
    007_add_campaigns.sql
    ...
  schema.sql                      ← mantener como referencia del estado completo
  seed.sql                        ← datos de prueba separados
```

---

## 7. RLS — estado actual

### Funciones helper (existen y funcionan)
```sql
public.user_in_workspace(ws_id uuid) → boolean
public.is_jc_admin() → boolean
```

### Tablas con RLS
Todas las tablas tienen RLS habilitado. Las políticas siguen el patrón:
- `jc_admin` → puede hacer todo
- Miembro del workspace → puede leer y modificar su propio workspace

### RLS pendiente para tablas nuevas
```sql
-- activity_logs
alter table public.activity_logs enable row level security;
create policy "ws_read_activity" on public.activity_logs
  for select using (public.user_in_workspace(workspace_id) or public.is_jc_admin());
create policy "system_insert_activity" on public.activity_logs
  for insert with check (public.user_in_workspace(workspace_id) or public.is_jc_admin());

-- assets, ai_jobs, brand_memories, campaigns → mismo patrón
```

---

*Documento vive en `/docs/05-data-architecture/data-architecture.md`*
