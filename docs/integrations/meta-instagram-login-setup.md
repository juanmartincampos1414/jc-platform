# Meta — Instagram Login setup (instagram_business_content_publish)

**Estado:** ✅ Validado end-to-end el 2026-06-30 — conexión por Instagram Login + publicación real en `flips.ar` desde la app (ver `docs/capabilities/CAP-002-instagram-autopublish.md`). Pendiente: que App Review apruebe el permiso para habilitar cuentas de clientes. Deploy productivo: `dpl_5u6Tc1X9BSxf3tGCUNoXiMyJDMAv` (commit `1f816aa`).

**Fecha:** 2026-06-30
**Por qué:** App Review pedía la test call de `instagram_business_content_publish`, que **solo** se concede vía *Instagram API with Instagram Login* (`graph.instagram.com`). El path de Facebook Login (`instagram_content_publish`) nunca registra esa test call. Se agregó el flujo de Instagram Login en paralelo, sin tocar el de Facebook.

## Código agregado

| Ruta | Qué hace |
|---|---|
| `GET /api/jclaude/oauth/instagram/start?workspaceId=…` | Redirige a `instagram.com/oauth/authorize` con scope `instagram_business_content_publish` |
| `GET /api/jclaude/oauth/instagram/callback` | Code → token largo (60d); guarda en `jclaude_profiles.social_credentials.ig_login` |
| `POST /api/jclaude/publish-instagram` | Publica vía `graph.instagram.com` (container → status FINISHED → media_publish) |

No modifica el path de Facebook Login (`oauth/start`, `oauth/callback`, `publish-meta`).

## 1. Configuración en el Meta App Dashboard (lo hace Juan)

1. App → **Add Product → Instagram → "API setup with Instagram business login"**.
2. Copiar **Instagram App ID** e **Instagram App Secret** (son distintos de `META_APP_ID` / `META_APP_SECRET`).
3. En *Business login settings* → **OAuth redirect URI**, agregar exactamente:
   `https://aigency.jcmarketing.digital/api/jclaude/oauth/instagram/callback`
4. Confirmar que la cuenta de Instagram de prueba es **profesional** (Business/Creator) y está como **test user / rol** en la app (en development mode, solo cuentas con rol pueden conectar).

## 2. Variables de entorno (Vercel + `.env.local`)

```env
INSTAGRAM_APP_ID=...        # Instagram App ID (del producto Instagram)
INSTAGRAM_APP_SECRET=...    # Instagram App Secret
# NEXT_PUBLIC_APP_URL ya existe (https://aigency.jcmarketing.digital)
```

## 3. Deploy

`npx vercel --prod` (el webhook de GitHub está desconectado).

## 4. Hacer la test call (registra instagram_business_content_publish)

1. **Conectar:** en el navegador, logueado, abrir
   `https://aigency.jcmarketing.digital/api/jclaude/oauth/instagram/start?workspaceId=TU_WORKSPACE_ID`
   → aprobar permisos → vuelve con `?ig_oauth=success`.
2. **Publicar** (desde la consola del navegador, en la misma sesión logueada):
   ```js
   await fetch("/api/jclaude/publish-instagram", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       workspaceId: "TU_WORKSPACE_ID",
       copy: "Test call App Review",
       hashtags: "#test",
       imageUrl: "https://URL_PUBLICA_DE_UNA_IMAGEN.jpg"  // pública, accesible, JPG, ratio válido
     })
   }).then(r => r.json())
   ```
   Respuesta esperada: `{ success: true, post_id: "...", via: "instagram_login" }`.
3. En el dashboard, **App Review → la test call** de `instagram_business_content_publish` pasa de `0 de 1` a `1 de 1` (puede tardar hasta ~24h en reflejarse).

## Notas

- La imagen debe ser **pública** y cumplir specs de IG (JPG, aspect ratio soportado). Una URL no accesible hace fallar el container y la call no cuenta.
- Reconectar Facebook Login hoy **sobrescribe** `social_credentials` y borraría `ig_login` (el callback de FB no hace merge). Si pasa, reconectar Instagram Login. *(Mejora pendiente: hacer merge también en el callback de FB.)*
- Pendiente opcional: wiring de un botón en la UI de JClaude para conectar/publicar por IG Login (hoy se dispara por URL/consola).

*Documento vive en `/docs/integrations/meta-instagram-login-setup.md`*
