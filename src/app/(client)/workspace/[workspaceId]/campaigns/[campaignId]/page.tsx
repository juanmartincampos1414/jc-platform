"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Layers, Brain, Zap, Activity,
  CheckCircle2, Clock, XCircle, AlertCircle,
  Image, Video, BookOpen,
  ChevronDown, ChevronUp, Lightbulb, TrendingDown, TrendingUp, Minus,
  Map, RefreshCw, ShieldAlert, Target
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────

type CampaignData = {
  campaign: {
    id: string; name: string; status: string
    starts_at: string | null; ends_at: string | null
    brief: { objective?: string; channels?: string[] } | null
    brands: { name: string } | null
  }
  assets: Asset[]
  decisions: Decision[]
  knowledge: Knowledge[]
  recommendations: Recommendation[]
  activity: DomainEvent[]
}

type Asset = {
  id: string; channel: string; asset_type: string
  status: string; caption: string | null
  scheduled_at: string | null; created_at: string
}

type Decision = {
  id: string; decision_type: string; status: string
  confidence: number; rationale: string
  supporting_knowledge: SupportingKnowledge[]
  supporting_evidence: unknown[]
  generated_at: string
}

type SupportingKnowledge = {
  type: string; title: string; confidence: number; summary?: string
}

type Knowledge = {
  id: string; memory_type: string; title: string
  content: string; confidence: number; created_at: string
  metadata?: Record<string, unknown>
}

type Recommendation = {
  id: string; title: string; body: string
  action_type: string; action_detail: Record<string, unknown>
  status: string; decision_id: string | null
  decision_reason?: string | null; created_at: string
}

type DomainEvent = {
  id: string; event: string; entity_type: string
  actor_type: string; metadata: Record<string, unknown>; created_at: string
}

// ─── Knowledge metadata ───────────────────────────────────────

const KNOWLEDGE_META: Record<string, { label: string; description: string }> = {
  brand_voice:      { label: "Voz de marca",         description: "Tono y estilo de comunicación" },
  channel_affinity: { label: "Canal preferido",       description: "Rendimiento por canal" },
  content_mix:      { label: "Mix de formatos",       description: "Distribución de tipos de contenido" },
  timing:           { label: "Horarios",              description: "Mejores momentos para publicar" },
  approval_signals: { label: "Aprobaciones",          description: "Patrones de aprobación del cliente" },
  creative_style:   { label: "Estilo creativo",       description: "Preferencias visuales y creativas" },
  campaign_pattern: { label: "Patrones de campaña",   description: "Comportamiento histórico de campañas" },
  user_feedback:    { label: "Feedback del cliente",  description: "Decisiones y preferencias explícitas" },
}

// ─── Helpers ──────────────────────────────────────────────────

function confidenceNarrative(pct: number): string {
  if (pct >= 95) return "El sistema está completamente seguro."
  if (pct >= 80) return "Alta confianza — el criterio está consolidado."
  if (pct >= 60) return "Confianza moderada — el sistema sigue aprendiendo."
  if (pct >= 40) return "Evidencia insuficiente — todavía en observación."
  return "Señal débil — no hay información suficiente aún."
}

const STATUS_DOT: Record<string, string> = {
  draft:               "bg-gray-300",
  approved:            "bg-green-500",
  published:           "bg-blue-500",
  rejected:            "bg-red-500",
  needs_changes:       "bg-yellow-500",
  sent_for_approval:   "bg-orange-400",
}

const ASSET_ICON: Record<string, React.ElementType> = {
  post:     Image,
  reel:     Video,
  story:    BookOpen,
  carousel: Layers,
}

const CHANNEL_LABEL: Record<string, string> = {
  instagram: "IG",
  facebook:  "FB",
  tiktok:    "TK",
  youtube:   "YT",
}

