import { NextRequest, NextResponse } from "next/server"

// Instagram API con Instagram Login (graph.instagram.com).
// Distinto del path de Facebook Login (oauth/start) — este es el que otorga
// instagram_business_content_publish, el permiso que pide App Review.
//
// Requiere las credenciales del producto "Instagram" → API setup with Instagram
// business login (NO son las mismas que META_APP_ID/SECRET).

const IG_APP_ID = process.env.INSTAGRAM_APP_ID!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/oauth/instagram/callback`
const SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
  "instagram_business_manage_comments",
].join(",")

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const url = new URL("https://www.instagram.com/oauth/authorize")
  url.searchParams.set("client_id", IG_APP_ID)
  url.searchParams.set("redirect_uri", REDIRECT_URI)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", SCOPES)
  url.searchParams.set("state", workspaceId)

  return NextResponse.redirect(url.toString())
}
