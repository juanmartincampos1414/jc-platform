# Build Rules
## JC AI Agency · Product Operating System
**Versión:** 0.1 · Junio 2026 · Vigencia: inmediata

---

> Estas reglas son obligatorias. No son sugerencias. Cuando haya dudas sobre si algo puede avanzar, la respuesta está en estas reglas.

---

## Regla 1 — Nada nuevo sin documento

Antes de construir cualquier feature, ruta o tabla nueva:
1. Agregar la entidad a `/docs/03-product-architecture/domain-model.md`
2. Agregar la capacidad a `/docs/03-product-architecture/capability-map.md`
3. Si es una decisión técnica no obvia → escribir ADR en `/docs/09-decisions/`

**Por qué:** El costo de documentar antes es 10 minutos. El costo de documentar después es un sprint entero, si alguien lo hace.

---

## Regla 2 — Nada en producción si sigue siendo mock

Ningún componente que use datos hardcodeados (`MOCK_*`, constantes falsas) puede llamarse "terminado".

Si hay un `MOCK_STATS` o un `generateMockPosts()` en el código que está en producción, ese módulo está en estado **WIP** y no se puede presentar a un cliente como funcional.

**Excepción permitida:** Variables de desarrollo local (`DEMO_MODE` en localhost) mientras haya una tarea activa para conectar a DB real.

---

## Regla 3 — Toda feature debe pertenecer a una capability

Antes de construir cualquier botón, pantalla o API route, responder:
> ¿A cuál de las 18 capabilities definidas en capability-map.md pertenece esto?

Si no pertenece a ninguna → o se agrega la capability o se descarta la feature.

---

## Regla 4 — Toda capability debe tener entidades claras

Cada capability opera sobre entidades del domain model. Si una feature no tiene entidades claras, el modelo de datos no está bien definido. No avanzar hasta tener el schema claro.

---

## Regla 5 — Toda entidad debe tener owner y lifecycle

Cada tabla nueva debe definir:
- `workspace_id` (owner — quién posee el dato)
- `status` con estados válidos y transiciones
- `created_at` + `updated_at`
- Políticas RLS

---

## Regla 6 — Todo output IA debe guardar input, prompt, modelo, versión y resultado

Cada llamada a Claude o fal.ai debe crear un registro en `ai_jobs`:
```typescript
// Antes de llamar a la IA:
const jobId = await createAiJob({ workspace_id, agent, model, input })

// Después de recibir respuesta:
await updateAiJob(jobId, { output, tokens_input, tokens_output, cost_usd, status: 'completed' })
```

Si un output de IA no tiene trazabilidad, no se puede mejorar ni auditar.

---

## Regla 7 — Toda acción crítica debe emitir un evento

Las siguientes acciones **siempre** deben insertar en `activity_logs`:
- Post aprobado / rechazado / publicado
- Documento firmado
- Mes generado
- Suscripción activada / cancelada
- Cuenta social conectada / desconectada
- Influencer aprobado

```typescript
await emitEvent({
  workspace_id,
  action: 'post.approved',
  entity_type: 'post',
  entity_id: postId,
  user_id: user.id,
})
```

---

## Regla 8 — Todo evento importante alimenta activity log o memory

El activity log no es optional. Es la única forma de que el Dashboard muestre datos reales y de que el sistema aprenda.

Si un evento ocurre y no queda registrado, para el sistema no ocurrió.

---

## Regla 9 — Todo módulo debe soportar workspace_id

No existe campo, tabla, API route ni componente sin `workspace_id`.

Si un módulo puede mostrar datos de otro workspace por error → hay un bug de seguridad.

El RLS de Supabase es la última línea de defensa, no la primera. La primera es que el código siempre filtre por workspace_id.

---

## Regla 10 — Todo token externo debe guardarse seguro

Los tokens de Meta, Google, TikTok, MP y cualquier servicio externo:
- **NUNCA** en plaintext en DB (actualmente violado en `social_credentials`)
- **NUNCA** en logs de console
- **NUNCA** en el cliente (browser)
- Siempre encriptados con `pgcrypto` o Supabase Vault
- Solo accesibles desde Server Components o API routes

