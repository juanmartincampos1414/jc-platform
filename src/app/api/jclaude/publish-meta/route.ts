import { NextRequest, NextResponse } from "next/server"

const IG_ACCOUNT_ID_ENV = process.env.META_IG_ACCOUNT_ID
const PAGE_ACCESS_TOKEN_ENV = process.env.META_PAGE_ACCESS_TOKEN
const PAGE_ID_ENV = process.env.META_PAGE_ID

export async function POST(req: NextRequest) {
  const { copy, hashtags, imageUrl, network, igAccountId, pageId, pageAccessToken } = await req.json()

  // Usar credenciales dinámicas del OAuth si vienen, sino fallback a env
  const resolvedIgAccountId = igAccountId || IG_ACCOUNT_ID_ENV
  const resolvedPageToken   = pageAccessToken || PAGE_ACCESS_TOKEN_ENV
  const resolvedPageId      = pageId || PAGE_ID_ENV

  if (!resolvedPageToken) {
    return NextResponse.json({ error: "Meta credentials not configured" }, { status: 500 })
  }

  const caption = `${copy}\n\n${hashtags || ""}`.trim()

  try {
    if (network === "instagram") {
      if (!resolvedIgAccountId) {
        return NextResponse.json({ error: "No hay cuenta de Instagram conectada" }, { status: 400 })
      }
      return await publishInstagram(caption, imageUrl, resolvedIgAccountId, resolvedPageToken)
    } else if (network === "facebook") {
      return await publishFacebook(caption, imageUrl, resolvedPageId, resolvedPageToken)
    }
    return NextResponse.json({ error: "Unsupported network" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function publishInstagram(caption: string, imageUrl: string | undefined, igAccountId: string, token: string) {
  if (imageUrl) {
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
      }
    )
    const container = await containerRes.json()
    if (!containerRes.ok || container.error) {
      throw new Error(container.error?.message || "Error creating media container")
    }

    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creation_id: container.id, access_token: token }),
      }
    )
    const published = await publishRes.json()
    if (!publishRes.ok || published.error) {
      throw new Error(published.error?.message || "Error publishing media")
    }

    return NextResponse.json({ success: true, post_id: published.id, network: "instagram" })
  } else {
    return NextResponse.json({
      success: false,
      error: "Instagram requiere una imagen para publicar.",
      fallback: "facebook",
    })
  }
}

async function publishFacebook(caption: string, imageUrl: string | undefined, pageId: string | undefined, token: string) {
  const body: Record<string, string> = { message: caption, access_token: token }
  if (imageUrl) body.url = imageUrl

  const endpoint = imageUrl
    ? `https://graph.facebook.com/v21.0/${pageId}/photos`
    : `https://graph.facebook.com/v21.0/${pageId}/feed`

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || "Error publishing to Facebook")
  }

  return NextResponse.json({ success: true, post_id: data.id, network: "facebook" })
}
