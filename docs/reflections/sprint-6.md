# Sprint 6 — AI Experience
## Product Reflection

**Release:** `v0.6-ai-experience`
**Commit:** `446b972`
**Producción:** `aigency.jcmarketing.digital`
**Resultado:** GO

---

## Logro principal

Por primera vez, el usuario puede observar el pensamiento del sistema.

No ver datos. Ver comprensión.

Hasta Sprint 5 el sistema aprendía. A partir de Sprint 6 el usuario sabe que el sistema aprendió, por qué, y cómo eso afecta lo que viene.

---

## Las cuatro preguntas del Definition of Done

| Pregunta | Superficie que responde | Verificado |
|---------|------------------------|-----------|
| ¿Qué aprendió el sistema sobre mi marca? | Brand Intelligence Panel | ✅ |
| ¿Por qué cambió ese aprendizaje? | Learning Timeline | ✅ |
| ¿Cómo afecta las próximas recomendaciones? | Toggle "¿Por qué?" en cada Rec | ✅ |
| ¿Qué debería hacer ahora? | Recommendations con botones de acción | ✅ |

---

## Lo que se construyó

**`BrandIntelligencePanel`** (nuevo componente en Campaign Detail):
- Barras de confidence para cada tipo de Knowledge Object
- Narrativa en lenguaje humano por nivel de confidence:
  - ≥95%: "El sistema está completamente seguro."
  - ≥80%: "Alta confianza — el criterio está consolidado."
  - ≥60%: "Confianza moderada — el sistema sigue aprendiendo."
  - ≥40%: "Evidencia insuficiente — todavía en observación."
  - <40%:  "Señal débil — no hay información suficiente aún."
- Panel ámbar separado para `user_feedback` (decisiones explícitas del cliente)
- Learning Timeline filtrado: solo eventos de aprendizaje, con causa → efecto → impacto

**`RecommendationCard` — sección "¿Por qué?":**
- Toggle expandible por recomendación
- Muestra `decision.rationale` en lenguaje legible
- Lista `supporting_knowledge` con label humano y confidence por ítem

**`ConfidenceBar` — modo `showNarrative`:**
- Decisions ahora muestran narrative debajo de la barra

**KPI "Inteligencia" en overview:**
- Cuarto número junto a Assets / Decisions / Recs
- Promedio real de confidence de todos los Knowledge Objects del sistema

**Orden de secciones redefinido:**
- Brand Intelligence primero (la inteligencia del sistema es el concepto principal)
- Recomendaciones segundo (acciones concretas derivadas de la inteligencia)
- Decisions colapsado (detalle técnico, no el foco del usuario)
- Assets colapsado (histórico operativo)
- Activity colapsado (log técnico)

---

## QA Results

| Punto | Estado |
|-------|--------|
| Campaign Detail carga | ✅ sin errores |
| Consola | ✅ 0 errores |
| Brand Intelligence | ✅ 6 knowledge objects con narrativas |
| `channel_affinity 85%` | ✅ "Alta confianza — el criterio está consolidado." |
| `approval_signals 10%` | ✅ "Señal débil — no hay información suficiente aún." |
| Client Feedback panel | ✅ rejection reason visible con timestamp |
| Learning Timeline | ✅ 6 eventos, causa→efecto legible |
| Toggle "¿Por qué?" | ✅ rationale + supporting_knowledge con confidence |
| KPI Inteligencia | ✅ 79% (promedio real, sin NaN) |
| Dashboard | ✅ 200 |
| Campaigns | ✅ 1 campaign real |
| Social Media | ✅ fix regresión confirmado (84 posts) |
| JClaude | ✅ 200 |
| Recommendation actions | ✅ PATCH operativo |

---

## Cambio conceptual

Sprint 1-5: construimos un sistema que piensa.

Sprint 6: construimos la primera superficie donde el usuario puede observar ese pensamiento.

La diferencia es mayor de lo que parece.

Antes el sistema tenía `channel_affinity: 0.85`. Era un número en una tabla.

Ahora el usuario ve:

> **Canal preferido** — Rendimiento por canal
> ████████░░ 85%
> *Alta confianza — el criterio está consolidado.*

Y debajo:

> Confidence de Canal preferido ajustada en -15%.
> Rechazaste la recomendación. Motivo: "Ya estamos en Instagram y Facebook."

El número se convirtió en narrativa. La narrativa se convirtió en confianza.

---

## Lo que este sprint valida de Regla 18

> Toda capacidad nueva del backend debe responder: ¿dónde la ve el usuario?

Sprint 5 implementó el Learning Engine. El usuario no lo veía.
Sprint 6 lo hizo visible. Sin cambiar una línea del backend.

Eso confirma que Regla 18 funciona como filtro:
no bloquea la construcción del backend, pero obliga a completar el ciclo.

---

## Próxima etapa

El ciclo cognitivo completo ahora es visible. Las siguientes iteraciones pueden ir hacia:

1. **Sprint 7A — Publicación automática (Meta):** conectar el flujo de aprobación con la API de Meta para publicar assets directamente desde el sistema.
2. **Sprint 7B — Campaign Health:** panel de salud de campaña que muestra en tiempo real el estado de assets pendientes, próximas fechas y acciones requeridas.
3. **Sprint 7C — Multi-Brand:** múltiples brands por workspace, cada una con su propio pipeline de Knowledge → Decision → Recommendation → Learning.
