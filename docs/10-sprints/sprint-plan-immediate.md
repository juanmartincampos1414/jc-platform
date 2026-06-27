# Sprint Plan Inmediato
## JC AI Agency · RUN72 OS
**Versión:** 0.1 · Junio 2026

---

> Estos sprints asumen que no hay equipo externo — solo Juan + Claude. Cada sprint tiene entregables concretos, no intenciones.

---

## Sprint -1 — RUN72 Product Freeze
**Objetivo:** Congelar conocimiento. No código nuevo (salvo fixes críticos de seguridad).  
**Duración:** 1-2 días

### Entregables
- [x] `/docs/00-start-here/product-reality-audit.md`
- [x] `/docs/00-start-here/run72-compliance-score.md`
- [x] `/docs/01-product-constitution/product-constitution.md`
- [x] `/docs/03-product-architecture/domain-model.md`
- [x] `/docs/03-product-architecture/ubiquitous-language.md`
- [x] `/docs/03-product-architecture/capability-map.md`
- [x] `/docs/07-knowledge-architecture/knowledge-architecture.md`
- [x] `/docs/09-decisions/ADR-001-nextjs.md`
- [x] `/docs/09-decisions/ADR-002-supabase.md`
- [x] `/docs/09-decisions/ADR-003-jclaude-core.md`
- [ ] `/docs/09-decisions/ADR-004-mercadopago.md`
- [ ] `/docs/09-decisions/ADR-005-fal-images.md`
- [ ] `/docs/09-decisions/ADR-006-meta-oauth-first.md`
- [ ] `/docs/04-technical-architecture/env-vars.md` (lista de variables sin valores)
- [ ] `/docs/04-technical-architecture/external-services.md` (estado de cada servicio)

### Lo que NO se hace en este sprint
- Nada de código nuevo
- No conectar DB a las UIs mock
- No nuevas features (Seedance, etc.)

---

## Sprint 0 — Technical Stabilization
**Objetivo:** Que lo existente deje de ser peligroso. Mocks del flujo principal eliminados.  
**Duración:** 5-7 días

### Critical fixes (bloquean clientes reales)

#### 0.1 — Password Reset
- Crear `/forgot-password/page.tsx`
- Implementar Supabase `resetPasswordForEmail`
- Crear `/reset-password/page.tsx` para el callback de email

#### 0.2 — Supabase Storage
- Inicializar bucket `jc-assets` en Supabase
- Crear bucket `legal-documents` (privado)
- Migrar generate-image para guardar en Storage (no usar URL de fal.ai directo)
- Actualizar `image_url` en jclaude_posts para usar URL de Storage permanente

#### 0.3 — Firmas de documentos reales
- Conectar `/legales/page.tsx` a tabla `legal_documents`
- Crear API route `POST /api/legal/sign` que guarda firma en DB
- Crear API route `GET /api/legal/documents` que lee de DB
- JC Admin: crear API route `POST /api/admin/legal/upload` para subir PDFs a Storage

#### 0.4 — Social Media conectado a DB
- Conectar `/social-media/page.tsx` a tabla `social_posts`
- Crear API route `GET /api/social/posts` con filtros por status y network
- Crear API route `PATCH /api/social/posts/[id]/status` para aprobar/rechazar
- Crear API route `POST /api/social/posts/[id]/comment` para comentarios
- Conectar tabla `post_comments` a la UI

#### 0.5 — Dashboard real
- Crear tabla `activity_logs` en Supabase
- Crear API route `GET /api/dashboard/stats` que lee conteos reales de DB
- Conectar Dashboard a datos reales (eliminar MOCK_STATS y MOCK_ACTIVITY)
- Emitir eventos de ActivityLog en: sign document, approve post, generate month

#### 0.6 — Encriptar tokens OAuth
- Mover `social_credentials` de plaintext a columna encriptada (Supabase Vault o AES-256 en código)
- Nunca loguear tokens a console

### Entregables técnicos

- `/api/legal/*` — CRUD real de documentos
- `/api/social/*` — CRUD real de posts y comentarios
- `/api/dashboard/stats` — conteos reales
- `activity_logs` table + políticas RLS
- Supabase Storage inicializado con dos buckets
- `/forgot-password` y `/reset-password` funcionales
- Dashboard sin MOCK_ constantes

### Criterio de éxito
- Un cliente puede firmar un documento y sigue firmado al recargar
- Un cliente puede aprobar un post y sigue aprobado al recargar
- El Dashboard muestra datos reales del workspace
- Las imágenes generadas por JClaude no expiran

---

## Sprint 1 — JClaude Hardening
**Objetivo:** Convertir JClaude de generador funcional a núcleo confiable y trazable.  
**Duración:** 5-7 días

