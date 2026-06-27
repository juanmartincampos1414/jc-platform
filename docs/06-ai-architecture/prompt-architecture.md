# Prompt Architecture
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

## El problema actual

Los prompts de JC AI Agency hoy están hardcodeados en el código:

| Prompt | Ubicación actual | Problema |
|---|---|---|
| Generar calendario mensual | `src/app/api/jclaude/generate-month/route.ts` líneas 40-53 | No versionable, requiere deploy para cambiar |
| Análisis de ads | `src/app/api/ai/ads-analysis/route.ts` | Ídem |
| Fit de influencer | `src/app/api/ai/influencer-fit/route.ts` | Ídem |
| Sugerencia de copy | `src/app/api/ai/social-copy/route.ts` | Ídem |

Esto significa que:
- Para mejorar un prompt hay que cambiar código y hacer deploy
- No hay historial de versiones de prompts
- No se puede saber si un cambio de prompt mejoró o empeoró la calidad
- No se puede hacer A/B testing de prompts
- No hay trazabilidad de qué versión de prompt generó cada output

---

## La solución: Prompt DB

### Tabla `jclaude_prompts`

```sql
create table public.jclaude_prompts (
  id uuid primary key default uuid_generate_v4(),
  agent text not null,      -- 'calendar', 'copy', 'image', 'ads_analysis', 'influencer_fit', 'social_copy'
  name text not null,       -- nombre descriptivo
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'active', 'deprecated')),
  system_prompt text,       -- instrucciones del sistema
  user_prompt_template text not null,  -- template con variables {{brand_name}}, {{industry}}, etc.
  output_schema jsonb,      -- JSON Schema esperado del output
  model text not null default 'claude-sonnet-4-6',
  temperature numeric(3,2) default 0.7,
  max_tokens integer default 4096,
  notes text,               -- por qué se cambió desde la versión anterior
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(agent, version)
);
```

### Reglas de la tabla

1. Solo un prompt por agent puede tener `status = 'active'` a la vez.
2. Al activar un nuevo prompt, el anterior pasa a `'deprecated'` automáticamente.
3. Nunca se eliminan prompts — solo se deprecan (historial completo).
4. El campo `notes` explica el motivo del cambio de versión.

---

## Prompts actuales — audit

### Prompt 1: Calendar / generate-month

**Agente:** `calendar`  
**Versión actual:** v1 (hardcodeada)  
**Modelo:** claude-sonnet-4-6  
**Max tokens:** 4096  
**Temperatura:** default

**Template actual (extraído del código):**
```
Creá un calendario de contenido para {{monthName}} {{year}} para una marca argentina.

MARCA: {{brand_name}} | Rubro: {{industry}} | Tono: {{tone}} | Audiencia: {{target_audience}}

REGLAS:
- Exactamente {{postsLimit}} posts distribuidos en el mes (días 1 al {{daysInMonth}})
- Redes: {{networksAvailable}}
- Tipos: post, reel, story
- Horarios: 09:00, 12:00, 18:00 o 20:00
- Copy máximo 150 caracteres por post
- Hashtags: máximo 8

Respondé ÚNICAMENTE con este JSON, sin texto adicional, sin markdown:
{"posts":[{"date":"{{year}}-{{month}}-01","time":"09:00","network":"instagram","post_type":"post","copy":"texto del post","hashtags":"#hash1 #hash2","image_brief":"descripción imagen"}]}
```

**Variables:** `monthName`, `year`, `brand_name`, `industry`, `tone`, `target_audience`, `postsLimit`, `daysInMonth`, `networksAvailable`, `month`

**Output schema:**
```json
{
  "posts": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "network": "instagram|facebook",
      "post_type": "post|reel|story",
      "copy": "string (max 150 chars)",
      "hashtags": "string (max 8 hashtags)",
      "image_brief": "string"
    }
  ]
}
```

**Problemas conocidos:**
- Claude ignora "sin markdown" y a veces devuelve fences (3-tier parsing como workaround)
- El límite de 12 posts es técnico (timeout), no del prompt
- No incluye key_messages del brand profile
- No considera performance histórica

**Mejoras propuestas para v2:**
- Agregar key_messages como contexto
- Pedir que los posts sean variados (no repetir el mismo ángulo dos veces)
- Incluir un sistema prompt de rol más claro
- Solicitar output JSON con marcador explícito `<JSON>` para facilitar parsing

---

### Prompt 2: Ads Analysis

**Agente:** `ads_analysis`  
**Modelo:** claude-sonnet-4-6  
**Max tokens:** 1500

**Template actual:**
```
Sos un experto en performance marketing y media buying. Analizá los siguientes resultados publicitarios y dá recomendaciones concretas.

Plataforma: {{platform}}
Período: {{month}}
Presupuesto aprobado: ${{budget.approved}}
Presupuesto ejecutado: ${{budget.executed}}

Métricas generales:
- Impresiones: {{metrics.impressions}}
- Clics: {{metrics.clicks}}
- CTR: {{metrics.ctr}}%
- Conversiones: {{metrics.conversions}}
- CPA: ${{metrics.cpa}}
- ROAS: {{metrics.roas}}x

Campañas activas:
{{campaigns_list}}

Respondé en formato JSON con esta estructura exacta: { "summary": "...", "score": 1-10, "highlights": [], "warnings": [], "recommendations": [] }
```

**Problemas conocidos:**
- Recibe datos mock, no reales — el análisis es ficticio
- Sin validación del output (si Claude devuelve algo inesperado, falla silenciosamente)

---

### Prompt 3: Influencer Fit

**Agente:** `influencer_fit`  
**Template:** Similar estructura — analiza perfil de influencer vs. marca

---

### Prompt 4: Social Copy

**Agente:** `social_copy`  
**Template:** Genera variante de copy para un post dado

---

## Sistema de variables del template

Los templates usan `{{variable}}` como marcador. Al ejecutar, se reemplazan con valores reales:

```typescript
function renderPrompt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`)
}
```

---

## Flujo de carga de prompts (Sprint 1)

```typescript
// En generate-month/route.ts (post-Sprint 1)
async function getActivePrompt(agent: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jclaude_prompts')
    .select('*')
    .eq('agent', agent)
    .eq('status', 'active')
    .single()
  return data
}

const prompt = await getActivePrompt('calendar')
const userMessage = renderPrompt(prompt.user_prompt_template, {
  monthName, year, brand_name, ...
})
```

---

## Estrategia de versionado

### Cuándo incrementar versión
- Cambio en el template que afecta el output
- Cambio de modelo
- Cambio en output schema
- Corrección de un problema recurrente

### Cuándo NO incrementar versión
- Corrección de typo menor que no afecta comportamiento
- Cambio de `notes` o comentarios internos

### Proceso de cambio de prompt
1. Crear nueva entrada con `version = current + 1` y `status = 'draft'`
2. Testear manualmente con 3-5 casos
3. Si el output mejora → cambiar a `status = 'active'` (el anterior pasa a `deprecated`)
4. Documentar en `notes` qué mejoró y por qué

---

## Calidad de outputs — métricas futuras

Cuando tengamos suficientes datos:
- **Tasa de aprobación:** % de posts generados que el cliente aprueba
- **Tasa de needs_changes:** % que requiere cambios
- **Tasa de rechazo:** % que el cliente rechaza
- **Variación entre runs:** similitud de posts generados en distintos meses

Estos datos viviran en `ai_jobs` y se compararán por `prompt_version_id`.

---

*Documento vive en `/docs/06-ai-architecture/prompt-architecture.md`*
