# Experience Dependency Graph
## Cómo se sostienen entre sí las capacidades — la herramienta para priorizar

**Fecha:** 2026-07-01
**Qué es:** un grafo de dependencias **de producto** (no técnico). Los nodos son capacidades; las flechas son "sostiene / necesita". Sirve para dejar de preguntar *"¿qué sprint sigue?"* y empezar a preguntar *"¿qué momento de la experiencia queremos mejorar, y qué hay que tocar para lograrlo?"*.
**Complementa:** `customer-experience-blueprint.md` (qué sostiene cada momento).

`✅ existe` · `⚠️ flojo` · `🔨 falta`

---

## El grafo por capas

Cada capa se apoya en la de abajo. Lo de abajo sostiene todo lo de arriba.

```
┌──────────────────────────────────────────────────────────────┐
│  DELIVERY  (Día 7 — publicar y no romperse)                   │
│  Scheduler ✅ · Meta API ✅ · TikTok API ⚠️ · Retry 🔨 ·       │
│  Audit ✅ · Monitoring 🔨                                       │
└───────────────▲──────────────────────────────────────────────┘
                │ necesita STORAGE permanente para no romperse
┌───────────────┴──────────────────────────────────────────────┐
│  INTELLIGENCE  (Día 3 — revisar, decidir, recomendar)         │
│  Decision ✅ · Recommendation ✅ · Executive ✅ · Learning ✅ · │
│  Explainability ✅ · Autonomy ⚠️                               │
└───────────────▲──────────────────────────────────────────────┘
                │ necesita datos del loop (aprobaciones + performance)
┌───────────────┴──────────────────────────────────────────────┐
│  CONTENT FACTORY  (Día 2 — generar)                           │
│  Claude ✅ · Prompt Engine ⚠️ · Image ✅ · Video ✅ ·          │
│  Asset Engine ⚠️ · Calendar ✅                                 │
└───────────────▲──────────────────────────────────────────────┘
                │ su CALIDAD depende del conocimiento de la marca
┌───────────────┴──────────────────────────────────────────────┐
│  BRAND KNOWLEDGE  (Día 1 — aprender) ← la raíz del valor      │
│  Ingestion 🔨 · Scanners 🔨 · OCR 🔨 · Brand Memory ⚠️ ·       │
│  Knowledge Engine ✅                                            │
└───────────────▲──────────────────────────────────────────────┘
                │ todo se apoya en los cimientos
┌───────────────┴──────────────────────────────────────────────┐
│  FOUNDATION  (Día 0 — existir)                                │
│  Auth ✅ · Workspace ✅ · Storage 🔨 · Billing 🔨              │
└──────────────────────────────────────────────────────────────┘
```

---

## Las dos raíces

Todo el grafo cuelga de dos nodos con el mayor impacto downstream:

1. **Storage (Foundation)** → sostiene la **confiabilidad** de todo lo que se genera y publica. Si falla, el Día 7 miente.
2. **Brand Knowledge (Ingestion → Memory)** → sostiene la **calidad** de todo lo que se genera, decide y recomienda. Si está vacío, todo suena genérico.

Por eso son las dos inversiones de mayor apalancamiento de la Fase II.

---

## Cómo usar el grafo para priorizar

En vez de "¿qué sigue?", se pregunta "¿qué momento quiero mejorar?" y se sigue la flecha hacia abajo:

| Quiero mejorar… | Toco… | Estado |
|---|---|---|
| **El "wow" del Día 1** (que el sistema ya conozca la marca) | Brand Knowledge: Ingestion + Scanners + OCR + Brand Memory | 🔨 (casi todo por construir) |
| **La calidad del Día 2** (que el contenido suene a la marca) | La raíz de abajo: Brand Knowledge (no el Content Factory, que ya es ✅) | 🔨 |
| **La confianza del Día 7** (que no se rompa) | Foundation + Delivery: Storage permanente · Retry · Monitoring | 🔨 |
| **La revisión del Día 3** (claridad, confianza en la autonomía) | Intelligence: Autonomy UX + Explainability | ⚠️ (pulido, ya existen) |

**Lección del grafo:** para mejorar el Día 2 **no se toca el Día 2** — se toca la raíz (Brand Knowledge). Y para sostener el Día 7 **no se toca el publishing** (ya funciona) — se toca el cimiento (Storage). El grafo evita optimizar la capa equivocada.

---

## Lo que esto ordena para la Fase II

El grafo confirma el orden que ya insinuaba el Journey, pero ahora con la causa explícita:

- **Sprint 10 = fortalecer los cimientos y la entrega** → Storage permanente + Billing + consolidar Asset Engine + confiabilidad de Delivery. *(Es el piso: sin esto, ninguna capa de arriba es confiable.)*
- **Sprint 11 = plantar la raíz del valor** → Brand Knowledge Ingestion + Intelligent Onboarding. *(Es la cabeza: sube la calidad de todo lo que está aguas arriba.)*
- **Sprints 12-14** (Content Factory completa, Brand Presence, Paid Media OS) → todos son **consumidores** de esas dos raíces; rinden mucho más una vez que las raíces existen.

Los Sprints dejan de ser la herramienta de planificación. La herramienta es este grafo: **cada decisión responde a "qué momento de la experiencia estamos mejorando".**

---

*Documento vive en `/docs/00-start-here/experience-dependency-graph.md`*
*Relacionado: `customer-experience-blueprint.md` · `customer-journey-v1.md` · `capability-portfolio.md`*
