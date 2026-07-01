import { createClient } from "@supabase/supabase-js"

// Re-hostea media generado (imágenes/videos) desde una URL externa efímera
// (ej: CDN de fal.ai) a un bucket propio de Supabase Storage, devolviendo una
// URL PERMANENTE. Con fallback: si algo falla (bucket no creado, sin service
// key, fetch caído), devuelve la URL original — NUNCA rompe la generación.

const BUCKET = "generated-media"

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function persistMediaToStorage(
  sourceUrl: string,
  opts: { workspaceId: string; kind: "image" | "video" }
): Promise<string> {
  try {
    if (!sourceUrl) return sourceUrl
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return sourceUrl

    const res = await fetch(sourceUrl)
    if (!res.ok) return sourceUrl

    const contentType = res.headers.get("content-type")
      || (opts.kind === "video" ? "video/mp4" : "image/jpeg")
    const ext = opts.kind === "video"
      ? "mp4"
      : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"

    const bytes = new Uint8Array(await res.arrayBuffer())
    const rand = Math.random().toString(36).slice(2, 8)
    const path = `${opts.workspaceId}/${opts.kind}-${Date.now()}-${rand}.${ext}`

    const supabase = serviceClient()
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: false,
    })
    if (error) {
      console.error("[storage] upload failed:", error.message)
      return sourceUrl
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data?.publicUrl || sourceUrl
  } catch (e) {
    console.error("[storage] persistMediaToStorage error:", e)
    return sourceUrl
  }
}
