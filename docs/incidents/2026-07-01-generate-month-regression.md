# Incident Review — Generate Month Regression

**Fecha:** 2026-07-01
**Severidad:** Alta — flujo principal del producto caído (JClaude "Generar mes")
**Estado:** 🟢 Cerrado — resuelto y verificado en producción
**Reglas nacidas de este incidente:** [Regla 24](../02-product-operating-system/build-rules.md) · [Regla 25](../02-product-operating-system/build-rules.md)

---

## 1. Qué pasó

El botón **"Generar mes"** de JClaude dejó de funcionar. El calendario no se generaba y la operación se frenaba alrededor de los 60 segundos.

Impacto: el **flujo principal del producto** — la razón por la que un cliente usa JClaude — quedó inoperativo.

## 2. Diagnóstico (y los desvíos)

El diagnóstico pasó por varias hipótesis falsas antes de llegar a la causa real:

1. **"Es el botón."** No lo era — `handleGenerateMonth` estaba bien.
2. **"Es el frontend."** Tampoco — la UI disparaba el request correctamente.
3. **"Es el modelo."** Se sospechó de un model ID inválido (`claude-sonnet-4-6`). Se **verificó contra la referencia oficial**: el modelo es válido y activo. No era el modelo.

La evidencia que cerró el caso fue el **tiempo de la request en DevTools → Network: `Time = 46.38s`**, contra un timeout del SDK de 45s. Un rate limit (429) o un overload (529) habrían fallado en <3s. Era un **timeout**, no un error de API.

## 3. Causa raíz

La causa real fue una **combinación**, no un único bug:

- **Límite del runtime** — Vercel plan **Hobby** ⇒ `maxDuration` capado en **60s**, no negociable.
- **Crecimiento del contexto del prompt** — knowledge + decision context inyectados crecieron con el uso.
- **Generación demasiado grande en una única llamada** — un mes completo (~4000 tokens de JSON) en un solo call de Sonnet 4.6, no-streaming, tardaba ~50-70s.

> El problema no estaba en la UI ni en el modelo. Estaba en el **presupuesto temporal de una operación crítica**: el trabajo simplemente no entraba en la ventana de tiempo del runtime.

## 4. El fix (en dos capas)

1. **Background job + polling** — `POST /generate-month` crea el `agent_job` y devuelve `{ jobId }` al instante; la generación corre en `after()`. El usuario ya no espera sincrónicamente ⇒ desaparece el timeout de fetch y el 504. Un nuevo `GET /generate-month/status` deja que la UI haga polling. Guard de wall-clock a 52s ⇒ si algo excede, el job queda `failed` limpio (no `running` colgado).
2. **Generación paralela por chunks** — como aun en background un solo call excedía 52s bajo Hobby, la generación se dividió en **N llamadas concurrentes de ≤4 posts** cada una (con su rango de días, sin colisiones). Corren en paralelo bajo el guard ⇒ el reloj de pared ≈ la llamada más lenta (~15-25s) en vez de la suma. Mantiene Sonnet 4.6 (misma calidad) y entra holgado en 60s.

Archivos:
- `src/app/api/jclaude/generate-month/route.ts`
- `src/app/api/jclaude/generate-month/status/route.ts` (nuevo)
- `src/app/(client)/workspace/[workspaceId]/jclaude/page.tsx`

Commits: `b9d2c6a` (background+polling) · `b58b5a9` (chunks paralelos).

## 5. Lo que más rescatamos — no un bug, un patrón

Hasta este incidente pensábamos las generaciones IA como **llamadas individuales**. Quedó demostrado que eso **no escala**. El cambio a generación paralela por chunks no es solo un fix: es una **evolución arquitectónica** que probablemente reaparezca en otras partes del producto durante Fase II.

De ahí nace la **[Regla 24](../02-product-operating-system/build-rules.md)**: toda operación IA crítica corre por chunks, en paralelo, como background job, vía queue, o bajo un runtime que soporte esa duración — nunca como una única llamada larga.

## 6. Lo que confirmó sobre la metodología

La disciplina funcionó, y quedó formalizada en la **[Regla 25](../02-product-operating-system/build-rules.md)**:

- Cuando el flujo principal se rompe, **se detiene el roadmap** (no capacidades nuevas, no migraciones, no roadmap).
- No se buscó un parche: se buscó la **causa raíz**, se documentó, se corrigió.
- **Recién después** se retomó el roadmap, exactamente donde se había detenido (Asset Domain Migration, Paso 3).

El incidente fortaleció más al producto de lo que lo debilitó.

## 7. Estado post-incidente

| Ítem | Estado |
|---|---|
| Generate Month | 🟢 Operativo (verificado en producción por Juan) |
| Product Reliability (Epic 1) | 🟢 En curso |
| Asset Domain Migration | 🟢 Desbloqueada (retoma Paso 3 — Backfill / Migration 017) |

---

*Documento vive en `/docs/incidents/2026-07-01-generate-month-regression.md`*
