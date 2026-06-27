# ADR-004: Domain Migration — Dual-Write Strategy (Sprint 1)

**Date:** 2026-06-27
**Status:** Accepted
**Deciders:** Juan Campos
**Context:** Sprint 1 — Domain Migration Plan

---

## Contexto

La plataforma tenía tablas legacy (`jclaude_posts`, `social_posts`, `post_comments`) que modelaban artefactos de contenido sin una abstracción de Campaign o Brand. El Domain Freeze (Sprint 0.9) definió 12 entidades de dominio con Campaign como centro. El reto era migrar sin romper producción.

## Opciones evaluadas

### Opción A: Big Bang — cortar y migrar
- Crear tablas nuevas, migrar datos, actualizar todo el código en un solo deploy.
- **Riesgo:** Si algo falla en producción, rollback complejo. No hay red de seguridad.

### Opción B: Feature flag — código nuevo detrás de flag
- Mantener dos rutas de código paralelas controladas por env var.
- **Riesgo:** Doble código permanente, difícil sincronizar datos entre ramas del flag.

### Opción C (elegida): Dual-Write + Compatibility Views
- Escribir en tablas VIEJAS Y NUEVAS simultáneamente.
- Leer desde tablas nuevas con fallback automático a tablas viejas.
- Views de compatibilidad (`jclaude_posts_v`, `social_posts_v`) para código no migrado.
- **Ventaja:** Producción nunca se rompe. Migración incremental, módulo por módulo.

## Decisión

Dual-Write con fallback automático.

## Invariantes de implementación

1. **Tablas viejas son inmutables de tipo:** No se eliminan ni se renombran en Sprint 1.
2. **Fallback silencioso:** Si la tabla nueva no tiene el registro, se lee de la vieja. El usuario no nota diferencia.
3. **Dual-write es fire-and-forget para assets:** La escritura en `assets` no bloquea la respuesta. Si falla, el dato queda en la tabla vieja. Se resuelve en el próximo backfill.
4. **Backfill idempotente:** Las migraciones 003 y 004 pueden ejecutarse N veces sin duplicar datos.
5. **Rejection reason es obligatorio:** El adapter enforza este invariante — nunca llega a la DB sin `rejection_reason` cuando status es `rejected` o `needs_changes`.

## Archivos creados/modificados

| Archivo | Rol |
|---------|-----|
| `supabase/migrations/003_create_domain_tables.sql` | Crea las 12 tablas del dominio con RLS completo |
| `supabase/migrations/004_backfill_domain_tables.sql` | 7-step backfill idempotente de tablas viejas a nuevas |
| `supabase/migrations/005_compatibility_views.sql` | Views `jclaude_posts_v` y `social_posts_v` |
| `supabase/migrations/ROLLBACK_sprint1.sql` | Rollback seguro: DROP views + tablas nuevas, tablas viejas intactas |
| `src/lib/types/domain.ts` | Tipos TypeScript para las 12 entidades + legacy compat types |
| `src/lib/adapters/assets.ts` | Read/write unificado para assets con fallback a tablas viejas |
| `src/lib/adapters/campaigns.ts` | get-or-create Brand/Campaign por defecto + stats |
| `src/app/api/jclaude/generate-month/route.ts` | Dual-write: jclaude_posts + assets en paralelo |
| `src/app/api/social/posts/route.ts` | Lee de assets con fallback a social_posts |
| `src/app/api/social/posts/[id]/status/route.ts` | Update en assets con fallback a social_posts |
| `src/app/api/social/posts/[id]/comments/route.ts` | Lee/escribe en asset_comments con fallback a post_comments |
| `src/app/api/dashboard/stats/route.ts` | Stats desde assets + campaigns con fallback a tablas viejas |

## Plan de salida de Sprint 1

Sprint 2 puede:
- Verificar que el backfill está completo en producción.
- Remover fallbacks legacy módulo por módulo.
- Deprecar tablas viejas con `ALTER TABLE ... RENAME TO ..._deprecated`.
- Eliminar `jclaude_posts_v` y `social_posts_v`.

## Consecuencias

- **Positivo:** Zero downtime. Rollback trivial. Incrementalidad real.
- **Negativo:** Durante Sprint 1, datos pueden existir en ambas tablas. El backfill debe ejecutarse y verificarse en producción.
- **Acción requerida:** Ejecutar migraciones 003, 004, 005 en Supabase SQL Editor antes de deploy.
