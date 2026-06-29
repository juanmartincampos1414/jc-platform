# Intelligence Presentation Levels
## RUN72 Core OS — Arquitectura de experiencia de inteligencia

**Versión:** 1.0 · 2026-06-28
**Origen:** Sprint 6 Review Addendum — Executive Intelligence
**Clasificación:** `[Core Primitive Candidate]` — ver `foundations-design.md`
**Alcance:** JC AI Agency + cualquier producto construido sobre RUN72 Core OS

---

## El principio

El conocimiento es único. La experiencia cambia según quién lo consume.

El mismo Knowledge Engine — con las mismas Memories, Decisions y Recommendations — debe poder presentarse de tres formas distintas. Lo que diferencia cada forma no es la cantidad de datos. Es el contexto del consumidor y el tipo de decisión que necesita tomar.

---

## Tres niveles

### Nivel 1 — Operacional

**Consumidor:** ejecutor de campaña, content manager, aprobador de assets.

**Contexto:** está haciendo trabajo. Necesita una respuesta rápida para tomar la próxima decisión.

**Lo que necesita ver:**
- La decisión concreta.
- El confidence del sistema.
- El razonamiento inmediato (Why).
- La acción recomendada.

**Lo que no necesita:** historia, contexto de semanas anteriores, implicancias estratégicas.

**Principio de diseño:** velocidad de comprensión. La inteligencia aparece en el momento exacto en que es relevante, en el formato más comprimido posible.

**Implementación actual:** Campaign Detail — Brand Intelligence Panel, toggle "¿Por qué?", Learning Timeline filtrado.

---

### Nivel 2 — Management

**Consumidor:** líder de cuenta, director de marketing.

**Contexto:** no está ejecutando una tarea específica. Quiere entender el estado general para priorizar recursos y detectar problemas antes de que escalen.

**Lo que necesita ver:**
- Tendencias recientes (qué cambió esta semana).
- Alertas de bajo confidence o patrones preocupantes.
- Comparación entre campañas o marcas.
- Estado del aprendizaje del sistema.

**Principio de diseño:** contexto suficiente para priorizar. Ni el detalle operacional ni el resumen ejecutivo — el punto intermedio donde los problemas son visibles antes de que se conviertan en urgencias.

**Implementación actual:** no existe. Candidato natural: Dashboard workspace.

---

### Nivel 3 — Executive

**Consumidor:** CMO, dueño de empresa, inversor.

**Contexto:** no está en el sistema a diario. Cuando entra, necesita entender rápidamente si el negocio va en la dirección correcta y qué decisiones requieren su atención.

**Lo que necesita ver:**
- Narrativa de evolución, no datos.
- Implicancias de negocio, no métricas técnicas.
- Riesgos y oportunidades concretas.
- La próxima decisión estratégica que el sistema recomienda.

**Ejemplo de salida Nivel 3:**

> Durante las últimas seis campañas la plataforma detectó un cambio sostenido hacia Instagram Reels.
>
> La confianza del modelo aumentó de 0.71 a 0.92 debido a 148 eventos observados y 24 decisiones aceptadas.
>
> El sistema recomienda redistribuir un 18% del presupuesto actualmente asignado a Facebook hacia Instagram durante las próximas dos semanas.

El objetivo no es explicar una decisión. Es explicar la evolución del negocio.

**Principio de diseño:** la inteligencia como historia. El sistema no muestra lo que aprendió — muestra lo que eso significa para el negocio del cliente.

**Implementación futura:** Executive Intelligence Panel — Sprint 8.

---

## Tabla comparativa

| Dimensión | Nivel 1 — Operacional | Nivel 2 — Management | Nivel 3 — Executive |
|---|---|---|---|
| Consumidor | Ejecutor | Líder | CMO / dueño |
| Frecuencia de uso | Diario | Semanal | Mensual / on-demand |
| Tiempo de atención | Segundos | Minutos | Una lectura |
| Formato | Chips, barras, toggles | Tendencias, alertas | Párrafos, narrativa |
| Unidad de información | Decision + Why | Cambio + Alerta | Evolución + Implicancia |
| Acción esperada | Aprobar / rechazar | Reasignar / escalar | Decidir / autorizar |
| Dato oculto | Historia | Detalle operacional | Detalle técnico |
| Implementación | Campaign Detail ✅ | Dashboard ❌ | Executive Panel ❌ |

---

## Arquitectura de implementación

Los tres niveles comparten la misma fuente de datos:

```
Knowledge Engine
  └── Memories (confidence, tipo, scope)
  └── Decisions (rationale, supporting_knowledge)
  └── Recommendations (acción, estado, resultado)
  └── Learning Events (causa → efecto)

        ↓              ↓               ↓
   Nivel 1          Nivel 2         Nivel 3
   (síntesis)      (contexto)      (narrativa)
```

La diferencia no está en los datos. Está en el prompt de IA que los procesa y en el componente que los renderiza.

Cada nivel tiene su propio:
- **Prompt de síntesis** — instrucción a Claude para transformar los datos crudos en el formato correcto.
- **Componente de presentación** — superficie visual adaptada al consumidor.
- **Refresh rate** — Nivel 1 en tiempo real, Nivel 2 diario, Nivel 3 semanal o on-demand.

---

## Candidato RUN72 Core

Este patrón no pertenece a JC AI Agency.

Pertenece al Core OS.

Porque cualquier producto que construya inteligencia sobre datos tendrá este mismo problema: la misma información necesita presentarse de tres formas distintas según quién la consume.

**Implementación sugerida para el Core:**

Un módulo `intelligence-renderer` que recibe:
```typescript
type IntelligenceRenderRequest = {
  level:    "operational" | "management" | "executive"
  data:     { memories: Memory[], decisions: Decision[], recommendations: Recommendation[] }
  context:  { entityType: string, entityId: string, timeWindow: string }
}
```

Y devuelve el formato apropiado para cada nivel. Los productos del Core lo llaman con el nivel correcto para cada superficie.

---

## Regla de diseño permanente

Antes de construir cualquier superficie de inteligencia, responder:

> ¿Quién consume esto y qué decisión necesita tomar?

La respuesta determina el nivel. El nivel determina el formato.

No al revés.

---

*Documento vive en `/docs/02-product-operating-system/intelligence-levels.md`*
*Relacionado: `build-rules.md` Regla 20 · `capability-map.md` Capability 19 (AI Experience)*
