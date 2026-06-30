# CAP-001 — Autonomous Action Execution

**Sprint:** Sprint 9 — Autonomous Operations
**Fecha:** 2026-06-30
**Framework:** Capability Validation v1.0
**Estado:** `Built` — pendiente `Validated`

> Primera Capability Card. Seed grounded en el DoD de Sprint 9 (`product-roadmap.md`) y la Regla 21. Los campos de pregunta 1, 2, 4 y la evidencia esperada son propuesta para confirmar con Juan antes de cerrar la validación.

---

## Capability

El sistema puede ejecutar una Recommendation como **acción automática**, sin intervención humana por acción, cuando se cumplen las tres condiciones: Confidence suficiente **AND** Autonomy Policy lo permite **AND** Action Class autorizada. Toda ejecución es segura, autorizada, observable y reversible.

## Problema

Hoy el cliente tiene que ejecutar o aprobar manualmente cada Recommendation de bajo riesgo, una por una. El sistema ya sabe qué hacer (ciclo cognitivo completo en producción), pero no puede hacerlo: queda esperando una acción humana repetitiva.

## Trabajo eliminado (pregunta 1)

Deja de existir el trabajo de **aprobar/ejecutar manualmente cada acción de bajo riesgo recomendada**. El cliente ya no revisa una por una las acciones Clase A; el sistema las ejecuta dentro de la política que el cliente definió.

## Decisión mejorada (pregunta 2)

El cliente decide **una sola vez** su nivel de delegación (Autonomy Policy global + por Action Class), en lugar de decidir acción por acción. La decisión pasa de "¿ejecuto esta acción?" (repetida N veces) a "¿hasta dónde autorizo al sistema?" (una vez, ajustable).

## Comportamiento esperado del cliente (pregunta 4)

- Configura su Autonomy Policy desde la UI (adopción gradual: Clase A automática, B con aprobación, C nunca).
- Deja de intervenir en acciones Clase A de bajo riesgo.
- Dedica el tiempo recuperado a supervisión estratégica, no a ejecución repetitiva.
- Confía en que puede revertir cualquier acción desde la UI.

## Evidencia esperada (pregunta 3 — definir antes de validar)

La capacidad pasa a `Validated` cuando, en producción real, se observa:

1. ≥1 acción autónoma **ejecutada** que verificó las tres condiciones antes de ejecutarse.
2. Cada ejecución generó un **evento inmutable** en el audit trail (política vigente, Action Class, confidence al momento).
3. Al menos una acción autónoma fue **revertida desde la UI** por el cliente, demostrando reversibilidad real.
4. El sistema **rechazó** al menos una acción por no cumplir una de las tres condiciones (la barrera funciona, no solo el happy path).
5. Un cliente real configuró su Autonomy Policy y **dejó de aprobar manualmente** acciones Clase A (cambio de comportamiento observable — pregunta 4).

Métrica de comportamiento sugerida: acciones Clase A ejecutadas autónomamente / total de acciones Clase A, antes vs. después de activar la política.

## Estado

```
Designed   ✓  (DoD definido en roadmap, Regla 21 formalizada)
Built      ✓  (código de Sprint 9 en producción — primera acción autónoma completa)
Frozen     ⟳  (pendiente Reflection + Tag + Review de Sprint 9)
Validated  ✗  (pendiente evidencia observable de los 5 puntos de arriba)
```

---

*Card vive en `/docs/capabilities/CAP-001-autonomous-action-execution.md`*
*Relacionado: `capability-validation.md` · `build-rules.md` (Regla 21) · `product-roadmap.md` (Sprint 9 DoD)*
