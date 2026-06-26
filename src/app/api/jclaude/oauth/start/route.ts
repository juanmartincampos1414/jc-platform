import { NextRequest, NextResponse } from "next/server"

const APP_ID = process.env.META_APP_ID!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/jclaude/oauth/callback`
const SCOPES = [
  "instagram_basic",
  "pages_show_list",
  "pages_read_engagement",
  "public_profile",
].join(",")

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId")
  if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 })

  const url = new URL("https://www.facebook.com/v21.0/dialog/oauth")
  url.searchParams.set("client_id", APP_ID)
  url.searchParams.set("redirect_uri", REDIRECT_URI)
  url.searchParams.set("scope", SCOPES)
  url.searchParams.set("state", workspaceId)
  url.searchParams.set("response_type", "code")

  return NextResponse.redirect(url.toString())
}
