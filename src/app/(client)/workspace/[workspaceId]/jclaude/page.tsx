"use client"

import { useState, useEffect } from "react"
import { Sparkles, Settings, Zap, TrendingUp, CheckCircle, XCircle, Clock, RefreshCw, ChevronRight, Lock } from "lucide-react"

const PLANS = {
  starter: {
    name: "Starter",
    price: "$15.000",
    posts: 8 as number | string,
    networks: 2 as number | string,
    autopublish: false,
    trending: false,
    featured: false,
    badge: "bg-gray-100 text-gray-700",
  },
  pro: {
    name: "Pro",
    price: "$35.000",
    posts: 20 as number | string,
    networks: 4 as number | string,
    autopublish: true,
    trending: false,
    featured: true,
    badge: "bg-[#FFE600] text-[#0A0A0A]",
  },
  enterprise: {
    name: "Enterprise",
    price: "$80.000",
    posts: "Ilimitados" as number | string,
    networks: "Todas" as number | string,
    autopublish: true,
    trending: true,
    featured: false,
    badge: "bg-purple-100 text-purple-800",
  },
}

type PlanKey = keyof typeof PLANS

const NETWORKS = [
  { id: "instagram", label: "Instagram", color: "from-purple-500 to-pink-500" },
  { id: "facebook", label: "Facebook", color: "from-blue-600 to-blue-700" },
  { id: "tiktok", label: "TikTok", color: "from-gray-800 to-gray-900" },
  { id: "linkedin", label: "LinkedIn", color: "from-blue-700 to-blue-800" },
]

type Post = {
  id: string
  network: string
  post_type: string
  copy: string
  hashtags: string
  image_brief: string
  status: "draft" | "approved" | "rejected" | "scheduled" | "published"
  created_at: string
}

type Tab = "plans" | "setup" | "generate" | "queue"

