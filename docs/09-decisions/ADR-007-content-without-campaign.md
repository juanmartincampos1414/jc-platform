# ADR-007 — Contenido sin campaña: `campaign_id` nullable

**Fecha:** 2026-07-01
**Estado:** ACEPTADO
**Autores:** Juan Campos, JC AI Agency

---

## Contexto

`assets` y `creatives` (dominio Campaign-first, migración 003) tienen `campaign_id` **`NOT NULL`**. Pero el contenido de JClaude (calendario mensual de contenido) **no nace de una campaña** — es contenido suelto de la marca. Ese desajuste es la causa de que el dual-write a `assets` sea incómodo y de que la UI de JClaude siga leyendo la tabla legacy `jclaude_posts`.

Para que `assets` sea la **única fuente de verdad del contenido** (ver `05-data-architecture/asset-domain-migration-plan.md`), hay que permitir contenido sin campaña.

## Decisión

**`assets.campaign_id` y `creatives.campaign_id` pasan a `nullable`.**

"Contenido sin campaña" es un **ciudadano de primera clase** del dominio. El contenido de JClaude vive con `campaign_id = null` y puede **asociarse a una campaña más adelante** (cuando Campaign OS lo requiera).

## Alternativas consideradas

- **Campaña default / "inbox" por workspace.** Rechazada: mete filas sintéticas, obliga una semántica de campaña que no existe, y complica el reporting. Introducir "todo contenido pertenece a una campaña" debe ser una **decisión de producto**, no un workaround técnico.

## Consecuencias

- Los consumers que agrupan por campaña (Campaigns, Executive) **ya filtran por `campaign_id`** → el contenido suelto simplemente no aparece bajo una campaña. Correcto.
- Habilita el **backfill** de `jclaude_posts` → `assets` sin inventar campañas.
- El reporting a **nivel workspace** debe contemplar contenido **con** y **sin** campaña.

## Qué revisar en el futuro

Si Campaign OS madura al punto de que **todo** contenido deba pertenecer a una campaña, se introduce la campaña default **entonces**, como decisión de producto explícita — no como parche.

---

*Relacionado: `05-data-architecture/asset-domain-migration-plan.md` · `ADR-005-assets-replace-social-posts.md` · migración `016_campaign_id_nullable.sql`*
