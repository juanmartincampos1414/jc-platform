# Asset Domain Migration Plan
## Una única fuente de verdad para el contenido

**Fecha:** 2026-07-01
**Objetivo (Epic 1):** *que el contenido de un cliente tenga una única fuente de verdad, viva para siempre y pueda recorrer todo el producto sin inconsistencias.*
**Regla:** sin código todavía. Este documento primero. Migración **conservadora, nunca al revés.**

---

## 1. Estado actual — el problema

Hoy el mismo contenido tiene **tres representaciones**:

| Tabla | Rol hoy | Qué escribe |
|---|---|---|
| `jclaude_posts` (legacy, Sprint 0) | **Fuente de verdad actual del calendario JClaude** | copy, hashtags, image_brief, image_url, status(5), scheduled/published |
| `social_posts` (legacy) | Fuente vieja de Social Media (ya `legacy` por ADR-005) | posts orgánicos de social |
| `assets` (dominio, migr. 003) | **Fuente de verdad OFICIAL** — pero hoy es una **copia sombra** | caption, file_urls[], metadata, status(9), campaign_id, approval, source_table/source_id |

**Quién escribe qué:**
- `jclaude_posts` ← `generate-month` (primario); aprobación/publicación ← `/api/jclaude/posts` + `cron-publish`.
- `assets` ← dual-write de `generate-month` (**async, fire-and-forget** → poco confiable) + `generate-video` (el video) + aprobación de Social Media + Autonomy.

**La inconsistencia concreta:**
- El **calendario JClaude lee `jclaude_posts`**. La **inteligencia** (Knowledge, Campaigns, Executive, Autonomy) y **Social Media** leen `assets`. → **dos verdades.**
- Aprobar en JClaude toca `jclaude_posts`; aprobar en Social Media toca `assets` → estados que no coinciden.
- El **video vive en `assets`**, el calendario lee `jclaude_posts` → por eso wirear TikTok fue incómodo.

---

## 2. Fuente de verdad — el destino

- **`assets` = única fuente de verdad de TODO el contenido** (post, reel, story, video, image, ad).
- **Desaparecen:** `jclaude_posts` y `social_posts` como fuentes; el dual-write; la doble representación de estado.
- **Quedan como compatibilidad temporal** (solo mientras dure el cutover): `jclaude_posts` / `social_posts`, luego se eliminan.

### 🔑 Decisión de diseño previa (bloqueante)

`assets.campaign_id` es **`NOT NULL`**, pero el contenido de JClaude **no pertenece a una campaña**. Hay que resolverlo antes de migrar:

- **Opción A (recomendada):** hacer `campaign_id` **nullable** → existe "contenido sin campaña". Más simple, sin datos sintéticos.
- **Opción B:** una **campaña default / "inbox"** por workspace para el contenido suelto. Más ordenado conceptualmente, pero mete filas sintéticas.

*(Esta decisión merece un ADR corto antes de tocar el schema.)*

---

## 3. Consumers — mapa completo

| Consumer | Hoy lee | Debe leer | Falta migrar |
|---|---|---|---|
| JClaude (calendario) | `jclaude_posts` | `assets` | ✅ sí |
| Scheduler (`cron-publish`) | `jclaude_posts` | `assets` | ✅ sí |
| Dashboard (counts) | `jclaude_posts` | `assets` | ✅ sí |
| Social Media | `assets` (+fallback `social_posts`) | `assets` | quitar fallback |
| Publish (Meta/IG/TikTok) | recibe del cliente | `assets` | menor |
| Knowledge Engine | `assets` | `assets` | — ya ok |
| Campaigns / Executive | `assets` | `assets` | — ya ok |
| Autonomy (auto-schedule) | `assets` | `assets` | — ya ok |
| Recommendations / Decision | derivan de Knowledge | — | — ya ok |
| Analytics / distributions | `assets` | `assets` | — ya ok |

→ **La inteligencia ya lee `assets`.** Falta migrar la lectura de: **JClaude calendario, cron-publish, dashboard**, y sacar el fallback de Social Media.

---

## 4. Migration Strategy (5 pasos, nunca al revés)

1. **Inventario** — este documento. ✅
2. **Compatibilidad** — resolver la decisión de `campaign_id` (ADR-007: nullable, migr. 016 ✅); dual-write a `assets` confiable; `campaign_id` nullable; assets siempre creados. ✅
3. **Backfill** — copiar los `jclaude_posts` / `social_posts` existentes que aún no tengan su `asset` (idempotente por `source_table` + `source_id`). *No destructivo.* ✅ **Aplicada 2026-07-01 — Migration `017_backfill_content_assets.sql`** (rollback: `ROLLBACK_017.sql`). **Resultado: 0 gaps** (46 jclaude_posts, todos con asset; social_posts vacía; 017 insertó 0 filas). El dual-write resultó confiable en la práctica → `assets` (112 filas) ya contenía todo el histórico. Verificado por datos, no por asunción. La 017 queda como red de seguridad idempotente. `campaign_id = NULL` (ADR-007), filas tagueadas `metadata.backfill = '017'`.
4. **Cutover de lectura** — apuntar JClaude calendario + cron-publish + dashboard a `assets` (vía adapter), **un consumer a la vez**, verificando. El dual-write sigue activo (datos en ambas). ⬅️ **Próximo paso tras aplicar 017.**
5. **Quitar el dual-write** — recién cuando `assets` sea la única lectura estable: dejar de escribir `jclaude_posts` / `social_posts`.
6. **Eliminar tablas legacy** — solo cuando nadie las lee ni escribe, con backup.

---

## 5. Rollback

| Paso | Cómo se vuelve atrás |
|---|---|
| 2–3 (compat + backfill) | No destructivos (solo agregan). Rollback = ignorar `assets`, seguir con `jclaude_posts`. |
| 4 (cutover lectura) | Feature flag / revert del adapter → volver a leer `jclaude_posts`. El dual-write sigue, los datos están en ambas. |
| 5 (quitar dual-write) | No hacerlo hasta que 4 lleve ≥ X días estable. Rollback = re-activar el dual-write. |
| 6 (drop legacy) | **Irreversible** → solo con backup y semanas de estabilidad. Mantener `ROLLBACK_016.sql` que recree las tablas desde `assets`. |

---

## El invariante que queda establecido

> Cada Capability tiene **una** fuente de verdad. Para el contenido, es **`assets`**. Todo lo demás — `jclaude_posts`, `social_posts`, la UI — es **adaptación, nunca duplicación.**

---

*Documento vive en `/docs/05-data-architecture/asset-domain-migration-plan.md`*
*Relacionado: `schema-contract.md` · `ADR-005-assets-replace-social-posts.md` · `10-sprints/sprint-10-product-experience.md`*
