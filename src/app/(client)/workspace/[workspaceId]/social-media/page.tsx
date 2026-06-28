"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { CheckCircle, XCircle, MessageCircle, Clock, ChevronLeft, ChevronRight, Send, Sparkles, Loader2, Copy } from "lucide-react"
import { toast } from "sonner"

type Network = "instagram" | "facebook" | "tiktok" | "youtube"
type PostStatus = "draft" | "pending" | "approved" | "rejected" | "needs_changes" | "published"

interface Comment { id: string; content: string; created_at: string; user_id: string }
interface Post {
  id: string
  network: Network
  title: string
  caption: string
  scheduled_at: string
  status: PostStatus
  media_urls: string[] | null
  comments?: Comment[]
}

const NET_CONFIG: Record<Network, { label: string; bg: string }> = {
  instagram: { label: "Instagram", bg: "bg-gradient-to-br from-purple-500 to-pink-500" },
  facebook: { label: "Facebook", bg: "bg-blue-600" },
  tiktok: { label: "TikTok", bg: "bg-gray-900" },
  youtube: { label: "YouTube", bg: "bg-red-600" },
}

const STATUS_CONFIG: Record<PostStatus, { label: string; color: string; bg: string }> = {
  draft:         { label: "Borrador",          color: "text-gray-500",   bg: "bg-gray-100" },
  pending:       { label: "Pendiente",          color: "text-amber-700",  bg: "bg-amber-100" },
  approved:      { label: "Aprobado",           color: "text-green-700",  bg: "bg-green-100" },
  rejected:      { label: "Rechazado",          color: "text-red-700",    bg: "bg-red-100" },
  needs_changes: { label: "Necesita cambios",   color: "text-orange-700", bg: "bg-orange-100" },
  published:     { label: "Publicado",          color: "text-gray-600",   bg: "bg-gray-100" },
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

export default function SocialMediaPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeNetwork, setActiveNetwork] = useState<Network | "all">("all")
  const [activeStatus, setActiveStatus] = useState<PostStatus | "all">("all")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [newComment, setNewComment] = useState("")
  const [month, setMonth] = useState(new Date().getMonth())
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCopies, setAiCopies] = useState<{ style: string; copy: string }[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ workspaceId })
    const res = await fetch(`/api/social/posts?${params}`)
    if (res.ok) {
      const data = await res.json()
      setPosts(data.posts)
    }
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function openPost(post: Post) {
    setSelectedPost(post)
    setAiCopies([])
    setCommentsLoading(true)
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setSelectedPost(p => p ? { ...p, comments: data.comments } : p)
      }
    } finally {
      setCommentsLoading(false)
    }
  }

  async function updateStatus(id: string, status: PostStatus, comment?: string) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/social/posts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment, workspaceId }),
      })
      if (!res.ok) throw new Error("Error al actualizar estado")
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      if (selectedPost?.id === id) setSelectedPost(prev => prev ? { ...prev, status } : prev)
      const labels: Record<string, string> = { approved: "Aprobado", rejected: "Rechazado", needs_changes: "Cambios solicitados" }
      toast.success(labels[status] ?? "Estado actualizado")
    } catch {
      toast.error("Error al actualizar estado")
    } finally {
      setSubmitting(false)
    }
  }

  async function addComment(postId: string) {
    if (!newComment.trim()) return
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      })
      if (!res.ok) throw new Error("Error al agregar comentario")
      const data = await res.json()
      setSelectedPost(prev => prev ? { ...prev, comments: [...(prev.comments ?? []), data.comment] } : prev)
      setNewComment("")
    } catch {
      toast.error("Error al agregar comentario")
    }
  }

  async function generateCopy(post: Post) {
    setAiLoading(true)
    setAiCopies([])
    try {
      const res = await fetch("/api/ai/social-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: post.network, title: post.title, context: post.caption, brand: "cliente JC AIgency" }),
      })
      const data = await res.json()
      setAiCopies(data.options ?? [])
    } catch {
      toast.error("Error generando copies con IA")
    } finally {
      setAiLoading(false)
    }
  }

  const filtered = posts.filter(p => {
    const matchNetwork = activeNetwork === "all" || p.network === activeNetwork
    const matchStatus = activeStatus === "all" || p.status === activeStatus
    const matchMonth = !p.scheduled_at || new Date(p.scheduled_at).getMonth() === month
    return matchNetwork && matchStatus && matchMonth
  })

  const pendingCount = posts.filter(p => p.status === "pending").length

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-400">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Cargando contenido...</span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Social Media</p>
          <h1 className="text-2xl font-black text-[#0A0A0A]">Plan de Contenido</h1>
        </div>
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <Clock size={14} className="text-amber-600" />
            <span className="text-sm font-bold text-amber-700">{pendingCount} posts para aprobar</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1">
          <button onClick={() => setActiveNetwork("all")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeNetwork === "all" ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-gray-700"}`}>Todas</button>
          {(["instagram","facebook","tiktok","youtube"] as Network[]).map(n => (
            <button key={n} onClick={() => setActiveNetwork(n)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition capitalize ${activeNetwork === n ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {NET_CONFIG[n].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1">
          {(["all","draft","pending","approved","needs_changes"] as const).map(s => (
            <button key={s} onClick={() => setActiveStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeStatus === s ? "bg-[#0A0A0A] text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {s === "all" ? "Todos" : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setMonth(m => Math.max(0, m - 1))} className="p-1.5 rounded-lg hover:bg-white hover:border hover:border-gray-100 transition">
          <ChevronLeft size={16} />
        </button>
        <span className="font-bold text-sm text-[#0A0A0A]">{MONTHS[month]} {new Date().getFullYear()}</span>
        <button onClick={() => setMonth(m => Math.min(11, m + 1))} className="p-1.5 rounded-lg hover:bg-white hover:border hover:border-gray-100 transition">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(post => {
          const net = NET_CONFIG[post.network] ?? { label: post.network, bg: "bg-gray-400" }
          const st = STATUS_CONFIG[post.status]
          return (
            <div key={post.id} onClick={() => openPost(post)}
              className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-[#FFE600] hover:shadow-sm transition group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md ${net.bg} flex items-center justify-center`}>
                    <span className="text-white text-[8px] font-black">{post.network.slice(0,2).toUpperCase()}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{net.label}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
              </div>
              <h3 className="font-bold text-sm text-[#0A0A0A] mb-1 group-hover:text-black">{post.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{post.caption}</p>
              <div className="flex items-center justify-between">
                {post.scheduled_at && (
                  <span className="text-xs text-gray-400">📅 {new Date(post.scheduled_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MessageCircle size={11} />
                </span>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <p className="text-sm text-gray-400">No hay posts para este mes y filtro.</p>
            <p className="text-xs text-gray-300 mt-1">JClaude genera contenido desde el módulo JClaude.</p>
          </div>
        )}
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-lg flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-md ${NET_CONFIG[selectedPost.network]?.bg ?? "bg-gray-400"} flex items-center justify-center`}>
                  <span className="text-white text-[9px] font-black">{selectedPost.network.slice(0,2).toUpperCase()}</span>
                </div>
                <span className="font-bold text-sm text-[#0A0A0A]">{selectedPost.title}</span>
              </div>
              <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[selectedPost.status].bg} ${STATUS_CONFIG[selectedPost.status].color}`}>
                {STATUS_CONFIG[selectedPost.status].label}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Caption</p>
                <p className="text-sm text-[#0A0A0A] leading-relaxed whitespace-pre-wrap">{selectedPost.caption}</p>
              </div>

              {selectedPost.scheduled_at && (
                <div className="text-xs text-gray-400">
                  📅 Programado: {new Date(selectedPost.scheduled_at).toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" })}
                </div>
              )}

              {selectedPost.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(selectedPost.id, "approved")} disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-600 transition disabled:opacity-50">
                    <CheckCircle size={15} /> Aprobar
                  </button>
                  <button onClick={() => updateStatus(selectedPost.id, "needs_changes")} disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-100 text-amber-700 rounded-xl py-2.5 text-sm font-bold hover:bg-amber-200 transition disabled:opacity-50">
                    ⚠️ Cambios
                  </button>
                  <button onClick={() => updateStatus(selectedPost.id, "rejected")} disabled={submitting}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-red-100 transition disabled:opacity-50">
                    <XCircle size={15} />
                  </button>
                </div>
              )}
              {selectedPost.status === "needs_changes" && (
                <button onClick={() => updateStatus(selectedPost.id, "approved")} disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-600 transition disabled:opacity-50">
                  <CheckCircle size={15} /> Aprobar ahora
                </button>
              )}

              {/* AI Copy Generator */}
              <div className="border border-dashed border-[#FFE600] rounded-xl p-4 bg-[#FFE600]/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#FFE600]" />
                    <p className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wide">Generar copy con IA</p>
                  </div>
                  <button onClick={() => generateCopy(selectedPost)} disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs bg-[#0A0A0A] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-black transition disabled:opacity-50">
                    {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {aiLoading ? "Generando..." : "Generar 3 opciones"}
                  </button>
                </div>
                {aiCopies.length > 0 && (
                  <div className="space-y-3 mt-3">
                    {aiCopies.map((c, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 border border-gray-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-[#FFE600] uppercase bg-[#0A0A0A] px-2 py-0.5 rounded-full">{c.style}</span>
                          <button onClick={() => { navigator.clipboard.writeText(c.copy); toast.success("Copy copiado") }}
                            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-700 transition">
                            <Copy size={10} /> Copiar
                          </button>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{c.copy}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Comentarios {selectedPost.comments ? `(${selectedPost.comments.length})` : ""}
                </p>
                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400 py-2">
                    <Loader2 size={12} className="animate-spin" />
                    <span className="text-xs">Cargando comentarios...</span>
                  </div>
                ) : (
                  <>
                    {(selectedPost.comments?.length ?? 0) === 0 && (
                      <p className="text-xs text-gray-400 italic">Sin comentarios aún</p>
                    )}
                    <div className="space-y-3">
                      {selectedPost.comments?.map(c => (
                        <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-[#0A0A0A]">Usuario</span>
                            <span className="text-[10px] text-gray-400">{new Date(c.created_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addComment(selectedPost.id)}
                  placeholder="Escribí un comentario..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FFE600] transition"
                />
                <button onClick={() => addComment(selectedPost.id)}
                  className="bg-[#0A0A0A] text-white rounded-xl px-3 py-2 hover:bg-black transition">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
