# Memory Model
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

> La memoria es lo que convierte JClaude de un generador genérico en un sistema que aprende de cada cliente. Sin memoria, cada generación empieza de cero. Con memoria, cada generación es mejor que la anterior.

---

## Por qué existe la memoria

Hoy JClaude genera contenido basándose solo en el brand profile estático. No sabe:
- Qué posts aprobó o rechazó el cliente el mes pasado
- Qué horarios funcionan mejor para su audiencia
- Qué tipo de copy genera más engagement
- Qué ángulos el cliente siempre rechaza
- Qué tono particular le gusta al cliente aunque el brand profile diga "profesional"

La memoria resuelve esto.

---

## Tipos de memoria

---

### Brand Memory

```
Tipo de memoria: Brand Memory
Qué guarda: Conocimiento acumulado sobre la identidad, voz y preferencias de la marca.
Ejemplos:
  - "El cliente siempre rechaza posts que usan precio en el copy"
  - "El tono real es más informal de lo que dice el perfil — usa 'vos' no 'usted'"
  - "Los emojis de comida funcionan bien para esta marca de gastronomía"
  - "Los posts con pregunta al final tienen mejor engagement"
Cómo se crea: Manual (brand profile) + automática (aprendizaje de aprobaciones)
Quién la actualiza: Learning Agent + client_admin (manual)
Quién la consume: Copy Agent, Campaign Planner, Brand Agent
Dónde vive: DB → brand_memories (type: 'brand')
Cuándo expira: Nunca (pero puede marcarse como 'outdated' si el cliente actualiza su perfil)
Cómo se versiona: Cada entrada tiene created_at, updated_at y confidence
```

---

### Campaign Memory

```
Tipo de memoria: Campaign Memory
Qué guarda: Lo aprendido de campañas anteriores — qué funcionó, qué no, qué el cliente repite.
Ejemplos:
  - "La campaña de verano 2025 tuvo ROAS 4.8x — el ángulo de 'sustentabilidad' fue el diferencial"
  - "Los posts de martes 18:00 superaron siempre a los de lunes en 40% de engagement"
  - "El cliente siempre aprueba primero los Reels y último los Stories"
Cómo se crea: Automática post-campaign (Learning Agent analiza resultados)
Quién la actualiza: Learning Agent
Quién la consume: Campaign Planner Agent, Strategy Agent
Dónde vive: DB → brand_memories (type: 'campaign')
Cuándo expira: Después de 12 meses (contexto viejo)
```

---

### Audience Memory

```
Tipo de memoria: Audience Memory
Qué guarda: Patrones de comportamiento de la audiencia de la marca.
Ejemplos:
  - "La audiencia es más activa los martes y jueves entre 18:00 y 21:00"
  - "El 70% de las conversiones vienen de contenido de carrusel"
  - "Los videos de menos de 30 segundos tienen más completion rate"
Cómo se crea: Automática desde performance_snapshots (cuando tengamos datos reales)
Quién la actualiza: Learning Agent
Quién la consume: Campaign Planner Agent, Publishing Agent (para horarios óptimos)
Dónde vive: DB → brand_memories (type: 'audience')
```

---

### Approval Pattern Memory

```
Tipo de memoria: Approval Pattern Memory
Qué guarda: Patrones de aprobación del cliente — qué aprueba rápido, qué siempre cambia, qué rechaza.
Ejemplos:
  - "El cliente aprueba el 90% de los posts de Instagram pero rechaza el 60% de los de Facebook"
  - "Los posts con precio en el copy siempre van a 'needs_changes'"
  - "El cliente tarda más de 48h en aprobar si el texto es más de 100 caracteres"
Cómo se crea: Automática al analizar historial de aprobaciones
Quién la actualiza: Learning Agent (runs mensual)
Quién la consume: Copy Agent (para evitar patrones rechazados), Campaign Planner (para priorizar redes)
Dónde vive: DB → brand_memories (type: 'approval_pattern')
```

---

### Performance Memory

