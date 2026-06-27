# Product Reality Audit
## JC AI Agency · RUN72 OS Integration
**Versión:** 0.1 · Junio 2026  
**Autor:** Claude (Technical Audit) · Juan Campos (Context)  
**Estado:** Freeze point — no nuevas features hasta que este documento esté cerrado

---

## 1. Resumen ejecutivo

JC AI Agency tiene una base técnica real y funcional en su núcleo (auth, workspaces, JClaude, pagos), pero el 80% de la superficie visible de la plataforma son mocks. El producto parece más avanzado visualmente de lo que está funcionalmente. Esto es normal en fase 0, pero hay que ordenarlo antes de seguir.

El único módulo vendible hoy es **JClaude**. El resto del portal de cliente es UI sin backend conectado.

---

## 2. Auditoría por módulo

---

### AUTH

```
Módulo: Auth
Estado: ✅ Real
Qué hace hoy: Login con email/password. Registro auto para JClaude (crea user + workspace + workspace_user). Signout. Redirect por roles.
Qué debería hacer: + Password reset funcional. + OAuth (Google). + Invitation flow para clientes JC.
Qué datos usa: Supabase Auth (auth.users)
Qué datos debería usar: Ídem + invitation_tokens table
Tablas relacionadas: auth.users, workspace_users
APIs relacionadas: /api/auth/register, /api/auth/signout
Componentes principales: (auth)/login/page.tsx, middleware.ts
Qué está hardcodeado: Nada crítico
Qué falta: Password reset UI, invitation flow, MFA
Riesgo: MEDIO — /forgot-password está linkeado pero la ruta no existe
Prioridad: Sprint 0
```

---

### WORKSPACES

```
Módulo: Workspaces
Estado: ✅ Real
Qué hace hoy: Multi-tenant real. Cada cliente tiene workspace_id. RLS enforces isolation. JC admin ve todos.
Qué debería hacer: + Logo upload. + Settings. + Active services toggle. + Billing info.
Qué datos usa: workspaces, workspace_users
Qué datos debería usar: Ídem + files (logo), billing_records
Tablas relacionadas: workspaces, workspace_users
APIs relacionadas: /api/admin/create-client
Componentes principales: (client)/workspace/page.tsx, (admin)/admin/
Qué está hardcodeado: active_services array (no hay UI para cambiarlo)
Qué falta: Workspace settings page, logo upload, service toggle
Riesgo: BAJO
Prioridad: Sprint 1
```

---

### DASHBOARD

```
Módulo: Dashboard
Estado: ❌ 100% Mock
Qué hace hoy: Muestra 4 stats hardcodeados (4 posts, 1 doc, 3 influencers, 12 tareas). Muestra 5 items de actividad ficticia. Links a módulos.
Qué debería hacer: Leer de DB. Contar posts pendientes reales. Contar docs para firmar reales. Mostrar actividad real del workspace.
Qué datos usa: NINGUNO — todo hardcodeado en MOCK_STATS y MOCK_ACTIVITY
Qué datos debería usar: social_posts (count pending), legal_documents (count pending), influencers (count in_review), jclaude_posts (count draft), activity_logs (last 10)
Tablas relacionadas: social_posts, legal_documents, influencers, jclaude_posts, activity_logs (no existe)
APIs relacionadas: Ninguna activa
Componentes principales: (client)/workspace/[workspaceId]/page.tsx
Qué está hardcodeado: MOCK_STATS array, MOCK_ACTIVITY array, DEMO_MODE check
Qué falta: activity_logs table, queries reales, eventos que alimenten el feed
Riesgo: ALTO — si un cliente real ve el dashboard, ve datos de otra empresa
Prioridad: Sprint 0
```

---

### LEGALES

```
Módulo: Legales
Estado: ⚠️ Tabla existe, UI es Mock
Qué hace hoy: Muestra lista de documentos mock. Permite "firmar" con nombre escrito → setState local. El estado se pierde al recargar.
Qué debería hacer: Leer legal_documents de DB. Guardar firma en DB con timestamp y user_id. Subir PDF a Supabase Storage. Audit trail real.
Qué datos usa: MOCK_DOCS hardcodeados en el componente
Qué datos debería usar: legal_documents (title, status, file_url, signed_at, signed_by, signature_data)
Tablas relacionadas: legal_documents (existe pero no se usa)
APIs relacionadas: Ninguna — todo es setState local
Componentes principales: (client)/workspace/[workspaceId]/legales/page.tsx
Qué está hardcodeado: MOCK_DOCS con 3 documentos ficticios
Qué falta: Supabase Storage configurado, API route para firmar, leer de DB, upload de PDF por admin
Riesgo: ALTO — firma no persiste, promesa comercial rota
Prioridad: Sprint 0
```

