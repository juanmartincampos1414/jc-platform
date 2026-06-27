# Event Architecture
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

> Los eventos son el sistema nervioso del producto. Cada acción importante emite un evento. Los eventos alimentan el activity log, el dashboard, las notificaciones, el aprendizaje y las automatizaciones.

---

## Principio

Todo evento tiene:
- **Nombre** en PascalCase, formato `Entity.Action`
- **Quién lo dispara** (user, system, webhook)
- **Cuándo ocurre**
- **Qué datos guarda** (payload mínimo)
- **Quién lo escucha** (módulos o agentes)
- **Qué activity log genera** (texto legible en español)

---

## Catálogo de eventos

---

### Workspace

#### WorkspaceCreated
```
Quién lo dispara: Sistema (al crear cliente desde admin o al registrarse en JClaude)
Cuándo ocurre: POST /api/auth/register o POST /api/admin/create-client
Datos: { workspace_id, name, slug, created_by, source: 'jclaude_register' | 'admin' }
Módulos que escuchan: Dashboard, Admin, Email (bienvenida)
Activity log: "Workspace {name} creado"
```

#### WorkspaceUpdated
```
Quién lo dispara: jc_admin, client_admin
Cuándo ocurre: Al editar settings del workspace
Datos: { workspace_id, changes: { campo_anterior, campo_nuevo } }
Activity log: "Configuración del workspace actualizada"
```

---

### Brand

#### BrandProfileCreated
```
Quién lo dispara: Usuario
Cuándo ocurre: Primera vez que se guarda el perfil de marca en JClaude
Datos: { workspace_id, brand_name, industry, tone }
Activity log: "Perfil de marca '{brand_name}' configurado"
```

#### BrandProfileUpdated
```
Quién lo dispara: Usuario
Cuándo ocurre: Al editar cualquier campo del perfil de marca
Datos: { workspace_id, fields_changed[] }
Activity log: "Perfil de marca actualizado"
Nota: Debe invalidar brand_memories desactualizadas
```

#### SocialAccountConnected
```
Quién lo dispara: Usuario (OAuth callback)
Cuándo ocurre: GET /api/jclaude/oauth/callback (exitoso)
Datos: { workspace_id, network: 'instagram' | 'facebook', account_name, page_id }
Módulos que escuchan: Dashboard, JClaude (habilita autopublish)
Activity log: "Cuenta de {network} '{account_name}' conectada"
```

#### SocialAccountDisconnected
```
Quién lo dispara: Usuario
Cuándo ocurre: POST /api/jclaude/oauth/disconnect
Datos: { workspace_id, network }
Activity log: "Cuenta de {network} desconectada"
```

---

### Post

#### PostsGenerated
```
Quién lo dispara: Sistema (Claude API)
Cuándo ocurre: Al completar generate-month con éxito
Datos: { workspace_id, month, year, count, ai_job_id, post_ids[] }
Módulos que escuchan: Dashboard, JClaude calendar
Activity log: "Se generaron {count} posts para {monthName} {year}"
Aprendizaje: Registrar en ai_jobs
```

#### PostSubmittedForApproval
```
Quién lo dispara: jc_admin (al pasar de draft a pending)
Cuándo ocurre: Al cambiar status a 'pending'
Datos: { workspace_id, post_id, network, scheduled_at }
Módulos que escuchan: Notificaciones (avisar al client_admin)
Activity log: "Post de {network} enviado para aprobación"
```

#### PostApproved
```
Quién lo dispara: client_admin, client_user
Cuándo ocurre: Al cambiar status a 'approved'
Datos: { workspace_id, post_id, approved_by, network, copy_preview }
Módulos que escuchan: Dashboard, Autopublish scheduler, Memory
Activity log: "Post de {network} aprobado por {user}"
Aprendizaje: Guardar en brand_memory: qué tipo de post aprueba este cliente
```

#### PostRejected
```
Quién lo dispara: client_admin, client_user
Cuándo ocurre: Al cambiar status a 'rejected'
Datos: { workspace_id, post_id, rejected_by, comment }
Activity log: "Post de {network} rechazado"
Aprendizaje: Guardar en brand_memory: qué rechaza este cliente y por qué
```

#### PostNeedsChanges
```
Quién lo dispara: client_admin
Cuándo ocurre: Al cambiar status a 'needs_changes' con comentario
Datos: { workspace_id, post_id, comment }
Activity log: "Post de {network} requiere cambios: '{comment}'"
```

#### PostImageGenerated
```
Quién lo dispara: Sistema (fal.ai callback)
Cuándo ocurre: Al completar generate-image
Datos: { workspace_id, post_id, image_url, ai_job_id, prompt_used }
Activity log: "Imagen generada para post de {network}"
```

#### PostPublished
```
Quién lo dispara: Sistema (cron-publish)
Cuándo ocurre: Al publicar exitosamente via Meta API
Datos: { workspace_id, post_id, network, published_at, external_post_id }
Módulos que escuchan: Dashboard, Performance (empezar a medir)
Activity log: "Post publicado en {network}"
```

