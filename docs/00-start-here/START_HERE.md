# START HERE
## JC AI Agency × RUN72 OS

**Si acabás de llegar a este proyecto, empezá acá.**

---

## Qué es este producto

JC AI Agency es un **AI Marketing Operating System**.

Ayuda a marcas y agencias a generar, aprobar, publicar y medir contenido de marketing usando IA.

El módulo central se llama **JClaude** — genera calendarios de contenido mensuales con Claude, imágenes con fal.ai, y los publica automáticamente en Instagram y Facebook.

URL de producción: **aigency.jcmarketing.digital**

---

## Estado actual (Junio 2026)

**Sprint actual: Sprint 0 — Technical Stabilization**

```
JClaude         → ✅ REAL — funciona y tiene clientes reales
Dashboard       → ❌ MOCK — datos hardcodeados
Legales         → ❌ MOCK — firma no persiste en DB
Social Media    → ❌ MOCK — aprobaciones no persisten
Ads             → ❌ MOCK — métricas inventadas
Influencers     → ❌ MOCK — pipeline no persiste
```

**RUN72 Compliance Score: 22%** — subiendo con cada sprint.

---

## Los 5 documentos más importantes

1. **[Product Reality Audit](product-reality-audit.md)** — qué funciona y qué no, sin suavizar
2. **[Product Constitution](../01-product-constitution/product-constitution.md)** — qué es el producto, principios, invariantes
3. **[Build Rules](../02-product-operating-system/build-rules.md)** — reglas obligatorias antes de escribir código
4. **[Domain Model](../03-product-architecture/domain-model.md)** — entidades del sistema
5. **[Sprint Plan](../10-sprints/sprint-plan-immediate.md)** — qué se hace ahora

---

## Mapa completo de documentación

```
docs/
├── 00-start-here/
│   ├── START_HERE.md               ← estás aquí
│   ├── product-reality-audit.md    ← real vs mock
│   └── run72-compliance-score.md   ← scores por área
│
├── 01-product-constitution/
│   └── product-constitution.md     ← qué es, qué no es, principios
│
├── 02-product-operating-system/
│   ├── universal-workflow.md       ← strategy→learning loop
│   └── build-rules.md              ← reglas obligatorias
│
├── 03-product-architecture/
│   ├── domain-model.md             ← entidades y relaciones
│   ├── ubiquitous-language.md      ← lenguaje canónico
│   ├── capability-map.md           ← 18 capacidades del sistema
│   └── event-architecture.md       ← catálogo de eventos
│
├── 04-technical-architecture/
│   └── technical-architecture.md  ← stack, estructura, deploy, security
│
├── 05-data-architecture/
│   └── data-architecture.md       ← schema, tablas a crear, RLS, Storage
│
├── 06-ai-architecture/
│   ├── ai-architecture.md         ← 12 agentes IA especializados
│   └── prompt-architecture.md     ← audit de prompts + plan Prompt DB
│
├── 07-knowledge-architecture/
│   ├── knowledge-architecture.md  ← dónde vive el conocimiento
│   └── memory-model.md            ← 6 tipos de memoria del sistema
│
├── 08-roadmap/
│   └── product-roadmap.md         ← v0.1 → v1.0
│
├── 09-decisions/
│   ├── ADR-001-nextjs.md
│   ├── ADR-002-supabase.md
│   └── ADR-003-jclaude-core.md
│
└── 10-sprints/
    ├── sprint-plan-immediate.md    ← sprint -1 a sprint 4
    └── module-refactor-plan.md     ← cómo refactorizar cada módulo
```

---

## Regla más importante antes de escribir código

> **Leer [Build Rules](../02-product-operating-system/build-rules.md) primero.**

Las tres reglas más críticas:
1. Nada nuevo sin documento
2. Nada en producción si sigue siendo mock
3. Todo output IA debe guardar input, prompt, modelo y resultado en `ai_jobs`

---

## Cómo deployar

```bash
npx vercel --prod
```

GitHub webhook está desconectado — deploy es manual por ahora. Ver [technical-architecture.md](../04-technical-architecture/technical-architecture.md) sección 8.

---

## Dónde están las credenciales

Las credenciales NO están en el repo. Están en:
- Vercel dashboard → Environment Variables
- Supabase dashboard → Settings → API

Ver lista completa de variables en el README principal.

---

*Última actualización: Sprint -1 — RUN72 Product Freeze · Junio 2026*
