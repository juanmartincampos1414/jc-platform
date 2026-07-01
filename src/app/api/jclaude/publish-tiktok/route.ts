import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTikTokCreds, TIKTOK_API } from "@/lib/tiktok"

// Publicación en TikTok — Content Posting API, Direct Post, PULL_FROM_URL.
// TikTok fetchea el video desde nuestro proxy (/api/jclaude/tiktok/media), que
// vive en el dominio verificado. Se usa PULL_FROM_URL (no FILE_UPLOAD) porque el
// contenido ya existe en un servidor — así lo exigen las content-sharing guidelines.
//
// post_info incluye interacción (comment/duet/stitch) y disclosure comercial
// (brand_organic_toggle = "Your Brand", brand_content_toggle = "Branded Content").
// Hasta el audit, todo queda SELF_ONLY.

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const {
    workspaceId,
    videoUrl,
    title,
    privacyLevel,
    allowComment = false,
    allowDuet = false,
    allowStitch = false,
    yourBrand = false,
    brandedContent = false,
  } = await req.json()

  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })
  if (!videoUrl) return NextResponse.json({ error: "Falta el video (videoUrl)" }, { status: 400 })
  if (!privacyLevel) return NextResponse.json({ error: "Elegí un nivel de privacidad" }, { status: 400 })
  if (brandedContent && privacyLevel === "SELF_ONLY") {
    return NextResponse.json({ error: "El contenido de marca (Branded Content) no puede ser privado" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tk = await getTikTokCreds(supabase, workspaceId)
  if (!tk) return NextResponse.json({ error: "TikTok no conectado" }, { status: 400 })

  const authHeaders = {
    Authorization: `Bearer ${tk.access_token}`,
    "Content-Type": "application/json; charset=UTF-8",
  }

  // URL del video servida desde nuestro dominio verificado (para PULL_FROM_URL)
  const pullUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/tiktok/media?url=${encodeURIComponent(videoUrl)}`

  try {
    // 1. creator_info → validar privacidad permitida
    const ciRes = await fetch(`${TIKTOK_API}/post/publish/creator_info/query/`, {
      method: "POST",
      headers: authHeaders,
    })
    const ci = await ciRes.json()
    if (ci.error?.code && ci.error.code !== "ok") {
      throw new Error(`[creator_info:${ci.error.code}] ${ci.error.message || ""} (log ${ci.error.log_id ?? "?"})`)
    }
    const options: string[] = ci.data?.privacy_level_options ?? ["SELF_ONLY"]
    if (!options.includes(privacyLevel)) {
      throw new Error(`Privacidad '${privacyLevel}' no permitida para esta cuenta`)
    }

    // 2. init con PULL_FROM_URL
    const initRes = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        post_info: {
          title: String(title ?? "").slice(0, 2200),
          privacy_level: privacyLevel,
          disable_comment: !allowComment,
          disable_duet: !allowDuet,
          disable_stitch: !allowStitch,
          brand_organic_toggle: !!yourBrand,
          brand_content_toggle: !!brandedContent,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: pullUrl,
        },
      }),
    })
    const init = await initRes.json()
    if (init.error?.code && init.error.code !== "ok") {
      throw new Error(`[init:${init.error.code}] ${init.error.message || ""} (log ${init.error.log_id ?? "?"})`)
    }
    const publishId: string | undefined = init.data?.publish_id
    if (!publishId) throw new Error("init no devolvió publish_id")

    // 3. poll de status (el procesamiento puede continuar en TikTok)
    let status = "PROCESSING_DOWNLOAD"
    for (let i = 0; i < 6; i++) {
      await new Promise(r => setTimeout(r, 2500))
      const stRes = await fetch(`${TIKTOK_API}/post/publish/status/fetch/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ publish_id: publishId }),
      })
      const st = await stRes.json()
      status = st.data?.status ?? status
      if (status === "PUBLISH_COMPLETE" || status === "FAILED") {
        if (status === "FAILED") {
          return NextResponse.json({ success: false, publish_id: publishId, status, error: st.data?.fail_reason || "FAILED" }, { status: 500 })
        }
        break
      }
    }

    return NextResponse.json({
      success: status !== "FAILED",
      publish_id: publishId,
      status,
      privacy: privacyLevel,
      network: "tiktok",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
