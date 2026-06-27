# Knowledge Architecture
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

> El problema más crítico de JC AI Agency hoy no es técnico. Es que el conocimiento del producto vive en conversaciones de Claude y en la cabeza de Juan. Cuando se cierra una sesión, se pierde contexto. Este documento existe para resolver eso.

---

## 1. Dónde vive el conocimiento hoy

### Código (src/)
**Qué contiene:**
- Lógica de negocio embebida en componentes
- Prompts de IA hardcodeados en API routes
- Decisiones de arquitectura implícitas en la estructura de carpetas
- Reglas de negocio en middleware y RLS

**Riesgo:** Ilegible para no-desarrolladores. No documentado. Se pierde al refactorizar.

---

### Conversaciones de Claude (sesiones)
**Qué contiene:**
- Decisiones tomadas y el porqué
- Bugs encontrados y cómo se resolvieron
- Alternativas descartadas
- Contexto de integraciones (Meta app review, MercadoPago config)
- Historial de iteraciones de prompts

**Riesgo:** 🔴 CRÍTICO. Todo este conocimiento desaparece al cerrar contexto. No es transferible a otro desarrollador, a un nuevo Claude, ni a Juan en 6 meses.

---

### Cabeza de Juan
**Qué contiene:**
- Visión del producto
- Decisiones comerciales
- Relación con clientes
- Credenciales y accesos
- Por qué se construyó cada cosa como está

**Riesgo:** 🔴 CRÍTICO. No documentado en ningún lado. Punto único de falla.

---

### Supabase (DB)
**Qué contiene:**
- Schema real en `supabase/schema.sql`
- Datos reales de workspaces y suscripciones
- Tokens OAuth (plaintext — riesgo de seguridad)

**Riesgo:** MEDIO. Schema en un solo archivo sin migrations. Sin versioning.

---

### GitHub repo
**Qué contiene:**
- Código fuente
- Historial de commits (mensajes en español, descriptivos)
- Sin README útil, sin CHANGELOG, sin ADRs

**Riesgo:** MEDIO. El código existe pero sin documentación que lo acompañe.

---

### No existe en ningún lado
- PRD
- Roadmap
- Domain model
- ADRs (decisiones)
- Runbooks de deploy
- Documentación de integraciones
- Configuración de servicios externos
- Onboarding guide

---

## 2. Clasificación del conocimiento

### Conocimiento explícito (capturado, transferible)
- Schema SQL de Supabase (parcialmente)
- Commits de git (mensajes descriptivos)
- Variables de entorno listadas (sin valores)

### Conocimiento implícito (existe pero no está capturado)
- Por qué se eligió Next.js sobre otras opciones
- Por qué MercadoPago y no Stripe
- Por qué JClaude como módulo premium separado
- Por qué el schema tiene `social_posts` Y `jclaude_posts` (duplicación)
- Por qué el deploy es manual (webhook roto)
- Por qué los posts están capeados en 12

### Conocimiento perdido (fue decidido pero ya no hay registro)
- Historial completo de iteraciones de prompts que fallaron
- Por qué se removió `instagram_content_publishing` del scope
- Qué configuraciones de Meta App se hicieron y cuándo
- Por qué `post_type` tuvo que actualizarse con SQL manual

### Conocimiento duplicado (existe en varios lugares sin sincronía)
- Listas de planes (hardcodeadas en create-subscription, en la UI de JClaude, en este repo)
- La definición de "status" de posts (distinta en jclaude_posts vs social_posts)
- Configuración de scopes Meta (en el código y en Meta App dashboard)

### Conocimiento peligroso (existe y es incorrecto o engañoso)
- Dashboard con datos de mock que parecen reales
- Ads con métricas inventadas que JC muestra a clientes como si fueran reales
- URL `/forgot-password` linkeada pero ruta inexistente
- Promesa implícita de autopublish no verificado

### Conocimiento crítico (si se pierde, el producto no funciona)
- Credenciales de Meta App (META_APP_ID, META_APP_SECRET)
- Access token de MercadoPago
- Service role key de Supabase
- Webhook verify token de Meta: `jcaigency-webhook-2025`
- URL de producción: `aigency.jcmarketing.digital`
- La cuenta reviewer de Meta: `hola@jcmarketing.digital` con workspace `00000000-0000-0000-0000-000000000099`

