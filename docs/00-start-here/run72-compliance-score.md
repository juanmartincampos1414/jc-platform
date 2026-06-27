# RUN72 Compliance Score
## JC AI Agency · Sprint -1
**Fecha:** Junio 2026 · **Evaluador:** Claude (Technical Audit)

---

> **Instrucción:** Scores sin inflar. 0% = no existe. 100% = listo para producción en ese área.

---

## Tabla de compliance

| Área | Score | Riesgo | Qué falta | Sprint |
|---|---|---|---|---|
| **Producto** | 25% | 🔴 Alto | PRD, north star definido, propuesta de valor clara, sin mocks en flujo principal | Sprint -1 |
| **Arquitectura** | 20% | 🔴 Alto | Domain model, entities, campaign como entidad central, event architecture | Sprint -1 |
| **Código** | 40% | 🟡 Medio | Mocks en producción, hardcoding, sin validación Zod, sin error boundaries, prompts en código | Sprint 0 |
| **Data** | 35% | 🔴 Alto | Sin migrations, sin activity_log, sin ai_jobs, sin campaigns, tokens en plaintext, sin Storage | Sprint 0 |
| **AI** | 45% | 🟡 Medio | JClaude funciona pero: prompts hardcodeados, sin trazabilidad, sin memory, sin versionado, caps en 12 posts | Sprint 1 |
| **Knowledge** | 5% | 🔴 Crítico | Todo el conocimiento vive en conversaciones de Claude o en la cabeza de Juan. Cero documentado. | Sprint -1 |
| **Docs** | 5% | 🔴 Crítico | Sin README útil, sin PRD, sin ADRs, sin schema versionado, sin roadmap | Sprint -1 |
| **Deploy** | 30% | 🟡 Medio | Deploy manual via CLI, GitHub webhook roto, sin staging, sin CI/CD, Hobby plan con límites | Sprint 0 |
| **Security** | 20% | 🔴 Alto | Tokens OAuth en plaintext, sin rate limiting, sin input validation, access_token ads sin encrypt | Sprint 0 |
| **Testing** | 0% | 🔴 Crítico | Cero tests — unit, integration, e2e. Nada. | Sprint 1 |
| **Observability** | 0% | 🔴 Crítico | Sin logging, sin error tracking, sin alertas, sin métricas de uso IA | Sprint 1 |
| **Scalability** | 25% | 🔴 Alto | Multi-tenant funciona pero: Vercel Hobby timeouts, sin caché, sin queue, sin rate limiting | Sprint 2 |
| **Commercial Readiness** | 30% | 🟡 Medio | MercadoPago funcional, pero: mocks en UI, promesas no defendibles en ads/legales/social | Sprint 0 |

---

## Score global: **22%**

---

## Detalle por área

### Producto (25%)

**Qué existe:**
- Visión general del producto en la cabeza de Juan
- JClaude como módulo funcional con propuesta de valor clara
- Portal de cliente con 8 módulos (6 mock)
- Suscripción funcional

**Qué falta para llegar a 80%:**
- PRD escrito y versionado
- North star definido: ¿es portal de agencia, SaaS o AI Marketing OS?
- Campaign como entidad central (actualmente no existe)
- Todos los módulos conectados a DB real
- Propuesta de valor documentada y testeable

---

### Arquitectura (20%)

**Qué existe:**
- Multi-tenant básico (workspaces + RLS)
- Separación client/server con App Router
- Route groups `(admin)`, `(auth)`, `(client)`

**Qué falta para llegar a 80%:**
- Domain model documentado
- Ubiquitous language definido
- Campaign como entidad principal
- Event architecture
- Capability map
- Separation of concerns entre UI, API routes y DB queries

---

### Código (40%)

**Qué existe:**
- TypeScript correcto
- Next.js App Router bien usado
- RLS en Supabase
- Middleware de auth funcional
- API routes reales para JClaude

**Qué falta para llegar a 80%:**
- Eliminar todos los MOCK_* en producción
- Validación con Zod en todas las API routes
- Error boundaries en componentes
- Prompts fuera del código
- Sin `any` types
- Custom error handling consistente

---

### Data (35%)

**Qué existe:**
- Schema SQL en un archivo (no versionado)
- 12 tablas con RLS
- Multi-tenant con workspace_id en todas las tablas
- Funciones helper RLS (user_in_workspace, is_jc_admin)

**Qué falta para llegar a 80%:**
- Supabase Storage inicializado y configurado
- Migrations en lugar de schema.sql monolítico
- `activity_logs` table
- `ai_jobs` table
- `campaigns` table
- `ai_prompt_versions` table
- `brand_memories` table
- `performance_snapshots` table
- Tokens OAuth encriptados
- Datos de prueba separados de producción
- Backups configurados

