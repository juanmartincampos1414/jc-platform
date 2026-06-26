import { NextRequest, NextResponse } from "next/server"

const FAL_API_KEY = process.env.FAL_API_KEY

export async function POST(req: NextRequest) {
  const { brief, network } = await req.json()

  if (!brief) {
    return NextResponse.json({ error: "Missing image brief" }, { status: 400 })
  }

  if (!FAL_API_KEY) {
    return NextResponse.json({ error: "FAL_API_KEY not configured" }, { status: 500 })
  }

  // Adaptar el prompt al formato ideal según la red
  const aspectRatio = network === "instagram" ? "1:1"
    : network === "facebook" ? "16:9"
    : network === "tiktok" ? "9:16"
    : "1:1"

  // Enriquecer el brief con instrucciones de calidad para marketing
  const prompt = `Professional marketing photo for social media. ${brief}. High quality, vibrant colors, clean composition, brand-friendly aesthetic, photorealistic, 4k quality.`

  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: aspectRatio === "1:1" ? "square_hd"
        : aspectRatio === "16:9" ? "landscape_16_9"
        : "portrait_4_3",
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    }),
  })

  const data = await res.json()

  if (!res.ok || data.error) {
    return NextResponse.json(
      { error: data.error || data.detail || "Image generation failed" },
      { status: 500 }
    )
  }

  const imageUrl = data.images?.[0]?.url
  if (!imageUrl) {
    return NextResponse.json({ error: "No image returned" }, { status: 500 })
  }

  return NextResponse.json({ image_url: imageUrl, prompt })
}
