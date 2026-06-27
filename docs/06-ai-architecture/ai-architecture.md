# AI Architecture
## JC AI Agency · JClaude System
**Versión:** 0.1 · Junio 2026

---

> JClaude hoy es un generador. El objetivo es convertirlo en un sistema de agentes especializados donde cada agente tiene una responsabilidad clara, datos de entrada definidos, outputs trazables y memoria persistente.

---

## Estado actual vs. objetivo

### Hoy
```
JClaude
  └── generate-month (un prompt monolítico → 12 posts de una vez)
  └── generate-image (un call a fal.ai por post)
  └── ads-analysis (un prompt con datos mock)
  └── influencer-fit (un prompt con datos mock)
  └── social-copy (un prompt simple)
```

### Objetivo (v0.4 AI Brain)
```
JClaude — AI Marketing Brain
  ├── Brand Agent          (conoce y actualiza la marca)
  ├── Strategy Agent       (define objetivos y audiencias)
  ├── Campaign Planner     (estructura campañas y calendarios)
  ├── Copy Agent           (genera copies en el tono de la marca)
  ├── Image Agent          (genera imágenes via fal.ai)
  ├── Video Agent          (genera videos via Seedance)
  ├── Ads Agent            (analiza y recomienda en paid media)
  ├── Influencer Fit Agent (evalúa fit de influencers)
  ├── Insights Agent       (interpreta métricas de performance)
  ├── Recommendation Agent (sugiere acciones concretas)
  ├── Publishing Agent     (orquesta publicación automática)
  └── Learning Agent       (actualiza memorias del sistema)
```

---

## Agentes (especificación)

---

### Brand Agent

```
Agente: Brand Agent
Qué hace: Mantiene actualizado el perfil de marca. Detecta inconsistencias. Enriquece el perfil desde interacciones previas.
Inputs:
  - jclaude_profiles (brand_name, industry, tone, target_audience, key_messages)
  - brand_memories (aprendizajes previos)
  - Historial de aprobaciones (qué aprobó/rechazó este cliente)
Outputs:
  - Brand context enriquecido (para alimentar otros agentes)
  - Actualizaciones de brand_memories
Modelo: claude-sonnet-4-6
Prompt: /docs/06-ai-architecture/prompts/brand-agent.md
Datos que necesita: jclaude_profiles, brand_memories, jclaude_posts (historial aprobados)
Tablas que lee: jclaude_profiles, brand_memories
Tablas que escribe: brand_memories
Fallbacks: Si no hay brand profile, pedir configuración antes de continuar
Riesgos: Puede sobre-escribir memorias válidas si no hay versioning
Costo estimado: Llamada pequeña (~500 tokens), pocas veces por mes
Trazabilidad: ai_jobs con agent: 'brand'
Estado actual: No existe como agente — la lógica está embebida en generate-month
```

---

### Campaign Planner Agent

```
Agente: Campaign Planner Agent
Qué hace: A partir de un brief de campaña y el brand context, estructura un calendario de contenido con distribución de posts, redes, tipos y horarios óptimos.
Inputs:
  - CampaignBrief (objetivo, audiencia, fechas, budget, canales)
  - Brand context (del Brand Agent)
  - brand_memories (qué funcionó en campañas anteriores)
  - Suscripción (posts_limit, networks_limit)
Outputs:
  - Plan de posts: [ { date, time, network, post_type, content_angle, objective } ]
  - Estimación de presupuesto de contenido
Modelo: claude-sonnet-4-6
Prompt: /docs/06-ai-architecture/prompts/campaign-planner-agent.md
Datos que necesita: campaign_briefs, jclaude_profiles, brand_memories, jclaude_subscriptions
Tablas que lee: campaign_briefs, jclaude_profiles, brand_memories, jclaude_subscriptions
Tablas que escribe: (el output alimenta al Copy Agent, no escribe directamente)
Fallbacks: Si no hay brief, usar brand profile + mes actual + distribución estándar
Costo estimado: ~2000 tokens por campaña
Trazabilidad: ai_jobs con agent: 'campaign_planner'
Estado actual: Lógica embebida en generate-month sin distinción de agente
```

---

### Copy Agent

```
Agente: Copy Agent
Qué hace: Genera el copy de cada post del calendario. Cada copy respeta el tono de marca, es específico al tipo de post y la red social, y no supera el límite de caracteres.
Inputs:
  - Plan de posts (del Campaign Planner)
  - Brand context (tone, key_messages, target_audience)
  - brand_memories (patrones de copy que funcionaron)
  - Restricciones: max chars, hashtags limit, idioma
Outputs:
  - Por post: { copy, hashtags, image_brief }
Modelo: claude-sonnet-4-6
Prompt: /docs/06-ai-architecture/prompts/copy-agent.md
Tablas que lee: jclaude_profiles, brand_memories
Tablas que escribe: jclaude_posts (copy, hashtags, image_brief)
Fallbacks: Si el copy supera límite, truncar elegantemente (no cortar a la mitad)
Riesgos: Repetición de ideas entre posts del mismo mes — necesita deduplicación
Costo estimado: ~100-200 tokens por post × 12 posts = ~2000 tokens por mes
Trazabilidad: ai_jobs con agent: 'copy', linked a post_id
Estado actual: Embebido en generate-month (genera todos de una sola vez)
```

---

### Image Agent