---

### SOCIAL MEDIA

```
Módulo: Social Media
Estado: ❌ 100% Mock
Qué hace hoy: Lista posts mock. Permite aprobar/rechazar/comentar → setState local. Todo se pierde al recargar. Tiene botón "Sugerir copy con IA" que llama API real.
Qué debería hacer: Leer social_posts de DB. Guardar aprobaciones y comentarios en DB. Relacionar con campaigns. Relacionar con jclaude_posts.
Qué datos usa: generateMockPosts() hardcodeado en el componente
Qué datos debería usar: social_posts, post_comments, workspace_users
Tablas relacionadas: social_posts (existe), post_comments (existe) — ninguna se usa
APIs relacionadas: /api/ai/social-copy (funciona pero con datos mock)
Componentes principales: (client)/workspace/[workspaceId]/social-media/page.tsx
Qué está hardcodeado: generateMockPosts(), MONTHS array para navegación
Qué falta: Queries a DB, API routes CRUD, upload de imágenes, conexión con jclaude_posts
Riesgo: MUY ALTO — módulo completamente desconectado, aprobaciones se pierden
Prioridad: Sprint 0
```

---

### ADS

```
Módulo: Ads
Estado: ❌ 100% Mock
Qué hace hoy: Muestra 3 cuentas de ads ficticias (Meta, Google, TikTok). Muestra métricas hardcodeadas. Permite "Analizar con IA" → API real con datos mock.
Qué debería hacer: Leer ad_accounts de DB. Importar métricas reales vía Meta Ads API. Mostrar snapshots históricos. Generar insights reales.
Qué datos usa: MOCK_ACCOUNTS, MOCK_METRICS, MOCK_CAMPAIGNS — todos hardcodeados
Qué datos debería usar: ad_accounts, performance_snapshots (no existe), campaigns
Tablas relacionadas: ad_accounts (existe, sin datos reales)
APIs relacionadas: /api/ai/ads-analysis (funciona con datos mock), Meta Ads API (no conectada)
Componentes principales: (client)/workspace/[workspaceId]/ads/page.tsx
Qué está hardcodeado: Todo — cuentas, métricas, campañas, budgets
Qué falta: Meta Ads API connection, performance_snapshots table, import cron, real metrics
Riesgo: MUY ALTO — promete métricas reales pero muestra datos inventados
Prioridad: Sprint 2 (después de stabilization)
```

---

### INFLUENCERS

```
Módulo: Influencers
Estado: ❌ 100% Mock
Qué hace hoy: Lista 6 influencers ficticios con pipeline de estados. Permite mover estados → setState local. Botón "Fit IA" → API real con datos mock.
Qué debería hacer: Leer influencers de DB. Persistir cambios de estado. Relacionar con campaigns. Subir contenido de influencer. Audit trail.
Qué datos usa: MOCK_INFLUENCERS hardcodeados con 6 perfiles ficticios
Qué datos debería usar: influencers, campaigns (futura), files (entregables)
Tablas relacionadas: influencers (existe pero no se usa)
APIs relacionadas: /api/ai/influencer-fit (funciona con datos mock)
Componentes principales: (client)/workspace/[workspaceId]/influencers/page.tsx
Qué está hardcodeado: MOCK_INFLUENCERS array completo
Qué falta: Queries a DB, API routes CRUD, file upload para entregables, relación con campaigns
Riesgo: ALTO — pipeline no persiste, scouting se pierde
Prioridad: Sprint 1
```

---

### WEBS

