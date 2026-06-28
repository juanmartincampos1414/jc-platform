# Sprint 4 — Recommendation Actions
## Product Reflection

**Release:** `v0.4-recommendation-actions`
**Commit:** `9621ef5`
**Producción:** `aigency.jcmarketing.digital`
**Resultado:** GO

---

## Logro principal

El loop de trazabilidad está cerrado.

Por primera vez, el usuario puede actuar sobre lo que el sistema recomienda. La acción queda registrada con trazabilidad completa: quién decidió, cuándo, por qué.

El ciclo completo es ahora:

```
Events + Assets → Knowledge → Decision → Recommendation → User Action → Event
```

---

## Lo que se construyó

**`PATCH /api/recommendations/[recommendationId]`** (nuevo):
- Actualiza `status`, `decided_by`, `decided_at`, `decision_reason`
- Validación: `rejected` requiere `decision_reason` no vacío
- Verificación de ownership: la recommendation debe pertenecer al workspace
- Emite `recommendation.accepted` / `recommendation.rejected` / `recommendation.pending` con `actor_type = "user"`

**`RecommendationCard`** (nuevo componente en Campaign Detail):
- Botones **Aceptar** (verde), **Rechazar** (rojo), **Pendiente** (gris)
- Si rechaza: input inline autoFocus + validación + botón confirmar/cancelar
- Optimistic update: estado refleja la acción inmediatamente sin reload
- Botón "Reabrir como pendiente" si ya fue decidida
- Muestra `decision_reason` si existe

**Fix en Campaign Detail API:**
- Query de recommendations incluye `status = rejected` además de `pending` y `accepted`
- Sin este fix, las recommendations rechazadas desaparecían de la vista e impedían reabrirlas

**`events.ts`:**
- Agregados tipos `recommendation.accepted`, `recommendation.rejected`, `recommendation.pending`

---

## QA Results

| Acción | Status BD | decided_at | decision_reason | Event emitido |
|--------|-----------|------------|-----------------|---------------|
| Accept rec 1 | `accepted` | ✅ | null | `recommendation.accepted` (actor: user) |
| Reject rec 2 | `rejected` | ✅ | ✅ texto poblado | `recommendation.rejected` (actor: user) |

| Regresión | Estado |
|-----------|--------|
| Dashboard | ✅ 200 |
| JClaude | ✅ 200 |
| Campaign Detail | ✅ |

---

## Bug detectado y corregido durante QA

**Problema:** La recommendation rechazada desaparecía de Campaign Detail después de rechazar.

**Causa:** La query filtraba `.in("status", ["pending", "accepted"])` — no incluía `rejected`.

**Fix:** Agregado `"rejected"` al filtro. La recommendation rechazada permanece visible con su motivo y el botón "Reabrir como pendiente".

**Patrón:** Los estados negativos (rejected) también necesitan ser visibles. Un usuario necesita ver lo que rechazó y por qué, y poder revertirlo.

---

## Estado del pipeline completo

| Etapa | Estado |
|-------|--------|
| Assets | ✅ generados |
| Knowledge | ✅ extraído |
| Decisions | ✅ activas con canal/porcentaje correctos |
| Recommendations | ✅ generadas con decision_id |
| User Actions | ✅ accept/reject/pending con event |
| Trazabilidad | ✅ decided_by + decided_at + decision_reason |

---

## Próximo sprint

El pipeline de generación → conocimiento → decisión → recomendación → acción del usuario está completo.

Las siguientes iteraciones pueden ir en dos direcciones:

1. **Sprint 5A — Multi-Brand / Multi-Campaign:** Soportar múltiples brands en un workspace, cada una con su propia Campaign y pipeline.
2. **Sprint 5B — Dashboard Intelligence:** Surfacear Decisions y Recommendations activas en el Dashboard principal, no solo en Campaign Detail.