### 1.1 — Prompt DB
- Crear tabla `jclaude_prompts` con campos: agent, version, status, system_prompt, user_prompt_template, output_schema, model, max_tokens
- Migrar el prompt de generate-month a DB
- Migrar prompts de ads-analysis, influencer-fit, social-copy a DB
- API route para leer prompt activo por agent

### 1.2 — AI Jobs
- Crear tabla `ai_jobs` con campos: workspace_id, agent, prompt_version_id, model, input, output, tokens_input, tokens_output, cost_usd, duration_ms, status, error
- Registrar cada llamada a Claude y fal.ai en ai_jobs
- Conectar generate-month para guardar ai_job
- Conectar generate-image para guardar ai_job con image asset result

### 1.3 — Eliminar límite de 12 posts (Vercel Pro o alternativa)
**Opción A:** Upgrade a Vercel Pro ($20/mes) — aumenta timeout a 300s
**Opción B:** Mover generate-month a Supabase Edge Function (sin timeout de 30/60s)
**Opción C:** Background job con status polling (más complejo pero más robusto)

Recomendación: Opción A primero (inmediata), Opción C cuando el volumen lo justifique.

### 1.4 — Verificar autopublish Meta
- Test end-to-end del cron-publish en producción
- Verificar que `publish-meta` funciona con scopes actuales
- Log de publicación en activity_logs
- Alerta por email/Slack si falla la publicación

### 1.5 — Calendar view en JClaude
- Agregar vista de calendario (mes) para los posts generados
- Reemplazar lista plana por grilla de días del mes
- Indicador visual por red social y tipo de post

### 1.6 — Influencers conectados a DB
- Conectar `/influencers/page.tsx` a tabla `influencers`
- CRUD real de influencers
- Pipeline de estados persistente

### Criterio de éxito
- Cada llamada a Claude queda registrada en ai_jobs
- Prompts se pueden editar en DB sin cambiar código
- Autopublish Meta funciona y está documentado
- JClaude puede generar más de 12 posts si el plan lo permite

---

## Sprint 2 — Campaign Foundation
**Objetivo:** Crear la entidad Campaign como unidad organizadora central.  
**Duración:** 7-10 días

### 2.1 — Tablas de campaña
```sql
campaigns (id, workspace_id, name, objective, status, start_date, end_date, budget, channels[])
campaign_briefs (id, campaign_id, workspace_id, title, description, target_audience, key_messages, tone, status)
```

### 2.2 — UI de Campaigns
- Página `/workspace/[id]/campaigns`
- Crear campaña con brief
- Ver posts/ads/influencers por campaña
- Dashboard por campaña (budget, posts publicados, etc.)

### 2.3 — Relacionar módulos con Campaign
- Posts de JClaude → pueden pertenecer a una campaign
- Social posts → pertenecen a campaign
- Influencers → campaign_id nullable
- Ads → campaign_id

### 2.4 — Meta Ads real (primero)
- Conectar Meta Ads API para importar métricas reales
- Tabla `performance_snapshots` para guardar histórico
- Reemplazar mock de Ads con datos reales de una cuenta
- Import cron diario

### Criterio de éxito
- Una campaña puede crearse con brief y ver todos sus assets juntos
- Los posts de JClaude pueden asignarse a una campaña
- Las métricas de Meta Ads son reales (aunque sea de una cuenta)

---

## Sprint 3 — Agency Portal Completo
**Objetivo:** JC puede usar el portal con todos los clientes sin mocks.  
**Duración:** 7-10 días

### Incluye
- Admin panel completo (ver todos los workspaces, gestionar suscripciones)
- Billing UI (historial de pagos, estado de suscripción)
- Equipo: invitations flow
- Extras: conectar a DB
- Webs: definir si es project management o landing pages
- Notificaciones: cuando hay algo para aprobar
- Workspace settings: logo, servicios activos, redes

---

## Sprint 4 — AI Marketing Brain
**Objetivo:** JClaude aprende y recomienda.  
**Duración:** 10-14 días

### Incluye
- Brand Memory table y lógica de actualización
- Performance feedback loop (lo que funcionó alimenta el próximo mes)
- Agentes especializados (Strategy, Insights, Recommendation)
- Trend ingestion (detectar tendencias por industria)
- Competitor context (si se configuran competidores)
- Quality metrics para evaluar outputs de IA

---

## Criterios generales para cerrar un sprint

Al finalizar cada sprint, documentar:
```markdown
## Sprint X — Learnings

### Qué se construyó:
### Qué cambió respecto al plan:
### Qué se rompió (bugs encontrados):
### Qué aprendimos:
### Qué deuda nueva quedó:
### Qué decisión nueva apareció:
### Próximo sprint: ajustar si es necesario
```

---

*Documento vive en `/docs/10-sprints/sprint-plan-immediate.md`*  
*Se actualiza al inicio de cada sprint con ajustes según aprendizajes anteriores*
