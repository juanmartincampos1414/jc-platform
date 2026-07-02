import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Get all approved posts due for publishing
  const { data: duePosts, error } = await supabaseAdmin
    .from("jclaude_posts")
    .select("*")
    .eq("status", "approved")
    .lte("scheduled_at", now)
    .limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ published: 0, message: "No posts due" })
  }

  const results = []

  for (const post of duePosts) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aigency.jcmarketing.digital"
      const res = await fetch(`${baseUrl}/api/jclaude/publish-meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copy: post.copy,
          hashtags: post.hashtags,
          imageUrl: post.image_url || null,
          network: post.network,
        }),
      })

      const data = await res.json()

      if (data.success) {
        const publishedAt = new Date().toISOString()
        await supabaseAdmin
          .from("jclaude_posts")
          .update({ status: "published", published_at: publishedAt })
          .eq("id", post.id)

        // Paso 4a — sincronizar el asset vinculado (best-effort)
        const { error: assetErr } = await supabaseAdmin
          .from("assets")
          .update({ status: "published", updated_at: publishedAt })
          .eq("source_table", "jclaude_posts")
          .eq("source_id", post.id)
        if (assetErr) console.error("[cron-publish] Asset status sync error:", assetErr.message)

        results.push({ id: post.id, success: true, post_id: data.post_id })
      } else {
        results.push({ id: post.id, success: false, error: data.error })
      }
    } catch (err) {
      results.push({ id: post.id, success: false, error: String(err) })
    }
  }

  return NextResponse.json({ published: results.filter(r => r.success).length, results })
}
