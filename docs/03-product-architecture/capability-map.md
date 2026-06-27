# Capability Map
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

> Este documento define las capacidades del sistema — no pantallas, no módulos, no features. Una capacidad es lo que el sistema puede hacer para resolver un problema real. Las pantallas son consecuencia de las capacidades.

---

## 01 · Identity & Access

```
Capacidad: Identity & Access
Qué problema resuelve: Saber quién es el usuario, a qué workspace pertenece, qué puede ver y qué puede hacer.
Usuarios: Todos
Entidades involucradas: User, WorkspaceUser, Workspace
Módulos actuales relacionados: Auth (login), middleware, (admin)/admin
Estado actual: ✅ Parcial — login funciona, registro JClaude funciona, permisos granulares no usados
Qué falta:
  - Password reset (ruta /forgot-password no existe)
  - Invitation flow (JC invita a clientes)
  - Permisos granulares activos (permissions jsonb en workspace_users no se usa)
  - MFA opcional
  - OAuth (Google)
Prioridad: Sprint 0
```

---

## 02 · Workspace Management

```
Capacidad: Workspace Management
Qué problema resuelve: Aislar datos por cliente/marca, configurar servicios activos, gestionar equipo.
Usuarios: jc_admin, client_admin
Entidades involucradas: Workspace, WorkspaceUser
Módulos actuales relacionados: (admin)/admin, (client)/workspace
Estado actual: ✅ Parcial — workspaces reales, create-client funciona, sin settings UI
Qué falta:
  - Workspace settings page (logo, nombre, servicios activos)
  - Equipo management con invitaciones
  - Toggle de módulos activos por workspace
Prioridad: Sprint 1
```

---

## 03 · Brand Setup

```
Capacidad: Brand Setup
Qué problema resuelve: Capturar la identidad de la marca para que todos los agentes de IA tengan contexto.
Usuarios: client_admin, jc_admin
Entidades involucradas: Brand (jclaude_profiles)
Módulos actuales relacionados: JClaude (perfil de marca)
Estado actual: ✅ Parcial — brand profile existe y se usa en generate-month. Sin logo, sin colors, sin competitors.
Qué falta:
  - Logo upload (Supabase Storage)
  - Brand colors
  - Brand guidelines / brand book
  - Competitors
  - Conexión con Campaign Planning
Prioridad: Sprint 1
```

---

## 04 · Campaign Planning

```
Capacidad: Campaign Planning
Qué problema resuelve: Definir estratégicamente qué se va a hacer, para quién, cuándo y con qué presupuesto. Contexto para toda la generación IA.
Usuarios: jc_admin, client_admin
Entidades involucradas: Campaign, CampaignBrief
Módulos actuales relacionados: Ninguno — no existe
Estado actual: ❌ No existe
Qué falta: Todo — campaña como entidad, brief, relación con posts/ads/influencers
Prioridad: Sprint 2
```

---

## 05 · Content Generation (AI)

```
Capacidad: Content Generation
Qué problema resuelve: Generar copies, imágenes y videos para posts orgánicos usando IA, tomando como base el brand profile y el brief.
Usuarios: Sistema (IA), jc_admin que aprueba
Entidades involucradas: Post, Asset, AIJob, Brand, PromptVersion
Módulos actuales relacionados: JClaude (generate-month, generate-image)
Estado actual: ✅ Parcial — copy ✅, imágenes ✅ (URLs temporales), videos ❌
Qué falta:
  - Supabase Storage para imágenes (hoy expiran)
  - Seedance para videos
  - Prompts en DB
  - AIJob trazabilidad
  - Brand memory como input
  - Generación a nivel de campaña (no solo mes)
Prioridad: Sprint 1
```

---

## 06 · Approval Workflow

```
Capacidad: Approval Workflow
Qué problema resuelve: Que el cliente pueda ver, comentar, aprobar o rechazar contenido antes de que se publique.
Usuarios: client_admin, client_user
Entidades involucradas: Post, Document, Approval, Comment
Módulos actuales relacionados: JClaude (aprobación posts), Social Media (mock), Legales (mock)
Estado actual: ⚠️ Parcial — JClaude posts tienen aprobación real. Social Media y Legales son mock.
Qué falta:
  - Centralizar aprobaciones en tabla `approvals`
  - Conectar Social Media a aprobación real
  - Conectar Legales a firma real (DB)
  - Notificaciones al cliente cuando hay algo para aprobar
  - Comentarios persistentes
Prioridad: Sprint 0 (conectar Social Media y Legales)
```