```
Módulo: Webs
Estado: ⚠️ Tabla existe, UI probablemente mock
Qué hace hoy: No auditado en detalle — probablemente lista de proyectos web mock
Qué debería hacer: Gestión de proyectos web/landings. Milestones. Links. Aprobación cliente.
Qué datos usa: Desconocido sin auditar
Qué datos debería usar: web_projects
Tablas relacionadas: web_projects (existe)
APIs relacionadas: Ninguna conocida
Componentes principales: (client)/workspace/[workspaceId]/webs/page.tsx
Qué está hardcodeado: Desconocido
Qué falta: Definir si es project management o landings de campaña
Riesgo: BAJO — módulo secondary
Prioridad: Sprint 2 — después de definir si pertenece al core
```

---

### EXTRAS

```
Módulo: Extras
Estado: ⚠️ Tabla existe, UI probablemente mock
Qué hace hoy: Lista de servicios adicionales, probablemente mock
Qué debería hacer: Upsells con workflow, billing, entregables y aprobación
Qué datos usa: Desconocido
Qué datos debería usar: extras, billing_records
Tablas relacionadas: extras (existe)
APIs relacionadas: Ninguna
Componentes principales: (client)/workspace/[workspaceId]/extras/page.tsx
Qué está hardcodeado: Desconocido
Qué falta: Conectar a DB, billing flow, deliverables
Riesgo: BAJO — módulo secondary
Prioridad: Sprint 3
```

---

### JCLAUDE

```
Módulo: JClaude
Estado: ✅ Real (núcleo funcional)
Qué hace hoy:
  - Brand profile (guardar marca, tono, audiencia, industria) → DB real
  - Generate month (Claude API → 12 posts → jclaude_posts) → Real
  - Generate image (fal.ai Flux Schnell) → Real pero URL expira
  - Approve/reject posts → Real (update en DB)
  - Meta OAuth (conectar Instagram/Facebook) → Parcial (scopes limitados)
  - Autopublish Meta → Código existe, no verificado en prod
  - Suscripción MercadoPago → Real (starter $200K, pro $300K, enterprise $800K ARS)
  - 7 días free trial → Configurado en MercadoPago

Qué debería hacer:
  - + Video generation (Seedance)
  - + Storage permanente para imágenes (Supabase Storage)
  - + Prompts en DB (versionables, editables)
  - + AI jobs con trazabilidad completa
  - + Brand memory persistente
  - + Performance feedback loop
  - + Conexión con campaigns
  - + Autopublish verificado y monitoreado

Qué datos usa: jclaude_profiles, jclaude_posts, jclaude_subscriptions (todos reales)
Qué datos debería usar: + campaigns, ai_jobs, brand_memories, performance_snapshots
Tablas relacionadas: jclaude_profiles, jclaude_posts, jclaude_subscriptions
APIs relacionadas: /api/jclaude/* (8 routes), /api/mercadopago/*, /api/meta/webhook
Componentes principales: (client)/workspace/[workspaceId]/jclaude/page.tsx (700+ líneas)
Qué está hardcodeado: Prompts embebidos en generate-month/route.ts, posts capeados en 12 por timeout Vercel
Qué falta: Storage, Seedance, prompt DB, AI jobs table, memory model, autopublish tests
Riesgo: MEDIO — el core funciona pero tiene límites estructurales (Vercel 60s, imagen URLs expiran)
Prioridad: Sprint 1 (hardening)
```

---

### EQUIPO

```
Módulo: Equipo
Estado: ⚠️ UI existe, no auditada en detalle
Qué hace hoy: Probablemente muestra workspace_users
Qué debería hacer: Gestión de usuarios del workspace. Roles. Invitaciones. Permisos granulares.
Tablas relacionadas: workspace_users
Prioridad: Sprint 1
```

---

### ADMIN

```
Módulo: Admin (panel JC)
Estado: ⚠️ Parcial
Qué hace hoy: Crear cliente via API real. Ver lista de clientes. Ruta /admin/ protegida.
Qué debería hacer: + Ver todos los workspaces. + Editar cliente. + Toggle servicios. + Ver suscripciones. + Impersonate.
Tablas relacionadas: workspaces, workspace_users, jclaude_subscriptions
APIs relacionadas: /api/admin/create-client
Prioridad: Sprint 1
```

---

### FACTURACIÓN

```
Módulo: Facturación / Billing
Estado: ⚠️ Tabla existe, sin UI real
Qué hace hoy: billing_records table existe. MercadoPago webhook recibe eventos. No hay UI para facturación.
Qué debería hacer: Ver historial de pagos. Generar invoice. Marcar como pagado. Integración con MP.
Tablas relacionadas: billing_records, jclaude_subscriptions
APIs relacionadas: /api/mercadopago/webhook (funcional)
Prioridad: Sprint 2
```

