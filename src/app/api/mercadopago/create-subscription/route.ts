import { NextRequest, NextResponse } from "next/server"

const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN

const PLAN_CONFIG = {
  starter: {
    title: "JClaude Starter",
    price: 200000,
    posts_limit: 8,
    networks_limit: 2,
    autopublish: false,
    trending: false,
  },
  pro: {
    title: "JClaude Pro",
    price: 300000,
    posts_limit: 20,
    networks_limit: 4,
    autopublish: true,
    trending: false,
  },
  enterprise: {
    title: "JClaude Enterprise",
    price: 800000,
    posts_limit: 999,
    networks_limit: 99,
    autopublish: true,
    trending: true,
  },
} as const

type PlanKey = keyof typeof PLAN_CONFIG

export async function POST(req: NextRequest) {
  const { plan, workspaceId, payerEmail } = await req.json()

  if (!plan || !workspaceId || !payerEmail) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const config = PLAN_CONFIG[plan as PlanKey]
  if (!config) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
  }

  if (!MP_ACCESS_TOKEN) {
    // Demo mode: return a fake checkout URL
    return NextResponse.json({
      checkout_url: `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=DEMO_${plan.toUpperCase()}&external_reference=${workspaceId}`,
      plan_config: config,
      demo: true,
    })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aigency.jcmarketing.digital"

  const body = {
    reason: config.title,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: config.price,
      currency_id: "ARS",
      free_trial: {
        frequency: 7,
        frequency_type: "days",
      },
    },
    payer_email: payerEmail,
    back_url: `${baseUrl}/workspace/${workspaceId}/jclaude?subscription=success`,
    external_reference: workspaceId,
    status: "pending",
  }

  const res = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok) {
    return NextResponse.json({ error: data.message || "MercadoPago error" }, { status: 500 })
  }

  return NextResponse.json({
    checkout_url: data.init_point,
    preapproval_id: data.id,
    plan_config: config,
  })
}
