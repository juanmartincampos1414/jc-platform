# Domain Model
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

> Este documento define las entidades del sistema, sus campos mínimos, relaciones y comportamiento. Es el contrato entre producto, arquitectura y código. Toda nueva tabla debe tener su entrada aquí primero.

---

## Mapa de entidades

```
Workspace
  ├── Brand
  ├── User (via WorkspaceUser)
  ├── Campaign
  │     ├── CampaignBrief
  │     ├── Post
  │     ├── Ad
  │     ├── Influencer
  │     ├── LandingPage
  │     └── PerformanceMetric
  ├── Asset
  ├── Document (legal)
  ├── Subscription
  ├── Invoice
  ├── Integration
  ├── ActivityLog
  └── AIJob
         ├── Prompt
         └── Memory
```

---

## Entidades

---

### Workspace

```
Entidad: Workspace
Descripción: Unidad de aislamiento. Un cliente = un workspace. Multi-tenant boundary.
Campos mínimos:
  - id uuid PK
  - name text
  - slug text UNIQUE
  - logo_url text
  - active_services text[]
  - active_networks text[]
  - monthly_fee numeric
  - ads_budget_monthly numeric
  - created_at timestamptz
  - updated_at timestamptz
Relaciones:
  - HAS MANY WorkspaceUser
  - HAS MANY Campaign
  - HAS ONE Brand (via jclaude_profiles hoy)
  - HAS MANY Document
  - HAS ONE Subscription
  - HAS MANY ActivityLog
  - HAS MANY Asset
  - HAS MANY Integration
Estados: activo / inactivo (no modelado aún)
Eventos que genera: WorkspaceCreated, WorkspaceUpdated
Módulos que la usan: Todos
```

---

### User / WorkspaceUser

```
Entidad: User + WorkspaceUser
Descripción: Un User (auth.users) puede pertenecer a múltiples workspaces con distintos roles.
Campos mínimos (WorkspaceUser):
  - id uuid PK
  - workspace_id uuid FK → workspaces
  - user_id uuid FK → auth.users
  - role text: 'jc_admin' | 'client_admin' | 'client_user'
  - permissions jsonb (granularidad por sección)
  - full_name text
  - created_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - BELONGS TO auth.User
  - CAN APPROVE Post, Document, Influencer
Estados: active (implícito por existencia en tabla)
Eventos que genera: UserInvited, UserJoinedWorkspace, UserRoleChanged
Módulos que la usan: Auth, Admin, todos los módulos (para permissions)
```

---

### Brand

```
Entidad: Brand
Descripción: La identidad de la marca. Input principal para todos los agentes de IA.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK UNIQUE (una brand por workspace)
  - brand_name text
  - industry text
  - tone text  (ej: "profesional y cercano")
  - target_audience text
  - key_messages text
  - connected_networks jsonb []
  - social_credentials jsonb {}  (tokens OAuth — ENCRIPTAR)
  - logo_url text (pendiente: Supabase Storage)
  - brand_colors jsonb (pendiente)
  - brand_fonts jsonb (pendiente)
  - competitors text[] (pendiente)
  - created_at timestamptz
  - updated_at timestamptz
Relaciones:
  - BELONGS TO Workspace (1:1)
  - FEEDS AIJob (es el contexto principal de los agentes)
  - HAS MANY Memory (brand memories)
Estados: setup_pending → active → archived
Eventos que genera: BrandProfileCreated, BrandProfileUpdated, SocialAccountConnected, SocialAccountDisconnected
Módulos que la usan: JClaude, Social Media, Campaign Planning
Tabla actual: jclaude_profiles
```

---

### Campaign

```
Entidad: Campaign
Descripción: Unidad estratégica principal. Agrupa objetivo, audiencia, canales, piezas y métricas.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - name text
  - objective text  (awareness | consideration | conversion | retention)
  - status text: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  - start_date date
  - end_date date
  - budget numeric
  - channels text[]  (instagram, facebook, tiktok, etc.)
  - brief_id uuid FK → CampaignBrief
  - created_by uuid FK → auth.users
  - created_at timestamptz
  - updated_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - HAS ONE CampaignBrief
  - HAS MANY Post
  - HAS MANY Ad
  - HAS MANY Influencer (via campaign_influencers)
  - HAS MANY Asset
  - HAS MANY PerformanceMetric
  - HAS MANY Insight
Estados: draft → active → paused → completed → archived
Eventos que genera: CampaignCreated, CampaignBriefApproved, CampaignActivated, CampaignCompleted
Módulos que la usan: Social Media, Ads, Influencers, JClaude, Dashboard
Tabla actual: NO EXISTE — pendiente de crear en Sprint 2
```

---

### CampaignBrief

