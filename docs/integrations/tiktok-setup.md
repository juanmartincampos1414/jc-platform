# TikTok — Content Posting API (Direct Post) setup

**Fecha:** 2026-06-30
**Estado:** código backend listo · pendiente portal de TikTok + envs + UI de publicación + audit
**Modo elegido:** Direct Post con **PULL_FROM_URL** (TikTok fetchea el video desde nuestro proxy `/api/jclaude/tiktok/media` en el dominio verificado). Las content-sharing guidelines **prohíben FILE_UPLOAD cuando el contenido ya existe en un servidor** (los videos viven en fal.ai), por eso se usa PULL_FROM_URL. **Requiere verificar el dominio** `aigency.jcmarketing.digital` en el portal de TikTok (URL prefix / property).

## Código agregado

| Ruta / archivo | Qué hace |
|---|---|
| `src/lib/tiktok.ts` | Helpers: leer/guardar creds, refresh de token (vence ~24h) |
| `GET /api/jclaude/oauth/tiktok/start?workspaceId=…` | Redirige a `tiktok.com/v2/auth/authorize` con `video.publish` |
| `GET /api/jclaude/oauth/tiktok/callback` | Code → tokens; guarda en `social_credentials.tiktok` |
| `GET /api/jclaude/tiktok/creator-info?workspaceId=…` | Username, avatar, opciones de privacidad (para la UI) |
| `POST /api/jclaude/publish-tiktok` | creator_info → video/init (FILE_UPLOAD) → PUT → status/fetch |

## 1. Portal de TikTok (lo hace Juan)

1. Cuenta en **developers.tiktok.com** (puede requerir verificación de organización).
2. **Create an app** (JC AIgency).
3. **Add products → Content Posting API** → activar **Direct Post**.
4. **Login Kit** → scopes **`user.info.basic`** y **`video.publish`**.
5. **Redirect URI**: `https://aigency.jcmarketing.digital/api/jclaude/oauth/tiktok/callback`
6. Copiar **Client Key** y **Client Secret**.
7. En **sandbox**, agregar tu cuenta de TikTok como **target user / test**.

## 2. Env vars (Vercel)

```env
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
```

## 3. Pendiente de código (próximo paso)

- **UI de publicación** en JClaude: botón "Conectar con TikTok" + **mostrar creator username/avatar antes de publicar** (requisito duro del audit) + selector de privacidad (limitado a `privacy_level_options` que devuelve creator_info). Routing de `handlePublishNow` para `network === "tiktok"` → `publish-tiktok`.

## 4. Test

Conectar tu cuenta → publicar un video → **queda en SELF_ONLY (privado)** hasta el audit → verificar en tu perfil.

## 5. Audit

Mandar la app a review de TikTok para levantar la restricción de privado. Tarda ~2-4 semanas. Requisitos: mostrar creator info antes de publicar, cumplir las guidelines de contenido.

## Notas / gotchas

- **Solo video** (TikTok). JClaude genera video con Seedance (fal.ai) → ese `video_url` va como origen.
- **Unaudited = privado.** Todo sale SELF_ONLY hasta aprobar el audit; solo funciona con tu cuenta / test users.
- **Token de acceso vence ~24h** → `getTikTokCreds` refresca automáticamente con el refresh token.
- **>64MB:** el upload actual es single-chunk (hasta 64MB). Videos más grandes requieren chunking (no implementado; los clips de Seedance son cortos).

## Compliance del audit (content-sharing guidelines) — IMPLEMENTADO

La pantalla "Publicar en TikTok" cumple los requisitos obligatorios de la review:
- Muestra creator (nickname + avatar) antes de publicar.
- Privacidad **sin default** — el usuario elige (opciones = `privacy_level_options`).
- **Interacciones** (Comentarios / Duet / Stitch): ninguna tildada por default; deshabilitadas si `creator_info` no las permite.
- **Toggle "Divulgación de contenido comercial"** (off por default): "Tu marca" → *Promotional content*; "Contenido de marca" → *Paid partnership*. Si está on sin elegir opción, el botón se bloquea.
- **Branded content no puede ser privado** (se saca SELF_ONLY de las opciones y se limpia si estaba elegido).
- Texto de **Music Usage Confirmation** (cambia si hay Branded Content).
- Aviso "puede tardar unos minutos en procesarse".
- Polling de `status/fetch`.

Mapeo a `post_info`: `disable_comment/duet/stitch`, `brand_organic_toggle` (Your Brand), `brand_content_toggle` (Branded Content).

## Verificación de dominio (obligatoria para PULL_FROM_URL)

En el portal de TikTok → **URL properties / Domain verification** → agregar y verificar `aigency.jcmarketing.digital` (o el URL prefix `https://aigency.jcmarketing.digital/api/jclaude/tiktok/media`). Método típico: subir un archivo de verificación o agregar un meta/registro DNS que TikTok indique. Sin esto, `video/init` con PULL_FROM_URL falla con `url_ownership_unverified`.

El proxy `/api/jclaude/tiktok/media?url=...` sirve el video (solo hosts en allowlist: fal, googleapis, etc.) desde nuestro dominio para que TikTok lo pueda fetchear.

*Documento vive en `/docs/integrations/tiktok-setup.md`*
