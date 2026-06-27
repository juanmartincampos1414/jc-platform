import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CheckCircle, Clock, TrendingUp, AlertCircle, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Ayer"
  return `Hace ${days} días`
}

const ACTION_LABELS: Record<string, string> = {
  "post.approved": "Post aprobado",
  "post.rejected": "Post rechazado",
  "post.needs_changes": "Post requiere cambios",
  "post.published": "Post publicado en",
  "document.signed": "Documento firmado",
  "month.generated": "Mes generado con IA",
  "subscription.activated": "Suscripción activada",
  "social_account.connected": "Cuenta social conectada",
  "social_account.disconnected": "Cuenta social desconectada",
  "influencer.approved": "Influencer aprobado",
}

export default async function WorkspaceDashboard({ params }: { params: Promise<{ workspaceId: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { workspaceId } = await params

  const [pendingPosts, pendingDocs, pendingInfluencers, jclaudeDrafts, activityRes, workspaceRes] = await Promise.all([
    supabase.from("social_posts").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).eq("status", "pending"),
    supabase.from("legal_documents").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).eq("status", "pending"),
    supabase.from("influencers").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).in("status", ["proposal_sent", "content_review"]),
    supabase.from("jclaude_posts").select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId).eq("status", "draft"),
    supabase.from("activity_logs")
      .select("action, entity_type, metadata, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("workspaces").select("name").eq("id", workspaceId).single(),
  ])

  const stats = [
    { label: "Posts pendientes", value: pendingPosts.count ?? 0, color: "text-amber-600", bg: "bg-amber-50", icon: Clock, href: "social-media" },
    { label: "Documentos para firmar", value: pendingDocs.count ?? 0, color: "text-red-600", bg: "bg-red-50", icon: AlertCircle, href: "legales" },
    { label: "Influencers en revisión", value: pendingInfluencers.count ?? 0, color: "text-purple-600", bg: "bg-purple-50", icon: TrendingUp, href: "influencers" },
    { label: "Borradores JClaude", value: jclaudeDrafts.count ?? 0, color: "text-yellow-600", bg: "bg-yellow-50", icon: Sparkles, href: "jclaude" },
  ]

  const activity = activityRes.data ?? []
  const workspaceName = workspaceRes.data?.name ?? "tu workspace"

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">{workspaceName}</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Link key={stat.label} href={`/workspace/${workspaceId}/${stat.href}`}
            className={`${stat.bg} rounded-xl p-4 border border-gray-100 hover:shadow-sm transition`}>
            <stat.icon className={`${stat.color} mb-3`} size={20} />
            <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-xs text-gray-500 leading-tight">{stat.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-[#0A0A0A] mb-4 text-sm uppercase tracking-wide">Acciones rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Ver posts pendientes de aprobación", href: "social-media", color: "border-amber-200 hover:border-amber-400" },
              { label: "Firmar documentos", href: "legales", color: "border-red-200 hover:border-red-400" },
              { label: "Ver resultados de Ads", href: "ads", color: "border-blue-200 hover:border-blue-400" },
              { label: "Revisar influencers", href: "influencers", color: "border-purple-200 hover:border-purple-400" },
            ].map(action => (
              <Link key={action.label} href={`/workspace/${workspaceId}/${action.href}`}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${action.color} transition group`}>
                <span className="text-sm text-gray-700 group-hover:text-[#0A0A0A] font-medium">{action.label}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-600 transition" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-[#0A0A0A] mb-4 text-sm uppercase tracking-wide">Actividad reciente</h2>
          {activity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Sin actividad todavía.</p>
              <p className="text-xs text-gray-300 mt-1">Las acciones del workspace aparecen aquí.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item, i) => {
                const label = ACTION_LABELS[item.action] ?? item.action
                const meta = item.metadata as Record<string, string> | null
                const detail = meta?.title ?? meta?.network ?? meta?.name ?? ""
                return (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FFE600] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">{label}{detail ? `: ${detail}` : ""}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(item.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
