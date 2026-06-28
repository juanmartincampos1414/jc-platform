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

*Documento vive en `/docs/02-product-operating-system/build-rules.md`*  
*Este documento se lee al inicio de cada sprint y antes de cada feature*
