# Sprint 2B — Product Reflection

**Fecha:** 2026-06-28
**Sprint:** 2B — Decision Engine

---

## ¿Qué construimos?

La capa de decisión del producto.

El sistema ya no solo aprende. Ahora concluye.

Concretamente:

- **`decisions` table**: entidad formal del dominio con trazabilidad completa
- **Decision Engine** (`src/lib/decision/engine.ts`): transforma Knowledge Objects en Decisions
- **4 derivadores**: content, channel, timing, creative — cada uno con rationale y evidencia
- **Decision Quality Framework**: toda Decision debe tener evidencia, knowledge, confidence > 0.4
- **Pipeline automático**: extractAndStoreKnowledge → generateAndStoreDecisions (fire-and-forget)
- **API endpoints**: POST /api/decision/generate + GET /api/decision/generate
- **generate-month v4**: Claude consume Knowledge + Decisions. No genera ninguno de los dos.
- **PROMPT_V**: bumpeado a `generate-month-v4`

---

## ¿Qué diferencia existe entre Knowledge y Decision?

**Knowledge** responde: ¿qué pasó?

"El 72% del contenido fue publicado en Instagram."
"El copy aprobado tiene en promedio 120 caracteres."
"Se publica principalmente los martes a las 09:00hs."

**Decision** responde: ¿qué hay que hacer?

"Concentrar esfuerzos en Instagram. Reducir frecuencia en Facebook."
"Usar copy de aproximadamente 120 caracteres."
"Publicar los martes a las 09:00hs y 18:00hs."

Knowledge es observación. Decision es criterio.

Un producto inteligente necesita los dos.
Un asistente de IA solo tiene el primero.

---

## ¿Qué parte pertenece únicamente a JC AI Agency?

- Los Decision Types de marketing: content, channel, timing, creative, publishing
- Los derivadores específicos que leen `content_mix`, `channel_affinity`, `approval_signals`
- El formato del rationale orientado a campañas de social media
- La integración con generate-month y el calendario mensual

---

## ¿Qué parte debería convertirse en infraestructura de RUN72 Core?

**Core Candidate — Decision Engine v1**

El patrón completo:

```
Knowledge Objects
        ↓
Derivers (tipados, con evidencia)
        ↓
Decision Quality Check (hasEvidence, hasKnowledge, confidence > threshold)
        ↓
Decision Store (idempotente: supersede anterior, insertar nuevo)
        ↓
Decision Context (promptContext para cualquier consumidor)
```

Este patrón no sabe nada de marketing. Sabe transformar knowledge estructurado en decisiones trazables con calidad garantizada.

Condición para mover al Core: que aparezca en al menos 2 productos.

---

## ¿Qué otras aplicaciones podrían reutilizar este motor?

**Margin** (costos/recetas para restaurantes):
- Knowledge: "El pollo tiene 40% de variación de precio mensual"
- Decision: "Reducir platos con pollo en el menú de agosto"

**Stay** (hospitalidad):
- Knowledge: "La ocupación cae los miércoles en temporada baja"
- Decision: "Activar descuentos mid-week a partir de abril"

**Tips+** (propinas / servicios):
- Knowledge: "Los clientes del turno noche dejan 18% más de propina"
- Decision: "Incentivar al equipo nocturno con objetivos diferenciados"

El Decision Engine es genérico. Los derivadores son específicos de cada dominio.

---

## ¿Qué ocurriría si mañana cambiáramos Claude por otro modelo?

Las Decisions no cambiarían.
La tabla `decisions` no cambiaría.
El Decision Engine no cambiaría.
El pipeline Knowledge → Decision no cambiaría.

Solo cambiaría el formato del `promptContext` que se inyecta al nuevo modelo.

Esto confirma el principio: **el producto genera criterio. Claude ejecuta instrucciones.**

---

## El ciclo completo, cerrado

```
Events
↓
Evidence (assets, memories)
↓
Knowledge (extractors + confidence)
↓
Decision (derivers + quality check)
↓
Recommendation (Sprint 2C)
↓
Action (publicación, ajuste, campaña)
↓
New Events
↓
(loop)
```

Sprint 2B cierra el ciclo de aprendizaje → criterio.
Sprint 2C cierra el ciclo de criterio → acción propuesta.

---

## Estado de madurez

| Componente | Estado |
|---|---|
| decisions table | ✅ Migración 007 |
| Decision types (8) | ✅ Definidos |
| Decision Quality Framework | ✅ assessDecisionQuality() |
| Derivadores (4) | ✅ content, channel, timing, creative |
| Pipeline Knowledge → Decision | ✅ Fire-and-forget |
| API trigger | ✅ /api/decision/generate |
| Claude consume Decisions | ✅ generate-month v4 |
| Dashboard de Decisions | ⬜ Sprint 2C |
| Recommendation derivada de Decision | ⬜ Sprint 2C |
| Budget Decision | ⬜ Requiere Performance data |
| Performance Decision | ⬜ Requiere Performance data |
| Audience Decision | ⬜ Requiere datos externos |
