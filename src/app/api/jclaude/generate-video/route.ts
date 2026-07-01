import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { persistMediaToStorage } from "@/lib/storage"

// Seedance por ByteDance via fal.ai
// Configurar en Vercel: SEEDANCE_MODEL (default: fal-ai/bytedance/seedance-1-5-lite/text-to-video)
const FAL_API_KEY     = process.env.FAL_API_KEY
const SEEDANCE_MODEL  = process.env.SEEDANCE_MODEL ?? "fal-ai/bytedance/seedance-1-5-lite/text-to-video"
const SEEDANCE_URL    = `https://fal.run/${SEEDANCE_MODEL}`

export const maxDuration = 60

// POST /api/jclaude/generate-video
// Body: { assetId, brief, network, workspaceId }
// Llama a Seedance, actualiza el asset con el video URL.
export async function POST(req: NextRequest) {
  const { assetId, brief, network, workspaceId } = await req.json()

  if (!assetId || !brief || !workspaceId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }
  if (!FAL_API_KEY) {
    return NextResponse.json({ error: "FAL_API_KEY not configured" }, { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verificar que el asset pertenece al workspace
  const { data: asset } = await supabase
    .from("assets")
    .select("id, workspace_id, status")
    .eq("id", assetId)
    .eq("workspace_id", workspaceId)
    .single()

  if (!asset) return NextResponse.json({ error: "Asset not found" }, { status: 404 })

  // Aspect ratio según red
  const aspectRatio = (network === "tiktok" || network === "instagram")
    ? "9:16"   // vertical para reels
    : "16:9"   // horizontal para facebook/youtube

  const prompt = `Professional video content for social media marketing. ${brief}. High quality, smooth motion, brand-friendly, vibrant colors, cinematic look.`

  let videoUrl: string | null = null

  try {
    const res = await fetch(SEEDANCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: aspectRatio,
        duration: 5,
      }),
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      await supabase.from("assets").update({
        status:     "draft",
        metadata:   { video_generation_error: data.error ?? "Seedance error", brief },
        updated_at: new Date().toISOString(),
      }).eq("id", assetId)

      return NextResponse.json(
        { error: data.error || data.detail || "Video generation failed" },
        { status: 500 }
      )
    }

    // fal.ai Seedance devuelve: { video: { url: "..." } }
    videoUrl = data.video?.url ?? data.videos?.[0]?.url ?? null

    if (!videoUrl) {
      return NextResponse.json({ error: "No video URL returned by Seedance" }, { status: 500 })
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    await supabase.from("assets").update({
      status:     "draft",
      metadata:   { video_generation_error: errMsg, brief },
      updated_at: new Date().toISOString(),
    }).eq("id", assetId)
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }

  // Re-hostear el video en storage propio (URL permanente). Fallback a la URL de fal.
  const permanentUrl = videoUrl
    ? await persistMediaToStorage(videoUrl, { workspaceId, kind: "video" })
    : videoUrl

  // Actualizar asset con el video generado
  await supabase.from("assets").update({
    status:     "draft",
    file_urls:  [permanentUrl],
    metadata:   { video_url: permanentUrl, brief, source: "seedance", model: SEEDANCE_MODEL },
    updated_at: new Date().toISOString(),
  }).eq("id", assetId)

  return NextResponse.json({ video_url: permanentUrl, asset_id: assetId })
}