```
Tipo de memoria: Performance Memory
Qué guarda: Benchmarks de performance por red, tipo de contenido y categoría.
Ejemplos:
  - "CTR promedio de esta marca en Meta: 2.3% (vs. benchmark industria: 1.5%)"
  - "CPA histórico Q1 2026: $450 ARS"
  - "Mejor ROAS logrado: 6.2x (campaña retargeting mayo 2026)"
Cómo se crea: Automática desde performance_snapshots
Quién la actualiza: Learning Agent
Quién la consume: Ads Agent, Insights Agent, Recommendation Agent
Dónde vive: DB → brand_memories (type: 'performance')
```

---

### Decision Memory

```
Tipo de memoria: Decision Memory
Qué guarda: Decisiones estratégicas tomadas por el cliente que afectan futuras generaciones.
Ejemplos:
  - "El cliente decidió no publicar en TikTok hasta tener video propio"
  - "No usar el precio en ninguna comunicación hasta que termine el rebranding"
  - "Solo publicar de lunes a viernes — no fines de semana"
Cómo se crea: Manual — JC Admin o client_admin agrega notas estratégicas
Quién la actualiza: jc_admin, client_admin
Quién la consume: Todos los agentes (es restricción global)
Dónde vive: DB → brand_memories (type: 'decision')
Cuándo expira: Configurado manualmente (puede tener expires_at)
```

---

## Schema de la tabla `brand_memories`

```sql
create table public.brand_memories (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references public.workspaces(id) on delete cascade not null,
  type text not null check (type in ('brand', 'campaign', 'audience', 'approval_pattern', 'performance', 'decision', 'competitor')),
  key text not null,                    -- identificador corto: 'preferred_tone', 'best_posting_time'
  value text not null,                  -- el conocimiento en sí, en lenguaje natural
  confidence numeric(3,2) default 0.7, -- 0.0 a 1.0
  source text not null check (source in ('ai_generated', 'human_input', 'performance_data')),
  source_id uuid,                       -- ai_job_id, post_id, etc.
  expires_at timestamptz,              -- null = no expira
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index para búsqueda por workspace y tipo
create index idx_brand_memories_workspace_type on public.brand_memories(workspace_id, type);
```

---

## Cómo se inyecta la memoria en los prompts

Cuando el Copy Agent o Campaign Planner necesita generar contenido, primero consulta la memoria relevante:

```typescript
async function getBrandContext(workspaceId: string) {
  const supabase = await createClient()
  
  const { data: memories } = await supabase
    .from('brand_memories')
    .select('type, key, value, confidence')
    .eq('workspace_id', workspaceId)
    .gt('confidence', 0.5)
    .order('confidence', { ascending: false })
    .limit(20)  // top 20 memorias más confiables

  return memories?.map(m => `[${m.type.toUpperCase()}] ${m.key}: ${m.value}`).join('\n')
}
```

Esto se inyecta en el prompt como:
```
CONTEXTO HISTÓRICO DE LA MARCA:
[BRAND] preferred_tone: El cliente prefiere un tono más informal de lo configurado. Usar "vos" siempre.
[APPROVAL_PATTERN] rejected_content: Los posts con precio explícito siempre son rechazados.
[AUDIENCE] best_time: Los martes y jueves a las 18:00 tienen 40% más engagement.
```

---

## Cuándo se actualiza la memoria

### Automático — después de cada aprobación/rechazo
```
PostApproved → Learning Agent analiza el copy aprobado → actualiza approval_pattern memory
PostRejected + comment → Learning Agent extrae patrón del rechazo → actualiza brand_memory
```

### Automático — mensual (después de publicación y medición)
```
Cron mensual → Learning Agent analiza todos los posts del mes anterior
             → Actualiza audience_memory (mejores horarios)
             → Actualiza performance_memory (benchmarks)
             → Actualiza campaign_memory (qué funcionó)
```

### Manual — por jc_admin o client_admin
```
Admin puede agregar decision_memory directamente: "No publicar en fines de semana"
```

---

## Estado actual

La memoria **no existe** en el sistema. Toda la información relevante se pierde entre runs.

**Impacto:** JClaude genera el mismo tipo de contenido mes a mes sin mejorar. Si el cliente rechaza 10 posts con precios, el próximo mes vuelve a generarlos con precios.

**Plan:** Implementar en Sprint 1 (estructura básica) + Sprint 4 (Learning Agent completo).

---

*Documento vive en `/docs/07-knowledge-architecture/memory-model.md`*
