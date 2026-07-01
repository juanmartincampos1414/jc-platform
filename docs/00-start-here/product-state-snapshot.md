# Product State Snapshot — JC AI Agency
## Fotografía funcional del producto de HOY (no del código, no del roadmap)

**Fecha:** 2026-07-01
**Método:** auditoría del código real (3 exploraciones: UI de cliente, Content Factory, engines/integraciones/storage).
**Supersede:** `product-reality-audit.md` (junio, desactualizado).
**Regla:** sin suavizar. "Terminado" ≠ "funciona".

---

## 0. Resumen en una línea

Hoy JC AI Agency es, en la práctica, **una Content Factory con IA (JClaude)** — planifica, genera y publica un mes de contenido social a Meta, con aprobación — envuelta en una **capa de inteligencia real** (Campaigns / Knowledge / Decision / Executive / Autonomy) que corre mayormente por detrás. El **"portal de agencia"** (Ads, Influencers, Webs, Extras) sigue siendo **fachada (mock)**.

---

## 1. Onboarding

**Qué pasa hoy** (real, conectado a Supabase):
1. Cliente entra a `/login` → switch a "JClaude Register" → nombre, email, password, acepta términos.
2. `/api/auth/register` crea **workspace + usuario**, auto-login → redirige a `/workspace/{id}/jclaude`.
3. **No hay wizard de marca en el registro.** El Brand profile se carga después, manualmente, desde un modal en JClaude (brand_name, rubro, tono, audiencia, mensajes clave).
4. Conexión de redes: manual, desde "Conectar cuentas" (Facebook/Instagram Login/TikTok).

**Segundos:** registro + login. **Minutos:** cargar marca + conectar redes. **Horas/pendiente:** nada automático; el sistema **no aprende nada en el onboarding** (el Knowledge Engine recién aprende cuando hay assets).
**Onboarding ideal que NO existe:** diagnóstico inicial de marca (ya hay backlog: `backlog-intelligent-onboarding.md`) que inicialice Brand Memory con contexto real antes de la primera campaña.

## 2. Workspace

Representa el tenant del cliente (multi-tenant real, RLS por `workspace_id`). Hoy configura: suscripción, brand profile, credenciales sociales, y contiene campaigns/assets/memories/actions. **Falta:** administración de equipo/roles a nivel cliente, settings, branding propio.

## 3. Brand

Sabe hoy (tabla `jclaude_profiles`): `brand_name`, `industry`, `tone`, `target_audience`, `key_messages`, redes conectadas, credenciales. Es **texto libre cargado a mano** — sin validación ni aprendizaje automático en esta capa. **Nunca debería aprender:** datos sensibles/PII fuera de contexto de marca. Ver Brand Memory (§13).

## 4. Campaigns

Nace desde la UI (`/campaigns`) — la crea el **usuario**. **No la crea JClaude ni el onboarding todavía.** Ciclo real: crear campaign (brief, fechas, canales) → se le asocian assets, decisions, recommendations, knowledge → Strategy Object generado por el Strategy Engine → Executive Intelligence la lee. **Verdadero y funcional**, con Brand Intelligence en el detalle.

## 5. Content Factory ★ (el corazón — REAL)

Pipeline (verdadero, con Claude + fal.ai):
1. "Generar mes" → `POST /api/jclaude/generate-month` (Claude `claude-sonnet-4-6`, prompt `generate-month-v4`, máx **12 posts**).
2. Inyecta **Knowledge context** (memories, confidence>0.3) + **Decision context** (decisions, confidence≥0.4) en el prompt.
3. Claude devuelve JSON: posts `{date, time, network, type, copy (≤150), hashtags (≤8), image_brief}` + videos `{caption, brief}`.
4. Persiste en `jclaude_posts` (legacy, source of truth de la UI) + dual-write async a `creatives`+`assets` (dominio).
5. Imágenes y videos se generan aparte (§6, §7). Aprobación + calendario (§ abajo).

**Aprobación:** `draft → approved → scheduled/published`. Hay un **cron real** (`/api/jclaude/cron-publish`) que publica los `approved` cuya hora llegó (vía `publish-meta`).

## 6. Image Generation (REAL)

Modelo **fal.ai `flux/schnell`**. Prompt = `image_brief` (de Claude) enriquecido, hardcodeado en el route. Aspect por red (IG 1:1, FB 16:9, TikTok 9:16). Devuelve URL de la **CDN de fal**. Se guarda en `jclaude_posts.image_url` (update manual desde la UI). ⚠️ **No se re-hostea en storage propio** (ver §16, riesgo).