function ConfidenceBar({ value, showNarrative = false }: { value: number; showNarrative?: boolean }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-gray-300"
  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className={cn("h-1.5 rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{pct}%</span>
      </div>
      {showNarrative && (
        <p className="text-[11px] text-gray-400 mt-1">{confidenceNarrative(pct)}</p>
      )}
    </div>
  )
}

function Section({
  title, icon: Icon, count, children, defaultOpen = true, accent = false
}: {
  title: string; icon: React.ElementType; count?: number
  children: React.ReactNode; defaultOpen?: boolean; accent?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn("bg-white rounded-2xl border overflow-hidden", accent ? "border-[#FFE600]/40" : "border-gray-100")}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition text-left"
      >
        <Icon size={16} className={accent ? "text-[#FFE600]" : "text-gray-400"} />
        <span className="font-semibold text-gray-800 flex-1">{title}</span>
        {count !== undefined && (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mr-2">
            {count}
          </span>
        )}
        {open ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
      </button>
      {open && <div className="border-t border-gray-50 px-6 py-4">{children}</div>}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="py-8 text-center text-gray-400 text-sm">{label}</div>
}

// ─── Brand Intelligence ───────────────────────────────────────

function BrandIntelligencePanel({
  knowledge,
  activity,
}: {
  knowledge: Knowledge[]
  activity: DomainEvent[]
}) {
  // Separate user_feedback from system knowledge
  const systemKnowledge = knowledge.filter(k => k.memory_type !== "user_feedback")
  const feedbackItems   = knowledge.filter(k => k.memory_type === "user_feedback")

  // Learning events — feedback applied, rec accepted/rejected
  const learningEvents = activity.filter(e =>
    e.event === "memory.feedback_applied" ||
    e.event === "recommendation.accepted" ||
    e.event === "recommendation.rejected"
  ).slice(0, 8)

  if (knowledge.length === 0) {
    return <EmptyState label="No hay conocimiento acumulado todavía. Generá un mes en JClaude para iniciar el aprendizaje." />
  }

  return (
    <div className="space-y-6">

      {/* Knowledge bars */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lo que el sistema sabe</p>
        {systemKnowledge.map(k => {
          const meta = KNOWLEDGE_META[k.memory_type] ?? { label: k.memory_type.replace(/_/g, " "), description: "" }
          const pct  = Math.round(k.confidence * 100)
          const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-gray-300"
          return (
            <div key={k.id}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{meta.description}</span>
                </div>
                <span className="text-sm font-bold text-gray-700 tabular-nums">{pct}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-2 mb-1">
                <div className={cn("h-2 rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[11px] text-gray-400">{confidenceNarrative(pct)}</p>
            </div>
          )
        })}
      </div>

      {/* Client feedback memories */}
      {feedbackItems.length > 0 && (
        <div className="border-t border-gray-50 pt-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Feedback del cliente</p>
          <div className="space-y-2">
            {feedbackItems.map(f => (
              <div key={f.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-0.5">{f.title}</p>
                <p className="text-xs text-amber-700 leading-relaxed">{f.content}</p>
                <p className="text-[10px] text-amber-500 mt-1">
                  {new Date(f.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Timeline */}
      {learningEvents.length > 0 && (
        <div className="border-t border-gray-50 pt-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Historial de aprendizaje</p>
          <div className="space-y-3">
            {learningEvents.map(e => {
              const isAccepted = e.event === "recommendation.accepted"
              const isRejected = e.event === "recommendation.rejected"
              const isFeedback = e.event === "memory.feedback_applied"

              const delta = e.metadata?.confidence_delta as number | undefined
              const types = e.metadata?.knowledge_types_adjusted as string[] | undefined
              const reason = e.metadata?.decision_reason as string | undefined

              let icon = <Minus size={12} className="text-gray-400 shrink-0 mt-0.5" />
              let narrative = ""
              let accentClass = "bg-gray-50 border-gray-100"

              if (isAccepted) {
                icon = <TrendingUp size={12} className="text-green-500 shrink-0 mt-0.5" />
                accentClass = "bg-green-50 border-green-100"
                narrative = "Aceptaste la recomendación — el sistema reforzó este criterio."
              } else if (isRejected) {
                icon = <TrendingDown size={12} className="text-red-400 shrink-0 mt-0.5" />
                accentClass = "bg-red-50 border-red-100"
                narrative = reason
                  ? `Rechazaste la recomendación. Motivo: "${reason}"`
                  : "Rechazaste la recomendación — el sistema ajustó su criterio."
              } else if (isFeedback && delta !== undefined) {
                const up = delta > 0
                icon = up
                  ? <TrendingUp size={12} className="text-green-500 shrink-0 mt-0.5" />
                  : <TrendingDown size={12} className="text-red-400 shrink-0 mt-0.5" />
                accentClass = up ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                const deltaStr = up ? `+${Math.round(delta * 100)}%` : `${Math.round(delta * 100)}%`
                const typesStr = types?.map(t => KNOWLEDGE_META[t]?.label ?? t).join(", ") ?? ""
                narrative = `Confidence de ${typesStr || "conocimiento"} ajustada en ${deltaStr}.`
              }

              if (!narrative) return null

              return (
                <div key={e.id} className={cn("border rounded-xl p-3 flex items-start gap-2", accentClass)}>
                  {icon}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{narrative}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(e.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Recommendation Card ──────────────────────────────────────

function RecommendationCard({
  rec,
  decision,
  workspaceId,
  onUpdated,
}: {
  rec: Recommendation
  decision?: Decision
  workspaceId: string
  onUpdated: (id: string, newStatus: string, reason?: string) => void
}) {
  const [acting, setActing]       = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason]       = useState("")
  const [reasonError, setReasonError] = useState("")
  const [showWhy, setShowWhy]     = useState(false)

  async function act(status: "accepted" | "rejected" | "pending", decision_reason?: string) {
    setActing(true)
    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, decision_reason, workspaceId }),
      })
      if (res.ok) {
        onUpdated(rec.id, status, decision_reason)
        setRejecting(false)
        setReason("")
      }
    } finally {
      setActing(false)
    }
  }

  function handleReject() {
    if (!reason.trim()) { setReasonError("El motivo es obligatorio"); return }
    setReasonError("")
    act("rejected", reason.trim())
  }

  const isDone = rec.status === "accepted" || rec.status === "rejected"
  const supportingKnowledge = (decision?.supporting_knowledge ?? []) as SupportingKnowledge[]

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {rec.action_type.replace(/_/g, " ")}
          </span>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{rec.title}</p>
          <p className="text-sm text-gray-500 mt-1 leading-snug">{rec.body}</p>
          {rec.decision_reason && (
            <p className="text-xs text-gray-400 mt-1 italic">Motivo: {rec.decision_reason}</p>
          )}
        </div>
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize",
          rec.status === "accepted" ? "bg-green-100 text-green-700"
          : rec.status === "rejected" ? "bg-red-100 text-red-600"
          : "bg-yellow-100 text-yellow-700"
        )}>{rec.status}</span>
      </div>

      {rec.action_detail?.confidence !== undefined && (
        <div className="mt-2 mb-1">
          <ConfidenceBar value={rec.action_detail.confidence as number} />
        </div>
      )}

      {/* Why */}
      {decision && (
        <div className="mt-3">
          <button
            onClick={() => setShowWhy(w => !w)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            {showWhy ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            ¿Por qué esta recomendación?
          </button>
          {showWhy && (
            <div className="mt-2 bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs text-gray-600 leading-relaxed">{decision.rationale}</p>
              {supportingKnowledge.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {supportingKnowledge.map((sk, i) => {
                    const meta = KNOWLEDGE_META[sk.type]
                    return (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                        <CheckCircle2 size={11} className="text-green-400 mt-0.5 shrink-0" />
                        <span>
                          <span className="font-medium">{meta?.label ?? sk.title}</span>
                          {" — "}{Math.round(sk.confidence * 100)}% de confianza
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rejection reason input */}
      {rejecting && (
        <div className="mt-3 space-y-2">
          <input
            autoFocus
            value={reason}
            onChange={e => { setReason(e.target.value); setReasonError("") }}
            placeholder="Motivo del rechazo…"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-400"
          />
          {reasonError && <p className="text-xs text-red-500">{reasonError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={acting}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
            >
              {acting ? "…" : "Confirmar rechazo"}
            </button>
            <button
              onClick={() => { setRejecting(false); setReason(""); setReasonError("") }}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-800 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isDone && !rejecting && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => act("accepted")}
            disabled={acting}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition"
          >
            <CheckCircle2 size={12} /> Aceptar
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={acting}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
          >
            <XCircle size={12} /> Rechazar
          </button>
          {rec.status !== "pending" && (
            <button
              onClick={() => act("pending")}
              disabled={acting}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 transition"
            >
              <Clock size={12} /> Pendiente
            </button>
          )}
        </div>
      )}

      {isDone && (
        <button
          onClick={() => act("pending")}
          disabled={acting}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Reabrir como pendiente
        </button>
      )}
    </div>
  )
}

// ─── Types: Strategy ──────────────────────────────────────────

type StrategySignal   = { signal: string; confidence: number; source: string }
type StrategyAction   = { action: string; priority: string; rationale: string }
type StrategyObject   = {
  summary:                  string
  objectives:               string[]
  hypothesis:               string
  strengths:                StrategySignal[]
  risks:                    StrategySignal[]
  expected_outcomes:        string[]
  recommended_next_actions: StrategyAction[]
  confidence:               number
  generated_at:             string
}

// ─── CampaignStrategyPanel ────────────────────────────────────

function CampaignStrategyPanel({
  campaignId, workspaceId,
}: { campaignId: string; workspaceId: string }) {
  const [strategy,   setStrategy]   = useState<StrategyObject | null>(null)
  const [narrative,  setNarrative]  = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)

  // Cargar estrategia guardada al montar
  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/strategy?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(d => {
        setStrategy(d.strategy ?? null)
        setNarrative(d.narrative ?? null)
        setGeneratedAt(d.generated_at ?? null)
      })
      .finally(() => setLoading(false))
  }, [campaignId, workspaceId])

  const generate = async () => {
    setGenerating(true)
    try {
      const res  = await fetch(`/api/campaigns/${campaignId}/strategy`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ workspaceId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error desconocido")
      setStrategy(data.strategy)
      setNarrative(data.narrative)
      setGeneratedAt(data.strategy?.generated_at ?? null)
    } catch (err) {
      console.error("[strategy]", err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="h-24 bg-gray-50 rounded-xl animate-pulse" />
  }

  const confidencePct = strategy ? Math.round(strategy.confidence * 100) : null

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {generatedAt && (
            <span>Generada {new Date(generatedAt).toLocaleDateString("es-AR")}</span>
          )}
          {confidencePct !== null && (
            <span className={cn(
              "font-semibold",
              confidencePct >= 70 ? "text-green-600" : "text-yellow-600"
            )}>· {confidencePct}% confianza</span>
          )}
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition"
        >
          <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
          {strategy ? "Regenerar" : "Generar estrategia"}
        </button>
      </div>

      {!strategy && !generating && (
        <div className="text-sm text-gray-400 py-8 text-center">
          El sistema aún no tiene una estrategia generada para esta campaña.<br />
          Presioná "Generar estrategia" para construirla desde los datos disponibles.
        </div>
      )}

      {generating && (
        <div className="text-sm text-gray-400 py-8 text-center animate-pulse">
          El Strategy Engine está analizando conocimientos, decisiones y recomendaciones…
        </div>
      )}

      {strategy && !generating && (
        <div className="space-y-5">

          {/* Narrativa ejecutiva */}
          {narrative && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
              {narrative}
            </div>
          )}

          {/* Hipótesis */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Hipótesis estratégica</div>
            <p className="text-sm text-gray-600 italic">{strategy.hypothesis}</p>
          </div>

          {/* Fortalezas y Riesgos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-2">
                <Target size={12} /> Fortalezas
              </div>
              <div className="space-y-2">
                {strategy.strengths.length === 0 && (
                  <p className="text-xs text-gray-400">Insuficiente evidencia.</p>
                )}
                {strategy.strengths.map((s, i) => (
                  <div key={i} className="text-xs bg-green-50 border border-green-100 rounded-lg p-2.5">
                    <div className="text-green-800">{s.signal}</div>
                    <div className="text-green-500 mt-1">{Math.round(s.confidence * 100)}% confianza</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 mb-2">
                <ShieldAlert size={12} /> Riesgos
              </div>
              <div className="space-y-2">
                {strategy.risks.length === 0 && (
                  <p className="text-xs text-gray-400">Sin riesgos identificados.</p>
                )}
                {strategy.risks.map((r, i) => (
                  <div key={i} className="text-xs bg-red-50 border border-red-100 rounded-lg p-2.5">
                    <div className="text-red-800">{r.signal}</div>
                    <div className="text-red-400 mt-1">{Math.round(r.confidence * 100)}% confianza</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Próximas acciones */}
          {strategy.recommended_next_actions.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Próximas acciones</div>
              <div className="space-y-2">
                {strategy.recommended_next_actions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm border border-gray-100 rounded-xl p-3">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 shrink-0",
                      a.priority === "high"   ? "bg-red-100 text-red-700"    :
                      a.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-gray-100 text-gray-500"
                    )}>
                      {a.priority === "high" ? "ALTA" : a.priority === "medium" ? "MEDIA" : "BAJA"}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">{a.action}</div>
                      {a.rationale && <div className="text-xs text-gray-400 mt-0.5">{a.rationale}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { workspaceId, campaignId } = useParams<{ workspaceId: string; campaignId: string }>()
  const router = useRouter()
  const [data, setData]       = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [campaignId, workspaceId])

  const handleRecUpdated = useCallback((id: string, newStatus: string, reason?: string) => {
    setData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        recommendations: prev.recommendations.map(r =>
          r.id === id ? { ...r, status: newStatus, decision_reason: reason ?? r.decision_reason } : r
        ),
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!data?.campaign) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          Campaign no encontrada.
        </div>
      </div>
    )
  }

  const { campaign, assets, decisions, knowledge, recommendations, activity } = data

  // Index decisions by id for O(1) lookup in RecommendationCard
  const decisionsById = Object.fromEntries(decisions.map(d => [d.id, d]))

  // Asset stats
  const assetByStatus = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc
  }, {})

  // Intelligence summary — highest and lowest confidence
  const systemKnowledge = knowledge.filter(k => k.memory_type !== "user_feedback")
  const avgConfidence   = systemKnowledge.length
    ? Math.round(systemKnowledge.reduce((s, k) => s + k.confidence, 0) / systemKnowledge.length * 100)
    : 0

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">

      {/* Back */}
      <button
        onClick={() => router.push(`/workspace/${workspaceId}/campaigns`)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition mb-2"
      >
        <ArrowLeft size={14} /> Campaigns
      </button>

      {/* ── Overview ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize",
                campaign.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              )}>{campaign.status}</span>
              {campaign.brands?.name && (
                <span className="text-xs text-gray-400">{campaign.brands.name}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{campaign.name}</h1>
            {campaign.brief?.objective && (
              <p className="text-sm text-gray-500 mt-1">{campaign.brief.objective}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-50 text-sm text-gray-500">
          {campaign.starts_at && (
            <span><span className="text-gray-400">Inicio:</span> {new Date(campaign.starts_at).toLocaleDateString("es-AR")}</span>
          )}
          {campaign.ends_at && (
            <span><span className="text-gray-400">Fin:</span> {new Date(campaign.ends_at).toLocaleDateString("es-AR")}</span>
          )}
          {campaign.brief?.channels && campaign.brief.channels.length > 0 && (
            <span><span className="text-gray-400">Canales:</span> {campaign.brief.channels.join(", ")}</span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: "Assets",        value: assets.length,          color: "text-blue-600"   },
            { label: "Decisions",     value: decisions.length,       color: "text-purple-600" },
            { label: "Recs",          value: recommendations.length, color: "text-green-600"  },
            { label: "Inteligencia",  value: `${avgConfidence}%`,    color: avgConfidence >= 70 ? "text-green-600" : "text-yellow-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className={cn("text-2xl font-bold", color)}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Brand Intelligence ── */}
      <Section title="Brand Intelligence" icon={Brain} count={knowledge.length} defaultOpen={true} accent={true}>
        <BrandIntelligencePanel knowledge={knowledge} activity={activity} />
      </Section>

      {/* ── Campaign Strategy ── */}
      <Section title="Estrategia de Campaña" icon={Map} defaultOpen={true}>
        <CampaignStrategyPanel campaignId={campaignId} workspaceId={workspaceId} />
      </Section>

      {/* ── Recommendations ── */}
      <Section title="Recomendaciones" icon={Lightbulb} count={recommendations.length} defaultOpen={true}>
        {recommendations.length === 0 ? (
          <EmptyState label="No hay recomendaciones todavía. Generá un mes en JClaude para activar el pipeline completo." />
        ) : (
          <div className="space-y-3">
            {recommendations.map(r => (
              <RecommendationCard
                key={r.id}
                rec={r}
                decision={r.decision_id ? decisionsById[r.decision_id] : undefined}
                workspaceId={workspaceId}
                onUpdated={handleRecUpdated}
              />
            ))}
          </div>
        )}
      </Section>

      {/* ── Decisions ── */}
      <Section title="Decisions" icon={Zap} count={decisions.length} defaultOpen={false}>
        {decisions.length === 0 ? (
          <EmptyState label="No hay decisions generadas todavía. Generá un mes en JClaude para activar el Decision Engine." />
        ) : (
          <div className="space-y-4">
            {decisions.map(d => (
              <div key={d.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{d.decision_type}</span>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{d.rationale}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 capitalize",
                    d.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  )}>{d.status}</span>
                </div>
                <ConfidenceBar value={d.confidence} showNarrative />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Assets ── */}
      <Section title="Assets" icon={Layers} count={assets.length} defaultOpen={false}>
        {assets.length === 0 ? <EmptyState label="No hay assets en esta campaign." /> : (
          <div className="space-y-1">
            {Object.entries(assetByStatus).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-50">
                {Object.entries(assetByStatus).map(([status, count]) => (
                  <span key={status} className="flex items-center gap-1.5 text-xs bg-gray-50 px-2.5 py-1 rounded-full text-gray-600">
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[status] ?? "bg-gray-300")} />
                    {status} <span className="font-semibold">{count}</span>
                  </span>
                ))}
              </div>
            )}
            {assets.map(a => {
              const AIcon   = ASSET_ICON[a.asset_type] ?? Image
              const chLabel = CHANNEL_LABEL[a.channel] ?? a.channel.slice(0,2).toUpperCase()
              return (
                <div key={a.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-1.5 shrink-0 w-24">
                    <span className="text-[10px] font-bold text-gray-400">{chLabel}</span>
                    <AIcon size={13} className="text-gray-400" />
                    <span className="text-[10px] text-gray-400 capitalize">{a.asset_type}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug line-clamp-2">{a.caption ?? "—"}</p>
                    {a.scheduled_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(a.scheduled_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className={cn("w-1.5 h-1.5 rounded-full", STATUS_DOT[a.status] ?? "bg-gray-300")} />
                    <span className="text-[10px] text-gray-400 capitalize">{a.status}</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      {/* ── Activity ── */}
      <Section title="Activity" icon={Activity} count={activity.length} defaultOpen={false}>
        {activity.length === 0 ? <EmptyState label="Sin actividad registrada." /> : (
          <div className="space-y-1">
            {activity.map(e => {
              const Icon = e.event.includes("fail")    ? XCircle
                : e.event.includes("complet")          ? CheckCircle2
                : e.event.includes("feedback_applied") ? Brain
                : e.event.includes("start")            ? Clock
                : AlertCircle
              return (
                <div key={e.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <Icon size={14} className={cn(
                    "mt-0.5 shrink-0",
                    e.event.includes("fail")            ? "text-red-400"
                    : e.event.includes("complet")       ? "text-green-500"
                    : e.event.includes("accepted")      ? "text-green-500"
                    : e.event.includes("rejected")      ? "text-red-400"
                    : e.event.includes("feedback")      ? "text-purple-400"
                    : "text-gray-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 font-medium">{e.event.replace(/\./g, " → ")}</span>
                    <span className="text-xs text-gray-400 ml-2 capitalize">{e.actor_type}</span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(e.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Section>

    </div>
  )
}
