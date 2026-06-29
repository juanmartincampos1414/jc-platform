# Sprint 7 — Campaign Strategy
## Product Reflection

**Release:** `v0.7-campaign-strategy`
**Commit:** `edcab8e`
**Producción:** `aigency.jcmarketing.digital`
**Resultado:** GO

---

## Logro principal

Por primera vez, JC AI Agency tiene una estrategia propia del producto — independiente del modelo de IA que la exprese.

El sistema construye la estrategia. Claude solo la narra.

---

## Las cuatro preguntas del Definition of Done

| Pregunta | Superficie que responde | Verificado |
|---------|------------------------|-----------|
| ¿Cuál es la estrategia de esta campaña? | Campaign Strategy Panel — narrativa ejecutiva | ✅ |
| ¿En qué se basa el sistema para decir eso? | Strengths / Risks desde Memories y Decisions | ✅ |
| ¿Cuál es la hipótesis estratégica? | Hipótesis derivada de la primera Decision activa | ✅ |
| ¿Qué debería hacer el equipo ahora? | Próximas acciones con prioridad (alta/media/baja) | ✅ |

---

## Lo que se construyó

**`src/lib/strategy/engine.ts`** — Strategy Engine:
- Lee Memories, Decisions y Recommendations desde la DB
- Construye el `StrategyObject` estructurado sin invocar Claude
- Campos: `summary`, `objectives`, `hypothesis`, `strengths`, `risks`, `expected_outcomes`, `recommended_next_actions`, `confidence`, `knowledge_used`, `evidence_used`, `generated_at`
- Confidence = promedio ponderado de todas las Memories y Decisions de la campaña

**`/api/campaigns/[campaignId]/strategy`** — Route:
- POST: Engine → StrategyObject → Claude Narrative Renderer → persiste ambos
- GET: devuelve `strategy` + `narrative` guardados, sin recalcular
- Claude recibe el objeto terminado con instrucción explícita: no inventar, no añadir, no razonar fuera del objeto

**`CampaignStrategyPanel`** — Componente UI:
- Narrativa ejecutiva en gris suave
- Hipótesis estratégica en cursiva
- Grid strengths / risks con confidence individual
- Próximas acciones con badge de prioridad (ALTA / MEDIA / BAJA)
- Botón "Generar / Regenerar" con spinner
- Al recargar: lee lo persistido, no recalcula

**Migrations:**
- `010_seedance_video_limit.sql`: `videos_limit` en `jclaude_subscriptions`
- `011_campaign_strategy.sql`: `strategy`, `strategy_narrative`, `strategy_generated_at` en `campaigns`

**Seedance integration:**
- `generate-month` calcula `videosPerWeek` desde `subscription.videos_limit`
- Crea Assets `asset_type: "video"` con `status: "generating"`
- Cliente dispara `generate-video` en fire-and-forget por cada video
- `AssetType` extendido con `"video"` en dominio y adaptador

---

## QA Results

| Punto | Estado |
|-------|--------|
| Migrations 010 + 011 aplicadas | ✅ |
| Deploy Vercel | ✅ |
| Campaign Detail carga | ✅ sin errores |
| Sección "Estrategia de Campaña" aparece | ✅ |
| Botón "Generar estrategia" funciona | ✅ |
| Strategy Object persiste en `campaigns.strategy` | ✅ |
| Strategy Narrative persiste en `campaigns.strategy_narrative` | ✅ |
| Al recargar lee persistido, no recalcula | ✅ |
| Dashboard | ✅ |
| Campaigns List | ✅ |
| JClaude | ✅ |
| Social Media | ✅ |

---

## El cambio arquitectónico central

Sprint 7 no es solo una feature nueva.

Es la primera vez que el sistema tiene un objeto estratégico propio.

Hasta Sprint 6 el sistema generaba contenido y aprendía de él.

A partir de Sprint 7 el sistema puede explicar por qué está haciendo lo que está haciendo — no como narrativa generada por un modelo, sino como un objeto estructurado que pertenece al dominio del producto.

```
StrategyObject
  └── summary
  └── hypothesis          ← derivada de Decisions
  └── strengths           ← Memories con confidence ≥ 0.70
  └── risks               ← Memories con confidence < 0.50 + Decisions rechazadas
  └── recommended_next_actions ← Recommendations activas
  └── confidence          ← promedio ponderado del conocimiento disponible
  └── evidence_used       ← referencias auditables a Memory/Decision/Recommendation
```

Claude recibe ese objeto terminado y produce la narrativa. Si mañana Claude es reemplazado por otro modelo, la estrategia no cambia. Solo cambia la forma en que se expresa.

Eso es exactamente lo que se construyó desde Sprint 2A en adelante.

---

## Preparación para Sprint 8

El `StrategyObject` puede ser consumido directamente por el Executive Intelligence Panel.

El Executive Panel de Sprint 8 no necesita construir su propia estrategia — puede leerla desde `campaigns.strategy` y agregarla a nivel de workspace para producir la narrativa ejecutiva de negocio.

La separación Strategy Engine / Narrative Renderer que definimos en Sprint 7 es el patrón que Sprint 8 va a escalar.

---

## Status Table

| Campo | Valor |
|---|---|
| Último Sprint | Sprint 7 — Campaign Strategy |
| Versión | v0.7-campaign-strategy |
| Arquitectura | Congelada |
| Próximo Sprint | Sprint 8 — Executive Intelligence |
| Bloqueantes | Ninguno |
| Exportar a RUN72 Core | No |
| Evidence Packages | 3 (EP-001, EP-002, EP-003) — sin nuevos este sprint |
