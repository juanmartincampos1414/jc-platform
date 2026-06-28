# ADR-005 — Assets reemplaza definitivamente a Social Posts

**Fecha:** 2026-06-28
**Estado:** ACEPTADO
**Autores:** Juan Campos, JC AI Agency

---

## Contexto

El dominio original de JC AI Agency modelaba el contenido de redes sociales como `social_posts` — una tabla específica para posts de Social Media con campos propios (`network`, `title`, `caption`, `media_urls`, `status`).

Durante los Sprints 2-5, se introdujo el dominio unificado de `assets` como objeto central de contenido. Los assets fueron diseñados para representar cualquier pieza de contenido generada o aprobada en el sistema, independientemente del canal, tipo o módulo que lo creara.

La regresión de Social Media en Sprint 5 confirmó que la UI ya consume `assets` como fuente primaria. La tabla `social_posts` pasó a ser fallback.

---

## Decisión

**`assets` es el único objeto oficial del dominio para representar contenido.**

`social_posts` pasa a estado `legacy`. No se elimina todavía, pero:
- No se crean nuevos registros en `social_posts` desde ningún flujo nuevo
- Todo código nuevo debe operar exclusivamente sobre `assets`
- Los adapters (`src/lib/adapters/assets.ts`) son la única interfaz válida para leer y escribir contenido
- El fallback a `social_posts` permanece en el API route de Social Media únicamente para no romper datos históricos

---

## Consecuencias

### Positivas
- Un único modelo de datos para todo el contenido del sistema
- El ciclo completo (Generación → Aprobación → Publicación → Knowledge → Decisión) opera sobre la misma entidad
- RLS, eventos y trazabilidad funcionan consistentemente para todo el contenido
- Social Media, Campaign Detail, JClaude y futuros módulos comparten el mismo objeto

### A gestionar
- Los datos existentes en `social_posts` no migran automáticamente — el fallback los mantiene visibles
- Cualquier integración nueva (Meta, TikTok, publicación automática) debe conectarse a `assets`, no a `social_posts`
- Los status de `assets` (`generating`, `draft`, `internal_review`, `sent_for_approval`, `approved`, `rejected`, `needs_changes`, `published`, `archived`) son los únicos estados válidos — cualquier UI que mapee status legacy debe usar `mapAssetStatusToLegacy` del adapter

---

## Mapa de migración de status

| Status legacy (`social_posts`) | Status de dominio (`assets`) |
|-------------------------------|------------------------------|
| `pending` | `sent_for_approval` |
| `approved` | `approved` |
| `rejected` | `rejected` |
| `needs_changes` | `needs_changes` |
| `published` | `published` |
| `draft` *(nuevo — no existía en legacy)* | `draft` |
| *(no existía)* | `generating` |
| *(no existía)* | `internal_review` |
| *(no existía)* | `archived` |

---

## Tabla `social_posts` — Plan de deprecación

| Fase | Condición | Acción |
|------|-----------|--------|
| Ahora | Post Sprint 5 | Documentar como legacy, mantener fallback |
| Futuro | Cuando todos los datos históricos estén en `assets` | Eliminar fallback del route |
| Futuro | Cuando `social_posts` tenga 0 rows activos | DROP TABLE |

No hay fecha fija. La deprecación es funcional, no calendarizada.
