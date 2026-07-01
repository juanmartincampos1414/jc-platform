# CAP-003 — Autopublicación a TikTok (Content Posting API)

**Fecha:** 2026-07-01
**Framework:** Capability Validation v1.0
**Capability:** `Validated`  ·  **Availability (General):** `Pending TikTok Audit`

---

## Capability

Publicar un video en TikTok desde la app vía Content Posting API (Direct Post, PULL_FROM_URL), con la UX que exigen las content-sharing guidelines de TikTok.

## Problema

Publicar videos en TikTok a mano es trabajo manual por pieza. Además, TikTok tiene requisitos estrictos de integración (auth, UX, verificación de dominio, audit) que hay que cumplir para publicar por API.

## Trabajo eliminado (pregunta 1)

Deja de existir el paso manual de subir cada video a TikTok desde el teléfono.

## Decisión mejorada (pregunta 2)

El aprobador decide una vez (privacidad + interacciones + disclosure) y el video sale, en lugar de coordinar una subida manual aparte.

## Comportamiento esperado del cliente (pregunta 4)

- Conecta su cuenta de TikTok una vez.
- Publica videos desde la app con menos fricción.
- Controla privacidad / interacciones / disclosure comercial en un solo lugar.

## Evidencia observable (pregunta 3) — CUMPLIDA (sandbox)

**2026-07-01:** publicación exitosa de un video en la cuenta `flips.ar` desde la app, vía `graph`/`open.tiktokapis.com` Content Posting API (creator_info → video/init PULL_FROM_URL → status), con la pantalla compliant (creator + privacidad sin default + interacciones + disclosure + music confirmation). El video apareció en el perfil (privado). Confirmado por Juan.

## Compliance implementado (content-sharing guidelines)

Creator visible antes de publicar · privacidad sin default · interacciones (comment/duet/stitch) sin tildar y greyed según creator_info · toggle de divulgación comercial (Your Brand / Branded Content) con enforcement · branded ≠ privado · Music Usage Confirmation · aviso de procesamiento · PULL_FROM_URL vía proxy en dominio verificado.

## Capability vs Availability

Distinción explícita (la capacidad no es la disponibilidad):

| | Estado | Depende de |
|---|---|---|
| **Capability** — TikTok Autopublish | `Validated` | El producto — demostrado |
| **Availability** — General Availability | `Pending TikTok Audit` | Aprobación externa de TikTok |

La capacidad **está validada**: se publicó un video real desde la app con el flujo oficial. La **disponibilidad comercial** (cuentas públicas / de clientes) depende de que TikTok apruebe el audit (~2-4 semanas) — **no es una limitación del producto, es una condición del ecosistema de TikTok** (unaudited clients solo publican a cuentas privadas, en SELF_ONLY).

## Evidencia mínima que cambió el estado

El estado pasó a `Validated` por esta evidencia observable — no por "el código debería funcionar":

- Cuenta real conectada (`flips.ar`).
- Autenticación oficial de TikTok (Login Kit / OAuth).
- Video enviado y publicación creada (creator_info → video/init PULL_FROM_URL → status), respuesta exitosa de la API.
- Publicación visible en el perfil de TikTok (privada).
- Sin intervención manual posterior.

## Qué NO valida CAP-003 v1.0

Esta capacidad, en su v1.0, **no** demuestra (serán validaciones futuras, no pertenecen a esta card):

- Múltiples cuentas simultáneas.
- Múltiples workspaces.
- Publicación masiva.
- Clientes arbitrarios.
- Escalabilidad.
- Audit de TikTok aprobado / publicación en cuentas públicas.

## Estado

```
Designed   ✓
Built      ✓  (OAuth + publish PULL_FROM_URL + UX compliant, deployado)
Frozen     ✓
Validated  ✓  (evidencia observable 2026-07-01, sandbox) — Availability: Pending TikTok Audit
```

## Código relacionado

- `src/lib/tiktok.ts`, `oauth/tiktok/{start,callback}`, `tiktok/creator-info`, `tiktok/media` (proxy), `publish-tiktok`
- UI: `jclaude/page.tsx` (pantalla "Publicar en TikTok")
- Setup/compliance: `docs/integrations/tiktok-setup.md`

---

*Card vive en `/docs/capabilities/CAP-003-tiktok-autopublish.md`*
