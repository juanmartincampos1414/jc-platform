import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Publicación en Instagram vía Instagram Login (graph.instagram.com).
// Usa el token con instagram_business_content_publish guardado por el callback
// de IG Login. Una publicación exitosa registra la test call que pide App Review.
//
// Distinto de publish-meta (graph.facebook.com / Facebook Login).

export const maxDuration = 60

const GRAPH = "https://graph.instagram.com"

type IgLogin = { ig_user_id: string; access_token: string }

export async function POST(req: NextRequest) {
  const { workspaceId, copy, hashtags, imageUrl } = await req.json()
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })
  if (!imageUrl) {
    return NextResponse.json({ error: "Instagram requiere una imagen (image_url público y accesible)" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("jclaude_profiles")
    .select("social_credentials")
    .eq("workspace_id", workspaceId)
    .single()

  const ig = (profile?.social_credentials as { ig_login?: IgLogin } | null)?.ig_login
  if (!ig?.ig_user_id || !ig?.access_token) {
    return NextResponse.json(
      { error: "No hay cuenta de Instagram conectada por Instagram Login. Conectá primero en /api/jclaude/oauth/instagram/start" },
      { status: 400 }
    )
  }

  const caption = `${copy ?? ""}\n\n${hashtags ?? ""}`.trim()

  try {
    // 1. Crear contenedor de media.
    const containerRes = await fetch(`${GRAPH}/${ig.ig_user_id}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ image_url: imageUrl, caption, access_token: ig.access_token }).toString(),
    })
    const container = await containerRes.json()
    if (!containerRes.ok || container.error) {
      throw new Error(container.error?.message || "Error creando el media container")
    }

    // 2. Esperar a que el contenedor termine de procesarse (status_code = FINISHED).
    let ready = false
    for (let i = 0; i < 6; i++) {
      const statusRes = await fetch(
        `${GRAPH}/${container.id}?fields=status_code&access_token=${ig.access_token}`
      )
      const status = await statusRes.json()
      if (status.status_code === "FINISHED") { ready = true; break }
      if (status.status_code === "ERROR") throw new Error("El contenedor de media falló al procesarse")
      await new Promise(r => setTimeout(r, 1500))
    }
    if (!ready) throw new Error("El contenedor no terminó de procesarse a tiempo")

    // 3. Publicar el contenedor.
    const publishRes = await fetch(`${GRAPH}/${ig.ig_user_id}/media_publish`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ creation_id: container.id, access_token: ig.access_token }).toString(),
    })
    const published = await publishRes.json()
    if (!publishRes.ok || published.error) {
      throw new Error(published.error?.message || "Error publicando el media")
    }

    return NextResponse.json({ success: true, post_id: published.id, network: "instagram", via: "instagram_login" })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