## 7. Video Generation (REAL)

Modelo **Seedance (`bytedance/seedance-1-5-lite`) vía fal.ai**. Prompt = `brief` enriquecido. **Duración fija 5s**, aspect 9:16/16:9. Se dispara **fire-and-forget** desde el cliente por cada video; sin retry ni timeout (si falla, el asset queda `generating` para siempre — deuda). URL en `assets.file_urls[]` + `metadata.video_url`. Mismo riesgo de CDN (§16).

## 8. Website Builder (MOCK)

`Webs` = lista estática hardcodeada (`MOCK_PROJECTS`), sin API, sin CRUD. **Hoy no existe como capacidad** — es una vista de placeholder. Visión (landing/CMS/SEO/blog/hosting/dominio) = **idea, no producto**. Decisión pendiente: ¿es Capability importante o queda fuera del core?

## 9. Social Publishing

| Red | Estado |
|---|---|
| **Instagram** (Instagram Login, graph.instagram.com) | ✅ Validado (CAP-002) — Availability pending Meta App Review |
| **Facebook / IG** (Facebook Login, publish-meta) | ✅ Real (path original, usado por el cron) |
| **TikTok** (Content Posting API) | ✅ Validado en sandbox (CAP-003) — en audit; ⚠️ el path del calendario ("Publicar ahora" para tiktok) todavía muestra un guard, la publicación real es la pantalla dedicada |
| YouTube / LinkedIn | ❌ Nombrados en UI, sin integración |

## 10. Paid Media / Ads (MOCK)

`Ads` = 100% hardcodeado (`MOCK_ACCOUNTS/METRICS/CAMPAIGNS`), con disclaimer "tu equipo lo conectará". Meta/Google/TikTok Ads: **ninguno conectado** (schema `ad_accounts` existe para Google, sin ruta). El botón "Analizar con IA" sí llama a Claude (`/api/ai/ads-analysis`) pero sobre datos mock.

## 11. Analytics (MAYORMENTE MOCK)

Métricas de Ads: mock. Tablas `performances`/`distributions` existen (reales en schema) pero **no hay importador** que traiga datos de Meta/TikTok. Dashboard: stats reales (cuenta posts/docs/influencers/actividad desde DB). Executive: real (§12).

## 12. Executive Intelligence (REAL)

Consume: campaigns activas + strategies, memories workspace-level, recommendations pendientes, snapshot anterior (para delta). Produce un `ExecutiveObject` (status, why, delta, top_risk, recommended_decision con urgencia, evidencia). **Se calcula on-demand, no persiste histórico** (deuda menor). Responde "¿qué decidir esta semana?". Funcional.

## 13. Brand Memory (REAL, incipiente)

`memories` con Knowledge Objects reales: channel_affinity, content_mix, timing, approval_signals, brand_voice, creative_style — extraídos por heurística (no IA) desde los assets, con confidence por sample_size. **Sabe** patrones de canal/formato/horario/aprobación. **No sabe** todavía nada al inicio (aprende con uso). **Debería aprender en onboarding:** el diagnóstico inicial (backlog).

## 14. IA — inventario

**IA generativa (real):**
- Claude (`claude-sonnet-4-6`): copy de posts (`/generate`, `/generate-month`), 3 opciones de copy (`/ai/social-copy`), análisis de ads (`/ai/ads-analysis`).
- fal.ai: imágenes (Flux), video (Seedance).

**"Engines" = lógica de dominio pura, NO LLM** (importante): Knowledge, Decision, Recommendation, Learning, Strategy, Executive → estadística + reglas, escriben en DB. Son reales y trazables, pero **no son IA generativa** — son el "cerebro determinista".

**Decisiones que siguen dependiendo 100% del usuario:** aprobar/rechazar contenido, aceptar/rechazar recomendaciones, definir Autonomy Policy, crear campaigns, conectar cuentas, cargar marca.

## 15. Integraciones

| Integración | Estado |
|---|---|
| Anthropic (Claude) | ✅ Producción (sin fallback) |
| fal.ai (Flux + Seedance) | ✅ Producción |
| Meta Graph (FB/IG) | ✅ Producción |
| Instagram Login | ✅ Validado (pending App Review) |
| TikTok Content Posting | ✅ Sandbox validado (en audit) |
| MercadoPago | ⚠️ Parcial (schema + preapproval; enforcement de cobro sin verificar) |
| Google Ads / TikTok Ads | ❌ Solo schema/UI mock |
| Analytics/observability | ❌ No hay |

