import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTikTokCreds, TIKTOK_API } from "@/lib/tiktok"

// Devuelve la info del creador (username, avatar, opciones de privacidad,
// restricciones). TikTok EXIGE mostrar username + avatar antes de publicar,
// y la privacy_level elegida debe estar dentro de privacy_level_options.

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const tk = await getTikTokCreds(supabase, workspaceId)
  if (!tk) return NextResponse.json({ error: "TikTok no conectado" }, { status: 400 })

  const res = await fetch(`${TIKTOK_API}/post/publish/creator_info/query/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tk.access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  })
  const d = await res.json()
  if (d.error?.code && d.error.code !== "ok") {
    return NextResponse.json({ error: d.error.message || "Error consultando creator info" }, { status: 500 })
  }

  return NextResponse.json({ creator: d.data })
}
