# Technical Architecture
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

## 1. Stack actual

| Capa | Tecnología | Versión | Estado |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.9 | ✅ |
| Lenguaje | TypeScript | 5.x | ✅ |
| Estilos | Tailwind CSS | 3.x | ✅ |
| Componentes UI | Lucide Icons + Shadcn (parcial) | - | ✅ |
| Auth | Supabase Auth | - | ✅ |
| Base de datos | Supabase PostgreSQL | - | ✅ |
| ORM/Query | @supabase/ssr + supabase-js | - | ✅ |
| Storage | Supabase Storage | - | ❌ No inicializado |
| Hosting | Vercel (Hobby plan) | - | ✅ |
| IA — copy | Anthropic `claude-sonnet-4-6` | - | ✅ |
| IA — imágenes | fal.ai `flux/schnell` | - | ✅ |
| IA — videos | Seedance (fal.ai) | - | ❌ Pendiente |
| Pagos | MercadoPago preapproval | - | ✅ |
| Redes sociales | Meta Graph API v21.0 | - | ⚠️ Parcial |
| Deploy | Vercel CLI manual | - | ⚠️ Workaround |
| CI/CD | Ninguno | - | ❌ |

---

## 2. Estructura de carpetas

```
src/
├── app/
│   ├── (admin)/                  → Panel JC AIgency (solo jc_admin)
│   │   ├── admin/page.tsx        → Lista de clientes
│   │   ├── admin/clientes/       → Detalle por cliente
│   │   ├── admin/nuevo-cliente/  → Crear cliente
│   │   └── layout.tsx
│   │
│   ├── (auth)/                   → Páginas sin sidebar
│   │   ├── login/page.tsx        → Login + JClaude register (3 modos)
│   │   └── layout.tsx
│   │
│   ├── (client)/                 → Portal de cliente
│   │   ├── workspace/page.tsx    → Lista de workspaces del user
│   │   └── workspace/[workspaceId]/
│   │       ├── page.tsx          → Dashboard (MOCK)
│   │       ├── legales/          → Legales (MOCK)
│   │       ├── social-media/     → Social Media (MOCK)
│   │       ├── ads/              → Ads (MOCK)
│   │       ├── influencers/      → Influencers (MOCK)
│   │       ├── webs/             → Webs
│   │       ├── extras/           → Extras
│   │       ├── jclaude/          → JClaude (REAL)
│   │       ├── equipo/           → Equipo
│   │       ├── admin/            → Admin del workspace
│   │       └── layout.tsx        → Layout con Sidebar
│   │
│   ├── api/
│   │   ├── admin/create-client/  → Crear workspace+user (admin)
│   │   ├── ai/
│   │   │   ├── ads-analysis/     → Claude analiza métricas ads
│   │   │   ├── influencer-fit/   → Claude evalúa fit de influencer
│   │   │   └── social-copy/      → Claude genera variante de copy
│   │   ├── auth/
│   │   │   ├── register/         → Auto-registro JClaude
│   │   │   └── signout/          → Signout
│   │   ├── jclaude/
│   │   │   ├── cron-publish/     → Cron diario autopublicación
│   │   │   ├── generate/         → Generación individual
│   │   │   ├── generate-image/   → Imagen via fal.ai
│   │   │   ├── generate-month/   → Calendario completo via Claude
│   │   │   ├── oauth/start|callback|disconnect/  → Meta OAuth
│   │   │   ├── posts/            → CRUD posts JClaude
│   │   │   ├── profile/          → Brand profile
│   │   │   ├── publish-meta/     → Publicar en Meta API
│   │   │   ├── subscription/     → Estado suscripción
│   │   │   └── trending/         → Contenido trending
│   │   ├── mercadopago/
│   │   │   ├── create-subscription/  → Crear checkout MP
│   │   │   └── webhook/              → Recibir eventos MP
│   │   └── meta/
│   │       └── webhook/              → Verificar + recibir Meta
│   │
│   ├── privacy/                  → Política de privacidad (pública)
│   ├── terms/                    → Términos y condiciones (pública)
│   ├── data-deletion/            → Data deletion request (pública)
│   ├── layout.tsx                → Root layout
│   └── page.tsx                  → Redirect a /login
│
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx           → Sidebar del portal
│   └── ui/
│       ├── button.tsx
│       ├── checkbox.tsx
│       ├── popover.tsx
│       ├── progress.tsx
│       ├── scroll-area.tsx
│       └── sonner.tsx            → Toast notifications
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             → Supabase browser client
│   │   └── server.ts             → Supabase server client
│   ├── types/index.ts            → TypeScript types
│   └── utils.ts                  → cn() utility
│
└── middleware.ts                 → Auth guard + public routes
```

---

## 3. Server/Client boundary

### Server Components (default en App Router)
- `workspace/[workspaceId]/page.tsx` (dashboard) — pero lee de mocks, no de DB
- Layouts con auth checks
- Páginas estáticas (privacy, terms, data-deletion)

### Client Components (`"use client"`)
- Todos los módulos: legales, social-media, ads, influencers, webs, extras
- `jclaude/page.tsx` — toda la lógica de JClaude está en cliente
- `login/page.tsx`

**Problema:** La mayoría de las páginas son Client Components incluso cuando podrían ser Server Components, porque usan hooks de React para estado. Esto no es incorrecto, pero limita el pre-rendering y el caching.

---

## 4. Auth flow

