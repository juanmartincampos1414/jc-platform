import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CheckCircle, Clock, TrendingUp, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const MOCK_STATS = [
  { label: "Posts pendientes de aprobación", value: 4, color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  { label: "Documentos para firmar", value: 1, color: "text-red-600", bg: "bg-red-50", icon: AlertCircle },
  { label: "Influencers en revisión", value: 3, color: "text-purple-600", bg: "bg-purple-50", icon: TrendingUp },
  { label: "Tareas completadas este mes", value: 12, color: "text-green-700", bg: "bg-green-50", icon: CheckCircle },
]

const MOCK_ACTIVITY = [
  { text: "JC subió 3 creatividades para revisión", time: "Hace 2h", type: "upload" },
  { text: "Factura de Junio marcada como enviada", time: "Hace 5h", type: "billing" },
  { text: "Post de Instagram aprobado", time: "Ayer", type: "approve" },
  { text: "Nueva influencer agregada: @marialopez", time: "Ayer", type: "influencer" },
  { text: "Carta oferta subida para firma", time: "Hace 3 días", type: "legal" },
]

const DEMO_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')

export default async function WorkspaceDashboard({ params }: { params: Promise<{ workspaceId: string }> }) {
  if (!DEMO_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/login")
  }

  const { workspaceId } = await params

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 font-medium mb-1">Bienvenido de vuelta</p>
        <h1 className="text-2xl font-black text-[#0A0A0A]">Dashboard</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {MOCK_STATS.map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
            <stat.icon className={`${stat.color} mb-3`} size={20} />
            <div className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-xs text-gray-500 leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-[#0A0A0A] mb-4 text-sm uppercase tracking-wide">Acciones rápidas</h2>
          <div className="space-y-2">
            {[
              { label: "Ver posts pendientes de aprobación", href: `legales`, color: "border-amber-200 hover:border-amber-400" },
              { label: "Firmar carta oferta", href: `legales`, color: "border-red-200 hover:border-red-400" },
              { label: "Ver resultados de Ads", href: `ads`, color: "border-blue-200 hover:border-blue-400" },
              { label: "Revisar influencers", href: `influencers`, color: "border-purple-200 hover:border-purple-400" },
            ].map(action => (
              <Link
                key={action.label}
                href={`/workspace/${workspaceId}/${action.href}`}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${action.color} transition group`}
              >
                <span className="text-sm text-gray-700 group-hover:text-[#0A0A0A] font-medium">{action.label}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-600 transition" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-black text-[#0A0A0A] mb-4 text-sm uppercase tracking-wide">Actividad reciente</h2>
          <div className="space-y-4">
            {MOCK_ACTIVITY.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FFE600] mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{item.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