```
Entidad: CampaignBrief
Descripción: El documento de entrada de una campaña. Define el qué, para quién, con qué objetivo y con qué restricciones.
Campos mínimos:
  - id uuid PK
  - campaign_id uuid FK
  - workspace_id uuid FK
  - title text
  - description text
  - target_audience text
  - key_messages text[]
  - tone text
  - dos text[]
  - donts text[]
  - reference_urls text[]
  - status text: 'draft' | 'approved' | 'rejected'
  - approved_by uuid FK → auth.users
  - approved_at timestamptz
  - created_at timestamptz
Relaciones:
  - BELONGS TO Campaign (1:1)
  - IS INPUT FOR AIJob (cuando se genera contenido desde un brief)
Estados: draft → approved | rejected
Eventos que genera: BriefCreated, BriefApproved, BriefRejected
Tabla actual: NO EXISTE — pendiente de crear en Sprint 2
```

---

### Post

```
Entidad: Post
Descripción: Unidad publicable de contenido orgánico en una red social.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - campaign_id uuid FK (nullable — puede existir sin campaña en v0.1)
  - network text: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin'
  - post_type text: 'post' | 'reel' | 'story' | 'carousel'
  - copy text
  - hashtags text
  - image_brief text
  - image_url text (URL de Supabase Storage — no CDN temporal)
  - video_url text (pendiente: Seedance)
  - status text: 'draft' | 'pending' | 'approved' | 'rejected' | 'needs_changes' | 'scheduled' | 'published'
  - client_comment text
  - scheduled_at timestamptz
  - published_at timestamptz
  - ai_job_id uuid FK (trazabilidad de generación)
  - created_by text: 'ai' | 'human'
  - created_at timestamptz
  - updated_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - BELONGS TO Campaign (opcional)
  - BELONGS TO AIJob (si fue generado por IA)
  - HAS MANY Comment
  - HAS ONE Asset (imagen/video)
  - TRIGGERS Approval
Estados: draft → pending → approved | rejected | needs_changes → scheduled → published
Eventos que genera: PostGenerated, PostSubmittedForApproval, PostApproved, PostRejected, PostPublished
Módulos que la usan: JClaude, Social Media
Tablas actuales: jclaude_posts (JClaude), social_posts (portal) — unificar en Sprint 2
```

---

### Ad

```
Entidad: Ad
Descripción: Unidad publicitaria paga. Pertenece a una campaign y a una cuenta de ads.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - campaign_id uuid FK
  - ad_account_id uuid FK
  - platform text: 'meta' | 'google' | 'tiktok'
  - name text
  - status text: 'draft' | 'active' | 'paused' | 'completed'
  - budget_daily numeric
  - budget_total numeric
  - objective text
  - audience_targeting jsonb
  - creative_ids uuid[] (assets)
  - external_ad_id text (ID en la plataforma externa)
  - created_at timestamptz
Relaciones:
  - BELONGS TO Campaign
  - BELONGS TO AdAccount
  - HAS MANY PerformanceMetric
  - USES Asset (creative)
Estados: draft → active → paused → completed
Tabla actual: NO EXISTE como entidad — parte de ad_accounts hoy
```

---

### Influencer

```
Entidad: Influencer
Descripción: Persona con audiencia en redes que potencialmente colabora con la marca.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - campaign_id uuid FK (nullable)
  - name text
  - handle text
  - network text
  - followers integer
  - engagement_rate numeric
  - category text
  - profile_url text
  - profile_image_url text
  - fee_proposal numeric
  - status text: 'scouting' | 'proposal_sent' | 'approved' | 'rejected' | 'in_production' | 'content_review' | 'published'
  - content_url text
  - notes text
  - contract_doc_id uuid FK → Document
  - created_by uuid FK
  - created_at timestamptz
  - updated_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - BELONGS TO Campaign (opcional)
  - HAS MANY Document (contrato)
  - HAS MANY Asset (entregables)
  - HAS MANY Comment
Estados: scouting → proposal_sent → approved|rejected → in_production → content_review → published
Eventos que genera: InfluencerAdded, InfluencerApproved, InfluencerRejected, ContentDelivered, ContentApproved, ContentPublished
Tabla actual: influencers (existe pero no conectada a UI real)
```

---

### Document

```
Entidad: Document
Descripción: Archivo legal o contractual que requiere firma o aprobación.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - title text
  - description text
  - type text: 'offer_letter' | 'contract' | 'nda' | 'service_order' | 'budget' | 'other'
  - file_url text (Supabase Storage)
  - signed_file_url text
  - status text: 'pending' | 'signed'
  - signed_by uuid FK → auth.users
  - signed_at timestamptz
  - signature_data text
  - created_by uuid FK
  - created_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - BELONGS TO Influencer (opcional — contrato)
  - BELONGS TO Campaign (opcional)
Estados: pending → signed
Eventos que genera: DocumentUploaded, DocumentSigned
Tabla actual: legal_documents (existe, no conectada a UI)
```

---

### Asset

