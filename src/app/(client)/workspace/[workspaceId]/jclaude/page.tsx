"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Sparkles, ChevronLeft, ChevronRight, CheckCircle, XCircle,
  RefreshCw, Zap, Settings, Lock, Image, Clock, Calendar
} from "lucide-react"

const PLAN_CONFIG = {
  starter: { name: "Starter", posts: 8, networks: 2, autopublish: false, trending: false },
  pro: { name: "Pro", posts: 20, networks: 4, autopublish: true, trending: false },
  enterprise: { name: "Enterprise", posts: 999, networks: 99, autopublish: true, trending: true },
}
type PlanKey = keyof typeof PLAN_CONFIG

const NETWORK_COLOR: Record<string, string> = {
  instagram: "bg-purple-100 text-purple-800 border-purple-200",
  facebook: "bg-blue-100 text-blue-800 border-blue-200",
  tiktok: "bg-gray-100 text-gray-800 border-gray-300",
  linkedin: "bg-sky-100 text-sky-800 border-sky-200",
}
const NETWORK_DOT: Record<string, string> = {
  instagram: "bg-purple-500",
  facebook: "bg-blue-600",
  tiktok: "bg-gray-800",
  linkedin: "bg-sky-600",
}
const TYPE_LABEL: Record<string, string> = { post: "Post", reel: "Reel", story: "Story" }
const STATUS_COLOR: Record<string, string> = {
  draft: "border-gray-200 bg-gray-50 text-gray-600",
  approved: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-600",
  scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  published: "border-purple-200 bg-purple-50 text-purple-700",
}
const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador", approved: "Aprobado", rejected: "Rechazado",
  scheduled: "Programado", published: "Publicado",
}

type Post = {
  id: string
  network: string
  post_type: string
  copy: string
  hashtags: string
  image_brief: string
  image_url?: string
  status: "draft" | "approved" | "rejected" | "scheduled" | "published"
  scheduled_at: string
  published_at?: string
}

type Subscription = {
  plan: PlanKey
  status: string
  posts_limit: number
  networks_limit: number
  autopublish: boolean
  trending: boolean
}

type Profile = {
  brand_name: string
  industry: string
  tone: string
  target_audience: string
  key_messages: string
}

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAY_NAMES = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]

