import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Callback de Instagram Login. Intercambia el code por un token de larga
// duración (60 días) con scope instagram_business_content_publish y lo guarda
// en jclaude_profiles.social_credentials.ig_login — SIN pisar el path de
// Facebook (fb_user_token / connections).

const IG_APP_ID = process.env.INSTAGRAM_APP_ID!
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/oauth/instagram/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const workspaceId = searchParams.get("state")
  const error = searchParams.get("error")

  const fail = () =>
    NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?ig_oauth=error`
    )

  if (error || !code || !workspaceId) return fail()

  try {
    // 1. Code → short-lived token (form-urlencoded). Devuelve user_id + access_token.
    const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: IG_APP_ID,
        client_secret: IG_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }).toString(),
    })
    const shortData = await shortRes.json()
    if (!shortData.access_token || !shortData.user_id) {
      throw new Error(shortData.error_message || "No short-lived token / user_id")
    }
    const shortToken = shortData.access_token as string
    const igUserId = String(shortData.user_id)

    // 2. Short → long-lived token (60 días).
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${IG_APP_SECRET}&access_token=${shortToken}`
    )
    const longData = await longRes.json()
    const longToken = (longData.access_token as string) || shortToken
    const expiresInSec = (longData.expires_in as number) || 60 * 24 * 60 * 60

    // 3. Username (best-effort).
    let username: string | null = null
    try {
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=user_id,username&access_token=${longToken}`
      )
      const me = await meRes.json()
      username = me.username ?? null
    } catch {
      // no bloquea la conexión
    }

    // 4. Persistir junto a las credenciales existentes (merge, no overwrite).
    const supabase = await createClient()
    const { data: existing } = await supabase
      .from("jclaude_profiles")
      .select("social_credentials, connected_networks")
      .eq("workspace_id", workspaceId)
      .single()

    const social = (existing?.social_credentials as Record<string, unknown>) ?? {}
    const networks = new Set<string>((existing?.connected_networks as string[]) ?? [])
    networks.add("instagram")

    await supabase.from("jclaude_profiles").upsert(
      {
        workspace_id: workspaceId,
        social_credentials: {
          ...social,
          ig_login: {
            ig_user_id: igUserId,
            username,
            access_token: longToken,
            token_expires_at: new Date(Date.now() + expiresInSec * 1000).toISOString(),
          },
        },
        connected_networks: Array.from(networks),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" }
    )

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?ig_oauth=success`
    )
  } catch (e) {
    console.error("IG Login OAuth error:", e)
    return fail()
  }
}
