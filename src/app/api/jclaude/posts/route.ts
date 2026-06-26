import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const workspaceId = searchParams.get("workspaceId")
  const month = searchParams.get("month") // "2025-07"

  if (!workspaceId || !month) {
    return NextResponse.json({ posts: [] })
  }

  const [year, mon] = month.split("-")
  const startDate = `${year}-${mon}-01`
  const daysInMonth = new Date(Number(year), Number(mon), 0).getDate()
  const endDate = `${year}-${mon}-${daysInMonth}T23:59:59`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("jclaude_posts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("scheduled_at", startDate)
    .lte("scheduled_at", endDate)
    .order("scheduled_at", { ascending: true })

  if (error) return NextResponse.json({ posts: [], error: error.message })
  return NextResponse.json({ posts: data || [] })
}

export async function PATCH(req: NextRequest) {
  const { id, status, scheduled_at, image_url } = await req.json()

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 })
  }

  const supabase = await createClient()
  const update: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (scheduled_at) update.scheduled_at = scheduled_at
  if (image_url) update.image_url = image_url

  const { data, error } = await supabase
    .from("jclaude_posts")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
