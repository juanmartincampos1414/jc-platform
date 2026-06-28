# Architecture Review — Post Sprint 5
## RUN72 OS × JC AI Agency

**Fecha:** 2026-06-28
**Tipo:** Retrospectiva arquitectónica de fase

---

## El ciclo está completo

Con Sprint 5, el sistema ejecuta por primera vez un ciclo cognitivo completo en producción:

```
Campaign
    ↓
Assets
    ↓
Knowledge
    ↓
Decision
    ↓
Recommendation
    ↓
User Feedback
    ↓
Learning
    ↓
Nueva generación
```

No es una hipótesis. Es comportamiento validado.

---

## Lo que realmente ocurrió con la regresión de Social Media

La regresión no fue un error de React ni de Next.js.

Fue un bug de contrato — la consecuencia natural y esperada de que el dominio evolucionó correctamente mientras la UI no fue actualizada en paralelo.

**Antes:** Social Media consumía `social_posts` con estados conocidos: `pending / approved / rejected / needs_changes / published`.

**Después:** Social Media consume `assets` como fuente primaria. Assets incorporó el estado `draft` como parte natural de su ciclo de vida (generación → borrador → aprobación → publicación).

**El resultado:** La UI no conocía el nuevo estado. `STATUS_CONFIG["draft"]` era `undefined`. El render rompió.

**La lectura correcta:** el dominio evolucionó correctamente. La arquitectura desacoplada funcionó exactamente como fue diseñada. El punto de falla fue la ausencia de la Domain Enum Rule.

---

## Dos nuevas reglas permanentes

### Domain Enum Rule (Regla 16)

Toda modificación de un enum del dominio obliga a revisar todos sus consumidores. El flujo: dominio cambia → Schema Contract → grep consumidores → actualizar mappings → smoke test → deploy.

### Domain Evolution Rule (Regla 17)

Cada vez que el dominio evoluciona, tres preguntas obligatorias antes de cerrar el sprint: qué estructuras nuevas aparecieron, qué consumidores dejaron de conocer el dominio, qué documento del Framework se actualiza. Nunca solo el código.

---

## Confirmaciones arquitectónicas

### Assets es el objeto oficial del dominio (ADR-005)

La UI ya consume `assets` como fuente primaria. `social_posts` es legacy. No se elimina todavía, pero no se crean nuevos registros desde ningún flujo nuevo.

### El Learning Boundary está congelado

- `workspace`: conocimiento operativo, nunca sale del workspace
- `brand`: activo más valioso, aislado por `brand_id`, nunca se mezcla entre Brands
- `platform`: solo patrones agregados anónimos — no implementado hasta tener ≥5 Brands activas

### El Schema Contract Protocol sigue siendo el único método de diseño

Ninguna query, endpoint o componente puede escribirse sin validar contra el Schema Contract primero. La regresión de Social Media habría sido detectada antes si el Domain Enum Rule hubiera existido al momento del Sprint 3B.

---

## Cambio de fase

Los primeros 5 sprints fueron de infraestructura. La distribución fue aproximadamente:

```
80% arquitectura
20% producto visible
```

A partir de este punto, la distribución se invierte:

```
20% arquitectura
80% producto visible
```

La base demostró ser suficientemente estable. El foco pasa a capacidades que un cliente puede usar todos los días.

---

## Componentes validados en producción

| Componente | Estado |
|-----------|--------|
| Event Architecture | ✅ producción |
| Knowledge Engine | ✅ producción |
| Decision Engine | ✅ producción |
| Recommendation Engine | ✅ producción |
| Learning Engine | ✅ producción |
| Campaign Command Center | ✅ producción |
| Schema Contract Protocol | ✅ adoptado |
| Learning Boundary | ✅ congelado |
| Domain Enum Rule | ✅ formalizado |
| Domain Evolution Rule | ✅ formalizado |

---

## Próxima etapa — Capacidades visibles

Todo sprint nuevo debe responder: ¿qué puede hacer el cliente que no podía hacer antes?

Dirección validada:
- Publicación automática a redes sociales (Meta primero)
- Calendario inteligente de contenido
- Aprobación colaborativa con flujo multi-usuario
- Reporting ejecutivo por campaña
- Integración TikTok
- Generación audiovisual (imagen para assets)
- Optimización automática basada en performance real

Ninguna de estas capacidades requiere nueva infraestructura de base. Todas se apoyan sobre el dominio existente.

---

## Estado de RUN72 Core

Los componentes validados en JC AI Agency son candidatos futuros a RUN72 Core. Todavía no extraer — el tiempo correcto es cuando una segunda aplicación necesite los mismos componentes. En ese momento, la extracción será trivial porque el dominio ya está bien delimitado.

Lo que sí está listo para documentar como principio de RUN72:

> *Un sistema de marketing inteligente no se diferencia por el modelo de lenguaje que usa. Se diferencia por la memoria que acumula y la capacidad de aprender del comportamiento de sus usuarios.*
