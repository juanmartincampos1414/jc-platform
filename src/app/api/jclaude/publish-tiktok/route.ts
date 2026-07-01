import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTikTokCreds, TIKTOK_API } from "@/lib/tiktok"

// Publicación en TikTok vía Content Posting API — Direct Post, FILE_UPLOAD.
// Flujo: creator_info/query → video/init (FILE_UPLOAD) → PUT del video → status/fetch.
// FILE_UPLOAD evita tener que verificar dominio (los videos viven en fal.ai).
//
// Nota: hasta que el app pase el audit de TikTok, todo queda en SELF_ONLY (privado).

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_SINGLE_CHUNK = 64 * 1024 * 1024 // 64MB — subimos en un solo chunk

export async function POST(req: NextRequest) {
  const { workspaceId, videoUrl, title, privacyLevel } = await req.json()
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })
  if (!videoUrl) return NextResponse.json({ error: "Falta el video (videoUrl)" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tk = await getTikTokCreds(supabase, workspaceId)
  if (!tk) return NextResponse.json({ error: "TikTok no conectado" }, { status: 400 })

  const authHeaders = {
    Authorization: `Bearer ${tk.access_token}`,
    "Content-Type": "application/json; charset=UTF-8",
  }

  try {
    // 1. creator_info → validar privacidad permitida
    const ciRes = await fetch(`${TIKTOK_API}/post/publish/creator_info/query/`, {
      method: "POST",
      headers: authHeaders,
    })
    const ci = await ciRes.json()
    if (ci.error?.code && ci.error.code !== "ok") {
      throw new Error(ci.error.message || "Error consultando creator info")
    }
    const options: string[] = ci.data?.privacy_level_options ?? ["SELF_ONLY"]
    const privacy = options.includes(privacyLevel) ? privacyLevel : options[0]

    // 2. descargar el video (fal.ai) a memoria
    const vidRes = await fetch(videoUrl)
    if (!vidRes.ok) throw new Error("No se pudo descargar el video de origen")
    const bytes = Buffer.from(await vidRes.arrayBuffer())
    const videoSize = bytes.length
    if (videoSize > MAX_SINGLE_CHUNK) {
      throw new Error(`Video demasiado grande (${Math.round(videoSize / 1e6)}MB). Chunking >64MB no implementado aún.`)
    }

    // 3. init (FILE_UPLOAD, single chunk)
    const initRes = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        post_info: {
          title: String(title ?? "").slice(0, 2200),
          privacy_level: privacy,
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
    })
    const init = await initRes.json()
    if (init.error?.code && init.error.code !== "ok") {
      throw new Error(init.error.message || "Error en video/init")
    }
    const publishId: string | undefined = init.data?.publish_id
    const uploadUrl: string | undefined = init.data?.upload_url
    if (!publishId || !uploadUrl) throw new Error("init no devolvió publish_id / upload_url")

    // 4. subir el video (un solo chunk)
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(videoSize),
        "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
      },
      body: new Uint8Array(bytes),
    })
    if (!putRes.ok) throw new Error(`Error subiendo el video (HTTP ${putRes.status})`)

    // 5. poll de status (breve; el procesamiento puede continuar en TikTok)
    let status = "PROCESSING_UPLOAD"
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const stRes = await fetch(`${TIKTOK_API}/post/publish/status/fetch/`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ publish_id: publishId }),
      })
      const st = await stRes.json()
      status = st.data?.status ?? status
      if (status === "PUBLISH_COMPLETE" || status === "FAILED") break
    }

    return NextResponse.json({
      success: status !== "FAILED",
      publish_id: publishId,
      status,
      privacy,
      network: "tiktok",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