#### PostPublishFailed
```
Quién lo dispara: Sistema (cron-publish, error)
Cuándo ocurre: Al fallar la publicación en Meta API
Datos: { workspace_id, post_id, network, error, retry_count }
Módulos que escuchan: Admin (alerta), Email (notificación)
Activity log: "⚠️ Falló la publicación en {network}: {error}"
```

---

### Document

#### DocumentUploaded
```
Quién lo dispara: jc_admin
Cuándo ocurre: Al subir un PDF a Supabase Storage y crear registro en legal_documents
Datos: { workspace_id, document_id, title, type }
Módulos que escuchan: Dashboard, Notificaciones (avisar al client)
Activity log: "Documento '{title}' enviado para firma"
```

#### DocumentSigned
```
Quién lo dispara: client_admin
Cuándo ocurre: Al guardar firma en DB
Datos: { workspace_id, document_id, signed_by, signed_at, signature_data }
Módulos que escuchan: Dashboard, Admin (notificación a JC)
Activity log: "'{title}' firmado por {user}"
```

---

### Influencer

#### InfluencerAdded
```
Quién lo dispara: jc_admin
Datos: { workspace_id, influencer_id, name, handle, network, status: 'scouting' }
Activity log: "Influencer @{handle} agregado al pipeline"
```

#### InfluencerStatusChanged
```
Quién lo dispara: jc_admin
Datos: { workspace_id, influencer_id, previous_status, new_status }
Activity log: "Estado de @{handle} actualizado: {previous} → {new}"
```

#### InfluencerApproved
```
Quién lo dispara: client_admin
Datos: { workspace_id, influencer_id, approved_by }
Activity log: "@{handle} aprobado para la campaña"
```

---

### Subscription

#### SubscriptionTrialStarted
```
Quién lo dispara: Sistema (MercadoPago webhook o registro)
Datos: { workspace_id, plan, trial_ends_at }
Activity log: "Prueba gratuita de JClaude {plan} iniciada (7 días)"
```

#### SubscriptionActivated
```
Quién lo dispara: Sistema (MercadoPago webhook)
Datos: { workspace_id, plan, mp_preapproval_id, period_start, period_end }
Activity log: "Suscripción JClaude {plan} activada"
```

#### SubscriptionPaused
```
Quién lo dispara: Sistema (MercadoPago webhook — pago fallido)
Datos: { workspace_id, plan, reason }
Activity log: "⚠️ Suscripción JClaude pausada (pago fallido)"
```

#### SubscriptionCancelled
```
Quién lo dispara: Usuario o Sistema
Datos: { workspace_id, plan, cancelled_by, reason }
Activity log: "Suscripción JClaude cancelada"
```

#### PaymentFailed
```
Quién lo dispara: MercadoPago webhook
Datos: { workspace_id, attempt_count, next_retry }
Activity log: "⚠️ Pago fallido ({attempt_count} intento)"
```

---

### AI

#### AIJobStarted
```
Quién lo dispara: Sistema (al iniciar llamada a Claude o fal.ai)
Datos: { workspace_id, ai_job_id, agent, model }
(No genera activity log — es interno)
```

#### AIJobCompleted
```
Quién lo dispara: Sistema
Datos: { workspace_id, ai_job_id, tokens_used, cost_usd, duration_ms }
(No genera activity log — es interno, alimenta dashboards de costo)
```

#### AIJobFailed
```
Quién lo dispara: Sistema
Datos: { workspace_id, ai_job_id, error, agent }
Activity log: "⚠️ Error en generación IA ({agent})"
```

#### InsightGenerated
```
Quién lo dispara: Sistema (AI Insights agent — futuro)
Datos: { workspace_id, insight_id, type, summary }
Activity log: "Nuevo insight disponible: {summary}"
```

#### RecommendationGenerated
```
Quién lo dispara: Sistema (Recommendation agent — futuro)
Datos: { workspace_id, recommendation_id, priority, action }
Activity log: "Nueva recomendación: {action}"
```

---

## Implementación

### Fase 1 — Mínimo viable (Sprint 0)
Implementar como función que inserta en `activity_logs`:

```typescript
async function emitEvent(event: {
  workspace_id: string
  action: string        // 'post.approved', 'document.signed', etc.
  entity_type: string   // 'post', 'document', 'influencer'
  entity_id: string
  user_id?: string
  metadata?: Record<string, unknown>
}) {
  await supabase.from('activity_logs').insert({
    workspace_id: event.workspace_id,
    action: event.action,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    user_id: event.user_id,
    metadata: event.metadata,
  })
}
```

### Fase 2 — Event bus (Sprint 3+)
Cuando haya múltiples "listeners" para el mismo evento (ej: PostPublished debe notificar por email Y actualizar analytics), migrar a un sistema de eventos:
- Supabase Realtime (simple, ya disponible)
- O un queue ligero (Inngest, Trigger.dev)

---

*Documento vive en `/docs/03-product-architecture/event-architecture.md`*