export default function JClaude({ params }: { params: Promise<{ workspaceId: string }> }) {
  const [workspaceId, setWorkspaceId] = useState("")
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [generating, setGenerating] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState("")
  const [showSetup, setShowSetup] = useState(false)
  const [profile, setProfile] = useState<Profile>({
    brand_name: "", industry: "", tone: "profesional y cercano",
    target_audience: "", key_messages: "",
  })

  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()
  const monthKey = `${year}-${String(month).padStart(2, "0")}`

  const loadPosts = useCallback(async (wsId: string) => {
    const res = await fetch(`/api/jclaude/posts?workspaceId=${wsId}&month=${monthKey}`)
    const data = await res.json()
    setPosts(data.posts || [])
  }, [monthKey])

  useEffect(() => {
    params.then(async p => {
      setWorkspaceId(p.workspaceId)
      const [subRes] = await Promise.all([
        fetch(`/api/jclaude/subscription?workspaceId=${p.workspaceId}`)
      ])
      const subData = await subRes.json()
      setSubscription(subData.subscription)
      setLoading(false)
      if (subData.subscription) await loadPosts(p.workspaceId)
    })
  }, [params, loadPosts])

  useEffect(() => {
    if (workspaceId && subscription) loadPosts(workspaceId)
  }, [monthKey, workspaceId, subscription, loadPosts])

  // Calendar grid logic
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  function getPostsForDay(day: number): Post[] {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return posts.filter(p => p.scheduled_at?.startsWith(dateStr))
  }

  function formatTime(iso: string) {
    return iso ? iso.slice(11, 16) : ""
  }

  async function handleGenerateMonth() {
    if (!subscription) return
    setGenerating(true)
    try {
      const res = await fetch("/api/jclaude/generate-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, month, year, profile, subscription }),
      })
      const data = await res.json()
      if (data.posts) setPosts(prev => {
        const kept = prev.filter(p => !p.scheduled_at?.startsWith(`${year}-${String(month).padStart(2,"0")}`))
        return [...kept, ...data.posts]
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleUpdateStatus(post: Post, status: Post["status"]) {
    const res = await fetch("/api/jclaude/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, status }),
    })
    const data = await res.json()
    if (data.post) {
      setPosts(prev => prev.map(p => p.id === post.id ? data.post : p))
      setSelectedPost(data.post)
    }
  }

  async function handleGenerateImage(post: Post) {
    setGeneratingImage(true)
    try {
      const res = await fetch("/api/jclaude/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: post.image_brief, network: post.network }),
      })
      const data = await res.json()
      if (data.image_url) {
        await fetch("/api/jclaude/posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: post.id, status: post.status, image_url: data.image_url }),
        })
        const updated = { ...post, image_url: data.image_url }
        setPosts(prev => prev.map(p => p.id === post.id ? updated : p))
        setSelectedPost(updated)
      }
    } finally {
      setGeneratingImage(false)
    }
  }

  async function handlePublishNow(post: Post) {
    setPublishing(true)
    setPublishMsg("")
    try {
      const res = await fetch("/api/jclaude/publish-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copy: post.copy, hashtags: post.hashtags,
          imageUrl: post.image_url || null, network: post.network,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setPublishMsg(`Publicado · ID ${data.post_id}`)
        await handleUpdateStatus(post, "published")
      } else {
        setPublishMsg(data.error || "Error al publicar")
      }
    } finally {
      setPublishing(false)
    }
  }

  const stats = {
    total: posts.length,
    approved: posts.filter(p => p.status === "approved").length,
    published: posts.filter(p => p.status === "published").length,
    draft: posts.filter(p => p.status === "draft").length,
  }

  // ── No plan ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#FFE600]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">JClaude</h1>
            <p className="text-sm text-gray-500">Calendario de contenido con IA · Publicación automática</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {(Object.entries(PLAN_CONFIG) as [PlanKey, typeof PLAN_CONFIG[PlanKey]][]).map(([key, plan]) => (
            <div key={key} className={`border-2 rounded-2xl p-6 relative ${key === "pro" ? "border-[#FFE600]" : "border-gray-200"}`}>
              {key === "pro" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFE600] text-[#0A0A0A] text-xs font-bold px-3 py-0.5 rounded-full">Más popular</span>}
              <div className="text-lg font-semibold mb-1">{plan.name}</div>
              <ul className="space-y-1.5 text-sm mb-5 mt-3">
                <li className="flex items-center gap-2 text-gray-700"><CheckCircle className="w-4 h-4 text-green-500" />{plan.posts === 999 ? "Posts ilimitados" : `${plan.posts} posts/mes`}</li>
                <li className={`flex items-center gap-2 ${plan.autopublish ? "text-gray-700" : "text-gray-400"}`}>{plan.autopublish ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}Autopublicación</li>
                <li className={`flex items-center gap-2 ${plan.trending ? "text-gray-700" : "text-gray-400"}`}>{plan.trending ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}Trending content IA</li>
              </ul>
              <button className={`w-full py-2.5 rounded-xl text-sm font-semibold ${key === "pro" ? "bg-[#FFE600] text-[#0A0A0A]" : "bg-[#0A0A0A] text-white"}`}>
                Suscribirme
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Setup modal ───────────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Perfil de marca</h2>
          <button onClick={() => setShowSetup(false)} className="text-sm text-gray-500 hover:text-gray-700">← Volver al calendario</button>
        </div>
        <div className="space-y-4">
          {([
            { key: "brand_name", label: "Nombre de la marca", placeholder: "Ej: Flips Argentina" },
            { key: "industry", label: "Rubro", placeholder: "Ej: Moda, Gastronomía, Tecnología..." },
            { key: "tone", label: "Tono de comunicación", placeholder: "Ej: Joven y divertido, Profesional, Cercano" },
            { key: "target_audience", label: "Audiencia objetivo", placeholder: "Ej: Mujeres 25-40 de CABA" },
            { key: "key_messages", label: "Mensajes clave", placeholder: "Ej: Calidad, precio justo, experiencia única" },
          ] as { key: keyof Profile; label: string; placeholder: string }[]).map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                type="text"
                value={profile[f.key]}
                onChange={e => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE600]"
              />
            </div>
          ))}
        </div>
        <button onClick={() => setShowSetup(false)} className="mt-6 bg-[#0A0A0A] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
          Guardar y volver
        </button>
      </div>
    )
  }

  // ── Main calendar view ────────────────────────────────────────────────────
  return (
    <div className="flex h-full">
      {/* Calendar column */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#FFE600]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">JClaude</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                subscription.plan === "enterprise" ? "bg-purple-100 text-purple-700" :
                subscription.plan === "pro" ? "bg-[#FFE600] text-[#0A0A0A]" :
                "bg-gray-100 text-gray-600"
              }`}>
                {PLAN_CONFIG[subscription.plan]?.name} activo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSetup(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Settings className="w-3.5 h-3.5" /> Marca
            </button>
            <button
              onClick={handleGenerateMonth}
              disabled={generating}
              className="flex items-center gap-2 bg-[#FFE600] text-[#0A0A0A] px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-60"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {generating ? "Generando..." : "Generar mes"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total", value: stats.total, color: "text-gray-900" },
            { label: "Borradores", value: stats.draft, color: "text-gray-500" },
            { label: "Aprobados", value: stats.approved, color: "text-green-600" },
            { label: "Publicados", value: stats.published, color: "text-purple-600" },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-0.5">{s.label}</div>
              <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-900">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Day names */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
            ))}
          </div>
          {/* Cells */}
          <div className="grid grid-cols-7">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - startOffset + 1
              const isValid = dayNum >= 1 && dayNum <= daysInMonth
              const isToday = isValid && new Date().getDate() === dayNum &&
                new Date().getMonth() + 1 === month && new Date().getFullYear() === year
              const dayPosts = isValid ? getPostsForDay(dayNum) : []

              return (
                <div
                  key={i}
                  className={`border-b border-r border-gray-100 min-h-[88px] p-1.5 ${
                    !isValid ? "bg-gray-50/50" : "bg-white"
                  } ${i % 7 === 6 ? "border-r-0" : ""}`}
                >
                  {isValid && (
                    <>
                      <div className={`text-xs font-medium mb-1 w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? "bg-[#0A0A0A] text-white" : "text-gray-400"
                      }`}>
                        {dayNum}
                      </div>
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 3).map(post => (
                          <button
                            key={post.id}
                            onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                            className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 truncate transition-all ${
                              selectedPost?.id === post.id
                                ? "ring-1 ring-[#0A0A0A]"
                                : ""
                            } ${STATUS_COLOR[post.status]}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${NETWORK_DOT[post.network] || "bg-gray-400"}`} />
                            <span className="truncate">{TYPE_LABEL[post.post_type]} · {formatTime(post.scheduled_at)}</span>
                          </button>
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-[10px] text-gray-400 px-1">+{dayPosts.length - 3} más</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {Object.entries(NETWORK_DOT).map(([net, cls]) => (
            <div key={net} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cls}`} />
              <span className="text-xs text-gray-500 capitalize">{net}</span>
            </div>
          ))}
          <div className="w-px h-3 bg-gray-200 mx-1" />
          {Object.entries(STATUS_LABEL).slice(0, 3).map(([s, label]) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLOR[s]}`}>{label}</span>
            </div>
          ))}
        </div>

        {generating && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Claude está planificando tu calendario del mes... esto tarda unos segundos.
          </div>
        )}
      </div>

      {/* Post detail panel */}
      {selectedPost && (
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${NETWORK_COLOR[selectedPost.network] || "bg-gray-100 text-gray-700"}`}>
                {selectedPost.network}
              </span>
              <span className="text-xs text-gray-500">{TYPE_LABEL[selectedPost.post_type]}</span>
            </div>
            <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
          </div>

          <div className="p-4 space-y-4">
            {/* Date/time */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(selectedPost.scheduled_at).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              <Clock className="w-3.5 h-3.5 ml-1" />
              {formatTime(selectedPost.scheduled_at)}
            </div>

            {/* Status */}
            <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLOR[selectedPost.status]}`}>
              {STATUS_LABEL[selectedPost.status]}
            </span>

            {/* Copy */}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">Copy</div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedPost.copy}</p>
            </div>

            {/* Hashtags */}
            {selectedPost.hashtags && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Hashtags</div>
                <p className="text-xs text-blue-600 leading-relaxed">{selectedPost.hashtags}</p>
              </div>
            )}

            {/* Image */}
            {selectedPost.image_url ? (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Imagen</div>
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={selectedPost.image_url} alt="Imagen generada" className="w-full object-cover" />
                  <button
                    onClick={() => handleGenerateImage(selectedPost)}
                    disabled={generatingImage}
                    className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-black/80"
                  >
                    <RefreshCw className="w-3 h-3" /> Regenerar
                  </button>
                </div>
              </div>
            ) : selectedPost.image_brief ? (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Brief de imagen</div>
                <p className="text-xs text-gray-600 mb-2">{selectedPost.image_brief}</p>
                <button
                  onClick={() => handleGenerateImage(selectedPost)}
                  disabled={generatingImage}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-[#FFE600] hover:text-gray-700 transition-colors disabled:opacity-60"
                >
                  {generatingImage
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generando...</>
                    : <><Image className="w-4 h-4" /> Generar imagen con IA</>}
                </button>
              </div>
            ) : null}

            {/* Actions */}
            {selectedPost.status === "draft" && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(selectedPost, "approved")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-semibold hover:bg-green-200 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedPost, "rejected")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
              </div>
            )}

            {selectedPost.status === "approved" && (
              <div className="space-y-2 pt-2">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Programado para publicarse automáticamente en el horario indicado.
                </div>
                {subscription.autopublish && (
                  <button
                    onClick={() => handlePublishNow(selectedPost)}
                    disabled={publishing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FFE600] text-[#0A0A0A] rounded-xl text-sm font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-60"
                  >
                    {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {publishing ? "Publicando..." : "Publicar ahora"}
                  </button>
                )}
                {!subscription.autopublish && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg p-2">
                    <Lock className="w-3 h-3" /> Autopublicación disponible en plan Pro
                  </div>
                )}
                {publishMsg && (
                  <p className={`text-xs ${publishMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                    {publishMsg}
                  </p>
                )}
                <button
                  onClick={() => handleUpdateStatus(selectedPost, "draft")}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
                >
                  Volver a borrador
                </button>
              </div>
            )}

            {selectedPost.status === "published" && (
              <div className="flex items-center gap-2 bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
                <CheckCircle className="w-4 h-4" /> Publicado en {selectedPost.network}
              </div>
            )}

            {selectedPost.status === "rejected" && (
              <button
                onClick={() => handleUpdateStatus(selectedPost, "draft")}
                className="w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Restablecer como borrador
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
