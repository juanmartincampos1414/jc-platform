# JC AI Agency

**AI Marketing Operating System** — Planificá, generá, aprobá, publicá y medí campañas de marketing usando IA.

URL de producción: [aigency.jcmarketing.digital](https://aigency.jcmarketing.digital)

---

## Quick start

```bash
npm install
cp .env.example .env.local   # completar con las variables reales
npm run dev
```

Para desarrollo local sin Supabase configurado, navegar directamente a `/workspace/ws-1` (demo mode).

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 App Router + TypeScript |
| Auth + DB | Supabase (PostgreSQL + RLS) |
| Storage | Supabase Storage |
| Hosting | Vercel |
| IA — copy | Anthropic Claude (claude-sonnet-4-6) |
| IA — imágenes | fal.ai (flux/schnell) |
| Pagos | MercadoPago preapproval |
| Redes sociales | Meta Graph API v21.0 |

---

## Variables de entorno necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
FAL_API_KEY=
MERCADOPAGO_ACCESS_TOKEN=
META_APP_ID=
META_APP_SECRET=
NEXT_PUBLIC_APP_URL=https://aigency.jcmarketing.digital
ENCRYPTION_KEY=
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (admin)/        → Panel JC AIgency (solo jc_admin)
│   ├── (auth)/         → Login y registro
│   ├── (client)/       → Portal de cliente
│   │   └── workspace/[workspaceId]/
│   │       ├── page.tsx           → Dashboard
│   │       ├── jclaude/           → JClaude ← núcleo real del producto
│   │       ├── social-media/      → Social Media
│   │       ├── legales/           → Documentos y firmas
│   │       ├── ads/               → Publicidad
│   │       └── influencers/       → Pipeline de influencers
│   └── api/            → API routes
├── components/
└── lib/                → Supabase client, tipos, utils
supabase/
├── schema.sql          → Schema completo de DB
└── migrations/         → Migrations individuales (en progreso)
docs/                   → Documentación completa del producto
```

---

## Deploy

El GitHub webhook está desconectado. Deploy manual por ahora:

```bash
npx vercel --prod
# Si el alias no actualiza:
npx vercel alias [deployment-url] aigency.jcmarketing.digital
```

---

## Documentación

**Empezar por:** [`docs/00-start-here/START_HERE.md`](docs/00-start-here/START_HERE.md)

| Documento | Descripción |
|---|---|
| [Product Reality Audit](docs/00-start-here/product-reality-audit.md) | Qué es real vs mock hoy |
| [Product Constitution](docs/01-product-constitution/product-constitution.md) | Qué es el producto, principios e invariantes |
| [Domain Model](docs/03-product-architecture/domain-model.md) | Entidades, campos y relaciones |
| [Technical Architecture](docs/04-technical-architecture/technical-architecture.md) | Stack, estructura, deploy |
| [AI Architecture](docs/06-ai-architecture/ai-architecture.md) | Agentes IA y JClaude |
| [Roadmap](docs/08-roadmap/product-roadmap.md) | v0.1 → v1.0 |
| [Sprint Plan](docs/10-sprints/sprint-plan-immediate.md) | Sprints inmediatos |
| [Build Rules](docs/02-product-operating-system/build-rules.md) | Reglas de construcción obligatorias |

---

## Estado actual

**Sprint actual: Sprint 0 — Technical Stabilization**

El módulo **JClaude** es el único completamente funcional. Los demás módulos tienen UI construida pero no conectada a DB real.

**RUN72 Compliance Score: 22%** — [Ver detalle](docs/00-start-here/run72-compliance-score.md)
