import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { persistTikTok, TIKTOK_API } from "@/lib/tiktok"

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/oauth/tiktok/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const workspaceId = searchParams.get("state")
  const error = searchParams.get("error")

  const fail = () =>
    NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?tiktok_oauth=error`
    )

  if (error || !code || !workspaceId) return fail()

  try {
    // Code → access token (+ refresh token, open_id). Form-urlencoded.
    const res = await fetch(`${TIKTOK_API}/oauth/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }).toString(),
    })
    const d = await res.json()
    if (!d.access_token || !d.open_id) {
      throw new Error(d.error_description || d.error || "No access token")
    }

    const supabase = await createClient()
    await persistTikTok(supabase, workspaceId, {
      open_id: d.open_id,
      access_token: d.access_token,
      refresh_token: d.refresh_token,
      token_expires_at: new Date(Date.now() + (d.expires_in ?? 86400) * 1000).toISOString(),
      refresh_expires_at: new Date(Date.now() + (d.refresh_expires_in ?? 0) * 1000).toISOString(),
      scope: d.scope,
    })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?tiktok_oauth=success`
    )
  } catch (e) {
    console.error("TikTok OAuth error:", e)
    return fail()
  }
}