---

## 3. Estado real del producto — sin suavizar

### ¿Esto puede venderse hoy?

**Sí, parcialmente.** JClaude como módulo standalone puede venderse y ya tiene infraestructura de pago real.

### ¿A quién?

A marcas o emprendedores que quieran un calendario de contenido mensual generado por IA para Instagram/Facebook, con posibilidad de aprobar posts y eventualmente publicarlos automáticamente.

### ¿Qué parte se puede vender?

- JClaude: generación de calendario, aprobación de posts, generación de imágenes, suscripción mensual con trial.
- Portal básico de cliente para ver y aprobar contenido (JClaude).

### ¿Qué parte NO se puede vender?

- Dashboard (datos inventados).
- Legales (firma no persiste).
- Ads (datos completamente ficticios — peligroso).
- Influencers (pipeline no persiste).
- Social Media (aprobaciones no persisten).

### ¿Qué promesas comerciales serían peligrosas?

- "Podés ver tus métricas de ads en tiempo real" → FALSO, son mock.
- "Tus documentos se guardan firmados" → FALSO, no persiste.
- "Manejamos tu pipeline de influencers" → FALSO, no persiste.
- "Autopublicamos en Instagram" → SIN VERIFICAR en producción.

### ¿Qué promesas sí son defendibles?

- "Generamos tu calendario de contenido mensual con IA."
- "Aprobás cada post antes de que se publique."
- "Generamos imágenes para cada post."
- "Cobramos suscripción mensual con 7 días gratis."
- "Conectás tu cuenta de Instagram." (scopes limitados, publicación pendiente de Meta)

### ¿Qué fallaría si entra un cliente real mañana?

1. Ve el dashboard con datos falsos (4 posts, 1 doc, 3 influencers) → confusión.
2. Firma un documento y al recargar vuelve a "pendiente" → pérdida de confianza.
3. El límite de 12 posts por el timeout de Vercel puede dejar meses incompletos.
4. Las imágenes generadas por fal.ai expiran (URL de CDN temporal).
5. `/forgot-password` no existe → cliente sin forma de recuperar contraseña.

### ¿Qué fallaría si entran 10 clientes reales?

Todo lo anterior x10, más:
- El cron de autopublicación no está verificado bajo carga.
- No hay observability ni alertas de errores.
- Los tokens de Meta guardados en plaintext JSONB son un riesgo de seguridad.
- No hay rate limiting en las APIs de IA.
- Una spike de uso puede agotar el quota de Anthropic sin alertas.

### ¿Qué fallaría si entra otra agencia como white-label?

Todo lo anterior, más:
- No hay custom domain por tenant.
- No hay branding configurable.
- No hay plan de onboarding.
- No hay soporte documentado.
- No hay SLA.
- No hay staging environment para probar antes de prod.

---

## 4. Deuda técnica clasificada

### Crítica (bloquea clientes reales)
- Dashboard con datos mock en lugar de DB real
- Firma de documentos no persiste en DB
- Social Media aprobaciones no persisten
- `/forgot-password` ruta no existe
- Imágenes fal.ai con URLs temporales (no guardadas en Storage)

### Alta (degrada experiencia)
- Tokens OAuth Meta en plaintext en JSONB
- Sin rate limiting en APIs IA
- Sin observability/error tracking
- Vercel Hobby timeout 60s limita generación a 12 posts
- Prompts hardcodeados en código (no versionables)

### Media (deuda de arquitectura)
- Sin Supabase Storage configurado
- Sin tabla de activity_logs / audit_logs
- Sin tabla de ai_jobs
- Sin tabla de campaigns
- Sin staging environment
- Sin CI/CD (deploy manual)
- permissions jsonb en workspace_users definido pero nunca usado

### Baja (hygiene)
- Sin README técnico útil
- Sin tests de ningún tipo
- Sin documentación de deploy
- Sin changelog
- Schema.sql como único archivo de DB (sin migrations)
- Un solo branch main sin feature branching

---

*Documento generado durante Sprint -1 — RUN72 Product Freeze*  
*Próxima revisión: al finalizar Sprint 0*