---

## 3. Dónde debería vivir cada tipo de conocimiento

### → Markdown en `/docs` (este sistema)
- Decisiones de producto y arquitectura (ADRs)
- Domain model y ubiquitous language
- Roadmap
- Runbooks de deploy
- Configuración de servicios (sin valores, solo estructura)
- Bugs conocidos y resoluciones
- Prompts actuales (como referencia)

### → Base de datos (Supabase)
- Brand profiles por workspace
- Prompts versionados (tabla `jclaude_prompts`)
- AI jobs con input/output completo (tabla `ai_jobs`)
- Memorias de marca (tabla `brand_memories`)
- Activity logs
- Historial de aprobaciones

### → Código (como debe ser)
- Lógica de transformación
- Validaciones
- Routing
- Rendering

### → Variables de entorno documentadas (NO valores, solo keys)
- Lista completa en `/docs/04-technical-architecture/env-vars.md`

### → Claude Memory (sesiones persistentes)
- Preferencias de Juan
- Contexto de trabajo actual
- Decisiones de esta semana
- Feedback sobre forma de trabajo

---

## 4. Plan de captura de conocimiento

### Paso 1 — Captura inmediata (Sprint -1)
Documentar todo lo que existe AHORA antes de que se pierda más:
- [x] Product Reality Audit (`/docs/00-start-here/product-reality-audit.md`)
- [x] Product Constitution
- [x] Domain Model
- [x] Ubiquitous Language
- [ ] ADR de cada decisión técnica tomada
- [ ] Lista completa de variables de entorno
- [ ] Configuración de servicios externos (Meta App, MP, fal.ai)
- [ ] Runbook de deploy actual (CLI manual)

### Paso 2 — Captura continua (Sprint 0 en adelante)
- Cada bug resuelto → entrada en `/docs/00-start-here/known-issues.md`
- Cada decisión técnica → ADR en `/docs/09-decisions/`
- Cada sprint cerrado → learnings en `/docs/10-sprints/sprint-NNN-learnings.md`
- Cada integración configurada → doc en `/docs/04-technical-architecture/integrations/`

### Paso 3 — Captura automática (Sprint 1)
- Cada llamada IA → guardada en `ai_jobs` (input, output, modelo, tokens)
- Cada aprobación → guardada en `activity_logs`
- Cada publicación → guardada en `activity_logs`
- Cada pago → guardada en `billing_records`

---

## 5. Protocolo de no-pérdida de conocimiento

A partir de ahora, antes de cerrar cualquier sesión de trabajo:

1. **Si se tomó una decisión importante** → escribir ADR.
2. **Si se resolvió un bug** → documentar en known-issues.md con causa raíz y solución.
3. **Si se configuró una integración** → documentar en /docs/integrations/.
4. **Si se cambió el schema** → actualizar supabase/schema.sql + domain-model.md + migration file.
5. **Si se cambió un prompt** → actualizar el registro de prompt en /docs/06-ai-architecture/.

---

## 6. Stack de conocimiento objetivo

```
Nivel 1 — Conocimiento de producto
  /docs/01-product-constitution/
  /docs/03-product-architecture/

Nivel 2 — Conocimiento técnico
  /docs/04-technical-architecture/
  /docs/05-data-architecture/
  supabase/migrations/

Nivel 3 — Conocimiento de IA
  /docs/06-ai-architecture/
  DB: jclaude_prompts (versiones de prompts)
  DB: ai_jobs (historial de outputs)

Nivel 4 — Conocimiento de cliente/marca
  DB: jclaude_profiles (brand profiles)
  DB: brand_memories (aprendizajes por marca)
  DB: activity_logs (historial de acciones)

Nivel 5 — Conocimiento de performance
  DB: performance_snapshots
  DB: insights
  DB: recommendations
```

---

*Documento vive en `/docs/07-knowledge-architecture/knowledge-architecture.md`*
