# Sprint 3B — Recommendations Layer
## Product Reflection

**Release:** `v0.3b-recommendations-layer`
**Commit:** `83370bb`
**Producción:** `aigency.jcmarketing.digital`
**Resultado:** GO

---

## Logro principal

Las Decisions invisibles se convirtieron en Recommendations navegables con trazabilidad completa.

El pipeline ahora es:
```
Events + Assets → Knowledge → Decision → Recommendation
```
Todo el pipeline corre dentro de un solo request, awaited, sin fire-and-forget.

---

## Lo que se construyó

**`src/lib/recommendation/engine.ts`** (nuevo):
- `generateAndStoreRecommendations(supabase, workspaceId, brandId, campaignId)`
- Carga Decisions activas con confidence ≥ 0.3
- Deriva una Recommendation por Decision usando DECISION_TO_RECOMMENDATION map
- Expira Recommendations pendientes anteriores antes de insertar nuevas
- Toda Recommendation tiene `decision_id` obligatorio — sin trazabilidad no existe
- Emite `recommendation.created` event

**`src/lib/knowledge/engine.ts`** (actualizado):
- Pipeline extendido: después de decisions, llama `generateAndStoreRecommendations` si hay `campaignId`

**`src/app/api/decision/generate/route.ts`** (actualizado):
- POST ahora también dispara `generateAndStoreRecommendations` si `campaignId` presente
- Permite activar el pipeline completo sin generar contenido nuevo

**`src/app/api/campaigns/[campaignId]/route.ts`** (actualizado):
- Agrega query de `recommendations` (solo con `decision_id`, status pending/accepted)
- Corrige events: campo `event` (no `event_type`), filtro `metadata->>campaign_id` (no columna directa)
- Decisions query agrega filtro `status = 'active'`

**Campaign Detail page** (actualizado):
- Tipo `Recommendation` agregado
- Sección Recommendations real: action_type, title, body (rationale de la Decision), confidence bar, status badge
- Contadores Overview: Assets / Decisions / Recs (en vez de Knowledge)
- Activity: `e.event` corregido (antes era `e.event_type` — columna inexistente)

---

## Bugs corregidos

### BUG-001 — Decision channel "counts"
**Causa raíz:** `deriveChannelDecision` hacía `Object.entries(affinity.data)` donde `data = { counts: {...}, dominant: string, dominant_pct: number, sorted: [...] }`. El primer entry era `["counts", objeto]`, no un canal.

**Fix:** Leer `data.dominant` y `data.dominant_pct` directamente. `dominant_pct` ya es porcentaje 0-100 calculado por el extractor.

**Resultado:** `"instagram es el canal dominante con 66% del contenido."`

### BUG-002 — Decision percentage NaN%
**Causa raíz:** `deriveContentDecision` hacía `Object.entries(data)` con el mismo problema. `topPct` recibía un objeto `{post:47,...}` → `Math.round(objeto * 100) = NaN`.

**Fix:** Leer `data.sorted` (array de `[tipo, count]`) y calcular porcentaje manualmente: `topCount / total * 100`.

**Resultado:** `"El formato \"post\" representa el 56% del contenido generado."`

### BUG adicional — events field
**Causa raíz:** La query de Activity usaba `event_type` (no existe) y filtraba `.eq("campaign_id", campaignId)` (columna no existe en events — campaign_id está en `metadata`).

**Fix:** Campo corregido a `event`. Filtro cambiado a `.eq("metadata->>campaign_id", campaignId)`.

**Resultado:** Activity section carga 30 eventos.

---

## Principio confirmado (Schema Contract Protocol v1.0)

Los tres bugs de este sprint se hubieran prevenido leyendo el Schema Contract antes de escribir código:

1. `events.event` (no `event_type`) — documentado en Schema Contract
2. `events` no tiene `campaign_id` como columna — documentado en Schema Contract
3. `channel_affinity.data` tiene shape `{counts, dominant, dominant_pct, sorted}` — documentado en extractors

El Schema Contract funciona. El proceso funciona. Los bugs que quedan son los que no están documentados todavía.

---

## Activación sin generar contenido nuevo

Pipeline activado con:
```
POST /api/decision/generate
{ workspaceId, brandId, campaignId }
```
Desde sesión autenticada en el browser (fetch con cookie de sesión).

Resultado: 2 decisions + 2 recommendations generadas sobre los 84 assets existentes.

---

## Estado del pipeline completo

| Etapa | Estado | Confianza |
|-------|--------|-----------|
| Assets (84) | ✅ | — |
| Knowledge (5 objects) | ✅ | 1.0 |
| Decisions (2 activas) | ✅ | 1.0 |
| Recommendations (2 pending) | ✅ | 1.0 |
| Campaign Detail (6 secciones) | ✅ | — |

---

## Próximo sprint

Sprint 4 — User Actions on Recommendations.

El ciclo de vida de una Recommendation (pending → accepted/rejected) todavía no está expuesto al usuario. El próximo sprint debería cerrar el loop: que el usuario pueda aceptar o rechazar una Recommendation desde Campaign Detail, emitiendo el event correspondiente.
