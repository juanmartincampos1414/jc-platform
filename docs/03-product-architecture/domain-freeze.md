# Domain Freeze
## JC AI Agency — Contrato Oficial de Dominio

**Estado:** CONGELADO — cualquier cambio requiere ADR  
**Versión:** 1.0  
**Fecha:** Junio 2026  
**Sprint:** 0.9 — Domain Freeze Protocol  

---

> Este documento define el contrato oficial e inamovible de todas las entidades core del sistema.  
> Una vez aprobado, ninguna tabla, ningún campo de API, ningún nombre de evento puede cambiar sin pasar por un ADR.  
> El código debe seguir al dominio. El dominio no sigue al código.

---

## Índice

1. [Validación del modelo](#validación-del-modelo)
2. [Entidades](#entidades)
   - [Workspace](#workspace)
   - [Brand](#brand)
   - [Campaign](#campaign)
   - [Creative](#creative)
   - [Asset](#asset)
   - [Distribution](#distribution)
   - [Performance](#performance)
   - [Insight](#insight)
   - [Recommendation](#recommendation)
   - [Memory](#memory)
   - [Agent](#agent)
   - [Event](#event)
3. [Contratos que no se rompen nunca](#contratos-que-no-se-rompen-nunca)
4. [Diagrama de relaciones](#diagrama-de-relaciones)

---

## Validación del modelo

Antes de definir los contratos, responder las preguntas que el modelo debe resolver.

---

### 1. ¿Campaign sigue siendo el centro del sistema?

**Sí. Campaign es el centro operativo.**

Toda unidad de trabajo tiene una Campaign. No existe un Post, un Creative, un Asset, una Distribution, ni una medición de Performance que no pertenezca a una Campaign.

Una Campaign puede ser tan pequeña como un post único o tan grande como una campaña de lanzamiento de seis meses. El tamaño no cambia el modelo.

La jerarquía es: `Workspace → Brand → Campaign → [todo lo demás]`

---

### 2. ¿Brand es contexto o entidad operativa?

**Brand es las dos cosas. Tiene una naturaleza dual.**

**Brand como contexto:** informa cada Campaign. La voz de la marca, la paleta, la audiencia, las restricciones de comunicación son propiedades de Brand que todos los agentes leen antes de producir cualquier output.

**Brand como entidad operativa:** acumula conocimiento a través del tiempo. Brand Memory se escribe al cierre de cada Campaign. Brand Performance agrega métricas históricas. Brand Knowledge almacena lo que se aprendió.

La distinción práctica: una Campaign sin Brand no puede existir. Una Brand sin Campaigns puede existir (es una Brand recién creada).

---

### 3. ¿Posts deberían existir o convertirse en un tipo de Asset?

**Posts dejan de existir como entidad separada.**

Un Post es un Creative formateado como Asset para distribución en redes sociales. No necesita ser una entidad propia.

La tabla `social_posts` y la tabla `jclaude_posts` **se fusionan** en la entidad `Asset` con `asset_type: 'post'` y en la entidad `Distribution` con `channel: 'instagram' | 'facebook' | etc.`

El modelo correcto:
```
Creative (la idea, el copy, el concepto)
  ↓
Asset (el Creative formateado para un canal específico)
  ↓
Distribution (el acto de publicar el Asset en ese canal)
```

Lo que hoy llamamos "aprobar un post" es aprobar un `Asset`. Lo que hoy llamamos "publicar" es crear una `Distribution` con estado `published`.

**Migración:** los registros existentes en `jclaude_posts` y `social_posts` se migran a `assets` + `distributions`. Ver Plan de Migración en [`sprint-plan-immediate.md`](../10-sprints/sprint-plan-immediate.md).

---

### 4. ¿Ads deberían existir o ser un canal de distribución?

**Ads son Distribution con `distribution_type: 'paid'`.**

La diferencia entre un post orgánico y un ad es el medio de distribución y el modelo de pago. No son entidades conceptualmente distintas.

Un Ad tiene metadata adicional: presupuesto, targeting, bidding strategy, ad account. Esa metadata se guarda en `Distribution.metadata` cuando `distribution_type = 'paid'`.

El módulo de Ads actual (mock) se convierte en la vista de Performance filtrada por `distribution_type: 'paid'`.

---

### 5. ¿Influencers son una entidad o un tipo de Distribution Partner?

**Influencers son una entidad especializada con ciclo de vida propio.**

Un influencer no es simplemente un canal de distribución. Tiene un proceso de selección, negociación, briefing, producción de contenido, revisión, publicación y liquidación que es lo suficientemente complejo como para justificar su propio ciclo de vida.

Pero conceptualmente es un `DistributionPartner` que se asocia a una `Distribution` con `distribution_type: 'influencer'`.

El modelo:
```
Influencer (entidad con lifecycle propio)
  ↓ se asocia a Campaign
  ↓ produce Content (que se trata como Creative → Asset)
  ↓ publica en su canal (que se registra como Distribution con type: 'influencer')
```

**Decisión:** `Influencer` existe como entidad propia en el dominio, pero su output se modela igual que el de cualquier otro canal: Creative → Asset → Distribution.

Para el Domain Freeze: `Influencer` se incluye como sub-entidad de `Distribution` con campos específicos. No tiene contrato propio de entidad core porque su modelo de datos está contenido dentro de `Distribution` + relación con una tabla auxiliar `influencer_partners`.

---

### 6. ¿Memory debe existir desde Sprint 1 aunque esté vacía?

**Sí. Memory debe existir desde Sprint 1.**

Las razones son tres:

**Razón arquitectónica:** si el schema de Memory no existe desde el inicio, todos los agentes que en el futuro deberían escribir a Memory van a necesitar ser refactorizados. Es más barato crear la tabla vacía ahora.

**Razón de contrato:** los agentes de producción (Copy, Image) deben poder consultar Memory desde el primer momento. Si Memory no existe, el agente hace un `try/catch` silencioso. Cuando Memory exista, empieza a funcionar sin cambios de código.

**Razón de datos:** los primeros registros de Memory son los más valiosos. Si activamos Memory en Sprint 3, perdemos el aprendizaje de Sprint 1 y Sprint 2. Si la activamos desde Sprint 1 aunque esté casi vacía, el sistema llega a Sprint 3 con contexto real.

**Implementación:** las tablas de Memory se crean en Sprint 1. Los primeros writes ocurren automáticamente cuando se cierre la primera Campaign formal.

---

### 7. ¿Qué contratos no deberían volver a romperse nunca?

Estos son los invariantes del dominio. Ver sección completa al final de este documento.

---

## Entidades

---

### Workspace

**Propósito**  
Contenedor de aislamiento multi-tenant. Todo dato en el sistema pertenece a un Workspace. No es una entidad de trabajo, es infraestructura de seguridad y organización.

**Responsabilidad**  
- Aislar datos entre clientes  
- Definir el plan de suscripción y sus límites  
- Contener Brands, Users y configuración de integración

**Owner**  
`jc_admin` (JC AIgency) crea y administra Workspaces. Los `client_admin` pueden editar su propio Workspace.

**Lifecycle**
```
created → onboarding → active → suspended → deleted
```
- `created`: registro creado por JC AIgency durante el alta del cliente  
- `onboarding`: Brand Profile incompleto, primer Campaign no iniciada  
- `active`: al menos una Brand configurada y una Campaign iniciada  
- `suspended`: suscripción vencida o pausada  
- `deleted`: soft delete, datos retenidos 90 días

**Estados**  
`onboarding | active | suspended | deleted`

**Relaciones**
- `Workspace` 1 → N `Brand`
- `Workspace` 1 → N `User` (via `workspace_users`)
- `Workspace` 1 → 1 `Subscription`
- `Workspace` 1 → N `Event` (todos los eventos del workspace)

**Eventos emitidos**  
`workspace.created` `workspace.activated` `workspace.suspended` `workspace.deleted`

**Eventos consumidos**  
`subscription.activated` → transición a `active`  
`subscription.cancelled` → transición a `suspended`

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Crear | ✅ | ❌ | ❌ |
| Leer | ✅ | ✅ (propio) | ✅ (propio) |
| Editar | ✅ | ✅ (propio) | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

**Interacciones con IA**  
Ninguna directa. El Workspace es infraestructura. Los agentes operan dentro de un Workspace pero no interactúan con él como entidad.

**Interacciones con Memory**  
`workspace_id` es FK en todas las tablas de Memory. Workspace define el scope de aislamiento de Memory.

**Contrato de API**
```
GET    /api/workspaces/:id           → workspace + brands + subscription status
PATCH  /api/workspaces/:id           → editar name, settings
GET    /api/workspaces/:id/users     → lista de miembros
POST   /api/workspaces/:id/users     → invitar miembro
DELETE /api/workspaces/:id/users/:uid → remover miembro
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.workspaces (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  status          text NOT NULL DEFAULT 'onboarding'
                  CHECK (status IN ('onboarding','active','suspended','deleted')),
  plan            text NOT NULL DEFAULT 'starter'
                  CHECK (plan IN ('starter','pro','enterprise')),
  settings        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
```

**Evolución esperada**  
- Multi-Brand Workspace (una agencia puede tener N marcas en un workspace)  
- Workspace-level analytics (performance agregada de todas las Brands)  
- White-label configuration por Workspace

---

### Brand

**Propósito**  
La identidad permanente de una marca. Brand es el contexto que informa todo lo que el sistema produce. Es la fuente de verdad de quién es la marca, cómo habla, a quién habla y qué quiere lograr.

**Responsabilidad**  
- Mantener el Brand Profile (voz, valores, audiencia, restricciones)  
- Acumular conocimiento via Brand Memory a lo largo del tiempo  
- Proveer contexto a los agentes de IA para producción de contenido  
- Agregar métricas históricas de todas sus Campaigns

**Owner**  
`jc_admin` crea y edita. `client_admin` puede leer y proponer cambios.

**Lifecycle**
```
created → profiling → active → archived
```
- `created`: Brand creada, Brand Profile vacío  
- `profiling`: Brand Profile en proceso de completarse (onboarding)  
- `active`: Brand Profile completo, al menos una Campaign creada  
- `archived`: Brand inactiva, datos preservados

**Estados**  
`created | profiling | active | archived`

**Relaciones**
- `Brand` N → 1 `Workspace`
- `Brand` 1 → N `Campaign`
- `Brand` 1 → 1 `BrandProfile` (embedded en Brand o tabla separada)
- `Brand` 1 → N `Memory` (tipo `brand`)
- `Brand` 1 → N `Influencer` (influencers aprobados para la marca)

**Eventos emitidos**  
`brand.created` `brand.profile_completed` `brand.memory_updated` `brand.archived`

**Eventos consumidos**  
`campaign.closed` → trigger para actualizar Brand Memory  
`performance.analyzed` → trigger para actualizar Brand Performance aggregate

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Crear | ✅ | ❌ | ❌ |
| Leer | ✅ | ✅ | ✅ |
| Editar profile | ✅ | ✅ (con aprobación) | ❌ |
| Ver Memory | ✅ | ✅ | ❌ |
| Archivar | ✅ | ❌ | ❌ |

**Interacciones con IA**  
- **Brand Agent** lee y escribe Brand Profile  
- **Copy Agent** lee Brand Voice antes de cada generación  
- **Image Agent** lee Brand Identity (paleta, estilo visual) antes de cada generación  
- **Learning Agent** escribe a Brand Memory al cierre de cada Campaign  
- **Strategy Agent** lee Brand Performance para recomendar tipo de Campaign

**Interacciones con Memory**  
Brand es el objeto primario de Memory. `brand_id` es FK en todas las entradas de tipo `brand` en la tabla `memories`. Brand Memory es la memoria más importante del sistema.

**Contrato de API**
```
GET    /api/brands/:id               → brand + profile + memory summary
POST   /api/brands                   → crear brand (jc_admin only)
PATCH  /api/brands/:id               → editar name, settings
PUT    /api/brands/:id/profile       → actualizar Brand Profile completo
GET    /api/brands/:id/campaigns     → campaigns de la brand
GET    /api/brands/:id/performance   → métricas agregadas históricas
GET    /api/brands/:id/memory        → Brand Memory entries
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.brands (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL,
  status          text NOT NULL DEFAULT 'created'
                  CHECK (status IN ('created','profiling','active','archived')),
  -- Brand Profile (embedded)
  voice           jsonb NOT NULL DEFAULT '{}',
  -- { tone, style, vocabulary[], avoided_words[], example_copies[] }
  identity        jsonb NOT NULL DEFAULT '{}',
  -- { colors[], fonts[], logo_url, visual_style }
  audience        jsonb NOT NULL DEFAULT '{}',
  -- { primary_demo, secondary_demo, pain_points[], motivations[] }
  restrictions    jsonb NOT NULL DEFAULT '[]',
  -- [{ rule, reason }]
  competitors     jsonb NOT NULL DEFAULT '[]',
  -- [{ name, handle, notes }]
  -- Metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, slug)
);
```

**Evolución esperada**  
- Brand Scoring (score de consistencia de voz a lo largo del tiempo)  
- Multi-Brand comparison (workspace con varias marcas)  
- Brand Health dashboard basado en Memory acumulada

---

### Campaign

**Propósito**  
La unidad de trabajo del sistema. Toda producción, distribución y medición ocurre dentro de una Campaign. Una Campaign tiene un objetivo, un período de tiempo, un presupuesto y un ciclo de vida completo desde el brief hasta el aprendizaje.

**Responsabilidad**  
- Contener el Brief que define qué se quiere lograr  
- Coordinar la producción de Creatives y Assets  
- Gestionar el flujo de aprobación  
- Contener los resultados de Performance  
- Producir Insights y Recommendations al cierre  
- Escribir Learning a Brand Memory

**Owner**  
`jc_admin` crea y opera. `client_admin` aprueba y revisa.

**Lifecycle**
```
draft → brief_approved → in_production → in_review → approved → publishing → active → completed → archived
```
- `draft`: Campaign creada, Brief incompleto  
- `brief_approved`: Brief completo y aprobado por `client_admin`  
- `in_production`: Creatives y Assets generándose  
- `in_review`: Assets enviados al cliente para aprobación  
- `approved`: Todos los Assets aprobados, listos para publicar  
- `publishing`: Assets publicándose (proceso activo)  
- `active`: Campaign publicada, midiendo Performance  
- `completed`: Período finalizado, Performance importada  
- `archived`: Insights y Learning generados, Campaign cerrada formalmente

**Estados**  
`draft | brief_approved | in_production | in_review | approved | publishing | active | completed | archived`

**Relaciones**
- `Campaign` N → 1 `Brand`
- `Campaign` 1 → 1 `Brief` (embedded o separado)
- `Campaign` 1 → N `Creative`
- `Campaign` 1 → N `Asset`
- `Campaign` 1 → N `Distribution`
- `Campaign` 1 → N `Performance`
- `Campaign` 1 → N `Insight`
- `Campaign` 1 → N `Recommendation`
- `Campaign` 1 → N `Memory` (tipo `campaign`)
- `Campaign` 1 → N `Agent` (jobs IA disparados por esta Campaign)

**Eventos emitidos**  
`campaign.created` `campaign.brief_approved` `campaign.production_started`  
`campaign.sent_for_review` `campaign.approved` `campaign.publishing_started`  
`campaign.activated` `campaign.completed` `campaign.closed` `campaign.archived`

**Eventos consumidos**  
`asset.all_approved` → transición a `approved`  
`distribution.all_published` → transición a `active`  
`performance.imported` → trigger para `insight.generate`  
`insight.generated` → trigger para `recommendation.generate`  
`recommendation.generated` → trigger para `learning.write` → transición a `archived`

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Crear | ✅ | ❌ | ❌ |
| Leer | ✅ | ✅ | ✅ |
| Editar brief | ✅ | ✅ (draft only) | ❌ |
| Aprobar brief | ✅ | ✅ | ❌ |
| Cerrar campaign | ✅ | ❌ | ❌ |

**Interacciones con IA**  
- **Campaign Planner Agent** genera el plan de contenidos al aprobar el Brief  
- **Copy Agent** genera Creatives dentro de la Campaign  
- **Image Agent** genera assets visuales  
- **Insights Agent** analiza Performance al completarse  
- **Recommendation Agent** genera recomendaciones a partir de Insights  
- **Learning Agent** escribe a Memory al archivarse

**Interacciones con Memory**  
Al inicio: lee Brand Memory para contextualizar la generación  
Al cierre: escribe Campaign Memory (qué se planeó vs qué pasó) y actualiza Brand Memory

**Contrato de API**
```
GET    /api/campaigns/:id                → campaign completa con resumen de estado
POST   /api/campaigns                    → crear campaign (requiere brand_id)
PATCH  /api/campaigns/:id                → editar name, dates, budget
PUT    /api/campaigns/:id/brief          → actualizar brief completo
POST   /api/campaigns/:id/brief/approve  → aprobar brief (client_admin)
POST   /api/campaigns/:id/close         → cerrar campaign (dispara Learning)
GET    /api/campaigns/:id/assets         → assets de la campaign
GET    /api/campaigns/:id/performance    → performance agregada
GET    /api/campaigns/:id/insights       → insights generados
GET    /api/campaigns/:id/recommendations → recomendaciones
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.campaigns (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES public.brands(id),
  name            text NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN (
                    'draft','brief_approved','in_production','in_review',
                    'approved','publishing','active','completed','archived'
                  )),
  -- Brief (embedded)
  brief           jsonb NOT NULL DEFAULT '{}',
  -- {
  --   objective: text,
  --   kpis: [{ metric, target }],
  --   audience: text,
  --   tone_notes: text,
  --   restrictions: text[],
  --   channels: text[],
  --   approved_at: timestamptz,
  --   approved_by: uuid
  -- }
  -- Scheduling
  starts_at       timestamptz,
  ends_at         timestamptz,
  -- Budget
  budget_total    numeric(12,2),
  budget_currency text NOT NULL DEFAULT 'ARS',
  -- Metadata
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Campaign Templates (reutilizar estructura de campaigns exitosas)  
- Campaign Cloning (clonar con Brief ajustado)  
- Multi-Brand Campaigns (una Campaign que sirve varias Brands)  
- Campaign ROI tracking (vincular inversión con resultado de negocio)

---

### Creative

**Propósito**  
El output intelectual del sistema. Un Creative es la idea, el copy, el guión o el concepto antes de formatearse para un canal específico. Es el primer output tangible del proceso de producción.

**Responsabilidad**  
- Contener el texto, narrativa o concepto generado  
- Registrar el prompt que lo produjo y el modelo que lo ejecutó  
- Mantener historial de versiones  
- Ser la fuente para uno o más Assets

**Owner**  
Generado por IA (con `created_by = agent_id`). Revisado y aprobado por `jc_admin`. Nunca editado directamente por el cliente.

**Lifecycle**
```
generating → draft → revised → approved → deprecated
```
- `generating`: el agente está produciendo el Creative  
- `draft`: generación completada, pendiente de revisión interna  
- `revised`: ajustado por el equipo JC  
- `approved`: listo para convertirse en Assets  
- `deprecated`: reemplazado por una versión más nueva

**Estados**  
`generating | draft | revised | approved | deprecated`

**Relaciones**
- `Creative` N → 1 `Campaign`
- `Creative` 1 → N `Asset` (un Creative puede producir assets para varios canales)
- `Creative` 1 → 1 `Agent` (el job de IA que lo generó)

**Eventos emitidos**  
`creative.generated` `creative.revised` `creative.approved` `creative.deprecated`

**Eventos consumidos**  
`campaign.brief_approved` → trigger para generar Creatives  
`campaign.production_started` → trigger para generación masiva

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver | ✅ | ❌ | ❌ |
| Editar | ✅ | ❌ | ❌ |
| Aprobar | ✅ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

*Nota: el cliente no ve Creatives, solo ve Assets. El Creative es trabajo interno.*

**Interacciones con IA**  
- **Copy Agent** es el productor primario de Creatives de texto  
- **Video Agent** produce Creatives de guión/concepto para video  
- **Brand Agent** valida que el Creative respeta Brand Voice antes de pasar a `approved`

**Interacciones con Memory**  
Al generarse: lee Brand Memory (voice) y Creative Memory (qué tipos de copy funcionaron)  
Al aprobarse y posteriormente al Performance del Asset derivado: escribe a Creative Memory

**Contrato de API**
```
GET    /api/campaigns/:id/creatives         → creatives de la campaign
POST   /api/campaigns/:id/creatives/generate → dispara generación IA
GET    /api/creatives/:id                    → creative + versiones + assets derivados
PATCH  /api/creatives/:id                    → editar contenido (jc_admin)
POST   /api/creatives/:id/approve           → aprobar (jc_admin)
POST   /api/creatives/:id/deprecate         → deprecar versión
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.creatives (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_type   text NOT NULL
                  CHECK (creative_type IN ('copy','script','concept','brief_note')),
  status          text NOT NULL DEFAULT 'generating'
                  CHECK (status IN ('generating','draft','revised','approved','deprecated')),
  content         text NOT NULL,
  -- IA provenance
  prompt          text,
  model           text,
  agent_job_id    uuid REFERENCES public.agent_jobs(id),
  -- Versioning
  version         integer NOT NULL DEFAULT 1,
  parent_id       uuid REFERENCES public.creatives(id),
  -- Metadata
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Creative scoring automático (predecir performance antes de publicar)  
- A/B Creative testing integrado  
- Creative library cross-campaign (reutilizar copies exitosos)

---

### Asset

**Propósito**  
Un Creative formateado para un canal específico. Un Asset es el objeto que el cliente aprueba y que el sistema publica. Puede ser texto + imagen, imagen sola, video, o cualquier combinación que requiera un canal.

**Responsabilidad**  
- Contener el contenido final listo para publicación  
- Gestionar el flujo de aprobación con el cliente  
- Almacenar archivos en Storage (imágenes, videos)  
- Ser la unidad de aprobación y rechazo

**Owner**  
Generado por IA / producido por `jc_admin`. Aprobado por `client_admin`.

**Lifecycle**
```
generating → draft → internal_review → sent_for_approval → approved → rejected → needs_changes → published → archived
```
- `generating`: el agente está produciendo el asset  
- `draft`: listo, pendiente de revisión interna JC  
- `internal_review`: revisado y ajustado por JC antes de enviar al cliente  
- `sent_for_approval`: enviado al cliente para su aprobación  
- `approved`: el cliente aprobó, listo para Distribution  
- `rejected`: el cliente rechazó (con razón documentada)  
- `needs_changes`: el cliente pidió cambios específicos  
- `published`: distribuido al menos en un canal  
- `archived`: retirado del uso activo

**Estados**  
`generating | draft | internal_review | sent_for_approval | approved | rejected | needs_changes | published | archived`

**Relaciones**
- `Asset` N → 1 `Campaign`
- `Asset` N → 1 `Creative` (un Asset deriva de un Creative)
- `Asset` 1 → N `Distribution` (un Asset puede publicarse en varios canales)
- `Asset` 1 → N `Comment` (feedback del cliente)
- `Asset` 1 → N `Performance` (métricas post-publicación)

**Eventos emitidos**  
`asset.generated` `asset.sent_for_approval` `asset.approved`  
`asset.rejected` `asset.changes_requested` `asset.published`

**Eventos consumidos**  
`creative.approved` → trigger para generar Assets derivados  
`distribution.published` → transición a `published`

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver | ✅ | ✅ (si status >= sent_for_approval) | ✅ |
| Aprobar | ✅ | ✅ | ❌ |
| Rechazar | ✅ | ✅ | ❌ |
| Comentar | ✅ | ✅ | ✅ |
| Eliminar | ✅ | ❌ | ❌ |

**Interacciones con IA**  
- **Image Agent** genera el archivo visual del Asset  
- **Video Agent** genera el archivo de video  
- **Copy Agent** puede refinar el copy de un Asset específico  
- **Ads Agent** lee el Asset aprobado para configurar su amplificación paid

**Interacciones con Memory**  
Al aprobarse / rechazarse: el motivo de rechazo se escribe a Brand Memory (es conocimiento valioso)  
Al medir Performance: el resultado se escribe a Creative Memory vinculado al Creative de origen

**Contrato de API**
```
GET    /api/campaigns/:id/assets            → assets de la campaign con estado
POST   /api/campaigns/:id/assets/generate   → generar assets desde Creative aprobado
GET    /api/assets/:id                      → asset + comments + distributions
POST   /api/assets/:id/approve              → aprobar (client_admin)
POST   /api/assets/:id/reject               → rechazar con razón obligatoria
POST   /api/assets/:id/request-changes      → pedir cambios con detalle
GET    /api/assets/:id/comments             → comentarios del asset
POST   /api/assets/:id/comments             → agregar comentario
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.assets (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creative_id     uuid REFERENCES public.creatives(id),
  asset_type      text NOT NULL
                  CHECK (asset_type IN ('post','reel','story','carousel','ad','video','image','document')),
  channel         text NOT NULL
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
  -- Rejection / changes tracking
  rejection_reason text,
  change_requests text,
  -- IA provenance
  agent_job_id    uuid REFERENCES public.agent_jobs(id),
  -- Metadata
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.asset_comments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id    uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id),
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Asset versioning (mantener historial de cambios solicitados por el cliente)  
- Asset templates (formatos reusables por canal y tipo)  
- Bulk approval (aprobar múltiples assets de una vez)

---

### Distribution

**Propósito**  
El acto de publicar un Asset en un canal. Distribution registra cuándo, dónde y cómo se distribuyó un Asset. Es el objeto que conecta la producción con el mundo real.

**Responsabilidad**  
- Gestionar la publicación en canales externos (Meta, etc.)  
- Rastrear el estado de la publicación (scheduled, published, failed)  
- Contener metadata de distribución paid (presupuesto, targeting, bid)  
- Ser el punto de partida para medir Performance

**Owner**  
`jc_admin` programa la Distribution. El sistema la ejecuta automáticamente.

**Lifecycle**
```
scheduled → publishing → published → failed → archived
```
- `scheduled`: programada para publicación futura  
- `publishing`: en proceso de publicación (llamada a API externa activa)  
- `published`: publicada exitosamente, Performance puede empezar a importarse  
- `failed`: falló la publicación (con error documentado)  
- `archived`: retirada del seguimiento activo

**Estados**  
`scheduled | publishing | published | failed | archived`

**Sub-tipos**  
`distribution_type: 'organic' | 'paid' | 'influencer' | 'email' | 'web'`

Metadata adicional por tipo:
- `organic`: sin metadata adicional requerida
- `paid`: `{ budget, targeting, bid_strategy, ad_account_id, ad_id }`
- `influencer`: `{ influencer_partner_id, agreement_url, fee }`
- `email`: `{ list_id, subject, open_rate }`
- `web`: `{ page_url, placement }`

**Relaciones**
- `Distribution` N → 1 `Asset`
- `Distribution` N → 1 `Campaign`
- `Distribution` 1 → N `Performance`

**Eventos emitidos**  
`distribution.scheduled` `distribution.publishing` `distribution.published`  
`distribution.failed` `distribution.archived`

**Eventos consumidos**  
`asset.approved` → puede programarse una Distribution  
`cron.publish_due` → dispara publicación automática

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver | ✅ | ✅ | ✅ |
| Crear | ✅ | ❌ | ❌ |
| Cancelar | ✅ | ❌ | ❌ |

**Interacciones con IA**  
- **Ads Agent** configura Distributions de tipo `paid`  
- **Publishing Agent** ejecuta la Distribution (llamada a Meta Graph API)

**Interacciones con Memory**  
Al publicarse: no escribe a Memory directamente. Performance escribe a Memory cuando llegan métricas.

**Contrato de API**
```
GET    /api/campaigns/:id/distributions   → distributions de la campaign
POST   /api/assets/:id/distributions      → programar publicación de un asset
PATCH  /api/distributions/:id             → editar fecha / metadata
DELETE /api/distributions/:id             → cancelar (solo si status = scheduled)
POST   /api/distributions/:id/retry       → reintentar (solo si status = failed)
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.distributions (
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
  -- Scheduling
  scheduled_at        timestamptz NOT NULL,
  published_at        timestamptz,
  -- External references
  external_id         text,     -- ID del post en la red social
  external_url        text,     -- URL del post publicado
  -- Error tracking
  error_message       text,
  retry_count         integer NOT NULL DEFAULT 0,
  -- Type-specific metadata
  metadata            jsonb NOT NULL DEFAULT '{}',
  -- Metadata
  created_by          uuid REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Cross-posting inteligente (publicar un Asset en múltiples canales con ajuste automático)  
- Distribution scoring (predecir mejor horario de publicación para cada canal)  
- Paid distribution optimization (ajustar presupuesto en tiempo real basado en early performance)

---

### Performance

**Propósito**  
Los resultados reales de una Distribution. Performance registra las métricas importadas de canales externos y las asocia al Asset que las generó y a la Campaign que las originó.

**Responsabilidad**  
- Importar métricas desde APIs externas (Meta Graph API, etc.)  
- Asociar cada métrica al Asset y Distribution correctos  
- Ser la fuente de datos para Insights  
- Actualizar Performance Memory de Brand

**Owner**  
Generado automáticamente por el sistema. No editable por usuarios.

**Lifecycle**
```
pending → importing → imported → analyzed
```
- `pending`: Distribution publicada, Performance aún no importada  
- `importing`: llamada a API externa activa  
- `imported`: métricas cargadas exitosamente  
- `analyzed`: Insights generados a partir de esta Performance

**Estados**  
`pending | importing | imported | analyzed`

**Relaciones**
- `Performance` N → 1 `Distribution`
- `Performance` N → 1 `Asset`
- `Performance` N → 1 `Campaign`
- `Performance` N → 1 `Brand`
- `Performance` 1 → N `Insight` (los Insights se derivan de Performance)

**Eventos emitidos**  
`performance.imported` `performance.analyzed`

**Eventos consumidos**  
`distribution.published` → crear Performance record en estado `pending`  
`cron.import_performance` → trigger para importación de métricas

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver | ✅ | ✅ | ✅ |
| Crear / editar | Sistema only | ❌ | ❌ |

**Interacciones con IA**  
- **Performance Agent** ejecuta la importación y normalización de métricas  
- **Insights Agent** consume Performance para generar Insights

**Interacciones con Memory**  
Al importarse: escribe a Performance Memory (benchmarks históricos de la Brand)

**Contrato de API**
```
GET  /api/campaigns/:id/performance     → performance agregada de la campaign
GET  /api/assets/:id/performance        → performance de un asset específico
GET  /api/brands/:id/performance        → performance histórica agregada de la brand
POST /api/campaigns/:id/performance/import → disparar importación manual
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.performances (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id      uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id       uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  brand_id          uuid NOT NULL REFERENCES public.brands(id),
  distribution_id   uuid NOT NULL REFERENCES public.distributions(id) ON DELETE CASCADE,
  asset_id          uuid NOT NULL REFERENCES public.assets(id),
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','importing','imported','analyzed')),
  -- Core metrics (normalizadas entre canales)
  impressions       bigint NOT NULL DEFAULT 0,
  reach             bigint NOT NULL DEFAULT 0,
  engagements       bigint NOT NULL DEFAULT 0,
  clicks            bigint NOT NULL DEFAULT 0,
  shares            bigint NOT NULL DEFAULT 0,
  saves             bigint NOT NULL DEFAULT 0,
  comments_count    integer NOT NULL DEFAULT 0,
  -- Paid-specific (null si organic)
  spend             numeric(12,2),
  cpm               numeric(10,4),
  cpc               numeric(10,4),
  roas              numeric(10,4),
  conversions       integer,
  -- Raw data from source
  raw_data          jsonb NOT NULL DEFAULT '{}',
  channel           text NOT NULL,
  -- Time window
  period_start      timestamptz NOT NULL,
  period_end        timestamptz NOT NULL,
  -- Metadata
  imported_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Real-time performance (refresh automático cada hora para campaigns activas)  
- Multi-touch attribution (qué combinación de Assets generó un resultado de negocio)  
- Benchmark comparison (comparar contra campaigns previas y promedios del sector)

---

### Insight

**Propósito**  
La interpretación de Performance en lenguaje humano. Un Insight convierte métricas en comprensión. No es un número — es una conclusión.

**Responsabilidad**  
- Traducir datos de Performance en narrativas comprensibles  
- Identificar patrones, anomalías y correlaciones  
- Ser la base para Recommendations  
- Documentar aprendizajes al cierre de Campaign

**Owner**  
Generado por IA. Revisado por `jc_admin`. Visible para `client_admin`.

**Lifecycle**
```
generating → draft → published → archived
```
- `generating`: el Insights Agent está procesando  
- `draft`: generado, pendiente de revisión por JC  
- `published`: visible para el cliente  
- `archived`: superado por insights más recientes

**Estados**  
`generating | draft | published | archived`

**Tipos de insight**  
`type: 'performance' | 'trend' | 'audience' | 'content' | 'competitive' | 'recommendation_trigger'`

**Relaciones**
- `Insight` N → 1 `Campaign`
- `Insight` N → 1 `Brand`
- `Insight` N → N `Performance` (un Insight puede derivar de múltiples registros de Performance)
- `Insight` 1 → N `Recommendation`

**Eventos emitidos**  
`insight.generated` `insight.published`

**Eventos consumidos**  
`performance.imported` → trigger para generar Insights  
`campaign.completed` → trigger para generar Insights de cierre de Campaign

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver | ✅ | ✅ (si published) | ✅ (si published) |
| Editar | ✅ | ❌ | ❌ |
| Publicar | ✅ | ❌ | ❌ |

**Interacciones con IA**  
- **Insights Agent** genera el contenido del Insight a partir de Performance data  
- **Recommendation Agent** lee Insights para generar Recommendations

**Interacciones con Memory**  
Al publicarse: el Insight se escribe a Campaign Memory. Los Insights de cierre de Campaign contribuyen a Brand Memory.

**Contrato de API**
```
GET   /api/campaigns/:id/insights     → insights de la campaign
GET   /api/brands/:id/insights        → insights históricos de la brand
GET   /api/insights/:id               → insight completo con Performance vinculada
POST  /api/campaigns/:id/insights/generate → disparar generación IA manual
PATCH /api/insights/:id/publish       → publicar para el cliente (jc_admin)
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.insights (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id     uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES public.brands(id),
  insight_type    text NOT NULL
                  CHECK (insight_type IN (
                    'performance','trend','audience','content',
                    'competitive','recommendation_trigger'
                  )),
  status          text NOT NULL DEFAULT 'generating'
                  CHECK (status IN ('generating','draft','published','archived')),
  title           text NOT NULL,
  body            text NOT NULL,
  -- Supporting data
  data_points     jsonb NOT NULL DEFAULT '[]',
  -- { metric, value, comparison, period }
  confidence      numeric(3,2),  -- 0.00 to 1.00
  -- IA provenance
  agent_job_id    uuid REFERENCES public.agent_jobs(id),
  model           text,
  -- Metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Insight Digest semanal generado automáticamente  
- Insight cross-brand (patrones que aparecen en múltiples marcas del workspace)  
- Client-facing Insight dashboard con narrativa ejecutiva

---

### Recommendation

**Propósito**  
La traducción de Insights en acciones concretas. Una Recommendation no describe qué pasó — prescribe qué hacer. Es el puente entre el aprendizaje y la siguiente Campaign.

**Responsabilidad**  
- Proponer acciones específicas y medibles basadas en Insights  
- Vincularse a la próxima Campaign cuando sea aceptada  
- Registrar si fue aceptada, rechazada o ignorada  
- Alimentar el ciclo de mejora continua

**Owner**  
Generada por IA. Aceptada o rechazada por `jc_admin` o `client_admin`.

**Lifecycle**
```
generating → pending → accepted → rejected → expired
```
- `generating`: el Recommendation Agent está procesando  
- `pending`: lista para ser considerada  
- `accepted`: se va a implementar en la próxima Campaign  
- `rejected`: descartada con razón  
- `expired`: no fue actioned y el contexto ya no es relevante

**Estados**  
`generating | pending | accepted | rejected | expired`

**Relaciones**
- `Recommendation` N → 1 `Campaign` (la Campaign que la generó)
- `Recommendation` N → N `Insight` (los Insights que la originaron)
- `Recommendation` N → 1 `Campaign` (la Campaign donde se implementará, si accepted)

**Eventos emitidos**  
`recommendation.generated` `recommendation.accepted` `recommendation.rejected`

**Eventos consumidos**  
`insight.generated` → trigger para generar Recommendations  
`campaign.created` → las Recommendations aceptadas se vinculan a la nueva Campaign

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver | ✅ | ✅ | ❌ |
| Aceptar | ✅ | ✅ | ❌ |
| Rechazar | ✅ | ✅ | ❌ |

**Interacciones con IA**  
- **Recommendation Agent** genera el contenido  
- **Strategy Agent** incorpora Recommendations aceptadas al Brief de la próxima Campaign

**Interacciones con Memory**  
Las Recommendations aceptadas se escriben a Decision Memory. Las rechazadas (con razón) también — saber qué NO implementar es tan valioso como saber qué implementar.

**Contrato de API**
```
GET   /api/campaigns/:id/recommendations    → recommendations de la campaign
GET   /api/brands/:id/recommendations       → recommendations históricas
POST  /api/recommendations/:id/accept       → aceptar con campaign_id destino opcional
POST  /api/recommendations/:id/reject       → rechazar con razón obligatoria
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.recommendations (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  source_campaign_id  uuid NOT NULL REFERENCES public.campaigns(id),
  brand_id            uuid NOT NULL REFERENCES public.brands(id),
  status              text NOT NULL DEFAULT 'generating'
                      CHECK (status IN ('generating','pending','accepted','rejected','expired')),
  title               text NOT NULL,
  body                text NOT NULL,
  action_type         text NOT NULL,
  -- 'increase_video' | 'change_posting_time' | 'adjust_tone' |
  -- 'test_new_format' | 'reduce_frequency' | 'expand_channel'
  action_detail       jsonb NOT NULL DEFAULT '{}',
  -- Decision tracking
  decided_by          uuid REFERENCES auth.users(id),
  decided_at          timestamptz,
  decision_reason     text,
  target_campaign_id  uuid REFERENCES public.campaigns(id),
  -- IA provenance
  agent_job_id        uuid REFERENCES public.agent_jobs(id),
  -- Metadata
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Recommendation tracking (medir si aceptar una Recommendation mejoró resultados)  
- Auto-recommendations en Brief (las Recommendations aceptadas se pre-cargan en el Brief de la próxima Campaign)  
- Recommendation portfolio (resumen mensual de qué se recomendó y qué se implementó)

---

### Memory

**Propósito**  
El conocimiento acumulado del sistema. Memory es lo que hace que el sistema mejore con el tiempo. Sin Memory, cada Campaign empieza desde cero. Con Memory, el sistema aprende de cada ciclo.

**Responsabilidad**  
- Persistir aprendizajes de Campaigns completadas  
- Proveer contexto a los agentes de IA  
- Evolucionar con el tiempo sin perder historia  
- Ser la diferencia entre un software con IA y un sistema AI-Native

**Owner**  
Escrita por agentes (especialmente Learning Agent). Leída por todos los agentes de producción. No editable directamente por usuarios.

**Lifecycle**
```
active → deprecated → archived
```
- `active`: disponible para ser leída por agentes  
- `deprecated`: reemplazada por una entrada más reciente o contradictoria  
- `archived`: retenida para historial pero no usada en producción

**Tipos de Memory**

| Tipo | Qué guarda | TTL | Quién escribe | Quién lee |
|---|---|---|---|---|
| `brand` | voz, valores, qué funciona, qué no | permanente | Learning Agent, Brand Agent | todos los agentes |
| `campaign` | qué se planeó vs qué pasó | permanente | eventos de Campaign | Insights, Recommendation |
| `creative` | prompts exitosos, formatos que funcionan | permanente con decay | Performance Agent | Copy, Image |
| `audience` | qué audiencias respondieron mejor | rolling 6 meses | Performance Agent | Strategy, Ads |
| `trend` | tendencias actuales detectadas | rolling 2 semanas | Trending endpoint | Copy, Planner |
| `performance` | benchmarks históricos de la Brand | permanente | Performance Agent | Insights, Strategy |
| `decision` | decisiones tomadas y sus resultados | permanente | Learning Agent | Strategy, Recommendation |
| `knowledge` | notas manuales del equipo JC | permanente | usuario | Brand, Strategy |
| `competitor` | actividad de competidores | rolling 3 meses | feed externo (futuro) | Strategy, Insights |

**Relaciones**
- `Memory` N → 1 `Workspace`
- `Memory` N → 1 `Brand`
- `Memory` N → 0..1 `Campaign` (si es de tipo `campaign`)

**Eventos emitidos**  
`memory.written` `memory.deprecated`

**Eventos consumidos**  
`campaign.archived` → trigger para Learning Agent que escribe Brand Memory  
`creative.approved` + `performance.imported` → trigger para Creative Memory

**Permisos**
| Acción | `jc_admin` | `client_admin` | `client_user` |
|---|---|---|---|
| Ver (summary) | ✅ | ✅ | ❌ |
| Ver (completo) | ✅ | ❌ | ❌ |
| Escribir manualmente | ✅ | ❌ | ❌ |
| Deprecar | ✅ | ❌ | ❌ |

**Interacciones con IA**  
Memory es el repositorio que todos los agentes consultan antes de actuar. Es input universal.  
Learning Agent es el único agente cuya responsabilidad primaria es escribir Memory.

**Contrato de API**
```
GET   /api/brands/:id/memory           → memory activa de la brand (summary)
GET   /api/brands/:id/memory/:type     → memory filtrada por tipo
POST  /api/brands/:id/memory           → escribir entrada manual (jc_admin)
PATCH /api/memory/:id/deprecate        → deprecar entrada
```

**Contrato de Base de Datos**
```sql
CREATE TABLE public.memories (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id    uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_id        uuid NOT NULL REFERENCES public.brands(id),
  campaign_id     uuid REFERENCES public.campaigns(id),  -- null si es memory global de Brand
  memory_type     text NOT NULL
                  CHECK (memory_type IN (
                    'brand','campaign','creative','audience',
                    'trend','performance','decision','knowledge','competitor'
                  )),
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','deprecated','archived')),
  -- Content
  title           text NOT NULL,
  content         text NOT NULL,
  -- Context
  source          text NOT NULL,
  -- 'learning_agent' | 'performance_agent' | 'user' | 'brand_agent'
  confidence      numeric(3,2) NOT NULL DEFAULT 1.00,  -- 0.00 to 1.00
  -- Decay (para tipos con TTL)
  expires_at      timestamptz,
  -- Versioning
  superseded_by   uuid REFERENCES public.memories(id),
  -- Metadata
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_memories_brand_type
  ON public.memories(brand_id, memory_type, status)
  WHERE status = 'active';
```

**Evolución esperada**  
- Memory embeddings (búsqueda semántica sobre Memory para agentes)  
- Memory confidence decay automático (las memorias antiguas pesan menos)  
- Cross-workspace Memory (patrones que aparecen en múltiples clientes — anonimizado)

---

### Agent

**Propósito**  
El registro de cada trabajo de IA ejecutado en el sistema. Un Agent (o `agent_job`) documenta qué agente actuó, sobre qué entidad, con qué input, con qué output, usando qué modelo, con qué costo.

**Responsabilidad**  
- Registrar toda ejecución de IA con trazabilidad completa  
- Proveer audit trail de decisiones tomadas por IA  
- Permitir reproducir cualquier output de IA dado el mismo input  
- Acumular datos de costo y latencia por agente

**Owner**  
Creado automáticamente por el sistema al disparar cualquier tarea de IA. No creado por usuarios.

**Lifecycle**
```
queued → running → completed → failed
```

**Estados**  
`queued | running | completed | failed`

**Tipos de agente**  
`agent_type: 'brand' | 'strategy' | 'campaign_planner' | 'copy' | 'image' | 'video' | 'ads' | 'influencer_fit' | 'performance' | 'insights' | 'recommendation' | 'learning'`

**Relaciones**
- `Agent` N → 1 `Workspace`
- `Agent` N → 0..1 `Campaign`
- `Agent` 1 → 0..1 `Creative` (output)
- `Agent` 1 → 0..1 `Insight` (output)
- `Agent` 1 → 0..1 `Recommendation` (output)
- `Agent` 1 → 0..N `Memory` (output del Learning Agent)

**Eventos emitidos**  
`agent.queued` `agent.started` `agent.completed` `agent.failed`

**Permisos**  
Ningún usuario puede crear o editar Agent jobs directamente. Son read-only para `jc_admin`.

**Contrato de Base de Datos**
```sql
CREATE TABLE public.agent_jobs (
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
  -- Input / Output (immutable once set)
  input           jsonb NOT NULL DEFAULT '{}',
  output          jsonb,
  -- IA provenance
  model           text,
  prompt_version  text,
  -- Cost & performance
  tokens_input    integer,
  tokens_output   integer,
  duration_ms     integer,
  cost_usd        numeric(10,6),
  -- Error
  error_message   text,
  -- Metadata
  triggered_by    uuid REFERENCES auth.users(id),  -- null si automático
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

**Evolución esperada**  
- Agent cost dashboard (cuánto gasta cada agente por workspace)  
- Agent retry con backoff exponencial  
- Agent queuing con prioridades (campaigns activas tienen prioridad sobre drafts)

---

### Event

**Propósito**  
El registro inmutable de todo lo que ocurre en el sistema. Los Events son el tejido conectivo del producto. Permiten observabilidad, automatización, audit trail y el Activity Feed del Command Center.

**Responsabilidad**  
- Registrar toda acción significativa del sistema  
- Ser el trigger para automatizaciones (publicación, notificaciones, learning)  
- Proveer el Activity Feed en tiempo real  
- Ser inmutables — un Event nunca se edita ni se elimina

**Owner**  
Emitidos por el sistema. Nadie crea Events manualmente.

**Invariante crítico**  
> Un Event es inmutable. Nunca se actualiza. Nunca se elimina. Se retiene para siempre.

**Lifecycle**  
`emitted` — único estado. Los Events no tienen lifecycle. Son hechos del pasado.

**Schema del Event**
```typescript
{
  id: uuid,
  workspace_id: uuid,
  event: string,           // 'campaign.created', 'asset.approved', etc.
  entity_type: string,     // 'campaign', 'asset', 'distribution', etc.
  entity_id: uuid,
  actor_id: uuid | null,   // null si fue el sistema
  actor_type: 'user' | 'agent' | 'system',
  metadata: Record<string, unknown>,
  created_at: timestamptz
}
```

**Catálogo oficial de eventos**

| Dominio | Evento |
|---|---|
| Workspace | `workspace.created` `workspace.activated` `workspace.suspended` |
| Brand | `brand.created` `brand.profile_completed` `brand.memory_updated` |
| Campaign | `campaign.created` `campaign.brief_approved` `campaign.production_started` `campaign.sent_for_review` `campaign.approved` `campaign.activated` `campaign.completed` `campaign.closed` |
| Creative | `creative.generated` `creative.approved` `creative.deprecated` |
| Asset | `asset.generated` `asset.sent_for_approval` `asset.approved` `asset.rejected` `asset.changes_requested` `asset.published` |
| Distribution | `distribution.scheduled` `distribution.published` `distribution.failed` |
| Performance | `performance.imported` `performance.analyzed` |
| Insight | `insight.generated` `insight.published` |
| Recommendation | `recommendation.generated` `recommendation.accepted` `recommendation.rejected` |
| Memory | `memory.written` `memory.deprecated` |
| Agent | `agent.started` `agent.completed` `agent.failed` |
| Subscription | `subscription.activated` `subscription.renewed` `subscription.cancelled` |
| Team | `team.member_added` `team.member_removed` |
| Social | `social_account.connected` `social_account.disconnected` |
| Legal | `document.sent` `document.signed` |

**Contrato de Base de Datos**  
*(nota: `activity_logs` creada en Sprint 0 es la implementación de esta entidad — migrar schema a este contrato)*
```sql
CREATE TABLE public.events (
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

CREATE INDEX idx_events_workspace_time
  ON public.events(workspace_id, created_at DESC);

CREATE INDEX idx_events_entity
  ON public.events(entity_type, entity_id);
```

**Evolución esperada**  
- Event streaming (webhooks para integraciones externas)  
- Event replay (reproducir el estado del sistema en cualquier momento del pasado)  
- Event-driven automations (reglas tipo "cuando asset.approved → si Campaign tiene todos aprobados → campaign.approved automático")

---

## Contratos que no se rompen nunca

Estos son los invariantes del dominio. Cualquier código que los viole es incorrecto, sin importar la urgencia.

### Invariante 1 — Jerarquía de pertenencia

```
Workspace → Brand → Campaign → [Creative | Asset | Distribution | Performance | Insight | Recommendation]
```

Ninguna entidad de trabajo existe fuera de una Campaign. Ninguna Campaign existe fuera de una Brand. Ninguna Brand existe fuera de un Workspace.

**Consecuencia:** toda tabla de trabajo tiene `workspace_id` Y `campaign_id` como foreign keys. Si falta uno de los dos, el schema está mal.

### Invariante 2 — Flujo de trabajo es unidireccional

```
Creative → Asset → Distribution → Performance → Insight → Recommendation → Memory
```

El flujo solo va en una dirección. Un Asset no puede actualizar un Creative. Una Distribution no puede modificar un Asset ya aprobado. La Performance no puede cambiar el estado de una Distribution.

**Consecuencia:** los estados de cada entidad solo avanzan. No retroceden. Si un Asset rechazado necesita volver a `draft`, se crea una nueva versión — no se modifica el existente.

### Invariante 3 — IA no decide sola

Todo output de IA pasa por al menos un estado de revisión antes de ser visible para el cliente.

`generating → draft` (revisión interna JC) → `sent_for_approval` (visible para cliente)

Nunca: `generating → sent_for_approval`

**Consecuencia:** ningún endpoint de generación IA retorna un asset directamente al cliente. Siempre crea en estado `draft`.

### Invariante 4 — Memory es inmutable en su contenido

Una entrada de Memory no se edita. Si hay nueva información, se crea una nueva entrada y la anterior se marca `deprecated` con referencia a la nueva.

**Consecuencia:** `UPDATE memories SET content = ...` no existe. Solo `INSERT` y `UPDATE memories SET status = 'deprecated', superseded_by = :new_id`.

### Invariante 5 — Events son inmutables

Un Event emitido no se actualiza ni se elimina. Nunca.

**Consecuencia:** no existe `UPDATE events` ni `DELETE events` en ningún lugar del código. Si se necesita corregir un Event incorrecto, se emite un nuevo Event de corrección.

### Invariante 6 — workspace_id viaja con todo

Toda query a la base de datos que devuelve datos de trabajo incluye `WHERE workspace_id = :id`. No existe una query que devuelva datos de múltiples workspaces mezclados (excepto en el panel de admin de JC AIgency).

**Consecuencia:** RLS en Supabase respalda este invariante. Si RLS no puede cubrir un caso, la query de la API debe filtrarlo explícitamente.

### Invariante 7 — rejection_reason es obligatorio al rechazar

Cuando un Asset pasa a `rejected` o `needs_changes`, el campo `rejection_reason` es obligatorio. No puede estar vacío.

**Consecuencia:** el endpoint de rechazo retorna 400 si no viene `rejection_reason`. El motivo del rechazo es conocimiento de marca — es el dato más valioso que puede capturar el sistema.

### Invariante 8 — Agentes no escriben directamente a Assets ni a Campaigns

Los agentes de IA escriben a `Creatives` y `Agent Jobs`. La promoción de un Creative a Asset es una acción humana (equipo JC) o una acción del sistema con validación explícita.

**Consecuencia:** ningún agente llama a `UPDATE assets SET status = 'approved'`. Solo puede llamar a `INSERT creatives` o `UPDATE agent_jobs`.

---

## Diagrama de relaciones

```
Workspace
  │
  ├── Brand ──────────────────────── Memory (type: brand, knowledge, competitor)
  │     │
  │     └── Campaign ────────────── Memory (type: campaign, decision)
  │           │
  │           ├── Creative ─────── Agent Job (type: copy, video)
  │           │     │
  │           │     └── Asset ──── Agent Job (type: image)
  │           │           │
  │           │           ├── Asset Comments
  │           │           │
  │           │           └── Distribution ── Memory (type: trend, audience)
  │           │                 │
  │           │                 └── Performance ─── Memory (type: performance, creative)
  │           │                       │
  │           │                       └── Insight ── Agent Job (type: insights)
  │           │                             │
  │           │                             └── Recommendation ── Agent Job (type: recommendation)
  │           │                                   │
  │           │                                   └── Memory (type: decision) [via Learning Agent]
  │           │                                         │
  │           │                                         └──────────────► Brand Memory
  │           │                                                           [el ciclo cierra]
  │           └── Agent Jobs (todos los jobs de la campaign)
  │
  ├── Users (workspace_users)
  ├── Subscription
  ├── Legal Documents
  └── Events (todo lo que ocurre en el workspace)
```

---

*Domain Freeze — v1.0*  
*Aprobado en Sprint 0.9*  
*Próximo cambio requiere ADR*  
*JC AI Agency × RUN72 OS — Junio 2026*