---

### AI (45%)

**Qué existe:**
- Claude `claude-sonnet-4-6` para generación de calendario
- fal.ai Flux Schnell para imágenes
- Anthropic para ads analysis, influencer fit, social copy
- 3-tier JSON parsing robusto
- Límite inteligente de 12 posts para evitar timeout

**Qué falta para llegar a 80%:**
- Prompts en DB (tabla `jclaude_prompts`)
- AI jobs con trazabilidad (input, prompt, modelo, output, status)
- Brand memory persistente
- Versionado de prompts
- Métricas de calidad de output
- Performance feedback loop
- Seedance para video
- Límite de 12 posts resuelto (Vercel Pro o Edge Functions)

---

### Knowledge (5%)

**Qué existe:**
- Conversaciones de Claude (no transferibles)
- Código en repo

**Qué falta para llegar a 80%:**
- Este mismo sistema de docs en `/docs`
- ADRs de decisiones tomadas
- README técnico
- Prompts documentados
- Conocimiento de Juan capturado en markdown

---

### Docs (5%)

**Qué existe:**
- `supabase/schema.sql` (el más valioso)
- Ningún otro documento técnico

**Qué falta para llegar a 80%:**
- README técnico completo
- PRD
- Domain model
- API documentation
- Deploy runbook
- Onboarding guide

---

### Deploy (30%)

**Qué existe:**
- Vercel Hobby plan funcionando
- Deploy manual via `npx vercel --prod`
- Variables de entorno en Vercel
- URL de producción: `aigency.jcmarketing.digital`
- Cron job diario a las 09:00

**Qué falta para llegar a 80%:**
- Arreglar GitHub webhook o migrar a Vercel Git integration
- Staging environment
- CI/CD con checks automáticos
- Vercel Pro (para resolver timeout de 60s)
- Deploy runbook documentado
- Rollback procedure

---

### Security (20%)

**Qué existe:**
- RLS en Supabase (bien configurado)
- Middleware de auth (funcional)
- SUPABASE_SERVICE_ROLE_KEY solo en server-side
- Rutas públicas correctamente configuradas

**Qué falta para llegar a 80%:**
- Encriptar tokens OAuth Meta
- Rate limiting en todas las API routes de IA
- Input validation con Zod
- CORS configurado explícitamente
- Sin logs de tokens en console
- Secrets rotation procedure
- Security headers (CSP, HSTS, etc.)

---

### Testing (0%)

**Qué existe:** Nada.

**Qué falta para llegar a 60% mínimo viable:**
- Tests de API routes críticas (generate-month, register, mercadopago webhook)
- Tests de parsing de respuestas Claude
- Test de OAuth flow
- E2E básico del flujo JClaude

---

### Observability (0%)

**Qué existe:** Logs de Vercel (básicos, no estructurados).

**Qué falta para llegar a 60% mínimo viable:**
- Sentry o similar para error tracking
- Logs estructurados en API routes críticas
- Alerta cuando falla generate-month
- Monitoreo de costo de Anthropic API
- Dashboard de uso por workspace

---

### Scalability (25%)

**Qué existe:**
- Multi-tenant con RLS (escala bien hasta ~100 workspaces)
- Supabase maneja carga de DB

**Qué falta para llegar a 80%:**
- Vercel Pro para eliminar timeout de 60s
- Edge Functions para generación de contenido
- Queue para ai_jobs (no bloquear UI)
- Caché de brand profiles
- Rate limiting por workspace
- Cost controls para uso de IA

---

### Commercial Readiness (30%)

**Qué existe:**
- MercadoPago con 3 planes reales
- 7 días free trial configurado
- Checkout flow funcional
- URL de producción

**Qué falta para llegar a 80%:**
- Eliminar mocks del flujo principal
- Dashboard real
- Firma de documentos real
- Autopublish verificado
- Password reset funcional
- Términos y privacidad correctos
- Onboarding flow documentado

---

## Plan de mejora de scores por sprint

| Sprint | Áreas que sube | Target |
|---|---|---|
| Sprint -1 | Knowledge, Docs, Producto, Arquitectura | Knowledge 40%, Docs 40%, Producto 40% |
| Sprint 0 | Código, Data, Security, Deploy, Commercial | Código 60%, Data 55%, Security 50% |
| Sprint 1 | AI, Observability, Testing | AI 65%, Observability 40%, Testing 30% |
| Sprint 2 | Scalability, Ads real | Scalability 55% |
| Sprint 3 | Commercial Readiness | Commercial 70% |

---

*Documento generado durante Sprint -1 — RUN72 Product Freeze*