```
Agente: Image Agent
Qué hace: A partir del image_brief del post, genera una imagen de marketing de alta calidad y la guarda en Supabase Storage.
Inputs:
  - image_brief (descripción de la imagen)
  - network (para definir aspect ratio)
  - brand context (colores, estilo visual — futuro)
Outputs:
  - image_url (URL permanente en Supabase Storage)
  - prompt_used (para trazabilidad)
Modelo: fal-ai/flux/schnell (generación rápida) → futuro: flux/pro (mayor calidad)
API: fal.ai
Datos que necesita: post.image_brief, post.network
Tablas que lee: jclaude_posts
Tablas que escribe: jclaude_posts (image_url), assets (nueva tabla)
Fallbacks: Si fal.ai falla, reintentar una vez. Si sigue fallando, dejar image_url null y avisar.
Riesgos: URLs temporales de fal.ai CDN (expiran) — RESOLVER en Sprint 0 con Storage
Costo estimado: ~$0.003 USD por imagen (Flux Schnell)
Trazabilidad: ai_jobs con agent: 'image', linked a post_id
Estado actual: ✅ Funciona pero guarda URL temporal, no en Storage
```

---

### Video Agent

```
Agente: Video Agent
Qué hace: A partir del image_brief y copy del post (tipo Reel), genera un video corto usando Seedance y lo guarda en Supabase Storage.
Inputs:
  - image_brief o video_brief (descripción del video)
  - copy del post (puede usarse como voz en off o subtítulo)
  - network y post_type (para definir aspect ratio: 9:16 para Reels)
Outputs:
  - video_url (URL permanente en Supabase Storage)
  - thumbnail_url (frame del video para preview)
Modelo: Seedance (vía fal.ai como fal-ai/seedance-1-lite o similar)
API: fal.ai
Tablas que lee: jclaude_posts
Tablas que escribe: jclaude_posts (video_url), assets
Fallbacks: Si falla Seedance, ofrecer imagen estática como fallback
Riesgos: Videos pueden ser rechazados por la IA de contenido de Seedance
Costo estimado: Por definir (Seedance es más caro que imagen)
Trazabilidad: ai_jobs con agent: 'video'
Estado actual: ❌ No implementado — pendiente Sprint 1
```

---

### Ads Agent

```
Agente: Ads Agent
Qué hace: Analiza métricas de performance de ads y genera insights y recomendaciones concretas.
Inputs:
  - performance_snapshots (métricas reales — pendiente)
  - campaign_briefs (objetivos originales)
  - brand context
Outputs:
  - { summary, score, highlights[], warnings[], recommendations[] }
Modelo: claude-sonnet-4-6
Tablas que lee: performance_snapshots (pendiente), campaigns, ad_accounts
Tablas que escribe: insights, recommendations (pendiente)
Costo estimado: ~1500 tokens por análisis
Estado actual: ⚠️ Existe (/api/ai/ads-analysis) pero recibe datos mock, no de DB real
```

---

### Influencer Fit Agent

```
Agente: Influencer Fit Agent
Qué hace: Evalúa el fit de un influencer con la marca basándose en categoría, audiencia, engagement y valores.
Inputs:
  - Perfil del influencer (followers, engagement, category, handle)
  - Brand context (target_audience, key_messages, industry)
Outputs:
  - { fit_score (1-10), strengths[], risks[], recommendation: 'approve' | 'reject' | 'consider' }
Modelo: claude-sonnet-4-6
Estado actual: ⚠️ Existe (/api/ai/influencer-fit) pero recibe datos mock
```

---

### Insights Agent

```
Agente: Insights Agent
Qué hace: Procesa datos de performance de posts publicados y genera observaciones sobre qué funciona y qué no.
Inputs: performance_snapshots por post
Outputs: insights[]
Modelo: claude-sonnet-4-6
Estado actual: ❌ No implementado
```

---

### Recommendation Agent

```
Agente: Recommendation Agent
Qué hace: A partir de insights, genera recomendaciones priorizadas con acciones concretas e impacto esperado.
Inputs: insights[], brand_memories[], campaign history
Outputs: recommendations[] con prioridad y acción específica
Modelo: claude-sonnet-4-6
Estado actual: ❌ No implementado
```

---

### Learning Agent

```
Agente: Learning Agent
Qué hace: Después de cada publicación y medición, actualiza las brand_memories con los patrones aprendidos.
Cuándo corre: Post publicación (en cron) + post análisis de insights
Inputs: Posts publicados + métricas + historial de aprobaciones
Outputs: Actualizaciones en brand_memories
Modelo: claude-haiku-4-5 (tarea simple, más barato)
Estado actual: ❌ No implementado
```

---

## Stack de IA

| Tarea | Modelo | Proveedor | Costo aprox. |
|---|---|---|---|
| Generación de calendarios | claude-sonnet-4-6 | Anthropic | ~$0.01/mes/workspace |
| Análisis de ads | claude-sonnet-4-6 | Anthropic | ~$0.005/análisis |
| Generación de imágenes | flux/schnell | fal.ai | ~$0.003/imagen |
| Generación de videos | seedance-1-lite | fal.ai | por definir |
| Learning Agent | claude-haiku-4-5 | Anthropic | ~$0.001/run |

---

## Tabla `ai_jobs` (a crear en Sprint 1)

```sql
create table public.ai_jobs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  agent text not null,
  prompt_version_id uuid, -- referencias a jclaude_prompts
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
```

---

*Documento vive en `/docs/06-ai-architecture/ai-architecture.md`*
