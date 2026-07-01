# TikTok — Content Posting API (Direct Post) setup

**Fecha:** 2026-06-30
**Estado:** código backend listo · pendiente portal de TikTok + envs + UI de publicación + audit
**Modo elegido:** Direct Post con **FILE_UPLOAD** (el servidor baja el video de fal.ai y lo sube a TikTok en un chunk) → **no requiere verificación de dominio**.

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

*Documento vive en `/docs/integrations/tiktok-setup.md`*
