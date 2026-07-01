import { NextRequest, NextResponse } from "next/server"

// Proxy de video servido desde NUESTRO dominio (aigency.jcmarketing.digital)
// para poder usar PULL_FROM_URL en TikTok (que exige que el video viva en un
// dominio verificado). TikTok fetchea esta URL directamente, sin auth, por eso
// el endpoint es público — pero solo reenvía hosts en la allowlist (anti-SSRF).

export const runtime = "nodejs"

const ALLOWED_HOSTS = [
  "fal.media",
  "fal.run",
  "storage.googleapis.com",
  "commondatastorage.googleapis.com",
  "test-videos.co.uk",
  "download.samplelib.com",
]

function hostAllowed(host: string): boolean {
  return ALLOWED_HOSTS.some(h => host === h || host.endsWith(`.${h}`))
}

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("url")
  if (!src) return NextResponse.json({ error: "Missing url" }, { status: 400 })

  let host: string
  try {
    const u = new URL(src)
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad protocol")
    host = u.hostname
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }
  if (!hostAllowed(host)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  const upstream = await fetch(src)
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: `Upstream fetch failed (${upstream.status})` }, { status: 502 })
  }

  const headers: Record<string, string> = {
    "Content-Type": upstream.headers.get("content-type") || "video/mp4",
    "Cache-Control": "public, max-age=3600",
  }
  const len = upstream.headers.get("content-length")
  if (len) headers["Content-Length"] = len

  return new NextResponse(upstream.body, { status: 200, headers })
}
