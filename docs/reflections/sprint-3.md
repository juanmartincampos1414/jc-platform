# Sprint 3 — Campaign Command Center
## Product Reflection

**Release:** `v0.3-campaign-command-center`
**Commit:** `a83b99a`
**Producción:** `aigency.jcmarketing.digital`
**Resultado:** GO

---

## Logro principal

La arquitectura dejó de estar escondida en la base de datos y apareció como producto visible.

Por primera vez el usuario puede navegar una Campaign y ver Assets, Decisions, Knowledge y Activity en una sola pantalla. El Campaign Command Center convierte el dominio técnico en experiencia navegable.

---

## Lo que se construyó

**Sidebar:** Campaigns como segundo ítem de navegación, antes que los módulos de servicio.

**Campaign List (`/campaigns`):**
- Status badge, nombre, objetivo desde `brief.objective`
- Counters: asset_count, decision_count
- timeAgo desde `updated_at`

**Campaign Detail (`/campaigns/[campaignId]`):**
- Overview: brand, status, starts_at/ends_at, canales desde `brief.channels`, counters globales
- Assets: status summary + lista con channel, tipo, caption, scheduled_at
- Decisions: decision_type, rationale, confidence bar, status
- Knowledge Used: memory_type, content, confidence bar (colapsado por defecto)
- Recommendations: empty state Sprint 3B
- Activity: events con iconografía por tipo (colapsado por defecto)

**APIs:**
- `GET /api/campaigns?workspaceId=` — lista enriquecida con counts
- `GET /api/campaigns/[campaignId]?workspaceId=` — detalle completo: campaign + assets + decisions + knowledge + activity

---

## Bugs encontrados en QA

### BUG-001 — Decision channel derivation
- **Síntoma:** Decisions muestran `counts` como canal en lugar del nombre real.
- **Causa probable:** Decision Engine lee `asset_count` en lugar del campo de channel/distribution correcto al derivar `deriveChannelDecision`.
- **Severidad:** baja — no afecta funcionalidad principal.
- **Sprint:** 3B.

### BUG-002 — Decision percentage NaN
- **Síntoma:** Confidence bar de Decisions muestra `NaN%`.
- **Causa probable:** cálculo de porcentaje sin denominador válido en el deriver.
- **Severidad:** baja.
- **Sprint:** 3B.

---

## Fixes durante QA (no anticipados en build spec)

| Fix | Causa | Aprendizaje |
|-----|-------|-------------|
| `start_date` → `starts_at` | Schema usa nombres distintos al spec | Leer migration antes de escribir queries |
| `end_date` → `ends_at` | ídem | ídem |
| `objective` → `brief.objective` | Campo está en jsonb, no columna | ídem |
| `brands(name, industry)` → `brands(name)` | `industry` no existe en brands | Verificar schema de tabla relacionada antes del join |

**Patrón:** 4 de 4 bugs de QA fueron mismatch entre nombres de columna del spec y el schema real de la migración. Fix: antes de escribir queries, leer la migración.

---

## Principio confirmado

> La arquitectura invisible no es producto.

Assets, Decisions y Knowledge existían desde Sprint 2B. Pero sin Campaign Detail no eran navegables ni demostrables. Un feature que el usuario no puede ver no existe como producto — existe como deuda técnica con nombre elegante.

El Campaign Command Center convierte deuda técnica en capital de producto.

---

## Próximo sprint

**Sprint 3B — Recommendations Layer**

No construir otro motor. Convertir las Decisions visibles en recomendaciones accionables dentro del Campaign Command Center. La sección Recommendations ya existe como empty state — completarla es el objetivo.

Incluye: fix BUG-001 y BUG-002 como prerequisito.
