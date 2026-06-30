# Capability Validation
## RUN72 Core OS — Cómo se mide una capacidad del producto

**Versión:** 1.0 · 2026-06-30
**Estado:** `Frozen` — aún no `Validated` (ver `build-rules.md`, Regla 22 y 23)
**Origen:** Cierre de etapa — pasar del "¿está implementado?" al "¿está validado?"
**Clasificación:** `[Core Primitive Candidate]` — ver `foundations-design.md`
**Alcance:** JC AI Agency + cualquier producto construido sobre RUN72 Core OS

---

## El principio — el producto marca el ritmo

Mientras construimos JC AI Agency, el orden no se invierte nunca:

```
Producto
   ↓
Implementación
   ↓
Evidencia
   ↓
Review
   ↓
Framework
```

JC AI Agency sigue siendo **el producto**. RUN72 Core sigue siendo el lugar donde se consolida aquello que demostró funcionar. El objetivo de cada sprint **no es descubrir principios nuevos** — es construir mejores capacidades para el cliente. Si durante la construcción aparece un principio nuevo: se documenta, se registra como Evidence Package y se continúa construyendo el producto. La decisión de promoverlo al Core ocurre fuera de este repositorio.

Por eso cada Sprint responde, en este orden:

1. **¿Qué capacidad nueva obtiene el cliente?** ← primero, siempre.
2. **¿Qué aprendió RUN72 gracias a esta implementación?** ← después, si corresponde.

El cliente primero. El Framework aprende después.

---

## Por qué esta disciplina

A medida que el producto crezca, vamos a dejar de preguntar:

> ¿Está implementado?

Y vamos a empezar a preguntar:

> ¿Está validado?

Esa diferencia será fundamental cuando existan decenas de capacidades construidas. **No alcanza con construir una capacidad. Queremos demostrar que realmente cambia la forma en que trabaja el cliente.** Esa evidencia vale muchísimo más que cualquier listado de funcionalidades.

Capability Validation hace con las capacidades lo que la Regla 22 hace con los métodos: separa "bien construido" de "demostró funcionar".

---

## Las cuatro preguntas

Toda capacidad nueva responde siempre estas cuatro preguntas, **desde el punto de vista del cliente, no técnico**.

### 1. ¿Qué trabajo elimina?

No qué automatiza. **Qué trabajo deja de existir.**

Automatizar un trabajo lo mantiene vivo en otra forma. Eliminarlo significa que el cliente ya no tiene que hacerlo ni supervisarlo manualmente.

### 2. ¿Qué decisión mejora?

No qué información muestra. **Qué decisión concreta ayuda a tomar.**

Mostrar datos no es mejorar una decisión. La pregunta es qué elige mejor el cliente gracias a esta capacidad.

### 3. ¿Cómo sabemos que funcionó?

**Definir antes de construir:** ¿cuál es la evidencia observable que validará esta capacidad?

No opiniones. No percepción. **Evidencia.** Si no se puede señalar dónde se medirá, la capacidad no se puede validar. (Misma disciplina que la Dimensión 5 del Product Review: evidencia, no proyección.)

### 4. ¿Qué comportamiento esperamos del cliente?

Toda capacidad cambia un comportamiento. Ese comportamiento debe quedar **explícito**.

Ejemplos:
- aprobar más rápido;
- publicar con mayor frecuencia;
- cometer menos errores;
- depender menos de una agencia;
- dedicar más tiempo a estrategia.

---

## Estados de una capacidad

Una capacidad atraviesa cuatro estados. Los dos últimos son los de la Regla 22.

| Estado | Significa |
|---|---|
| **Designed** | Las cuatro preguntas están respondidas. Existe Capability Card. Todavía no hay código. |
| **Built** | El código funciona y está en producción estable. |
| **Frozen** | Listo para usarse: diseño cerrado, versionado, con Reflection / Tag / Review. |
| **Validated** | Existe evidencia observable de que cambió el comportamiento del cliente (pregunta 3 cumplida). |

**Built no implica Validated.** Una capacidad puede estar Built y en producción durante semanas sin estar Validated. Validar requiere la evidencia definida en la pregunta 3, medida en la realidad. (Regla 22.)

---

## Capability Card

Toda capacidad importante tiene una ficha mínima. No requiere tabla nueva ni UI: empieza como documentación en `docs/capabilities/`.

```text
Capability:            [nombre]
Problema:              [qué problema del cliente resuelve]
Trabajo eliminado:     [qué trabajo deja de existir — pregunta 1]
Decisión mejorada:     [qué decisión concreta mejora — pregunta 2]
Comportamiento esperado: [qué cambia el cliente — pregunta 4]
Evidencia esperada:    [evidencia observable que la valida, definida antes de construir — pregunta 3]
Estado:                Designed | Built | Frozen | Validated
```

Convención de archivo: `docs/capabilities/CAP-NNN-[slug].md`.

---

## Cuándo se completa

Hasta ahora un sprint cerraba cuando: el código funcionaba, producción estaba estable, había Reflection, Tag y Review.

A partir de ahora se agrega una pieza más, **para todos los sprints futuros**: cada capacidad nueva tiene su Capability Card, con las cuatro preguntas respondidas y su estado declarado. La Card se crea en `Designed` (antes de construir, para fijar la evidencia) y avanza de estado a medida que la capacidad progresa.

Una capacidad no se considera terminada por estar `Built`. Se considera demostrada cuando llega a `Validated`.

**La pregunta que cierra un Sprint:**

> ¿Qué capacidad nueva obtuvo el cliente, y cómo demostramos —con evidencia— que realmente le cambió la forma de trabajar?

Si se puede responder **con evidencia**, el Sprint está completo. Si solo se puede responder *"el código funciona"*, todavía no. El producto ya no crece por cantidad de funcionalidades, sino por cantidad de capacidades realmente validadas con clientes.

---

## Relación con RUN72 Core

Capability Validation es un `[Core Primitive Candidate]`. RUN72 debería medir capacidades de la misma forma que hoy mide métodos. Si esta disciplina demuestra valor a lo largo de varias capacidades, se emite el Evidence Package correspondiente al hilo de RUN72 Core. La promoción a Foundation se decide allí, no aquí.

---

## Registro de Capability Cards

| # | Capability | Estado |
|---|---|---|
| CAP-001 | Autonomous Action Execution (Sprint 9) | `Built` — pendiente `Validated` |
| CAP-002 | Autopublicación a Instagram (Instagram Login) | `Validated` (cuenta conectada/test, 2026-06-30) — clientes gated por App Review |

---

*Documento vive en `/docs/02-product-operating-system/capability-validation.md`*
*Relacionado: `build-rules.md` (Reglas 21, 22, 23) · `product-review-framework.md` · `evidence-package-protocol.md`*