---

## Regla 11 — Toda integración puede desconectarse

Cada integración externa (Meta, Google, TikTok) debe tener:
- Un botón de "Desconectar" en la UI
- Una API route que limpia el token de DB
- El sistema debe funcionar degradado sin la integración (sin publicación automática, sin métricas de esa red)

No puede haber un estado donde desconectar una integración rompa el sistema.

---

## Regla 12 — Todo cliente real debe estar separado de datos de prueba

- Workspace `ws-1` es para demo y desarrollo
- Los workspaces con `id` real son clientes reales
- No mezclar datos de prueba con datos reales en la misma instancia de producción
- Si se necesita datos de prueba en prod → usar workspace dedicado de JC AIgency para tests

---

## Regla 13 — Toda deuda técnica debe documentarse

Si durante el desarrollo se identifica deuda técnica que no se puede resolver ahora:
1. Agregar a `/docs/00-start-here/product-reality-audit.md` en la sección correspondiente
2. Con: descripción, impacto, sprint sugerido para resolver

No dejar deuda invisible.

---

## Regla 14 — Todo sprint debe cerrar con learnings

Al finalizar cada sprint, escribir en `/docs/10-sprints/sprint-NNN-learnings.md`:

```markdown
## Qué se construyó:
## Qué cambió respecto al plan:
## Qué se rompió:
## Qué aprendimos:
## Qué deuda nueva quedó:
## Qué decisión nueva apareció:
```

---

## Regla 15 — Todo cambio relevante debe generar ADR

Una decisión es "relevante" si:
- Elige una tecnología, librería o servicio externo
- Cambia la arquitectura de datos (nueva tabla, relación nueva)
- Cambia el modelo de negocio (nuevo plan, nuevo precio)
- Cambia una decisión anterior documentada en un ADR previo

Formato en `/docs/09-decisions/ADR-NNN-titulo.md`.

---

## Regla 16 — Domain Enum Rule

Toda modificación de un enum del dominio obliga a revisar todos sus consumidores antes de deployar.

**Flujo obligatorio:**

```
Dominio cambia (nuevo estado, nuevo tipo)
        ↓
Actualizar Schema Contract
        ↓
grep en codebase por el enum modificado
        ↓
Actualizar todos los mappings y CONFIG en UI
        ↓
Smoke Test del módulo afectado
        ↓
Deploy
```

**Por qué existe esta regla:** La regresión de Social Media en Sprint 5 demostró que el dominio puede evolucionar correctamente (Assets incorporó `draft`) mientras la UI sigue esperando el contrato anterior. El error no fue de React ni de Next — fue un bug de contrato. Nunca asumir que un enum permanece constante.

**Aplicación:** Cualquier adición a `AssetStatus`, `PostStatus`, `MemoryType`, `DomainEvent`, `Channel`, `RecommendationStatus` u otros enums del dominio activa automáticamente esta regla.

---

## Regla 17 — Domain Evolution Rule

Cada vez que el dominio evoluciona, responder tres preguntas antes de cerrar el sprint.

**1. ¿Qué estructuras nuevas aparecieron?**

Identificar: nuevos estados de enum, nuevas tablas, nuevas relaciones, nuevos campos obligatorios.

**2. ¿Qué consumidores dejan de conocer el dominio?**

Buscar: componentes de UI, API routes, adapters, engines, y prompts de IA que operan sobre las estructuras modificadas.

**3. ¿Qué documento del Framework debe actualizarse?**

Seleccionar al menos uno: Schema Contract / Reflection / ADR / Domain Freeze / Build Rules.

**Regla:** Nunca actualizar únicamente el código. Un cambio de dominio sin documentación es deuda conceptual.

---

## Regla 18 — Visible Intelligence Rule

Toda capacidad nueva del backend debe responder una pregunta antes de considerarse terminada:

> **¿Dónde la ve el usuario?**

Si la respuesta es "en ningún lado" → la capacidad no está terminada. El backend generó valor. El producto todavía no lo entregó.

