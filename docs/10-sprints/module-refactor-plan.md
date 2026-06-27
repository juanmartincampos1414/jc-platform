# Module Refactor Plan
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

## Dashboard

**Estado actual:** 100% mock. `MOCK_STATS` y `MOCK_ACTIVITY` hardcodeados.

**Qué datos debería leer:**
```typescript
// Stats reales
const pendingPosts = await supabase.from('social_posts').select('id', { count: 'exact' }).eq('workspace_id', id).eq('status', 'pending')
const pendingDocs = await supabase.from('legal_documents').select('id', { count: 'exact' }).eq('workspace_id', id).eq('status', 'pending')
const inReviewInfluencers = await supabase.from('influencers').select('id', { count: 'exact' }).eq('workspace_id', id).in('status', ['proposal_sent', 'content_review'])
const jclaude_pending = await supabase.from('jclaude_posts').select('id', { count: 'exact' }).eq('workspace_id', id).eq('status', 'draft')

// Activity feed
const activity = await supabase.from('activity_logs').select('*').eq('workspace_id', id).order('created_at', { ascending: false }).limit(10)
```

**Qué debe eliminarse:** `MOCK_STATS`, `MOCK_ACTIVITY`, `DEMO_MODE` const

**Nuevas tablas necesarias:** `activity_logs`

**Sprint:** 0

---

## Legales

**Estado actual:** `MOCK_DOCS` hardcodeados. La firma es `setState` local — no persiste.

**Plan de refactor:**

1. Crear API routes:
   - `GET /api/legal/documents` → leer de `legal_documents` del workspace
   - `POST /api/legal/sign` → guardar firma en DB (signed_by, signed_at, signature_data)
   - `POST /api/admin/legal/upload` (admin only) → subir PDF a Supabase Storage, crear registro

2. Conectar página a las APIs:
   - Eliminar `MOCK_DOCS`
   - `useEffect` que llama a `GET /api/legal/documents`
   - `handleSign` que llama a `POST /api/legal/sign` en lugar de `setState`

3. Storage:
   - Bucket `legal-documents` en Supabase (privado)
   - `file_url` apunta a URL de Storage

4. Después de firma:
   - Emitir evento `DocumentSigned` → `activity_logs`
   - Notificación a JC admin (email o dashboard)

**Qué se elimina:** `MOCK_DOCS`, todo el `setDocs(prev => prev.map(...))` de la firma

**Sprint:** 0

---

## Social Media

**Estado actual:** `generateMockPosts()` hardcodeado. Aprobaciones y comentarios se pierden al recargar.

**Plan de refactor:**

1. Crear API routes:
   - `GET /api/social/posts` → leer de `social_posts` con filtros por workspace, status, network, mes
   - `PATCH /api/social/posts/[id]/status` → actualizar status (approved/rejected/needs_changes)
   - `GET /api/social/posts/[id]/comments` → leer comentarios
   - `POST /api/social/posts/[id]/comment` → agregar comentario

2. Conectar página:
   - Reemplazar `generateMockPosts()` con fetch a API
   - `updateStatus()` llama a PATCH en lugar de `setPosts()`
   - `addComment()` llama a POST en lugar de `setPosts()`

3. Relación con JClaude:
   - Los posts de `jclaude_posts` aprobados se "exportan" a `social_posts`
   - O unificar ambas tablas en Sprint 2 con campo `source`

4. Emitir eventos en cada aprobación/rechazo → `activity_logs`

**Qué se elimina:** `generateMockPosts()`, toda la lógica de `useState` para estado de posts y comentarios

**Sprint:** 0

---

## Ads

**Estado actual:** `MOCK_ACCOUNTS`, `MOCK_METRICS`, `MOCK_CAMPAIGNS` — todo inventado.

**Riesgo actual:** JC podría estar mostrando estos datos a clientes como si fueran reales.

**Plan de refactor (más largo — Sprint 2):**

**Fase 1 (Sprint 0) — Emergency:**
- Agregar banner visible: "Los datos de ads se sincronizan manualmente. Contactá a JC para ver tus métricas actualizadas."
- NO mostrar números falsos como si fueran reales

**Fase 2 (Sprint 2) — Meta Ads real:**
1. Conectar Meta Ads API con token del ad account
2. Crear `performance_snapshots` table
3. Import cron de métricas reales (diario)
4. Mostrar datos reales en lugar de mock

**Fase 3 (Sprint 3+) — Google/TikTok:**
- Solo después de tener Meta funcionando

