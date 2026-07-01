# Capability Portfolio & Releases
## JC AI Agency — el producto leído como capacidades (Vista de Producto)

**Versión:** 1.0 · 2026-07-01
**Origen:** Capability Releases — leer la evolución del producto como capacidades, no como sprints
**Clasificación:** `[Core Primitive Candidate]` — ver `foundations-design.md`
**Alcance:** JC AI Agency + cualquier producto sobre RUN72 Core OS

---

## El principio

El cliente nunca compra un Sprint, un commit ni una pantalla. **Compra capacidades.** Por eso el producto se lee como una colección de Capabilities que evolucionan de forma independiente.

> El software crece Sprint a Sprint. El producto crece Capability a Capability.

### La materia prima es el conocimiento de la marca

Más profundo aún: JC AI Agency dejó de ser una herramienta de marketing — es un **sistema operativo de marca**, y el marketing es una consecuencia. La verdadera materia prima del producto ya no son posts, anuncios ni campañas: es **el conocimiento de una marca**. Cuanto mejor entienda el sistema a la marca, mejores serán su contenido, imágenes, videos, anuncios, sitio, estrategia, recomendaciones y decisiones. Las próximas etapas no construyen features aisladas: construyen un sistema que **entiende una marca cada vez mejor** y usa ese conocimiento para ejecutar toda su operación. (Ver `product-constitution.md`.)

---

## Dos vistas del mismo producto

El mismo producto, dos perspectivas distintas:

### Vista de Ingeniería — *cómo se construye*
Sprints, dependencias, migraciones, QA, implementación.
→ vive en `product-roadmap.md` y `docs/10-sprints/`.

### Vista de Producto — *qué adquiere el cliente*
Capabilities: estado, versión, availability, evidencia, impacto para el cliente.
→ este documento + las Capability Cards (`docs/capabilities/`).

Ambas describen exactamente el mismo producto. Ninguna reemplaza a la otra.

---

## Capability Portfolio

Las capacidades no tienen todas el mismo nivel de madurez. El portfolio describe el **estado real del producto** mucho mejor que una lista de features.

**Estados de portfolio:** `Planned` (identificada, aún sin Designed) → entra al lifecycle **Designed → Built → Frozen → Validated** (ver `capability-validation.md`).

### Cards formalizadas

| # | Capability | Version | Estado | Availability |
|---|---|---|---|---|
| CAP-001 | Autonomous Action Execution | v1.0 | `Built` | — (interno) |
| CAP-002 | Instagram Autopublish | v1.0 | `Validated` | Pending Meta App Review |
| CAP-003 | TikTok Autopublish | v1.0 | `Validated` | Pending TikTok Audit |
| CAP-004 | Brand Knowledge Ingestion | (planned) | `Planned` | — |

### Candidatas a formalizar

Features ya construidas en producción que merecen su propia Capability Card (código `Built`, card `Planned`):

- **Campaign Strategy** (Sprint 7)
- **Executive Intelligence** (Sprint 8)
- **Learning Engine** (Sprint 5)
- **Brand Intelligence** (Sprint 6)
- **Knowledge / Decision / Recommendation Engine** (Sprint 2-4)

### Ideas de portfolio (`Planned`, aún sin card)

- **Intelligent Onboarding** (Sprint 11)
- **AI Content Factory** (Sprint 12 — el contenido evoluciona a fábrica completa)
- **Brand Presence** (Sprint 13 — antes "Website Builder"; concepto más amplio)
- **Paid Media OS** (Sprint 14)
- Multi-Workspace Publishing

*(Las secciones "Candidatas" e "Ideas" son backlog: se vuelven "reales" cuando tienen su Capability Card con las 6 dimensiones.)*

---

## Capability Releases

Cada release se define como un **conjunto coherente de Capabilities**, no de tareas. Las Release Notes responden **una sola pregunta**:

> ¿Qué nuevas capacidades adquirió el cliente en esta versión?

Nada más. No commits, no pantallas, no sprints.

### Release v0.9 — actual

- CAP-001 — Autonomous Action Execution
- CAP-002 — Instagram Autopublish
- CAP-003 — TikTok Autopublish

### Roadmap de producto (evolución de Capabilities)

| Sprint | Foco / Release | Capabilities |
|---|---|---|
| **10** | **Product Experience** (Reliability · Experience · Scope) | consolida las existentes — **no agrega** capabilities. Ver `10-sprints/sprint-10-product-experience.md` |
| **11** | Intelligent Onboarding | Brand Knowledge Ingestion (CAP-004) + Intelligent Onboarding |
| **12** | AI Content Factory | fábrica completa (masivo, edición, variantes, A/B, biblioteca, versionado) |
| **13** | Brand Presence | landing/sitios/blog/SEO/microsites/link-in-bio — misma Brand Memory |
| **14** | Paid Media OS | Meta/Google/TikTok/LinkedIn Ads con aprendizaje y autonomía |

*(Sprint 11+ son ilustrativas hasta que cada capability tenga su card. Todas alimentadas por CAP-004.)*

---

## Formato de Release Notes (Vista de Producto)

Para cada release, listar solo:

- Las Capabilities **nuevas** o que **subieron de versión**.
- Su **Capability Version** y el delta de su Changelog.
- **Qué puede hacer ahora el cliente que antes no podía.**

Cero contenido técnico. La Vista de Ingeniería (sprints, migraciones) queda en `product-roadmap.md`.

---

*Documento vive en `/docs/08-roadmap/capability-portfolio.md`*
*Relacionado: `capability-validation.md` (Regla 23, lifecycle) · `docs/capabilities/` (cards) · `product-roadmap.md` (Vista de Ingeniería)*
