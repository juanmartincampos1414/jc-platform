# Sprint 5 — Learning from Actions
## Product Reflection

**Release:** `v0.5-learning-from-actions`
**Commit:** `82ac177`
**Producción:** `aigency.jcmarketing.digital`
**Resultado:** GO

---

## Logro principal

El sistema aprende de sus usuarios.

Por primera vez, una decisión del cliente modifica el conocimiento interno del sistema. La próxima vez que el Knowledge Engine corra, ese aprendizaje ya estará ahí — sin intervención manual, sin re-entrenamiento, sin configuración.

El pipeline completo es ahora:

```
Events + Assets → Knowledge → Decision → Recommendation → User Action → Learning → Memory
                                                                                     ↓
                                                                            Futuras Decisions
                                                                            Futuras Generaciones
```

---

## Lo que se construyó

**`src/lib/learning/engine.ts`** (nuevo):
- `processRecommendationAction(supabase, params)` — función principal
- `accepted` → `confidence + 0.10` en cada Memory del tipo de Knowledge asociado a la Decision
- `rejected` → `confidence - 0.15` + nueva Memory tipo `user_feedback` con el `decision_reason`
- Confidence clampeada entre `0.00` y `1.00` con precisión `numeric(3,2)`
- Emite `memory.feedback_applied` con delta, tipos ajustados, y flag de rejection reason
- Error aislado: fallo en learning nunca crashea la acción del usuario

**`supabase/migrations/009_learning_from_actions.sql`**:
- Fix crítico: `memories_update` RLS ahora permite `user_in_workspace(workspace_id)` además de admin
- Sin este fix, todas las actualizaciones de confidence habrían fallado silenciosamente
- Agrega `user_feedback` al CHECK constraint de `memory_type`

**`PATCH /api/recommendations/[recommendationId]`** (actualizado):
- Después de accepted/rejected, llama `processRecommendationAction`
- Solo actúa si la recommendation tiene `decision_id` (trazabilidad obligatoria)
- Fire-and-catch: el learning no bloquea la respuesta al usuario

**`events.ts`**:
- Agrega `memory.feedback_applied`

---

## QA Results

| Acción | Efecto en Memory | Verificado |
|--------|-----------------|-----------|
| Accept "Optimizar mix de formatos" | `content_mix` confidence: 1.0 → 1.0 (cap) | ✅ engine corrió |
| Reject "Rebalancear distribución de canales" | `channel_affinity`: 1.0 → **0.85** (-0.15) | ✅ |
| Rejection reason guardado | `user_feedback` Memory creada con `confidence = 1.0` | ✅ |
| Events emitidos | `memory.feedback_applied` x2 (actor: system) | ✅ |

---

## Cómo fluye el aprendizaje hacia Claude

La Memory `user_feedback` que se crea en cada rejection tiene:
- `confidence = 1.0` — máxima prioridad en el prompt context
- `content` = "El cliente rechazó la recomendación de tipo 'channel'. Motivo declarado: [reason]. Tener esto en cuenta al generar contenido futuro."
- Se incluye en `loadBrandKnowledgeContext` porque el filtro existente es `neq("memory_type", "brand")` — `user_feedback` pasa

La próxima vez que JClaude genere un mes, Claude recibe este contexto y lo incorpora naturalmente en el contenido generado.

---

## Bug crítico detectado y corregido

**Problema:** `memories_update` RLS solo permitía `is_jc_admin()`. El knowledge engine corre en sesión de usuario. Todas las actualizaciones de confidence habrían fallado silenciosamente — sin error visible, sin aprendizaje.

**Por qué no se detectó antes:** Los `INSERT` de memories sí funcionaban (policy correcta). Solo los `UPDATE` fallaban. El knowledge engine nunca actualiza memories en producción — solo inserta y depreca. La deprecación también fallaba silenciosamente.

**Fix:** Migration 009 agrega `user_in_workspace(workspace_id)` a la policy de UPDATE.

**Efecto secundario positivo:** Ahora la deprecación de memories anteriores (que el Knowledge Engine hacía con `update({ status: "deprecated" })`) también funciona correctamente para usuarios normales.

---

## Estado del pipeline completo

| Etapa | Estado |
|-------|--------|
| Assets generados | ✅ |
| Knowledge extraído | ✅ |
| Decisions activas | ✅ confidence correcta |
| Recommendations generadas | ✅ con decision_id |
| User Actions | ✅ accept/reject/pending |
| Learning Engine | ✅ confidence actualizada |
| user_feedback Memory | ✅ reason persistido |
| Flujo hacia JClaude | ✅ via promptContext |

---

## Próximo sprint

El sistema tiene memoria, aprende, y actúa sobre lo que aprende. Las próximas iteraciones pueden ir en:

1. **Sprint 6A — Dashboard Intelligence:** Surfacear Decisions activas y Recommendations pendientes en el Dashboard principal con un panel de "Inteligencia de Campaña".
2. **Sprint 6B — Multi-Brand:** Soportar múltiples brands por workspace, cada una con su propio pipeline de Knowledge → Decision → Recommendation → Learning.
