"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Target, Layers, Brain, ChevronRight, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Campaign = {
  id: string
  name: string
  status: string
  starts_at: string | null
  ends_at: string | null
  brief: { objective?: string; channels?: string[] } | null
  brand_id: string
  asset_count: number
  decision_count: number
  event_count: number
  updated_at: string
}

const STATUS_STYLES: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  draft:     "bg-gray-100 text-gray-600",
  paused:    "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  archived:  "bg-gray-100 text-gray-400",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return "hace unos minutos"
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return "ayer"
  return `hace ${d} días`
}

export default function CampaignsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/campaigns?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setCampaigns(d.campaigns ?? []); setLoading(false) })
      .catch(() => { setError("Error cargando campañas"); setLoading(false) })
  }, [workspaceId])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <p className="text-gray-500 mt-1 text-sm">El centro operativo del sistema. Cada campaign concentra Assets, Knowledge y Decisions.</p>
      </div>

      {/* States */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-700 rounded-xl p-4 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Target size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay campaigns todavía</p>
          <p className="text-gray-400 text-sm mt-1">Generá un mes en JClaude para crear la primera campaign.</p>
        </div>
      )}

      {/* Campaign list */}
      <div className="space-y-3">
        {campaigns.map(c => (
          <button
            key={c.id}
            onClick={() => router.push(`/workspace/${workspaceId}/campaigns/${c.id}`)}
            className="w-full bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-300 hover:shadow-sm transition text-left group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[c.status] ?? STATUS_STYLES.draft)}>
                    {c.status}
                  </span>
                  {c.starts_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(c.starts_at).toLocaleDateString("es-AR", { month: "short", year: "numeric" })}
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-gray-900 text-base truncate">{c.name}</h2>
                {c.brief?.objective && (
                  <p className="text-sm text-gray-400 mt-0.5 truncate">{c.brief.objective}</p>
                )}
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition shrink-0 mt-1" />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Layers size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-700">{c.asset_count}</span> assets
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Brain size={14} className="text-gray-400" />
                <span className="font-semibold text-gray-700">{c.decision_count}</span> decisions
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 ml-auto">
                <Clock size={14} className="text-gray-400" />
                {timeAgo(c.updated_at)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
