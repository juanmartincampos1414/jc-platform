import { NextRequest, NextResponse } from "next/server"

// OAuth de TikTok (Login Kit) para Content Posting API — Direct Post.
// Requiere el Client Key del app de TikTok for Developers y los scopes
// user.info.basic + video.publish (este último exige app audit para público).

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/oauth/tiktok/callback`
const SCOPES = "user.info.basic,video.publish"

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/")
  url.searchParams.set("client_key", CLIENT_KEY)
  url.searchParams.set("scope", SCOPES)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("redirect_uri", REDIRECT_URI)
  url.searchParams.set("state", workspaceId)

  return NextResponse.redirect(url.toString())
}
