# Knowledge Engine — Design Document

**Sprint:** 2A
**Estado:** Implementado v1
**Fecha:** 2026-06-28

---

## Separación formal: Memory / Knowledge / Recommendation

Estos tres conceptos son distintos y no deben mezclarse.

| Capa | Tabla | Rol | Responde a |
|---|---|---|---|
| **Memory** | `memories` (type: brand) | Recuerda hechos y contexto de identidad | ¿Quién es esta marca? |
| **Knowledge** | `memories` (type: content_mix, timing, etc.) | Comprende patrones y tendencias | ¿Qué funciona para esta marca? |
| **Recommendation** | `recommendations` | Propone acciones fundamentadas | ¿Qué debería hacer esta marca ahora? |

Memory recuerda.
Knowledge comprende.
Recommendation actúa.

---

## Knowledge Object Types

| Tipo | Qué detecta |
|---|---|
| `channel_affinity` | Preferencia de canal (Instagram vs Facebook vs otros) |
| `content_mix` | Mix de formatos (post / reel / story / carousel) |
| `timing` | Horarios y días preferidos de publicación |
| `approval_signals` | Qué tipo de copy / canal consigue approved vs rejected |
| `brand_voice` | Longitud promedio de copy, uso de hashtags |
| `creative_style` | Enfoques creativos con mayor tasa de aprobación |
| `campaign_pattern` | Qué hace a una campaña exitosa (Sprint 2B) |

---

## Flujo del Knowledge Engine

```
Assets / Events
        ↓
Extractors (src/lib/knowledge/extractors.ts)
        ↓
Knowledge Objects (typed, with confidence score)
        ↓
memories table (status: active, old deprecated)
        ↓
loadBrandKnowledgeContext()
        ↓
promptContext (texto listo para inyectar en Claude)
        ↓
generate-month prompt enriquecido
        ↓
Próxima generación más informada
```

---

## Ciclo de aprendizaje

```
generate-month
    ↓
JClaude genera contenido
    ↓
Assets creados
    ↓
extractAndStoreKnowledge() [fire-and-forget]
    ↓
Knowledge Objects actualizados en memories
    ↓
Próximo generate-month:
    loadBrandKnowledgeContext() → promptContext inyectado
    ↓
Claude recibe contexto de campañas anteriores
    ↓
Generación más personalizada y adaptada
```

Este es el primer ciclo de aprendizaje real del sistema. No requiere Performance ni Distribution.

---

## Confidence Score

Cada Knowledge Object tiene un score de 0.0 a 1.0 según tamaño de muestra:

| Score | Significado | Umbral |
|---|---|---|
| < 0.3 | Datos insuficientes — no se inyecta en prompt | < 6 assets |
| 0.3 – 0.7 | Tendencia emergente | 6–14 assets |
| > 0.7 | Patrón confirmado | 15+ assets |

Solo conocimiento con confidence > 0.3 se inyecta en el prompt de Claude.

---

## Idempotencia

`extractAndStoreKnowledge()` es idempotente:
- Depreca el Knowledge Object anterior del mismo tipo
- Inserta el nuevo con los datos actualizados
- Los records deprecated se preservan como historial

---

## Archivos

```
src/lib/knowledge/
    types.ts        — KnowledgeObject, BrandKnowledgeContext
    extractors.ts   — runAllExtractors() y 5 extractores especializados
    engine.ts       — extractAndStoreKnowledge(), loadBrandKnowledgeContext()

src/app/api/knowledge/
    extract/route.ts — POST endpoint para trigger manual
```

---

## Sprint 2B: lo que falta

- `campaign_pattern`: requiere Performance data (métricas reales)
- `competitive_knowledge`: requiere datos de mercado externos
- Learning Loop automático: trigger por cierre de Campaign
- Recommendation Engine: de Knowledge a acción propuesta

---

## Core Candidate

Este módulo es candidato a RUN72 Core OS Engine.

El patrón `Extractors → Knowledge Objects → Confidence → Prompt Injection` es completamente genérico y aplicable a cualquier producto que use Claude como cerebro operativo.

Condición para mover al Core: aparezca en al menos 2 productos distintos.
