# Schema Contract v1.0
## JC AIgency Platform — Fuente única de verdad del dominio

**Principio:** El dominio define el código y el schema. Nunca al revés.

**Regla de uso:** Antes de escribir una query, endpoint, componente o agente — leer este documento. No asumir columnas. No asumir relaciones. No asumir nombres.

**Actualización:** Todo cambio de dominio requiere actualizar este contrato antes de escribir la migración.

---

## Índice de entidades

| Entidad | Tabla | Sprint |
|---------|-------|--------|
| [Brand](#brand) | `brands` | 1 |
| [Campaign](#campaign) | `campaigns` | 1 |
| [Creative](#creative) | `creatives` | 1 |
| [Asset](#asset) | `assets` | 1 |
| [Asset Comment](#asset-comment) | `asset_comments` | 1 |
| [Distribution](#distribution) | `distributions` | 1 |
| [Performance](#performance) | `performances` | 1 |
| [Insight](#insight) | `insights` | 1 |
| [Recommendation](#recommendation) | `recommendations` | 1 |
| [Memory](#memory) | `memories` | 1 / 2A |
| [Decision](#decision) | `decisions` | 2B |
| [Agent Job](#agent-job) | `agent_jobs` | 1 |
| [Event](#event) | `events` | 1 |

---

## Brand

**Qué representa:** Una marca cliente gestionada por JC AIgency. Contiene el perfil completo de la marca: voz, identidad, audiencia, restricciones, competidores.

### Tabla: `brands`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | uuid_generate_v4() | PK |
| workspace | `workspace_id` | uuid FK→workspaces | NO | — | Tenant owner |
| nombre | `name` | text | NO | — | Nombre display |
| slug | `slug` | text | NO | — | Identificador URL-safe. UNIQUE por workspace |
| estado | `status` | text | NO | `'created'` | `created` `profiling` `active` `archived` |
| voz | `voice` | jsonb | NO | `{}` | Tono, estilo, keywords |
| identidad | `identity` | jsonb | NO | `{}` | Misión, visión, valores |
| audiencia | `audience` | jsonb | NO | `{}` | Segmentos, personas |
| restricciones | `restrictions` | jsonb | NO | `[]` | Temas prohibidos, límites |
| competidores | `competitors` | jsonb | NO | `[]` | Lista de competidores |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

**NO existen:** `industry`, `description`, `logo_url` — no están en el schema.

### Relaciones
- `workspace_id` → `workspaces.id` CASCADE DELETE
- 1 Brand → N Campaigns
- 1 Brand → N Memories
- 1 Brand → N Decisions

### RLS
- SELECT: `user_in_workspace(workspace_id)` OR `is_jc_admin()`
- INSERT: `is_jc_admin()` solo
- UPDATE: `user_in_workspace(workspace_id)` OR `is_jc_admin()`

### Queries oficiales
```sql
-- Obtener brand de un workspace
SELECT id, name, slug, status, voice, identity, audience
FROM brands WHERE workspace_id = $1 AND status != 'archived';

-- Join desde campaigns
brands(name)   -- CORRECTO
brands(name, industry)  -- ❌ industry NO EXISTE
```

### Consumidores
- `src/lib/knowledge/engine.ts` — lee `name` para context
- `src/app/api/campaigns/` — join `brands(name)`
- `src/app/api/jclaude/generate-month/` — lee brand completo

---

## Campaign

**Qué representa:** El centro operativo. Agrupa Assets, Decisions y Knowledge bajo un objetivo de comunicación. Una Campaign pertenece a una Brand.

### Tabla: `campaigns`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | uuid_generate_v4() | PK |
| workspace | `workspace_id` | uuid FK→workspaces | NO | — | Tenant |
| brand | `brand_id` | uuid FK→brands | NO | — | Brand owner |
| nombre | `name` | text | NO | — | Nombre de la campaign |
| estado | `status` | text | NO | `'draft'` | `draft` `brief_approved` `in_production` `in_review` `approved` `publishing` `active` `completed` `archived` |
| brief | `brief` | jsonb | NO | `{}` | `{objective, channels, migrated, ...}` |
| inicio | `starts_at` | timestamptz | SÍ | — | Fecha inicio |
| fin | `ends_at` | timestamptz | SÍ | — | Fecha fin |
| presupuesto | `budget_total` | numeric(12,2) | SÍ | — | Presupuesto total |
| moneda | `budget_currency` | text | NO | `'ARS'` | Moneda del presupuesto |
| creado_por | `created_by` | uuid FK→auth.users | SÍ | — | Usuario que creó |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

**NO existen:** `start_date`, `end_date`, `objective` (como columna), `channels` (como columna).
**Objetivo y canales están en:** `brief->>'objective'`, `brief->'channels'`.

### Brief jsonb — estructura esperada
```json
{
  "objective": "string — objetivo de la campaign",
  "channels": ["instagram", "facebook"],
  "migrated": true
}
```

### Relaciones
- `workspace_id` → `workspaces.id` CASCADE DELETE
- `brand_id` → `brands.id`
- 1 Campaign → N Assets
- 1 Campaign → N Creatives
- 1 Campaign → N Distributions
- 1 Campaign → N Performances
- 1 Campaign → N Insights
- 1 Campaign → N Recommendations
- 1 Campaign → N Memories
- 1 Campaign → N Decisions
- 1 Campaign → N Events
- 1 Campaign → N Agent Jobs

### Queries oficiales
```sql
-- Lista de campaigns
SELECT id, name, status, starts_at, ends_at, brief, created_at, updated_at, brand_id
FROM campaigns WHERE workspace_id = $1 ORDER BY created_at DESC;

-- Campaign detail con brand
SELECT id, name, status, starts_at, ends_at, brief, created_at, updated_at, brand_id,
       brands(name)
FROM campaigns WHERE id = $1 AND workspace_id = $2;

-- Extraer objective del brief
brief->>'objective'      -- texto
brief->'channels'        -- jsonb array
```

### Consumidores
- `src/app/api/campaigns/route.ts`
- `src/app/api/campaigns/[campaignId]/route.ts`
- `src/lib/decision/engine.ts`
- `src/app/(client)/workspace/[workspaceId]/campaigns/`

---

## Creative

**Qué representa:** El contenido textual generado por IA o editado por el equipo. Es la capa intelectual de un Asset — el texto antes de ser formateado para un canal específico.

### Tabla: `creatives`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | uuid_generate_v4() | PK |
| workspace | `workspace_id` | uuid FK→workspaces | NO | — | Tenant |
| campaign | `campaign_id` | uuid FK→campaigns CASCADE | NO | — | Campaign owner |
| tipo | `creative_type` | text | NO | `'copy'` | `copy` `script` `concept` `brief_note` |
| estado | `status` | text | NO | `'draft'` | `generating` `draft` `revised` `approved` `deprecated` |
| contenido | `content` | text | NO | `''` | Texto del creative |
| prompt | `prompt` | text | SÍ | — | Prompt usado para generarlo |
| modelo | `model` | text | SÍ | — | Modelo de IA usado |
| agent_job | `agent_job_id` | uuid | SÍ | — | FK lógico a agent_jobs |
| versión | `version` | integer | NO | 1 | Número de versión |
| padre | `parent_id` | uuid FK→creatives | SÍ | — | Creative que reemplaza |
| fuente_tabla | `source_table` | text | SÍ | — | `'jclaude_posts'` para migrados |
| fuente_id | `source_id` | uuid | SÍ | — | ID en tabla origen |
| creado_por | `created_by` | uuid FK→auth.users | SÍ | — | Usuario |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

### Relaciones
- 1 Creative → N Assets (un creative puede tener múltiples formatos)

---

## Asset

**Qué representa:** La unidad de contenido lista para publicar. Tiene canal, tipo, caption, scheduling y estado de aprobación. Es el objeto central del workflow de producción.

### Tabla: `assets`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | uuid_generate_v4() | PK |
| workspace | `workspace_id` | uuid FK→workspaces | NO | — | Tenant |
| campaign | `campaign_id` | uuid FK→campaigns CASCADE | NO | — | Campaign owner |
| creative | `creative_id` | uuid FK→creatives | SÍ | — | Creative source |
| tipo | `asset_type` | text | NO | `'post'` | `post` `reel` `story` `carousel` `ad` `video` `image` `document` |
| canal | `channel` | text | NO | `'instagram'` | `instagram` `facebook` `tiktok` `youtube` `linkedin` `twitter` `email` `web` |
| estado | `status` | text | NO | `'draft'` | `generating` `draft` `internal_review` `sent_for_approval` `approved` `rejected` `needs_changes` `published` `archived` |
| caption | `caption` | text | SÍ | — | Texto del post |
| archivos | `file_urls` | text[] | NO | `{}` | URLs de media |
| thumbnail | `thumbnail_url` | text | SÍ | — | URL thumbnail |
| publicar_en | `scheduled_at` | timestamptz | SÍ | — | Fecha/hora de publicación |
| motivo_rechazo | `rejection_reason` | text | SÍ | — | Razón si rechazado |
| cambios_pedidos | `change_requests` | text | SÍ | — | Feedback del cliente |
| metadata | `metadata` | jsonb | NO | `{}` | `{source, hashtags, image_brief, ...}` |
| aprobado_por | `approved_by` | uuid FK→auth.users | SÍ | — | Usuario aprobador |
| aprobado_en | `approved_at` | timestamptz | SÍ | — | Timestamp aprobación |
| agent_job | `agent_job_id` | uuid | SÍ | — | FK lógico a agent_jobs |
| fuente_tabla | `source_table` | text | SÍ | — | Tabla de migración |
| fuente_id | `source_id` | uuid | SÍ | — | ID en tabla origen |
| creado_por | `created_by` | uuid FK→auth.users | SÍ | — | — |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

### Metadata jsonb — estructura esperada
```json
{
  "source": "jclaude",
  "hashtags": "#tag1 #tag2",
  "image_brief": "descripción para generación de imagen"
}
```

### RLS (cliente ve solo estados post-draft)
- Client SELECT: `status IN ('sent_for_approval','approved','rejected','needs_changes','published')`
- JC Admin SELECT: todos los estados

### Queries oficiales
```sql
-- Assets de una campaign para Campaign Detail
SELECT id, channel, asset_type, status, caption, scheduled_at, created_at, metadata
FROM assets WHERE campaign_id = $1 ORDER BY scheduled_at ASC;

-- Counts por status para summary
SELECT status, COUNT(*) FROM assets WHERE campaign_id = $1 GROUP BY status;
```

### Consumidores
- `src/app/api/campaigns/[campaignId]/route.ts`
- `src/app/api/jclaude/generate-month/` — INSERT
- `src/lib/knowledge/engine.ts` — lee para extraer knowledge
- `src/app/(client)/workspace/[workspaceId]/campaigns/[campaignId]/page.tsx`

---

## Asset Comment

**Qué representa:** Comentario de un usuario sobre un Asset específico durante el proceso de revisión.

### Tabla: `asset_comments`

| Campo físico | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | uuid PK | NO | — |
| `workspace_id` | uuid FK→workspaces | NO | Tenant |
| `asset_id` | uuid FK→assets CASCADE | NO | Asset comentado |
| `user_id` | uuid FK→auth.users | NO | Autor del comentario |
| `content` | text | NO | Texto del comentario |
| `created_at` | timestamptz | NO | — |

---

## Distribution

**Qué representa:** El registro de una publicación o intento de publicación de un Asset en un canal externo.

### Tabla: `distributions`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | — | PK |
| workspace | `workspace_id` | uuid | NO | — | Tenant |
| campaign | `campaign_id` | uuid | NO | — | — |
| asset | `asset_id` | uuid FK→assets CASCADE | NO | — | Asset publicado |
| tipo | `distribution_type` | text | NO | `'organic'` | `organic` `paid` `influencer` `email` `web` |
| canal | `channel` | text | NO | — | Mismo enum que assets.channel |
| estado | `status` | text | NO | `'scheduled'` | `scheduled` `publishing` `published` `failed` `archived` |
| programado_en | `scheduled_at` | timestamptz | SÍ | — | — |
| publicado_en | `published_at` | timestamptz | SÍ | — | — |
| id_externo | `external_id` | text | SÍ | — | ID en plataforma externa |
| url_externa | `external_url` | text | SÍ | — | URL del post publicado |
| error | `error_message` | text | SÍ | — | Error si falló |
| reintentos | `retry_count` | integer | NO | 0 | — |
| metadata | `metadata` | jsonb | NO | `{}` | — |
| creado_por | `created_by` | uuid | SÍ | — | — |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

---

## Performance

**Qué representa:** Métricas de performance de un Asset/Distribution en un período dado. Import desde Meta API u otras plataformas.

### Tabla: `performances`

| Campo físico | Tipo | Nullable | Descripción |
|---|---|---|---|
| `id` | uuid PK | NO | — |
| `workspace_id` | uuid | NO | Tenant |
| `campaign_id` | uuid | NO | — |
| `brand_id` | uuid | NO | — |
| `distribution_id` | uuid FK→distributions CASCADE | SÍ | — |
| `asset_id` | uuid FK→assets | SÍ | — |
| `status` | text | NO | `pending` `importing` `imported` `analyzed` |
| `impressions` | bigint | NO | 0 | — |
| `reach` | bigint | NO | 0 | — |
| `engagements` | bigint | NO | 0 | — |
| `clicks` | bigint | NO | 0 | — |
| `shares` | bigint | NO | 0 | — |
| `saves` | bigint | NO | 0 | — |
| `comments_count` | integer | NO | 0 | — |
| `spend` | numeric(12,2) | SÍ | — | Gasto en pauta |
| `cpm` | numeric(10,4) | SÍ | — | — |
| `cpc` | numeric(10,4) | SÍ | — | — |
| `roas` | numeric(10,4) | SÍ | — | — |
| `conversions` | integer | SÍ | — | — |
| `raw_data` | jsonb | NO | `{}` | Respuesta cruda de la API |
| `channel` | text | NO | `'instagram'` | Canal de origen |
| `period_start` | timestamptz | NO | now() | Inicio del período medido |
| `period_end` | timestamptz | NO | now() | Fin del período medido |
| `imported_at` | timestamptz | SÍ | — | — |
| `created_at` | timestamptz | NO | now() | — |

---

## Insight

**Qué representa:** Análisis generado por IA sobre performance, tendencias o audiencia. Puede ser un trigger para una Recommendation.

### Tabla: `insights`

| Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid PK | NO | — | — |
| `workspace_id` | uuid | NO | — | Tenant |
| `campaign_id` | uuid | NO | — | — |
| `brand_id` | uuid | NO | — | — |
| `insight_type` | text | NO | `'performance'` | `performance` `trend` `audience` `content` `competitive` `recommendation_trigger` |
| `status` | text | NO | `'draft'` | `generating` `draft` `published` `archived` |
| `title` | text | NO | `''` | — |
| `body` | text | NO | `''` | — |
| `data_points` | jsonb | NO | `[]` | — |
| `confidence` | numeric(3,2) | SÍ | 1.00 | — |
| `agent_job_id` | uuid | SÍ | — | — |
| `model` | text | SÍ | — | — |
| `created_at` | timestamptz | NO | now() | — |
| `updated_at` | timestamptz | NO | now() | — |

---

## Recommendation

**Qué representa:** Una acción concreta recomendada al cliente, derivada de una Decision. Tiene ciclo de vida: pending → accepted/rejected.

### Tabla: `recommendations`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | — | PK |
| workspace | `workspace_id` | uuid | NO | — | Tenant |
| campaign_origen | `source_campaign_id` | uuid FK→campaigns | NO | — | Campaign que generó la rec |
| brand | `brand_id` | uuid FK→brands | NO | — | — |
| decision | `decision_id` | uuid FK→decisions | SÍ | — | Decision que derivó esta rec (Sprint 2B) |
| estado | `status` | text | NO | `'pending'` | `generating` `pending` `accepted` `rejected` `expired` |
| título | `title` | text | NO | `''` | — |
| cuerpo | `body` | text | NO | `''` | — |
| tipo_accion | `action_type` | text | NO | `'test_new_format'` | Qué tipo de acción recomienda |
| detalle_accion | `action_detail` | jsonb | NO | `{}` | Parámetros específicos |
| decidido_por | `decided_by` | uuid FK→auth.users | SÍ | — | Quién aprobó/rechazó |
| decidido_en | `decided_at` | timestamptz | SÍ | — | — |
| razon_decision | `decision_reason` | text | SÍ | — | Por qué se aceptó/rechazó |
| campaign_destino | `target_campaign_id` | uuid FK→campaigns | SÍ | — | Campaign donde se implementa |
| agent_job | `agent_job_id` | uuid | SÍ | — | — |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

### Eventos emitidos
- `recommendation.created` — al generar
- `recommendation.accepted` — al aceptar
- `recommendation.rejected` — al rechazar

---

## Memory

**Qué representa:** Conocimiento persistente del sistema sobre una Brand o Campaign. Existen dos categorías: Knowledge Objects (del Knowledge Engine) y memorias generales del sistema.

### Tabla: `memories`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | — | PK |
| workspace | `workspace_id` | uuid | NO | — | Tenant |
| brand | `brand_id` | uuid FK→brands | NO | — | Brand owner |
| campaign | `campaign_id` | uuid FK→campaigns | SÍ | — | Campaign específica (opcional) |
| tipo | `memory_type` | text | NO | — | Ver tipos abajo |
| estado | `status` | text | NO | `'active'` | `active` `deprecated` `archived` |
| título | `title` | text | NO | — | — |
| contenido | `content` | text | NO | — | Texto del conocimiento |
| fuente | `source` | text | NO | `'system'` | Quién lo generó |
| confianza | `confidence` | numeric(3,2) | NO | 1.00 | 0.0–1.0 |
| metadata | `metadata` | jsonb | NO | `{}` | `{sample_size, data, ...}` (Sprint 2B fix) |
| expira_en | `expires_at` | timestamptz | SÍ | — | — |
| supersedido_por | `superseded_by` | uuid FK→memories | SÍ | — | — |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

### Valores válidos de `memory_type`
```
Tipos generales:
  brand, campaign, creative, audience,
  trend, performance, decision, knowledge, competitor

Tipos del Knowledge Engine (Sprint 2A):
  channel_affinity, content_mix, timing,
  approval_signals, brand_voice, creative_style, campaign_pattern
```

### Queries oficiales
```sql
-- Knowledge Objects activos para una brand (Campaign Detail)
SELECT id, memory_type, title, content, confidence, metadata, created_at
FROM memories
WHERE workspace_id = $1
  AND status = 'active'
  AND memory_type != 'brand'
ORDER BY confidence DESC;

-- Knowledge para prompt context (threshold 0.3)
SELECT * FROM memories
WHERE brand_id = $1 AND status = 'active' AND confidence >= 0.3;
```

### Consumidores
- `src/lib/knowledge/engine.ts` — INSERT/UPDATE
- `src/lib/knowledge/context.ts` — SELECT para Claude
- `src/app/api/campaigns/[campaignId]/route.ts` — SELECT para Campaign Detail

---

## Decision

**Qué representa:** Una conclusión del sistema basada en evidencia y knowledge. Toda Recommendation debe derivar de una Decision. Nunca existe una Decision sin trazabilidad.

### Tabla: `decisions`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | — | PK |
| workspace | `workspace_id` | uuid FK→workspaces CASCADE | NO | — | Tenant |
| brand | `brand_id` | uuid FK→brands | NO | — | Brand owner |
| campaign | `campaign_id` | uuid FK→campaigns | SÍ | — | Opcional — puede ser cross-campaign |
| tipo | `decision_type` | text | NO | — | `content` `channel` `timing` `budget` `audience` `creative` `publishing` `performance` |
| estado | `status` | text | NO | `'active'` | `active` `expired` `superseded` `rejected` |
| confianza | `confidence` | numeric(3,2) | NO | 0.0 | 0.0–1.0 |
| fundamento | `rationale` | text | NO | `''` | Explicación legible |
| knowledge_soporte | `supporting_knowledge` | jsonb | NO | `[]` | IDs de Memories que soportan |
| evidencia_soporte | `supporting_evidence` | jsonb | NO | `[]` | Datos crudos de evidencia |
| eventos_fuente | `source_events` | jsonb | NO | `[]` | IDs de Events que originaron |
| expira_en | `expires_at` | timestamptz | SÍ | — | — |
| generado_en | `generated_at` | timestamptz | NO | now() | — |
| creado_en | `created_at` | timestamptz | NO | now() | — |
| actualizado_en | `updated_at` | timestamptz | NO | now() | — |

### Regla de negocio
Al generar una nueva Decision del mismo `decision_type` para la misma `brand_id`, la anterior pasa a `status = 'superseded'`.

### Queries oficiales
```sql
-- Decisions activas de una campaign
SELECT id, decision_type, status, confidence, rationale,
       supporting_knowledge, supporting_evidence, generated_at
FROM decisions
WHERE campaign_id = $1
ORDER BY confidence DESC;

-- Decisions activas para prompt context (threshold 0.4)
SELECT * FROM decisions
WHERE brand_id = $1 AND status = 'active' AND confidence >= 0.4;
```

### Consumidores
- `src/lib/decision/engine.ts` — INSERT/UPDATE
- `src/lib/decision/context.ts` — SELECT para Claude
- `src/app/api/campaigns/[campaignId]/route.ts` — SELECT para Campaign Detail
- `src/app/api/decision/generate/route.ts` — trigger

---

## Agent Job

**Qué representa:** Registro de una ejecución de agente IA. Incluye inputs, outputs, métricas de costo y performance.

### Tabla: `agent_jobs`

| Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|
| `id` | uuid PK | NO | — | — |
| `workspace_id` | uuid | NO | — | Tenant |
| `campaign_id` | uuid FK→campaigns | SÍ | — | — |
| `agent_type` | text | NO | — | `brand` `strategy` `campaign_planner` `copy` `image` `video` `ads` `influencer_fit` `performance` `insights` `recommendation` `learning` |
| `status` | text | NO | `'queued'` | `queued` `running` `completed` `failed` |
| `input` | jsonb | NO | `{}` | Input enviado al agente |
| `output` | jsonb | SÍ | — | Output retornado |
| `model` | text | SÍ | — | Modelo IA usado |
| `prompt_version` | text | SÍ | — | Ej: `generate-month-v4` |
| `tokens_input` | integer | SÍ | — | — |
| `tokens_output` | integer | SÍ | — | — |
| `duration_ms` | integer | SÍ | — | — |
| `cost_usd` | numeric(10,6) | SÍ | — | — |
| `error_message` | text | SÍ | — | — |
| `triggered_by` | uuid FK→auth.users | SÍ | — | — |
| `started_at` | timestamptz | SÍ | — | — |
| `completed_at` | timestamptz | SÍ | — | — |
| `created_at` | timestamptz | NO | now() | — |

---

## Event

**Qué representa:** Registro inmutable de algo que ocurrió en el sistema. Los Events son la evidencia que alimenta el Knowledge Engine y el Decision Engine. **Nunca se modifican ni eliminan.**

### Tabla: `events`

| Campo lógico | Campo físico | Tipo | Nullable | Default | Descripción |
|---|---|---|---|---|---|
| id | `id` | uuid | NO | — | PK |
| workspace | `workspace_id` | uuid FK→workspaces | NO | — | Tenant |
| tipo_evento | `event` | text | NO | — | Nombre del evento (ej: `asset.approved`) |
| tipo_entidad | `entity_type` | text | SÍ | — | Qué tipo de entidad (ej: `asset`) |
| id_entidad | `entity_id` | uuid | SÍ | — | ID de la entidad afectada |
| id_actor | `actor_id` | uuid FK→auth.users | SÍ | — | Usuario que lo produjo |
| tipo_actor | `actor_type` | text | NO | `'user'` | `user` `agent` `system` |
| metadata | `metadata` | jsonb | NO | `{}` | Datos adicionales del evento |
| creado_en | `created_at` | timestamptz | NO | now() | — |

**NOTA:** La tabla tiene columna `event` (no `event_type`). Queries deben usar `event`.

**NO existen:** `event_type` como columna — el campo es `event`.

**NOTA RLS:** No hay políticas de UPDATE ni DELETE — los Events son inmutables por diseño.

### Queries oficiales
```sql
-- Activity de una campaign
SELECT id, event, entity_type, entity_id, actor_type, metadata, created_at
FROM events WHERE campaign_id = $1
ORDER BY created_at DESC LIMIT 30;
```

**Problema conocido:** La tabla `events` no tiene columna `campaign_id`. La relación campaign ↔ event se hace via `entity_id` cuando `entity_type = 'campaign'`, o via los assets/decisions del campaign.

### Consumidores
- `src/lib/knowledge/engine.ts` — lee events para extraer knowledge
- `src/app/api/campaigns/[campaignId]/route.ts` — query de activity

---

## Reglas de implementación

### Antes de escribir código

1. **Validar nombres de columnas en este documento.** Si no está listado, no existe.
2. **Verificar la migración SQL correspondiente** si hay dudas.
3. **No agregar columnas imaginadas** (`industry`, `objective`, `event_type`, etc.).

### Antes de hacer un join

1. Verificar que el campo requerido existe en la tabla relacionada.
2. Usar solo: `brands(name)` — no `brands(name, industry)`.

### Antes de leer metadata/jsonb

1. Verificar la estructura esperada en este documento.
2. Usar `->>'campo'` para texto, `->'campo'` para jsonb.

### Orden del flujo (RUN72 OS)

```
Product Constitution
        ↓
Domain Freeze
        ↓
Schema Contract  ← este documento
        ↓
Build Spec
        ↓
Implementation
        ↓
Reflection
        ↓
Architecture Retrospective
```

---

## Historial de cambios

| Versión | Sprint | Cambio |
|---------|--------|--------|
| v1.0 | Sprint 3 Closeout | Creación inicial. Documento derivado de migraciones 003–008. |
