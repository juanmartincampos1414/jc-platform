import { NextRequest, NextResponse } from "next/server"

const VERIFY_TOKEN = "jcaigency-webhook-2025"

// Meta webhook verification
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode")
  const token = req.nextUrl.searchParams.get("hub.verify_token")
  const challenge = req.nextUrl.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse("Forbidden", { status: 403 })
}

// Meta webhook events
export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log("Meta webhook event:", JSON.stringify(body))
  return NextResponse.json({ received: true })
}
