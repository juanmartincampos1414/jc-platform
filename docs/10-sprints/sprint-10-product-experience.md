# Sprint 10 — Product Experience
## Customer Experience Foundation

**Fecha:** 2026-07-01
**Regla de trabajo:** Sprint 10 **no agrega Capabilities nuevas.** Consolida la experiencia comercial del producto. No es "hardening" (deuda técnica) — es construir **la experiencia que vive el cliente**, para que el producto empiece a sentirse terminado desde su perspectiva.

**Objetivo:** que JC AI Agency pase de "demo avanzada" a "producto que un cliente usa y en el que confía todos los días", alrededor de **tres prioridades**.

---

## Epic 1 — Product Reliability

> Que ningún cliente pueda perder contenido ni encontrar inconsistencias entre módulos.

- **Storage propio** para imágenes y videos — dejar de depender de la CDN de fal.ai. URLs **permanentes** bajo dominio/storage propio.
- **Consolidación definitiva del dominio `assets`** — eliminar el **dual-write** con `jclaude_posts`; un solo modelo de contenido; la UI lee el dominio, no la tabla legacy.
- **Versionado de Assets** + **persistencia real** del contenido generado.
- **Billing real con enforcement** — trial/suscripción que gatea el acceso de verdad (hoy no cobra con confianza).

## Epic 2 — Product Experience

Revisión de **experiencia** (no de features), end-to-end:

- Pantallas: **Dashboard · Campaign Detail · Executive · JClaude · Social Media · Autonomy**.
- Transversal: estados vacíos, estados de carga, navegación, responsive, jerarquía visual, colores, consistencia visual.
- **Autonomy es prioridad:** funciona, pero no transmite confianza. Como representa **permisos, riesgo y ejecución automática**, debe ser una de las pantallas **más claras** del producto.

## Epic 3 — Product Scope

> Comunicar el nivel de madurez **real** de cada módulo. Ser extremadamente honestos.

Etiquetas: ✅ **Production Ready** · 🟡 **Beta** · 🔒 **Coming Soon** · ❌ **Hidden**.

| Módulo | Etiqueta propuesta |
|---|---|
| JClaude (contenido) | ✅ Production Ready |
| Social Media | ✅ Production Ready |
| Campaigns + Executive | ✅ Production Ready |
| Autonomy | 🟡 Beta (tras el rediseño UX) |
| Legales | ✅ Production Ready |
| Dashboard | ✅ Production Ready |
| **Ads** | ❌ Hidden |
| **Influencers** | ❌ Hidden |
| **Webs** | ❌ Hidden |
| Extras | ❌ Hidden |

**Recomendación:** ocultar temporalmente **Ads, Influencers, Webs** (y Extras). No porque no existan, sino porque **todavía no agregan valor real**. Mejor **8 módulos excelentes que 20 a medias** — eso aumenta muchísimo la confianza del cliente.

---

## Definition of Done

- Contenido en **storage propio**, URLs permanentes; ningún media roto por expiración de CDN.
- **Un solo modelo de dominio** para contenido (sin dual-write); cero inconsistencias entre módulos.
- **Billing gatea** el acceso.
- **UX revisada** en las 6 pantallas core; **Autonomy rediseñada**.
- Cada módulo muestra su **madurez**; Ads/Influencers/Webs/Extras ocultos.

---

## Lo que viene después (Vista de Producto)

Recién con Product Experience consolidado arranca el verdadero AI Marketing OS. Secuencia como **evolución de Capabilities** (ver `docs/08-roadmap/capability-portfolio.md`):

- **Sprint 11 — Intelligent Onboarding** (fábrica de contexto, no formulario)
- **Sprint 12 — AI Content Factory** (fábrica completa: masivo, edición, variantes, A/B, biblioteca, versionado)
- **Sprint 13 — Brand Presence** (no "Website Builder": landing, sitios, blog, SEO, microsites, link-in-bio, lead magnets — misma Brand Memory)
- **Sprint 14 — Paid Media OS** (Meta/Google/TikTok/LinkedIn Ads, presupuestos, audiencias, aprendizaje, autonomía)

Todos alimentados por **[CAP-004 — Brand Knowledge Ingestion](../capabilities/CAP-004-brand-knowledge-ingestion.md)**.

---

*Documento vive en `/docs/10-sprints/sprint-10-product-experience.md`*