---

## 07 · Asset Management

```
Capacidad: Asset Management
Qué problema resuelve: Almacenar, organizar y reutilizar archivos (imágenes, videos, PDFs) de forma permanente y organizada por workspace/campaña.
Usuarios: Todos
Entidades involucradas: Asset
Módulos actuales relacionados: JClaude (image_url temporal), Legales (file_url sin storage)
Estado actual: ❌ No existe como sistema — Supabase Storage no configurado
Qué falta: Todo — inicializar Storage, tabla assets, upload UI, relación con posts/campaigns
Prioridad: Sprint 0 (crítico — imágenes actuales expiran)
```

---

## 08 · Publishing

```
Capacidad: Publishing
Qué problema resuelve: Publicar automáticamente posts aprobados en las redes sociales en la fecha y hora programada.
Usuarios: Sistema (automático), jc_admin
Entidades involucradas: Post, Integration, ActivityLog
Módulos actuales relacionados: JClaude (cron-publish, publish-meta), Meta OAuth
Estado actual: ⚠️ Código existe, no verificado en producción. Scopes Meta insuficientes (pending review).
Qué falta:
  - Verificar autopublish end-to-end
  - Aprobación Meta para instagram_content_publishing
  - Error handling y retry logic
  - Notificación cuando se publica
  - Log de publicación real
Prioridad: Sprint 1
```

---

## 09 · Social Media Management

```
Capacidad: Social Media Management
Qué problema resuelve: Gestionar el flujo completo de contenido orgánico — desde la creación hasta la aprobación, con comentarios del cliente.
Usuarios: jc_admin (crea), client_admin (aprueba/comenta)
Entidades involucradas: Post, Comment, Campaign
Módulos actuales relacionados: Social Media (mock), JClaude (parcialmente real)
Estado actual: ❌ Mock — tabla social_posts existe pero UI no la usa
Qué falta: Conectar social_posts a UI, persistir comments, relacionar con campaigns, relacionar con JClaude
Prioridad: Sprint 0
```

---

## 10 · Ads Management

```
Capacidad: Ads Management
Qué problema resuelve: Conectar cuentas de ads, importar métricas, mostrar performance real y generar insights.
Usuarios: jc_admin (gestiona), client_admin (visualiza)
Entidades involucradas: AdAccount, Ad, PerformanceMetric, Insight
Módulos actuales relacionados: Ads (mock), api/ai/ads-analysis
Estado actual: ❌ Mock — UI completamente ficticia. API de análisis funciona pero con datos inventados.
Qué falta: Meta Ads API real, performance_snapshots, import cron, datos reales antes de mostrar IA analysis
Prioridad: Sprint 2 (Meta primero)
```

---

## 11 · Influencer Workflow

```
Capacidad: Influencer Workflow
Qué problema resuelve: Gestionar el pipeline completo de influencers — desde el scouting hasta la publicación del contenido.
Usuarios: jc_admin (gestiona), client_admin (aprueba)
Entidades involucradas: Influencer, Document, Asset, Comment
Módulos actuales relacionados: Influencers (mock), api/ai/influencer-fit
Estado actual: ❌ Mock — tabla existe pero UI no la usa
Qué falta: Conectar DB, pipeline real, entregables, relacionar con campaigns, documentos de contrato
Prioridad: Sprint 1
```

---

## 12 · Legal Document Management

```
Capacidad: Legal Document Management
Qué problema resuelve: Compartir documentos legales/contractuales con clientes y recoger firmas digitales con audit trail.
Usuarios: jc_admin (sube), client_admin (firma)
Entidades involucradas: Document, Signature
Módulos actuales relacionados: Legales (mock), Supabase Storage (no configurado)
Estado actual: ⚠️ Tabla existe, UI es mock — firma no persiste
Qué falta: Storage para PDFs, API route para firmar (guarda en DB), audit trail real
Prioridad: Sprint 0
```

---

## 13 · Performance Analytics

