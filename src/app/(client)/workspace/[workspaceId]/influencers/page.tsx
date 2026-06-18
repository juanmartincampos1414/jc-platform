"use client"

import { useState } from "react"
import { CheckCircle, XCircle, Users, TrendingUp, MessageCircle, ChevronRight, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

type InfluencerStatus =
  | "scouting"
  | "proposal_sent"
  | "approved"
  | "rejected"
  | "in_production"
  | "content_review"
  | "published"

interface Influencer {
  id: string
  name: string
  handle: string
  network: "instagram" | "tiktok" | "youtube"
  followers: number
  engagementRate: number
  category: string
  feeProposal?: number
  status: InfluencerStatus
  profileImage?: string
  notes?: string
  contentUrl?: string
}

const STATUS_FLOW: InfluencerStatus[] = [
  "scouting", "proposal_sent", "approved", "in_production", "content_review", "published"
]

const STATUS_LABELS: Record<InfluencerStatus, string> = {
  scouting: "Scouting",
  proposal_sent: "Propuesta enviada",
  approved: "Aprobado",
  rejected: "Rechazado",
  in_production: "En producción",
  content_review: "Revisión de contenido",
  published: "Publicado",
}

const STATUS_COLORS: Record<InfluencerStatus, { bg: string; text: string }> = {
  scouting: { bg: "bg-gray-100", text: "text-gray-600" },
  proposal_sent: { bg: "bg-amber-100", text: "text-amber-700" },
  approved: { bg: "bg-green-100", text: "text-green-700" },
  rejected: { bg: "bg-red-100", text: "text-red-700" },
  in_production: { bg: "bg-blue-100", text: "text-blue-700" },
  content_review: { bg: "bg-purple-100", text: "text-purple-700" },
  published: { bg: "bg-gray-100", text: "text-gray-500" },
}

const MOCK_INFLUENCERS: Influencer[] = [
  { id: "1", name: "Sofia Martínez", handle: "@sofiamtz", network: "instagram", followers: 245000, engagementRate: 4.2, category: "Moda & Lifestyle", feeProposal: 85000, status: "proposal_sent", notes: "Muy buena afinidad con la marca, audiencia femenina 18-34." },
  { id: "2", name: "Lucas Fernández", handle: "@lucasfv", network: "tiktok", followers: 890000, engagementRate: 8.7, category: "Humor & Entretenimiento", feeProposal: 150000, status: "approved" },
  { id: "3", name: "Camila Rojas", handle: "@camirojas", network: "instagram", followers: 120000, engagementRate: 6.1, category: "Fitness & Bienestar", feeProposal: 45000, status: "in_production", notes: "Grabando el unboxing esta semana." },
  { id: "4", name: "Mateo García", handle: "@mateogarcia_yt", network: "youtube", followers: 310000, engagementRate: 3.8, category: "Tech & Reviews", feeProposal: 120000, status: "content_review", contentUrl: "https://youtube.com/watch?v=ejemplo", notes: "Review grabada, esperando aprobación." },
  { id: "5", name: "Valentina López", handle: "@valestyleblog", network: "instagram", followers: 55000, engagementRate: 5.9, category: "Moda & Lifestyle", feeProposal: 28000, status: "published" },
  { id: "6", name: "Nicolás Romero", handle: "@nicoromero", network: "tiktok", followers: 430000, engagementRate: 9.2, category: "Gastronomía", status: "scouting" },
]

const NET_COLORS: Record<string, string> = {
  instagram: "from-purple-500 to-pink-500",
  tiktok: "from-gray-900 to-gray-700",
  youtube: "from-red-600 to-red-700",
}

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>(MOCK_INFLUENCERS)
  const [selected, setSelected] = useState<Influencer | null>(null)
  const [filterStatus, setFilterStatus] = useState<InfluencerStatus | "all">("all")

  const filtered = influencers.filter(i => filterStatus === "all" || i.status === filterStatus)

  function approve(id: string) {
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, status: "approved" } : i))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "approved" } : prev)
    toast.success("Influencer aprobado ✅")
  }

  function reject(id: string) {
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, status: "rejected" } : i))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "rejected" } : prev)
    toast.error("Influencer rechazado")
  }

  function approveContent(id: string) {
    setInfluencers(prev => prev.map(i => i.id === id ? { ...i, status: "published" } : i))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "published" } : prev)
    toast.success("Contenido aprobado — listo para publicar 🎉")
  }

  const needsAction = influencers.filter(i => i.status === "proposal_sent" || i.status === "content_review").length

  const [fitLoading, setFitLoading] = useState(false)
  const [fitResult, setFitResult] = useState<{
    fit_score: number; fit_label: string; audience_match: string;
    strengths: string[]; risks: string[]; fee_assessment: string; recommendation: string
  } | null>(null)

  async function analyzeFit(inf: Influencer) {
    setFitLoading(true)
    setFitResult(null)
    try {
      const res = await fetch("/api/ai/influencer-fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencer: { name: inf.name, handle: inf.handle, network: inf.network, followers: inf.followers, engagementRate: inf.engagementRate, category: inf.category, feeProposal: inf.feeProposal, notes: inf.notes },
          brand: "Marca de moda y lifestyle argentina, target femenino 25-40 años"
        })
      })
      const data = await res.json()
      setFitResult(data)
    } catch {
      toast.error("Error analizando fit con IA")
    } finally {
      setFitLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Influencers</p>
          <h1 className="text-2xl font-black text-[#0A0A0A]">Workflow de Influencers</h1>
        </div>
        {needsAction > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-sm font-bold text-amber-700">{needsAction} acciones pendientes</span>
          </div>
        )}
      </div>

      {/* Pipeline visual */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 overflow-x-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Pipeline</p>
        <div className="flex gap-2 min-w-max">
          {STATUS_FLOW.map((s, i) => {
            const count = influencers.filter(inf => inf.status === s).length
            const colors = STATUS_COLORS[s]
            return (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => setFilterStatus(s === filterStatus ? "all" : s)}
                  className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 transition min-w-[100px] ${
                    filterStatus === s ? "border-[#FFE600] bg-[#FFE600]/10" : "border-transparent hover:border-gray-100"
                  }`}
                >
                  <span className={`text-xl font-black ${colors.text}`}>{count}</span>
                  <span className="text-[10px] text-gray-400 text-center leading-tight mt-0.5">{STATUS_LABELS[s]}</span>
                </button>
                {i < STATUS_FLOW.length - 1 && <ChevronRight size={14} className="text-gray-200 shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button onClick={() => setFilterStatus("all")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterStatus === "all" ? "bg-[#0A0A0A] text-white" : "bg-white border border-gray-100 text-gray-500 hover:border-gray-200"}`}>
          Todos ({influencers.length})
        </button>
        {(["proposal_sent","content_review"] as InfluencerStatus[]).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterStatus === s ? "bg-[#0A0A0A] text-white" : `${STATUS_COLORS[s].bg} ${STATUS_COLORS[s].text} border border-transparent`}`}>
            {STATUS_LABELS[s]} ({influencers.filter(i => i.status === s).length})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(inf => {
          const colors = STATUS_COLORS[inf.status]
          const actionNeeded = inf.status === "proposal_sent" || inf.status === "content_review"
          return (
            <div
              key={inf.id}
              onClick={() => setSelected(inf)}
              className={`bg-white rounded-2xl p-4 cursor-pointer transition border-2 hover:shadow-sm ${actionNeeded ? "border-amber-200 hover:border-amber-400" : "border-gray-100 hover:border-[#FFE600]"}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${NET_COLORS[inf.network]} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                  {inf.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm text-[#0A0A0A] truncate">{inf.name}</p>
                  <p className="text-xs text-gray-400">{inf.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{STATUS_LABELS[inf.status]}</span>
                <span className="text-[10px] text-gray-400">{inf.category}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg py-2">
                  <p className="font-black text-sm text-[#0A0A0A]">{(inf.followers / 1000).toFixed(0)}K</p>
                  <p className="text-[10px] text-gray-400">Seguidores</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-2">
                  <p className="font-black text-sm text-[#0A0A0A]">{inf.engagementRate}%</p>
                  <p className="text-[10px] text-gray-400">Engagement</p>
                </div>
              </div>
              {inf.feeProposal && (
                <p className="text-xs text-gray-500 mt-3 font-medium">Fee: {formatARS(inf.feeProposal)}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-md flex flex-col shadow-2xl overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-[#0A0A0A]">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-6 space-y-5">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${NET_COLORS[selected.network]} flex items-center justify-center text-white font-black text-lg`}>
                  {selected.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-[#0A0A0A]">{selected.name}</p>
                  <p className="text-sm text-gray-400">{selected.handle} · {selected.network}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[selected.status].bg} ${STATUS_COLORS[selected.status].text}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Seguidores", value: `${(selected.followers / 1000).toFixed(0)}K` },
                  { label: "Engagement", value: `${selected.engagementRate}%` },
                  { label: "Fee", value: selected.feeProposal ? formatARS(selected.feeProposal) : "—" },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="font-black text-[#0A0A0A] text-sm">{s.value}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Category */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Categoría</p>
                <p className="text-sm text-[#0A0A0A]">{selected.category}</p>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Notas de JC</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              {/* Content link */}
              {selected.contentUrl && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Contenido para revisar</p>
                  <a href={selected.contentUrl} target="_blank" className="text-sm text-blue-600 underline break-all">{selected.contentUrl}</a>
                </div>
              )}

              {/* Pipeline progress */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Estado del workflow</p>
                <div className="space-y-2">
                  {STATUS_FLOW.map((s, i) => {
                    const currentIdx = STATUS_FLOW.indexOf(selected.status)
                    const done = i < currentIdx
                    const active = i === currentIdx
                    return (
                      <div key={s} className={`flex items-center gap-3 text-xs ${active ? "text-[#0A0A0A] font-bold" : done ? "text-gray-400" : "text-gray-300"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-[#FFE600]" : done ? "bg-green-500" : "bg-gray-100"}`}>
                          {done ? <CheckCircle size={10} className="text-white" /> : <span className={active ? "text-[#0A0A0A]" : "text-gray-400"}>{i + 1}</span>}
                        </div>
                        {STATUS_LABELS[s]}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* AI Fit Analysis */}
              <div className="border border-dashed border-[#FFE600] rounded-xl p-4 bg-[#FFE600]/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#FFE600]" />
                    <p className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wide">Análisis de Fit IA</p>
                  </div>
                  <button
                    onClick={() => analyzeFit(selected)}
                    disabled={fitLoading}
                    className="flex items-center gap-1.5 text-xs bg-[#0A0A0A] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-black transition disabled:opacity-50"
                  >
                    {fitLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {fitLoading ? "Analizando..." : "Analizar"}
                  </button>
                </div>
                {fitResult && (
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-black ${fitResult.fit_score >= 7 ? "text-green-600" : fitResult.fit_score >= 5 ? "text-amber-600" : "text-red-600"}`}>
                        {fitResult.fit_score}/10
                      </div>
                      <span className="text-xs font-bold text-[#0A0A0A]">{fitResult.fit_label}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{fitResult.audience_match}</p>
                    {fitResult.strengths?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-green-700 uppercase mb-1">Fortalezas</p>
                        {fitResult.strengths.map((s, i) => <p key={i} className="text-xs text-gray-600">✅ {s}</p>)}
                      </div>
                    )}
                    {fitResult.risks?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Riesgos</p>
                        {fitResult.risks.map((r, i) => <p key={i} className="text-xs text-gray-600">⚠️ {r}</p>)}
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Fee</p>
                      <p className="text-xs text-gray-700">{fitResult.fee_assessment}</p>
                    </div>
                    <div className="bg-[#0A0A0A] rounded-lg p-3">
                      <p className="text-[10px] font-bold text-[#FFE600] uppercase mb-1">Recomendación</p>
                      <p className="text-xs text-white leading-relaxed">{fitResult.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selected.status === "proposal_sent" && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => approve(selected.id)} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 text-sm font-bold hover:bg-green-600 transition">
                    <CheckCircle size={15} /> Aprobar
                  </button>
                  <button onClick={() => reject(selected.id)} className="flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm font-bold hover:bg-red-100 transition">
                    <XCircle size={15} />
                  </button>
                </div>
              )}
              {selected.status === "content_review" && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => approveContent(selected.id)} className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 text-sm font-bold hover:bg-green-600 transition">
                    <CheckCircle size={15} /> Aprobar contenido
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-amber-100 text-amber-700 rounded-xl py-3 text-sm font-bold hover:bg-amber-200 transition">
                    <MessageCircle size={15} /> Pedir cambios
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