export default function JClaude({ params }: { params: Promise<{ workspaceId: string }> }) {
  const [workspaceId, setWorkspaceId] = useState("")
  const [tab, setTab] = useState<Tab>("plans")
  const [activePlan, setActivePlan] = useState<PlanKey | null>(null)
  const [generating, setGenerating] = useState(false)
  const [trending, setTrending] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [trendingIdeas, setTrendingIdeas] = useState<{concept:string;why_trending:string;best_network:string;hook:string}[]>([])
  const [selectedNetwork, setSelectedNetwork] = useState("instagram")
  const [profile, setProfile] = useState({
    brand_name: "",
    industry: "",
    tone: "profesional y cercano",
    target_audience: "",
    key_messages: "",
  })
  const [subscribing, setSubscribing] = useState<PlanKey | null>(null)

  useEffect(() => {
    params.then(p => setWorkspaceId(p.workspaceId))
  }, [params])

  async function handleSubscribe(plan: PlanKey) {
    setSubscribing(plan)
    try {
      const res = await fetch("/api/mercadopago/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          workspaceId,
          payerEmail: "cliente@example.com",
        }),
      })
      const data = await res.json()
      if (data.checkout_url) {
        window.open(data.checkout_url, "_blank")
        // Simulate activation in demo
        if (data.demo) {
          setActivePlan(plan)
          setTab("setup")
        }
      }
    } finally {
      setSubscribing(null)
    }
  }

  async function handleGenerate(postType: "standard" | "trending" = "standard") {
    if (!activePlan) return
    setGenerating(true)
    try {
      const res = await fetch("/api/jclaude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: selectedNetwork, postType, profile }),
      })
      const data = await res.json()
      if (data.copy) {
        const newPost: Post = {
          id: Math.random().toString(36).slice(2),
          network: selectedNetwork,
          post_type: postType,
          copy: data.copy,
          hashtags: data.hashtags || "",
          image_brief: data.image_brief || "",
          status: "draft",
          created_at: new Date().toISOString(),
        }
        setPosts(prev => [newPost, ...prev])
        setTab("queue")
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleTrending() {
    if (!activePlan || !PLANS[activePlan].trending) return
    setTrending(true)
    try {
      const res = await fetch("/api/jclaude/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: profile.industry, networks: ["instagram", "tiktok"] }),
      })
      const data = await res.json()
      setTrendingIdeas(data.ideas || [])
    } finally {
      setTrending(false)
    }
  }

  function updatePostStatus(id: string, status: Post["status"]) {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const statusBadge = (status: Post["status"]) => {
    const map = {
      draft: "bg-gray-100 text-gray-600",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      scheduled: "bg-blue-100 text-blue-700",
      published: "bg-purple-100 text-purple-700",
    }
    return map[status]
  }

  const statusLabel = (status: Post["status"]) => ({
    draft: "Borrador",
    approved: "Aprobado",
    rejected: "Rechazado",
    scheduled: "Programado",
    published: "Publicado",
  }[status])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#FFE600]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">JClaude</h1>
          <p className="text-sm text-gray-500">Generación de contenido con IA · Publicación automática</p>
        </div>
        {activePlan && (
          <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${PLANS[activePlan].badge}`}>
            Plan {PLANS[activePlan].name} activo
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {([
          { key: "plans", label: "Planes" },
          { key: "setup", label: "Configuración de marca" },
          { key: "generate", label: "Generar contenido" },
          { key: "queue", label: `Cola de posts${posts.length ? ` (${posts.length})` : ""}` },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-[#FFE600] text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Plans */}
      {tab === "plans" && (
        <div>
          <p className="text-gray-600 mb-6 text-sm">
            Suscribite mensualmente vía MercadoPago. Podés cambiar de plan en cualquier momento.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {(Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]).map(([key, plan]) => (
              <div
                key={key}
                className={`border-2 rounded-2xl p-6 relative ${
                  plan.featured ? "border-[#FFE600]" : "border-gray-200"
                } ${activePlan === key ? "ring-2 ring-green-400" : ""}`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFE600] text-[#0A0A0A] text-xs font-bold px-3 py-0.5 rounded-full">
                    Más popular
                  </span>
                )}
                {activePlan === key && (
                  <span className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">
                    Activo
                  </span>
                )}
                <div className="text-lg font-semibold text-gray-900 mb-1">{plan.name}</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{plan.price}</div>
                <div className="text-xs text-gray-500 mb-5">/mes · ARS</div>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {plan.posts} posts/mes
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    {plan.networks} {typeof plan.networks === "number" ? "redes" : "redes"}
                  </li>
                  <li className={`flex items-center gap-2 ${plan.autopublish ? "text-gray-700" : "text-gray-400"}`}>
                    {plan.autopublish
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                    Autopublicación
                  </li>
                  <li className={`flex items-center gap-2 ${plan.trending ? "text-gray-700" : "text-gray-400"}`}>
                    {plan.trending
                      ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : <XCircle className="w-4 h-4 text-gray-300 shrink-0" />}
                    Trending content IA
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe(key)}
                  disabled={subscribing === key || activePlan === key}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activePlan === key
                      ? "bg-green-100 text-green-700 cursor-default"
                      : plan.featured
                      ? "bg-[#FFE600] text-[#0A0A0A] hover:bg-yellow-300"
                      : "bg-[#0A0A0A] text-white hover:bg-gray-800"
                  }`}
                >
                  {subscribing === key ? "Redirigiendo..." : activePlan === key ? "Plan activo" : "Suscribirme"}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">
            El pago se procesa de forma segura vía MercadoPago. Cancelás cuando querés.
          </p>
        </div>
      )}

      {/* TAB: Setup */}
      {tab === "setup" && (
        <div className="max-w-2xl">
          <p className="text-gray-600 text-sm mb-6">
            Completá el perfil de tu marca. Claude usa esta información para generar contenido alineado con tu voz.
          </p>
          <div className="space-y-4">
            {[
              { key: "brand_name", label: "Nombre de la marca", placeholder: "Ej: Café Central" },
              { key: "industry", label: "Rubro", placeholder: "Ej: Gastronomía, Moda, Servicios financieros..." },
              { key: "tone", label: "Tono de comunicación", placeholder: "Ej: Joven y divertido, Profesional y serio, Cercano y cálido" },
              { key: "target_audience", label: "Audiencia objetivo", placeholder: "Ej: Mujeres 25-40 de CABA interesadas en lifestyle" },
              { key: "key_messages", label: "Mensajes clave", placeholder: "Ej: Calidad artesanal, precio justo, experiencia única" },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type="text"
                  value={profile[field.key as keyof typeof profile]}
                  onChange={e => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFE600] focus:border-transparent"
                />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Redes conectadas</label>
            <div className="flex flex-wrap gap-2">
              {NETWORKS.map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    // toggle
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${n.color}`} />
                  {n.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              La autopublicación directa vía API estará disponible próximamente. Por ahora podés descargar el contenido aprobado.
            </p>
          </div>
          <button
            onClick={() => setTab("generate")}
            className="mt-6 flex items-center gap-2 bg-[#0A0A0A] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Guardar y continuar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB: Generate */}
      {tab === "generate" && (
        <div>
          {!activePlan ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Necesitás un plan activo para generar contenido</p>
              <button onClick={() => setTab("plans")} className="mt-3 text-sm text-[#0A0A0A] underline underline-offset-2">
                Ver planes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Generar post</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Red social</label>
                  <div className="flex flex-wrap gap-2">
                    {NETWORKS.slice(0, PLANS[activePlan].networks === "Todas" ? 4 : Number(PLANS[activePlan].networks)).map(n => (
                      <button
                        key={n.id}
                        onClick={() => setSelectedNetwork(n.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                          selectedNetwork === n.id
                            ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                            : "border-gray-200 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleGenerate("standard")}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFE600] text-[#0A0A0A] py-3 rounded-xl font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-60"
                  >
                    {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {generating ? "Generando..." : "Generar post con IA"}
                  </button>
                  {PLANS[activePlan].trending ? (
                    <button
                      onClick={handleTrending}
                      disabled={trending}
                      className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
                    >
                      {trending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                      {trending ? "Analizando tendencias..." : "Ideas trending por rubro"}
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-3 rounded-xl text-sm">
                      <Lock className="w-4 h-4" />
                      Trending content · Plan Enterprise
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 space-y-1">
                  <p className="font-medium text-gray-700">Tu perfil de marca</p>
                  <p>Marca: {profile.brand_name || <span className="italic">no configurado</span>}</p>
                  <p>Rubro: {profile.industry || <span className="italic">no configurado</span>}</p>
                  <p>Tono: {profile.tone}</p>
                  <button onClick={() => setTab("setup")} className="text-[#0A0A0A] underline underline-offset-1 mt-1">
                    Editar perfil
                  </button>
                </div>
              </div>

              <div>
                {trendingIdeas.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Ideas trending</h3>
                    <div className="space-y-3">
                      {trendingIdeas.map((idea, i) => (
                        <div key={i} className="border border-purple-200 rounded-xl p-4 bg-purple-50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-purple-700 uppercase">{idea.best_network}</span>
                            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{idea.hook}</p>
                          <p className="text-xs text-gray-500 mb-2">{idea.why_trending}</p>
                          <button
                            onClick={() => {
                              setSelectedNetwork(idea.best_network)
                              handleGenerate("trending")
                            }}
                            className="text-xs text-purple-700 font-medium underline underline-offset-1"
                          >
                            Generar este post
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Queue */}
      {tab === "queue" && (
        <div>
          {posts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No hay posts generados todavía</p>
              <button onClick={() => setTab("generate")} className="mt-3 text-sm text-[#0A0A0A] underline underline-offset-2">
                Generar contenido
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
                <div key={post.id} className="border border-gray-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">{post.network}</span>
                      {post.post_type === "trending" && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Trending</span>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusBadge(post.status)}`}>
                      {statusLabel(post.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">{post.copy}</p>
                  {post.hashtags && (
                    <p className="text-xs text-blue-600 mb-3">{post.hashtags}</p>
                  )}
                  {post.image_brief && (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 mb-3">
                      <span className="font-medium text-gray-700">Brief de imagen: </span>
                      {post.image_brief}
                    </div>
                  )}
                  {post.status === "draft" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updatePostStatus(post.id, "approved")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                      </button>
                      <button
                        onClick={() => updatePostStatus(post.id, "rejected")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rechazar
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([`${post.copy}\n\n${post.hashtags}`], { type: "text/plain" })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement("a")
                          a.href = url
                          a.download = `post-${post.network}-${post.id}.txt`
                          a.click()
                        }}
                        className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Descargar
                      </button>
                    </div>
                  )}
                  {post.status === "approved" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => updatePostStatus(post.id, "scheduled")}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-200 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" /> Programar
                      </button>
                      {activePlan && PLANS[activePlan].autopublish && (
                        <button
                          onClick={() => updatePostStatus(post.id, "published")}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#FFE600] text-[#0A0A0A] rounded-lg text-xs font-semibold hover:bg-yellow-300 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" /> Publicar ahora
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