```
Usuario → GET / → middleware → no auth → redirect /login
Usuario → GET /login → LoginPage (client component)
  → POST /api/auth/register (nuevo usuario JClaude)
  → supabase.auth.signInWithPassword
  → redirect /workspace/[id]/jclaude

Middleware checks:
  - isPublicPath: /, /login, /privacy, /terms, /data-deletion
  - isWebhook: /api/meta/webhook, /api/mercadopago/webhook, /api/jclaude/oauth/callback, /api/auth/register
  - isDevPreview: /workspace/ws-1 (acceso sin auth para demo)
  - Sin auth + path privado → redirect /login
  - Con auth + /login → redirect /workspace
```

---

## 5. API Routes — patrones actuales

### Patrón de autenticación en API routes
```typescript
// Todas las API routes autenticadas siguen este patrón:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
```

### Patrón de acceso a workspace
```typescript
// Verificar que el user pertenece al workspace (en routes con workspaceId):
const { data: wu } = await supabase
  .from('workspace_users')
  .select('role')
  .eq('workspace_id', workspaceId)
  .eq('user_id', user.id)
  .single()
if (!wu) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
```

### Lo que falta en las API routes
- Validación de inputs con Zod (actualmente sin validación de tipos)
- Rate limiting (actualmente sin límites)
- Error handling consistente
- Logging estructurado

---

## 6. Cron Jobs

| Job | Schedule | Qué hace |
|---|---|---|
| `cron-publish` | `0 9 * * *` (09:00 diario) | Busca posts con `status: 'scheduled'` y `scheduled_at < now()` → los publica via Meta API |

**Configurado en `vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/jclaude/cron-publish", "schedule": "0 9 * * *" }
  ]
}
```

**Limitación Vercel Hobby:** Solo un cron por día. Vercel Pro permite crons más frecuentes.

---

## 7. Variables de entorno

| Variable | Usada en | Estado |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ |
| `ANTHROPIC_API_KEY` | Server only | ✅ |
| `FAL_API_KEY` | Server only | ✅ |
| `MERCADOPAGO_ACCESS_TOKEN` | Server only | ✅ |
| `META_APP_ID` | Server only | ✅ |
| `META_APP_SECRET` | Server only | ✅ |
| `NEXT_PUBLIC_APP_URL` | Server only | ✅ (`https://aigency.jcmarketing.digital`) |

**Variables que faltan:**
| Variable | Para qué |
|---|---|
| `ENCRYPTION_KEY` | Para encriptar tokens OAuth Meta |
| `SENTRY_DSN` | Para error tracking (Sprint 1) |
| `RESEND_API_KEY` o similar | Para emails (password reset, notificaciones) |

---

## 8. Deploy — estado actual

### Cómo se deploya hoy (workaround)
El GitHub webhook de Vercel está roto. El deploy es manual:

```bash
cd "/Users/juancampos/Documents/Juan Campos/Juan Campos Ventures/JC Marketing/jc-platform"
npx vercel --prod
# Si el alias no se actualiza:
npx vercel alias [deployment-url] aigency.jcmarketing.digital
```

### URLs de producción
- Producción: `https://aigency.jcmarketing.digital`
- Sin staging environment

### Plan de CI/CD (Sprint 0)
1. Investigar por qué el GitHub webhook falló
2. Re-conectar en Vercel dashboard → Settings → Git → Re-authorize
3. Si sigue fallando: migrar a Vercel CI con GitHub Actions
4. Crear branch `staging` con ambiente separado en Vercel

---

## 9. Vercel plan — limitaciones actuales

| Límite | Hobby | Pro | Impacto |
|---|---|---|---|
| Function timeout | 60s | 300s | 🔴 Limita generate-month a 12 posts |
| Cron jobs | 1/día | Hourly | 🟡 Autopublish solo a las 09:00 |
| Bandwidth | 100GB | 1TB | 🟢 OK por ahora |
| Functions | 12/deploy | Unlimited | 🟢 OK |

**Acción recomendada:** Upgrade a Vercel Pro ($20/mes) en Sprint 1 para resolver el timeout.

---

## 10. Qué se debería hacer con el código existente

### Quedarse (no tocar)
- Estructura de App Router con route groups — bien pensada
- Middleware de auth — funciona correctamente
- RLS de Supabase — bien configurado
- API routes de JClaude — funcionan, solo mejorar
- MercadoPago integration — funciona

### Moverse a donde corresponde
- Prompts: de código a tabla `jclaude_prompts`
- Tipos de posts hardcodeados: de código a configuración por suscripción
- PLAN_CONFIG en create-subscription: moverlo a DB para hacerlo configurable

### Rehacerse
- Dashboard: de mocks a queries reales
- Legales: conectar a DB real
- Social Media: conectar a DB real + post_comments
- Generate month: agregar ai_jobs tracking

### Eliminarse
- Constantes MOCK_* de todos los módulos
- DEMO_MODE checks en páginas (reemplazar con dev workspace real)
- `const isDevPreview = pathname.startsWith('/workspace/ws-1')` en middleware

### Congelarse (no tocar hasta que se resuelva el core)
- Webs module
- Extras module
- Equipo module (hasta tener invitations flow)

---

## 11. Security checklist

- [ ] Encriptar tokens OAuth en `jclaude_profiles.social_credentials`
- [ ] Encriptar `ad_accounts.access_token`
- [ ] Agregar rate limiting en `/api/jclaude/generate-month` (1 por workspace por hora)
- [ ] Agregar rate limiting en `/api/jclaude/generate-image` (10 por workspace por día)
- [ ] Validar todos los inputs de API routes con Zod
- [ ] Agregar security headers (CSP, HSTS, X-Frame-Options) en `next.config.js`
- [ ] No loguear tokens a console.log en ninguna API route
- [ ] CORS explícito en API routes públicas

---

*Documento vive en `/docs/04-technical-architecture/technical-architecture.md`*
