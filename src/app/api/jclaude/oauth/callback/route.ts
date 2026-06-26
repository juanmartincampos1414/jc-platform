import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const APP_ID = process.env.META_APP_ID!
const APP_SECRET = process.env.META_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/oauth/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get("code")
  const workspaceId = searchParams.get("state")
  const error = searchParams.get("error")

  if (error || !code || !workspaceId) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?oauth=error`
    )
  }

  try {
    // 1. Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) throw new Error("No access token")

    // 2. Exchange for long-lived token (60 days)
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    )
    const longData = await longRes.json()
    const longToken = longData.access_token || tokenData.access_token

    // 3. Get Facebook Pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longToken}`
    )
    const pagesData = await pagesRes.json()
    const pages = pagesData.data || []

    // 4. For each page, find Instagram Business Account
    const connections: {
      fb_page_id: string
      fb_page_name: string
      fb_page_token: string
      ig_account_id?: string
      ig_username?: string
    }[] = []

    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      )
      const igData = await igRes.json()
      const conn: typeof connections[0] = {
        fb_page_id: page.id,
        fb_page_name: page.name,
        fb_page_token: page.access_token,
      }
      if (igData.instagram_business_account?.id) {
        const igProfileRes = await fetch(
          `https://graph.facebook.com/v21.0/${igData.instagram_business_account.id}?fields=username&access_token=${page.access_token}`
        )
        const igProfile = await igProfileRes.json()
        conn.ig_account_id = igData.instagram_business_account.id
        conn.ig_username = igProfile.username
      }
      connections.push(conn)
    }

    // 5. Save to jclaude_profiles
    const supabase = await createClient()
    await supabase.from("jclaude_profiles").upsert({
      workspace_id: workspaceId,
      social_credentials: {
        fb_user_token: longToken,
        token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        connections,
      },
      connected_networks: connections.flatMap(c => {
        const nets = ["facebook"]
        if (c.ig_account_id) nets.push("instagram")
        return nets
      }).filter((v, i, a) => a.indexOf(v) === i),
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?oauth=success`
    )
  } catch (e) {
    console.error("OAuth error:", e)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/jclaude?oauth=error`
    )
  }
}
