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

### Candidatas a formalizar

Features ya construidas en producción que merecen su propia Capability Card (código `Built`, card `Planned`):

- **Campaign Strategy** (Sprint 7)
- **Executive Intelligence** (Sprint 8)
- **Learning Engine** (Sprint 5)
- **Brand Intelligence** (Sprint 6)
- **Knowledge / Decision / Recommendation Engine** (Sprint 2-4)

### Ideas de portfolio (`Planned`)

- Multi-Workspace Publishing
- Meta Ads Autonomy
- Budget Optimization
- Autonomous Campaign Execution

*(Estas dos últimas secciones son backlog: se vuelven "reales" cuando tienen su Capability Card con las 6 dimensiones.)*

---

## Capability Releases

Cada release se define como un **conjunto coherente de Capabilities**, no de tareas. Las Release Notes responden **una sola pregunta**:

> ¿Qué nuevas capacidades adquirió el cliente en esta versión?

Nada más. No commits, no pantallas, no sprints.

### Release v0.9 — actual

- CAP-001 — Autonomous Action Execution
- CAP-002 — Instagram Autopublish
- CAP-003 — TikTok Autopublish

### Release v1.0 — propuesta

- Multi-Workspace Publishing (CAP nueva)
- Campaign Strategy (formalizar card)
- Executive Intelligence (formalizar card)

### Release v1.1 — propuesta

- Meta Ads Autonomy
- Budget Optimization
- Autonomous Campaign Execution

*(v1.0 y v1.1 son ilustrativas hasta que cada capability tenga su card.)*

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