```
Entidad: Asset
Descripción: Archivo almacenado en Supabase Storage. Puede ser imagen, video, PDF, documento.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - type text: 'image' | 'video' | 'pdf' | 'document' | 'audio'
  - name text
  - file_url text (Supabase Storage — permanente)
  - mime_type text
  - size_bytes integer
  - width integer (imágenes)
  - height integer (imágenes)
  - duration_seconds numeric (videos)
  - source text: 'ai_generated' | 'uploaded' | 'scraped'
  - ai_job_id uuid FK (si fue generado por IA)
  - campaign_id uuid FK (opcional)
  - post_id uuid FK (opcional)
  - created_by uuid FK
  - created_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - BELONGS TO Campaign (opcional)
  - BELONGS TO Post (opcional)
  - BELONGS TO AIJob (si fue generado)
Tabla actual: NO EXISTE — hoy las URLs de imágenes están en jclaude_posts.image_url (temporales)
```

---

### Subscription

```
Entidad: Subscription
Descripción: Plan de pago activo de un workspace para JClaude.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - plan text: 'starter' | 'pro' | 'enterprise'
  - status text: 'pending' | 'active' | 'paused' | 'cancelled'
  - mp_preapproval_id text
  - posts_limit int
  - networks_limit int
  - autopublish bool
  - trending bool
  - current_period_start timestamptz
  - current_period_end timestamptz
  - trial_ends_at timestamptz
  - created_at timestamptz
Relaciones:
  - BELONGS TO Workspace (1:1)
Estados: pending → active → paused → cancelled
Eventos que genera: SubscriptionActivated, SubscriptionPaused, SubscriptionCancelled, PaymentFailed, TrialStarted, TrialEnded
Tabla actual: jclaude_subscriptions (existe y funciona)
```

---

### AIJob

```
Entidad: AIJob
Descripción: Registro de cada llamada a un modelo de IA. Trazabilidad completa.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - agent text: 'copy' | 'image' | 'video' | 'ads_analysis' | 'influencer_fit' | 'social_copy' | 'calendar'
  - prompt_version_id uuid FK → PromptVersion
  - model text
  - input jsonb
  - output jsonb
  - tokens_input integer
  - tokens_output integer
  - cost_usd numeric
  - duration_ms integer
  - status text: 'pending' | 'completed' | 'failed'
  - error text
  - created_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - BELONGS TO PromptVersion
  - PRODUCES Post | Asset | Insight | Recommendation
Tabla actual: NO EXISTE — pendiente de crear en Sprint 1
```

---

### PromptVersion

```
Entidad: PromptVersion
Descripción: Una versión de un prompt usado por un agente. Permite versionado, rollback y A/B testing.
Campos mínimos:
  - id uuid PK
  - agent text
  - name text
  - version integer
  - status text: 'draft' | 'active' | 'deprecated'
  - system_prompt text
  - user_prompt_template text
  - output_schema jsonb
  - model text
  - temperature numeric
  - max_tokens integer
  - created_by uuid FK
  - created_at timestamptz
Relaciones:
  - USED BY AIJob
Tabla actual: NO EXISTE — pendiente de crear en Sprint 1
```

---

### Memory

```
Entidad: Memory (BrandMemory)
Descripción: Conocimiento persistente sobre la marca, audiencia, performance o decisiones. Alimenta a los agentes de IA.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - type text: 'brand' | 'campaign' | 'audience' | 'performance' | 'approval_pattern' | 'competitor'
  - key text
  - value text
  - confidence numeric (0-1)
  - source text: 'ai_generated' | 'human_input' | 'performance_data'
  - source_id uuid (referencia a la fuente: ai_job_id, post_id, etc.)
  - expires_at timestamptz (opcional)
  - created_at timestamptz
  - updated_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - READ BY AIJob
  - WRITTEN BY AIJob | human input
Tabla actual: NO EXISTE — pendiente de crear en Sprint 1
```

---

### ActivityLog

```
Entidad: ActivityLog
Descripción: Feed cronológico de eventos en un workspace. Alimenta dashboard y audit trail.
Campos mínimos:
  - id uuid PK
  - workspace_id uuid FK
  - user_id uuid FK (nullable si es evento de sistema)
  - action text  (ej: 'post.approved', 'document.signed', 'month.generated')
  - entity_type text  (ej: 'post', 'document', 'influencer')
  - entity_id uuid
  - metadata jsonb
  - created_at timestamptz
Relaciones:
  - BELONGS TO Workspace
  - REFERENCES cualquier entidad
Tabla actual: NO EXISTE — pendiente de crear en Sprint 0
```

---

## Relaciones críticas (resumen visual)

```
Workspace
  ├── 1:1 → Brand
  ├── 1:1 → Subscription
  ├── 1:N → WorkspaceUser
  ├── 1:N → Campaign
  │           ├── 1:N → Post
  │           ├── 1:N → Ad
  │           ├── 1:N → Influencer
  │           └── 1:N → PerformanceMetric
  ├── 1:N → Document
  ├── 1:N → Asset
  ├── 1:N → AIJob
  │           ├── N:1 → PromptVersion
  │           └── PRODUCES → Post | Asset | Insight
  ├── 1:N → Memory
  └── 1:N → ActivityLog
```

---

*Documento vive en `/docs/03-product-architecture/domain-model.md`*  
*Toda nueva tabla en Supabase debe tener su entrada en este documento primero*
