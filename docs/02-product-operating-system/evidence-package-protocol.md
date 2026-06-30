# Evidence Package Protocol
## JC AI Agency → RUN72 Core OS

**Versión:** 1.0 · 2026-06-28
**Alcance:** Disciplina permanente para exportar descubrimientos de JC AI Agency al hilo de RUN72 Core.

---

## Separación de responsabilidades

```
JC AI Agency        →    descubre
RUN72 Core          →    decide
```

JC AI Agency construye el mejor AI Marketing Operating System posible.

RUN72 Core identifica qué parte de esa experiencia se convierte en infraestructura universal.

Esas dos responsabilidades no se mezclan. Cuando aparece un principio nuevo en JC AI Agency, no se analiza aquí. Se documenta como Evidence Package y se exporta al hilo de RUN72 Core para su revisión.

---

## Qué es un Evidence Package

Un Evidence Package no es un análisis arquitectónico.

Es un paquete de evidencia mínima que permite al hilo de RUN72 Core tomar una decisión informada sobre si un principio merece promoverse a Core Primitive.

### Estructura

```markdown
## Evidence Package — [Nombre del principio]

**Sprint:** Sprint N
**Fecha:** YYYY-MM-DD

**Qué principio apareció:**
[Una oración. No más.]

**Qué problema resolvió:**
[El problema concreto que motivó el descubrimiento.]

**Evidencia:**
[Dónde aparece en el código o la arquitectura. File paths si aplica.]

**Por qué parece reutilizable:**
[Por qué este principio existiría en un producto distinto.]

**Productos que podrían validarlo:**
[Lista de productos RUN72 donde este principio debería aparecer.]
```

### Lo que NO incluye un Evidence Package

- Análisis de si el principio merece ser Foundation.
- Comparación con otros Core Primitives.
- Propuesta de implementación en el Core.
- Decisión de promoción.

Todo eso ocurre en el hilo de RUN72 Core. No aquí.

---

## Cuándo emitir un Evidence Package

Emitir un Evidence Package cuando:

1. Un principio de arquitectura resuelve el mismo problema de formas independientes en dos módulos distintos del producto.
2. Al diseñar una nueva feature, el principio ya existente evita tener que reinventarlo.
3. Al hacer un sprint review, se observa que una decisión tomada en Sprint N gobernó implícitamente Sprint N+2.

No emitir un Evidence Package por:

- Decisiones de implementación que solo tienen sentido en este dominio.
- Build Rules operacionales.
- ADRs de arquitectura técnica.

---

## Registro de Evidence Packages emitidos

| # | Principio | Sprint | Estado en Core |
|---|---|---|---|
| EP-001 | Universal Workflow | Sprint 1-3 | `[Core Primitive Candidate]` |
| EP-002 | Learning Boundaries | Sprint 5 | `[Core Primitive Candidate]` |
| EP-003 | Intelligence Levels | Sprint 6 | `[Core Primitive Candidate]` |
| EP-004 | Product Review Framework | Product Review v1.0 | `[Core Primitive Candidate]` — emitir al validar primera instancia |

---

## Qué NO debe ocurrir en este repositorio

Las siguientes discusiones pertenecen al hilo de RUN72 Core y no deben abrirse aquí:

- Análisis de si un principio merece ser Foundation.
- Reorganización de documentación del Core.
- Promoción de Candidates a Foundations.
- Diseño de la capa Foundations como estructura.
- Discusión sobre el ciclo de vida de Core Primitives.

Si alguna de estas discusiones aparece durante la construcción del producto, pausar, emitir el Evidence Package correspondiente, y continuar con el producto.

---

## Status Table — Disciplina de fin de etapa

Al cierre de cada sprint o etapa significativa, registrar:

| Campo | Valor |
|---|---|
| Último Sprint | Sprint N — Nombre |
| Versión | v0.N-tag |
| Arquitectura | Congelada / En evolución |
| Próximo Sprint | Sprint N+1 — Nombre |
| Bloqueantes | Descripción o Ninguno |
| Exportar a RUN72 Core | Sí / No |
| Evidence Packages | N pendientes |

Esta tabla evita conversaciones de re-sincronización cuando el hilo de RUN72 Core y el hilo de JC AI Agency avanzan en paralelo.

---

*Documento vive en `/docs/02-product-operating-system/evidence-package-protocol.md`*
*Relacionado: `foundations-design.md` · `build-rules.md`*
