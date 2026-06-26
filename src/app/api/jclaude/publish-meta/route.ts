import { NextRequest, NextResponse } from "next/server"

const IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN
const PAGE_ID = process.env.META_PAGE_ID

export async function POST(req: NextRequest) {
  const { copy, hashtags, imageUrl, network } = await req.json()

  if (!IG_ACCOUNT_ID || !PAGE_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Meta credentials not configured" }, { status: 500 })
  }

  const caption = `${copy}\n\n${hashtags || ""}`.trim()

  try {
    if (network === "instagram") {
      return await publishInstagram(caption, imageUrl)
    } else if (network === "facebook") {
      return await publishFacebook(caption, imageUrl)
    }
    return NextResponse.json({ error: "Unsupported network" }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function publishInstagram(caption: string, imageUrl?: string) {
  if (imageUrl) {
    // Post con imagen: primero crear el container, después publicar
    const containerRes = await fetch(
      `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    )
    const container = await containerRes.json()

    if (!containerRes.ok || container.error) {
      throw new Error(container.error?.message || "Error creating media container")
    }

    // Publicar el container
    const publishRes = await fetch(
      `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    )
    const published = await publishRes.json()

    if (!publishRes.ok || published.error) {
      throw new Error(published.error?.message || "Error publishing media")
    }

    return NextResponse.json({ success: true, post_id: published.id, network: "instagram" })
  } else {
    // Post solo texto (carrusel o story de texto — Instagram no permite posts sin imagen)
    // En este caso publicamos en Facebook y devolvemos aviso
    return NextResponse.json({
      success: false,
      error: "Instagram requiere una imagen para publicar. El post se publicará en Facebook.",
      fallback: "facebook",
    })
  }
}

async function publishFacebook(caption: string, imageUrl?: string) {
  const body: Record<string, string> = {
    message: caption,
    access_token: PAGE_ACCESS_TOKEN!,
  }

  if (imageUrl) {
    body.url = imageUrl
  }

  const endpoint = imageUrl
    ? `https://graph.facebook.com/v21.0/${PAGE_ID}/photos`
    : `https://graph.facebook.com/v21.0/${PAGE_ID}/feed`

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