**Aplicación directa:** cada nuevo engine, cada nuevo tipo de Memory, cada nuevo evento que el sistema emita debe tener una superficie visible correspondiente — un panel, un badge, una línea de texto, una explicación. Lo que el usuario no puede ver no puede valorar.

**Corolario:** cuando se planifique un sprint de backend, incluir en el mismo sprint la superficie visible. No deferir la UI a "un sprint futuro".

---

## Regla 19 — Explainability First

Toda nueva capacidad inteligente del sistema deberá responder tres preguntas antes de considerarse terminada:

> **1. ¿Qué sabe el sistema?**
> **2. ¿Por qué lo sabe?**
> **3. ¿Cómo afecta la próxima decisión?**

Si alguna respuesta no puede mostrarse al usuario de forma comprensible, la capacidad todavía no está terminada.

No alcanza con que la IA sea correcta. Debe ser explicable.

**Distinción con Regla 18:** Regla 18 (Visible Intelligence) exige que toda capacidad backend tenga una superficie visible. Regla 19 (Explainability First) exige que esa superficie explique el razonamiento — no solo muestre el resultado.

- Regla 18: *¿Dónde lo ve el usuario?*
- Regla 19: *¿Entiende el usuario por qué?*

**Aplicación directa:** toda Recommendation, Decision, o Memory que el sistema genere debe poder responder las tres preguntas anteriores en lenguaje humano. El criterio de aceptación no es técnico. Es comprensión del usuario.

---

## Regla 20 — Intelligence Presentation Levels

El mismo Knowledge Engine puede alimentar múltiples superficies. Lo que cambia no es la inteligencia — es la forma en que se presenta según el consumidor.

**Tres niveles:**

| Nivel | Consumidor | Contexto | Presentación |
|---|---|---|---|
| Operacional | Ejecutor de campaña | Está tomando una decisión ahora | Síntesis: Decision + Confidence + Why + Action |
| Management | Líder de equipo | Quiere entender el estado general | Contexto: tendencias, cambios recientes, alertas |
| Executive | CMO / dueño | Está tomando decisiones de negocio | Narrativa: evolución, implicancias, recomendación estratégica |

**Regla de diseño:**

Antes de construir cualquier superficie de inteligencia, identificar el nivel del consumidor. La respuesta determina el formato — no el volumen de datos disponibles.

- Operacional → velocidad de comprensión. Menos es más.
- Management → contexto suficiente para priorizar.
- Executive → la inteligencia como historia del negocio.

**Aplicación directa:** Campaign Detail es Nivel 1. Executive Intelligence Panel (Sprint 8) es Nivel 3. Dashboard puede ser Nivel 2. Diseñar cada uno con el formato correcto para su nivel — no con el formato que resulte más fácil de implementar.

**Candidato RUN72 Core:** este patrón trasciende JC AI Agency. Todo producto construido sobre RUN72 Core tendrá el mismo problema: conocimiento único, experiencia diferenciada por consumidor. Este principio debe gobernar todos los futuros Executive Panels del Core.

Ver documento completo: `docs/02-product-operating-system/intelligence-levels.md`

---

## Anti-patrones prohibidos

Los siguientes patrones están prohibidos a partir de ahora:

| Anti-patrón | Por qué está prohibido |
|---|---|
| `const MOCK_X = [...]` en código de producción | Engaña al usuario, no es real |
| Prompts de IA hardcodeados en route files | No versionables, requieren deploy para cambiar |
| `console.log(token)` | Riesgo de seguridad, tokens en logs |
| `any` type en TypeScript sin comentario explicativo | Deuda de tipos, bugs silenciosos |
| API route sin validación de `workspace_id` | Bug de seguridad multi-tenant |
| Commit directo a main sin revisión | No hay staging, va directo a producción |
| `// TODO` sin issue o sprint asociado | Deuda invisible |

---

## Regla 21 — Autonomy Requires Permission, Not Just Confidence

El sistema nunca ejecuta una acción automáticamente basándose únicamente en su nivel de confidence.

Para que una acción autónoma sea válida se requieren **tres condiciones simultáneas**:

```
Confidence suficiente
        AND
Autonomy Policy lo permite
        AND
Action Class está autorizada
```

Ninguna condición reemplaza a las otras. Las tres son obligatorias.

**Las tres dimensiones pertenecen al dominio — ninguna al modelo:**

| Dimensión | Pregunta que responde | Quién la define |
|---|---|---|
| Confidence | ¿La decisión es suficientemente buena? | El sistema |
| Autonomy Policy | ¿Hasta dónde me autorizás a actuar? | El cliente |
| Action Class | ¿Qué nivel de riesgo tiene esta acción? | El dominio del producto |

---

### Autonomy Policy — cuatro niveles

| Nivel | Nombre | Comportamiento |
|---|---|---|
| 0 | Observation Only | El sistema observa. No recomienda. No ejecuta. |
| 1 | Recommendations | El sistema recomienda. El usuario ejecuta. |
| 2 | Approval Required | El sistema prepara la acción. Queda pendiente de aprobación humana. |
| 3 | Autonomous | El sistema ejecuta acciones de las clases autorizadas. Audit trail completo. Siempre reversible. |

---

### Action Class — tres clases de riesgo

| Clase | Riesgo | Ejemplos |
|---|---|---|
| A — Low Risk | Bajo | Programar publicaciones, reordenar calendario, generar contenido, actualizar borradores |
| B — Medium Risk | Medio | Publicar automáticamente, responder comentarios, aprobar assets |
| C — High Risk | Alto | Modificar presupuestos, activar/detener campañas, cambiar audiencias, enviar comunicaciones masivas |

Un cliente puede configurar, por ejemplo: Clase A → automática, Clase B → requiere aprobación, Clase C → nunca automática. Eso permite adopción gradual y reduce el riesgo de automatización significativamente.

**Regla de diseño:** toda nueva acción autónoma que se agregue al sistema debe declarar su Action Class antes de implementarse. La clase no puede ser inferida por el modelo — es una decisión de dominio explícita.

---

**Aplicación directa:** antes de ejecutar cualquier acción autónoma, verificar las tres condiciones. Si alguna falla, la acción no se ejecuta.

**Corolario:** la Autonomy Policy pertenece al cliente, no al modelo. La Action Class pertenece al dominio del producto, no al modelo. Un cambio de modelo, un aumento de confidence, o una mejora del sistema nunca modifica ninguna de las dos.

---

## Regla 22 — Frozen ≠ Validated

Un método, framework o artefacto **bien diseñado no está validado**. Solo está listo para usarse. Validar es otra cosa: demostrar que funciona en la realidad.

Todo artefacto de método tiene dos estados de ciclo de vida que nunca se confunden:

| Estado | Significa | Cómo se alcanza |
|---|---|---|
| **Frozen** | Listo para usarse. Diseño cerrado y versionado, sin cliente. | Cuando el diseño está completo. |
| **Validated** | Demostró funcionar en la realidad. | Cuando se usó al menos una vez en un caso real documentado. |

**Frozen no implica Validated.** Un método puede estar Frozen durante semanas o meses antes de validarse. Creer que algo está validado solo porque está bien diseñado es exactamente el error que esta regla previene. RUN72 es estricto con esta diferencia: *Frozen = listo para usar; Validated = demostró funcionar en la realidad.*

**Disciplina:**
- Todo método/framework declara su estado explícitamente: `Frozen vX.Y` o `Validated vX.Y`.
- Un artefacto solo pasa a `Validated vX.Y` cuando existe al menos un caso real que lo usó.
- Si durante la validación el método falla → **no se modifica la versión Frozen**. Se abre la siguiente versión (`vX.Y+1`), se registra la evidencia, se actualiza el ADR si corresponde y se emite un Evidence Package si aparece un principio nuevo. La trazabilidad de la evolución se preserva siempre.

**Estado de referencia actual:**

| Artefacto | Estado |
|---|---|
| Product Review Framework v1.0 | `Frozen` — aún no `Validated` (pendiente primer caso real) |

---

## Regla 23 — Capability Validation: construir no es validar