```
Capacidad: Performance Analytics
Qué problema resuelve: Mostrar métricas reales de ads y contenido orgánico. Histórico. Tendencias.
Usuarios: jc_admin (analiza), client_admin (visualiza)
Entidades involucradas: PerformanceMetric, AdAccount, Post
Módulos actuales relacionados: Ads (mock)
Estado actual: ❌ No existe — todo es mock
Qué falta: performance_snapshots table, import desde Meta Ads API, histórico, UI real
Prioridad: Sprint 2
```

---

## 14 · AI Insights & Recommendations

```
Capacidad: AI Insights & Recommendations
Qué problema resuelve: Convertir datos de performance en insights accionables y recomendaciones concretas para la próxima campaña.
Usuarios: Sistema (IA genera), jc_admin (revisa), client_admin (decide)
Entidades involucradas: Insight, Recommendation, PerformanceMetric, Memory
Módulos actuales relacionados: Ads (análisis mock), JClaude (futuro)
Estado actual: ⚠️ Parcial — api/ai/ads-analysis funciona pero con datos mock
Qué falta: Datos reales como input, tabla insights, tabla recommendations, aprobación de recomendaciones
Prioridad: Sprint 3
```

---

## 15 · Billing & Subscription

```
Capacidad: Billing & Subscription
Qué problema resuelve: Cobrar suscripciones recurrentes, gestionar free trials, manejar pagos fallidos.
Usuarios: client_admin (paga), jc_admin (gestiona)
Entidades involucradas: Subscription, Invoice
Módulos actuales relacionados: JClaude (suscripción MP), mercadopago webhook
Estado actual: ✅ Parcial — suscripción MP funciona, sin UI de historial de pagos
Qué falta: Historial de pagos UI, manejo de pago fallido, invoice PDF, billing_records conectado
Prioridad: Sprint 1
```

---

## 16 · Integration Management

```
Capacidad: Integration Management
Qué problema resuelve: Conectar y desconectar redes sociales y plataformas de ads. Gestionar tokens de forma segura.
Usuarios: client_admin, jc_admin
Entidades involucradas: Integration, Brand (social_credentials)
Módulos actuales relacionados: JClaude (OAuth Meta), api/jclaude/oauth/*
Estado actual: ✅ Parcial — Meta OAuth funciona (scopes limitados). Sin otras redes.
Qué falta: Encriptar tokens, TikTok, LinkedIn, Google, Meta Ads API
Prioridad: Sprint 1 (encriptar tokens), Sprint 3 (otras redes)
```

---

## 17 · Knowledge Capture

```
Capacidad: Knowledge Capture
Qué problema resuelve: Capturar aprendizajes del sistema (qué funcionó, qué no, qué aprobó el cliente) y almacenarlos como memoria reutilizable para mejorar futuras generaciones.
Usuarios: Sistema automático
Entidades involucradas: Memory, ActivityLog, AIJob, PerformanceMetric
Módulos actuales relacionados: Ninguno — no existe
Estado actual: ❌ No existe
Qué falta: memory table, AI que escribe memorias, agente que lee memorias, performance feedback loop
Prioridad: Sprint 3
```

---

## 18 · Admin Operations

```
Capacidad: Admin Operations
Qué problema resuelve: Que JC AIgency pueda crear clientes, gestionar workspaces, impersonar usuarios y ver el estado de toda la plataforma.
Usuarios: jc_admin exclusivamente
Entidades involucradas: Workspace, WorkspaceUser, Subscription, ActivityLog
Módulos actuales relacionados: (admin)/admin/*
Estado actual: ⚠️ Parcial — create-client funciona, sin panel completo
Qué falta: Ver todos los workspaces, estadísticas globales, impersonation, gestión de subscripciones
Prioridad: Sprint 1
```

---

## Mapa de prioridades

| Sprint | Capacidades a completar |
|---|---|
| Sprint 0 | Identity & Access (fixes), Asset Management, Approval Workflow (real), Social Media Management (conectar DB), Legal Document Management (firmas reales) |
| Sprint 1 | Workspace Management, Brand Setup, Content Generation (Storage + Seedance), Publishing (verificar), Influencer Workflow, Billing UI, Integration Management (encriptar tokens), Admin Operations |
| Sprint 2 | Campaign Planning, Ads Management (Meta real), Performance Analytics |
| Sprint 3 | AI Insights & Recommendations, Knowledge Capture |

---

*Documento vive en `/docs/03-product-architecture/capability-map.md`*
