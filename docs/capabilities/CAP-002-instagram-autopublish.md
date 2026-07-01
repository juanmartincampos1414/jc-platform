# CAP-002 — Autopublicación a Instagram (Instagram Login)

**Fecha:** 2026-06-30
**Framework:** Capability Validation v1.0
**Capability Version:** v1.0
**Capability:** `Validated`  ·  **Availability (General):** `Pending Meta App Review`

> Primera capacidad que llega a `Validated` con evidencia observable real (no "el código funciona").

---

## Capability

Una pieza aprobada en JClaude se publica en Instagram **desde la app**, vía Instagram Login (`graph.instagram.com`), sin salir a Instagram a hacerlo a mano. Flujo: conectar cuenta por OAuth → "Publicar ahora" → contenedor de media → `media_publish`.

## Problema

Hasta hoy, publicar una pieza aprobada implicaba trabajo manual fuera de la app: abrir Instagram, copiar el caption, subir la imagen y postear, pieza por pieza. Además, el path de Facebook Login no otorgaba el permiso de publicación correcto para el setup actual de Meta.

## Trabajo eliminado (pregunta 1)

Deja de existir el paso manual de **salir de la app y publicar a mano cada pieza**. Aprobada la pieza, la publicación ocurre desde JClaude con una acción.

## Decisión mejorada (pregunta 2)

La decisión "¿esta pieza sale?" se resuelve en **una sola acción** dentro de la app, en vez de depender de un segundo paso humano (que alguien la publique manualmente en otro lado). El aprobador deja de necesitar un ejecutor.

## Comportamiento esperado del cliente (pregunta 4)

- Conecta su cuenta de Instagram una vez (botón "Conectar con Instagram Login").
- Deja de publicar manualmente desde el teléfono.
- Publica con menos fricción y mayor frecuencia.
- Confía en que lo aprobado se publica desde un solo lugar.

## Evidencia observable (pregunta 3) — CUMPLIDA

**2026-06-30:**
1. Test call de App Review hecha: publicación exitosa en `flips.ar` (IG `17841476767433628`) vía `graph.instagram.com` con el permiso `instagram_business_content_publish` (container → FINISHED → `media_publish` devolvió `id`).
2. Flujo in-app validado end-to-end: se conectó `flips.ar` por el botón de **Instagram Login** (OAuth → token largo guardado en `social_credentials.ig_login`) y se **publicó un post aprobado desde JClaude** ("Publicar ahora" → `publish-instagram`), confirmado por Juan.

Es decir: se demostró en la realidad que la app publica en Instagram, no solo que el código compila.

## Capability vs Availability

Distinción explícita (la capacidad no es la disponibilidad):

| | Estado | Depende de |
|---|---|---|
| **Capability** — Instagram Autopublish | `Validated` | El producto — demostrado |
| **Availability** — General Availability | `Pending Meta App Review` | Aprobación externa de Meta |

La capacidad **está validada**: el flujo completo se demostró con éxito. La **disponibilidad comercial** (cuentas cualquiera / clientes arbitrarios) todavía depende de que Meta apruebe el App Review — **no es una limitación del producto, es una condición del ecosistema de Meta.**

## Evidencia mínima que cambió el estado

El estado pasó a `Validated` por esta evidencia observable — no por "el código debería funcionar":

- Cuenta real conectada (`flips.ar`).
- Autenticación oficial de Meta (Instagram Login / OAuth).
- Publicación creada correctamente (respuesta exitosa de la API con `id`).
- Publicación visible en Instagram.
- Sin intervención manual posterior.

## Qué NO valida CAP-002 v1.0

Esta capacidad, en su v1.0, **no** demuestra (serán validaciones futuras, no pertenecen a esta card):

- Múltiples cuentas simultáneas.
- Múltiples workspaces.
- Publicación masiva.
- Clientes arbitrarios.
- Escalabilidad.
- App Review aprobado.

## Capability Changelog

- **v1.0** (2026-06-30) — Primera publicación validada mediante la API oficial de Instagram (Instagram Login): una cuenta, imagen, desde la app.

## Estado

```
Designed   ✓  (4 preguntas respondidas)
Built      ✓  (commit 1f816aa, deploy prod dpl_5u6Tc1X9BSxf3tGCUNoXiMyJDMAv, tsc OK)
Frozen     ✓  (deployado, estable, typecheck limpio)
Validated  ✓  (evidencia observable 2026-06-30) — Availability: Pending Meta App Review
```

## Código relacionado

- `src/app/api/jclaude/oauth/instagram/start` · `.../oauth/instagram/callback` (OAuth Instagram Login)
- `src/app/api/jclaude/publish-instagram` (publicación vía graph.instagram.com)
- `src/app/(client)/workspace/[workspaceId]/jclaude/page.tsx` (botón conectar + routing de publicación)
- Setup: `docs/integrations/meta-instagram-login-setup.md`

---

*Card vive en `/docs/capabilities/CAP-002-instagram-autopublish.md`*
*Relacionado: `capability-validation.md` (Regla 23) · `build-rules.md` (Regla 22)*
