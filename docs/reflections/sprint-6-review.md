# Sprint 6 Review — AI Experience Achieved
**Fecha:** 2026-06-28
**Release:** `v0.6-ai-experience`

---

## El cambio real

Sprint 6 no agregó nuevas capacidades al sistema.

Hizo visible lo que el sistema ya sabía.

Hasta Sprint 5 el sistema tenía inteligencia. A partir de Sprint 6 el usuario puede observar esa inteligencia. Esa diferencia es el cambio de producto más importante desde el inicio del proyecto.

---

## Lo que quedó validado

### Brand Intelligence
El sistema muestra criterio, no datos. Cada Knowledge Object tiene confidence, narrativa y contexto. El usuario entiende qué sabe el sistema, qué está aprendiendo, qué cambió recientemente. No es memoria. Es conocimiento.

### Learning Timeline
Transforma eventos aislados en evolución. El usuario puede seguir la secuencia Recommendation → Decisión → Aprendizaje → Cambio de comportamiento. El cliente deja de sentir que trabaja con software. Empieza a sentir que trabaja con un sistema que recuerda.

### "¿Por qué?"
El componente más importante construido hasta ahora. No explica el modelo. Explica el criterio. Cuando una Recommendation muestra qué evidencia usó, qué Knowledge consumió y cuál fue el razonamiento, el sistema deja de pedir confianza. Empieza a justificarla.

### KPI de Inteligencia
Correcto como primera versión. Evolución sugerida: de mostrar `79%` a mostrar `"El sistema ya reconoce patrones consistentes en canales, formatos y comportamiento reciente."` — la interpretación como producto, no el número.

---

## Nueva capa del dominio

Apareció una quinta capa que no estaba en el modelo original:

```
Data
↓
Knowledge
↓
Decision
↓
Recommendation
↓
AI Experience  ← nueva
```

AI Experience no genera inteligencia. La traduce. Es una capacidad oficial del sistema. Quedó formalizada como Capability 19 en el Capability Map.

---

## Nueva dimensión de calidad

Hasta Sprint 5 medíamos: precisión, arquitectura, trazabilidad, aprendizaje.

Sprint 6 introduce una quinta dimensión:

**Comprensión** — el usuario entiende qué sabe el sistema, por qué lo sabe, qué cambió, cómo influye en el futuro.

Eso convierte la IA en confianza.

---

## Regla 19 — Explainability First

Toda nueva capacidad inteligente debe responder tres preguntas antes de considerarse terminada:

1. ¿Qué sabe el sistema?
2. ¿Por qué lo sabe?
3. ¿Cómo afecta la próxima decisión?

Formalizada en `docs/02-product-operating-system/build-rules.md`.

**Distinción clave:**
- Regla 18: *¿Dónde lo ve el usuario?*
- Regla 19: *¿Entiende el usuario por qué?*

---

## Cambio de categoría comercial

Las categorías anteriores (AI Content Generator, Marketing Copilot, Campaign Assistant) quedaron pequeñas.

Lo que existe ahora es:

> **AI Marketing Operating System**

No porque genere contenido. Sino porque observa, aprende, explica y mejora continuamente la operación de marketing.

---

## Criterio que gobierna los próximos sprints

> Que cada cliente perciba que el sistema es inteligente en los primeros cinco minutos de uso.

No demostrar que la IA es correcta. Demostrar que es comprensible.

---

## Hoja de ruta

| Sprint | Foco |
|---|---|
| Sprint 7 | Campaign Strategy — el sistema explica la estrategia completa de una campaña |
| Sprint 8 | Executive Intelligence — panel CMO con conclusiones, riesgos, oportunidades |
| Sprint 9 | Autonomous Operations — Recommendations → acciones automáticas con supervisión configurable |