## 16. Storage ⚠️ (riesgo real, no mock)

- Imágenes/videos: **NO se guardan en storage propio.** Viven en la **CDN de fal.ai**, referenciados por URL en `jclaude_posts.image_url` / `assets.file_urls[]`. **No hay bucket de Supabase Storage en uso.**
- **Riesgo:** si fal expira/rota esas URLs, el contenido del cliente queda **roto**. Para un producto de contenido, esto es una deuda de infraestructura importante.
- Copy/outputs: en Postgres (`creatives`, `assets.caption`, `jclaude_posts`). Prompts: **hardcodeados en el código** (no en DB) → no se pueden ajustar sin redeploy.
- Documentos legales: reales (firma persiste).

## 17. Qué está COMPLETAMENTE terminado

Auth/registro · Dashboard · Social Media (CRUD + copy IA) · Legales (firma) · Campaigns + detalle (Brand Intelligence) · Executive · Autonomy (policy + audit trail + revert) · JClaude calendario + generación (copy/imagen/video) + aprobación · Publicación Instagram (validada) y Facebook.

## 18. Qué está MOCKEADO (sin excepción)

Ads (métricas/cuentas/campañas) · Influencers (`MOCK_INFLUENCERS`, no persiste) · Webs (`MOCK_PROJECTS`) · Extras (`MOCK_EXTRAS`) · Admin/CRM (`MOCK_CLIENTS`) · Planes/pago de JClaude (mockup: "7 días gratis" sin enforcement real).

## 19. Qué usa IA REAL

Claude → copy (posts, mes, alternativas), análisis de ads. fal.ai → imágenes (Flux), video (Seedance). (Los engines NO son IA — son reglas.)

## 20. Qué usa APIs externas REALES

Anthropic · fal.ai (Flux + Seedance) · Meta Graph (FB/IG) · Instagram Login · TikTok Content Posting · MercadoPago (parcial).

## 21. Qué compra EXACTAMENTE un cliente hoy ★

Si alguien pagara hoy, recibe:
- ✅ **JClaude**: un "empleado de contenido con IA" que genera un **mes de posts** (copy + hashtags + briefs) adaptado a su marca, **genera las imágenes y videos**, le arma el **calendario**, le deja **aprobar/rechazar**, y **publica en Instagram/Facebook** (TikTok en cuanto apruebe el audit).
- ✅ Una **capa de inteligencia** que aprende de sus aprobaciones y le da **campaigns, recomendaciones y un panel ejecutivo** (más "por detrás" que algo que use a diario).
- ✅ **Firma de documentos** legales.

**NO recibe (aunque lo vea en el menú):** gestión real de Ads, gestión real de Influencers, sitios web, analytics reales, ni un cobro/suscripción confiable. Esos módulos son **fachada**.

**Promesa comercial defendible hoy:** *"Generamos, aprobás y publicamos tu contenido de redes con IA."*
**Promesa peligrosa hoy:** cualquier cosa sobre Ads, Influencers, Webs, Analytics o "todo tu marketing automatizado".

---

## Riesgos de estabilización (no son bugs — son deuda que frena calidad)

1. **Storage efímero (fal CDN):** el contenido del cliente no está en storage propio → riesgo de media rota. *Prioridad alta para un producto de contenido.*
2. **Deuda de dominio `assets` ↔ `jclaude_posts`:** dual-write frágil (fire-and-forget, sin rollback); la UI lee la tabla legacy. Genera inconsistencias (lo sufrí al wirear TikTok).
3. **Prompts hardcodeados:** no se pueden tunear sin deploy; sin versionado real ni A/B (deuda de prompt-architecture, ya identificada).
4. **Billing sin enforcement:** trial/suscripción no gatea el acaso real → no se puede cobrar con confianza.
5. **Autonomy angosta:** una sola acción (`auto-schedule-approved-asset`), disparada al aprobar; sin orquestación más amplia.
6. **Módulos mock visibles:** el cliente ve Ads/Influencers/Webs/Extras como si funcionaran → riesgo de expectativa/credibilidad.
7. **UX de Autonomy:** funcional pero visualmente floja (jerarquía/colores) — y es el módulo de permisos/riesgo, donde la confianza es todo.

---

*Documento vive en `/docs/00-start-here/product-state-snapshot.md`*
*Relacionado: `capability-portfolio.md` · `capability-validation.md` · `product-reality-audit.md` (histórico)*