**Qué se elimina:** `MOCK_ACCOUNTS`, `MOCK_METRICS`, `MOCK_CAMPAIGNS`

**Sprint:** Emergency fix en Sprint 0, real en Sprint 2

---

## Influencers

**Estado actual:** `MOCK_INFLUENCERS` hardcodeado. Pipeline no persiste.

**Plan de refactor:**

1. Crear API routes:
   - `GET /api/influencers` → leer de `influencers` del workspace
   - `POST /api/influencers` → crear influencer (jc_admin)
   - `PATCH /api/influencers/[id]` → actualizar status, notes, content_url
   - `DELETE /api/influencers/[id]` → eliminar (jc_admin)

2. Conectar página:
   - Reemplazar `MOCK_INFLUENCERS` con fetch a API
   - Estado del pipeline persiste en DB

3. Relación futura con Campaign (Sprint 2):
   - Agregar `campaign_id` a influencers
   - Vista de influencers por campaña

4. Emitir eventos en cambios de estado → `activity_logs`

**Qué se elimina:** `MOCK_INFLUENCERS`, `setInfluencers()` para cambio de status

**Sprint:** 1

---

## Webs

**Decisión a tomar primero:** ¿Es project management o landing pages de campaña?

**Opción A (Project Management):** Sigue siendo un módulo de gestión de proyectos web para clientes. Conectar a `web_projects` table. Simple, bajo impacto.

**Opción B (Campaign Landings):** En v0.3 Campaign OS, las webs son landing pages de campañas. Este módulo desaparece y se integra a Campaign.

**Recomendación:** Opción A en Sprint 2 (conectar tabla existente, bajo costo). Evaluar Opción B al implementar Campaign.

**Sprint:** 2

---

## Extras

**Estado actual:** Lista de servicios adicionales, probablemente mock.

**Plan:**
1. Conectar a tabla `extras`
2. Agregar billing: cada Extra puede tener un fee
3. Agregar deliverables: archivos o links de entrega
4. Relacionar con `billing_records`

**Sprint:** 2-3

---

## JClaude

**Estado actual:** Core funcional. Necesita hardening.

**Plan de refactor:**

**Sprint 1A — Prompts a DB:**
1. Crear tabla `jclaude_prompts` (ver data-architecture.md)
2. Migrar prompt de `generate-month/route.ts` a DB
3. En el route: `const prompt = await getActivePrompt('calendar')` en lugar de string hardcodeado
4. Misma lógica para ads-analysis, influencer-fit, social-copy

**Sprint 1B — AI Jobs:**
1. Crear tabla `ai_jobs`
2. En `generate-month`: registrar ai_job al inicio y actualizar al completar
3. En `generate-image`: registrar ai_job con prompt, imagen result
4. Conectar `jclaude_posts.ai_job_id` al job que los generó

**Sprint 1C — Storage para imágenes:**
1. En `generate-image/route.ts`: después de obtener URL de fal.ai, descargar la imagen y subirla a Supabase Storage
2. Guardar URL permanente de Storage en `jclaude_posts.image_url`
3. Crear registro en `assets` table

```typescript
// Después de obtener imageUrl de fal.ai:
const response = await fetch(imageUrl)
const buffer = await response.arrayBuffer()
const { data: storageData } = await supabase.storage
  .from('jc-assets')
  .upload(`images/${workspaceId}/${postId}.jpg`, buffer, { contentType: 'image/jpeg' })
const { data: { publicUrl } } = supabase.storage
  .from('jc-assets')
  .getPublicUrl(storageData.path)
// Usar publicUrl en lugar de la URL temporal de fal.ai
```

**Sprint 1D — Calendar view:**
- Reemplazar lista de posts por vista de calendario mensual
- Grilla de días con indicadores de posts por día y red social

**Sprint 1E — Seedance para videos:**
- Nueva API route: `POST /api/jclaude/generate-video`
- Botón "Generar video" en el panel del post (tipo Reel)
- Usar fal.ai Seedance API
- Guardar video en Supabase Storage

**Sprint:** 1 completo

---

## Admin Panel

**Estado actual:** Crear cliente funciona. Sin panel completo.

**Plan:**
1. Ver todos los workspaces con suscripción, plan y estado
2. Editar workspace (servicios activos, fee, redes)
3. Ver posts de JClaude de cualquier workspace (soporte)
4. Ver historial de pagos MP por workspace
5. Impersonation (acceder como cliente) — para soporte

**Sprint:** 1

---

*Documento vive en `/docs/10-sprints/module-refactor-plan.md`*
