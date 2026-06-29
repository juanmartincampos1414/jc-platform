import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PLAN_LIMITS = {
  starter:    { posts_limit: 8,   networks_limit: 2,  autopublish: false, trending: false, videos_limit: 1 },
  pro:        { posts_limit: 20,  networks_limit: 4,  autopublish: true,  trending: false, videos_limit: 2 },
  enterprise: { posts_limit: 999, networks_limit: 99, autopublish: true,  trending: true,  videos_limit: 3 },
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // MercadoPago sends type + data.id
  const { type, data } = body

  if (type === "subscription_preapproval") {
    const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
    })
    const subscription = await mpRes.json()

    const workspaceId = subscription.external_reference
    const mpStatus = subscription.status // authorized, paused, cancelled

    const statusMap: Record<string, string> = {
      authorized: "active",
      paused: "paused",
      cancelled: "cancelled",
      pending: "pending",
    }

    const dbStatus = statusMap[mpStatus] || "pending"

    const { data: existing } = await supabaseAdmin
      .from("jclaude_subscriptions")
      .select("id, plan")
      .eq("workspace_id", workspaceId)
      .single()

    const plan = existing?.plan || "starter"
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.starter

    if (existing) {
      await supabaseAdmin
        .from("jclaude_subscriptions")
        .update({
          status: dbStatus,
          mp_subscription_id: data.id,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", workspaceId)
    } else {
      await supabaseAdmin.from("jclaude_subscriptions").insert({
        workspace_id: workspaceId,
        plan,
        status: dbStatus,
        mp_subscription_id: data.id,
        ...limits,
      })
    }
  }

  return NextResponse.json({ received: true })
}