Mientras construimos JC AI Agency, **el producto marca el ritmo y RUN72 aprende observando**. Cada Sprint responde primero *¿qué capacidad nueva obtiene el cliente?* y recién después *¿qué aprendió RUN72?*. El cliente siempre primero. Cualquier descubrimiento del Framework se documenta como Evidence Package y nunca frena la evolución del producto.

Toda capacidad nueva pasa **Capability Validation** antes de considerarse terminada. No alcanza con que el código funcione: hay que demostrar que cambia cómo trabaja el cliente.

Cada capacidad responde cuatro preguntas, desde el punto de vista del cliente (no técnico):

| # | Pregunta | Cuidado |
|---|---|---|
| 1 | ¿Qué trabajo elimina? | Qué trabajo deja de existir — no qué automatiza |
| 2 | ¿Qué decisión mejora? | Qué decisión concreta ayuda a tomar — no qué información muestra |
| 3 | ¿Cómo sabemos que funcionó? | Evidencia observable, definida **antes** de construir — no opinión |
| 4 | ¿Qué comportamiento esperamos del cliente? | El comportamiento que cambia, explícito |

Toda capacidad importante tiene una **Capability Card** (`docs/capabilities/CAP-NNN-*.md`) con estado explícito:

```
Designed  →  Built  →  Frozen  →  Validated
```

Los dos últimos estados siguen la Regla 22. Una capacidad solo es `Validated` cuando existe evidencia observable de que cambió el comportamiento del cliente. **Built no implica Validated.**

Ver `capability-validation.md`.

---

## Regla 24 — Toda operación IA crítica tiene un presupuesto temporal

Una operación que sostiene un **flujo principal del producto** nunca debe depender de **una única llamada larga** contra un runtime con límite de duración. Si lo hace, el flujo principal queda a merced del presupuesto temporal de esa llamada — y cuando el contexto crece o el modelo se ralentiza, se rompe sin que la UI ni el modelo tengan la culpa.

**Origen:** incidente *Generate Month* (2026-07-01). El flujo principal de JClaude se rompía no por la UI ni por el modelo, sino porque una generación de un mes completo excedía el límite de 60s del runtime (Vercel Hobby). Parecía un problema del botón; era un problema de **presupuesto temporal**. Ver `docs/incidents/2026-07-01-generate-month-regression.md`.

**La regla:** toda operación IA que sostiene un flujo principal debe cumplir **al menos una** de estas condiciones:

- ejecutarse **por chunks** (dividir el trabajo en unidades más chicas);
- ejecutarse **en paralelo** (el reloj de pared ≈ la unidad más lenta, no la suma);
- ejecutarse como **background job** (el usuario no espera sincrónicamente);
- ejecutarse mediante **queue** (desacople total del request);
- o ejecutarse bajo un **runtime que soporte esa duración** (elegido explícitamente, no por default).

Antes de wirear una operación IA a un flujo principal, se responde: *¿en qué presupuesto temporal corre, y cuál de estas condiciones cumple?* Si la respuesta es "una sola llamada larga bajo un runtime que no la garantiza", **no está lista**.

Esto no es solo un fix — es un patrón arquitectónico de Fase II. Pensar las generaciones IA como llamadas individuales **no escala**; van pensadas como operaciones acotadas en el tiempo desde el diseño.

---

## Regla 25 — Flujo principal roto ⇒ se detiene el roadmap

Cuando un **flujo principal del producto** se rompe, la respuesta es siempre la misma, en este orden:

```
NO se agregan nuevas capacidades.
NO se continúan migraciones.
NO se sigue el roadmap.
Primero se recupera el flujo principal.
```

No se busca un parche: se busca la **causa raíz**, se **documenta**, se **corrige**, y **recién después** se retoma el roadmap exactamente donde se había detenido. El incidente *Generate Month* (2026-07-01) confirmó que esta disciplina funciona: recuperar el corazón del producto antes de seguir construyendo fortalece más al producto que cualquier ladrillo nuevo.

---

*Documento vive en `/docs/02-product-operating-system/build-rules.md`*  
*Este documento se lee al inicio de cada sprint y antes de cada feature*
