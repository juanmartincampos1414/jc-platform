"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  BrainCircuit, RefreshCw, TrendingUp, TrendingDown, Minus,
  ShieldAlert, Zap, Clock, ChevronDown, ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExecutiveObject } from "@/lib/executive/engine"

// ─── Helpers ──────────────────────────────────────────────────

function confidenceColor(c: number) {
  if (c >= 0.75) return "text-green-600"
  if (c >= 0.50) return "text-yellow-600"
  return "text-red-500"
}

function trendIcon(trend: ExecutiveObject["delta"]["confidence_trend"]) {
  if (trend === "up")   return <TrendingUp  size={14} className="text-green-500" />
  if (trend === "down") return <TrendingDown size={14} className="text-red-500"  />
  return <Minus size={14} className="text-gray-400" />
}

function urgencyLabel(u: string) {
  if (u === "this_week")     return { label: "Esta semana",    cls: "bg-red-100 text-red-700"    }
  if (u === "this_month")    return { label: "Este mes",       cls: "bg-yellow-100 text-yellow-700" }
  return                            { label: "Próximo trimestre", cls: "bg-gray-100 text-gray-500"  }
}

// ─── Question block ────────────────────────────────────────────

function Question({
  number, question, answer, accent = false,
}: { number: string; question: string; answer: string; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-2xl border p-5",
      accent ? "border-[#FFE600]/30 bg-[#FFFDE7]" : "border-gray-100 bg-white"
    )}>
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-bold text-gray-300 mt-0.5 shrink-0 w-4">{number}</span>
        <div>
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{question}</div>
          <p className="text-sm text-gray-800 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Evidence drawer ───────────────────────────────────────────

function EvidenceDrawer({ evidence }: { evidence: ExecutiveObject["evidence_used"] }) {
  const [open, setOpen] = useState(false)
  if (evidence.length === 0) return null
  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm text-gray-500 hover:text-gray-700 transition"
      >
        <span className="font-medium">Evidencia usada ({evidence.length} fuentes)</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="border-t border-gray-50 px-5 py-4 space-y-2">
          {evidence.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <span className={cn(
                "px-1.5 py-0.5 rounded-full font-semibold",
                e.type === "campaign_strategy" ? "bg-blue-50 text-blue-600"    :
                e.type === "memory"            ? "bg-purple-50 text-purple-600" :
                                                 "bg-green-50 text-green-600"
              )}>
                {e.type === "campaign_strategy" ? "Estrategia" :
                 e.type === "memory"            ? "Conocimiento" : "Recomendación"}
              </span>
              <span>{e.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function ExecutivePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [snapshot,     setSnapshot]     = useState<ExecutiveObject | null>(null)
  const [narrative,    setNarrative]    = useState<string | null>(null)
  const [generatedAt,  setGeneratedAt]  = useState<string | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [generating,   setGenerating]   = useState(false)

  // Carga snapshot persistido al montar (no recalcula — Refresh Strategy: Cached)
  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}/executive`)
      .then(r => r.json())
      .then(d => {
        setSnapshot(d.snapshot ?? null)
        setNarrative(d.narrative ?? null)
        setGeneratedAt(d.generated_at ?? null)
      })
      .finally(() => setLoading(false))
  }, [workspaceId])

  const generate = async () => {
    setGenerating(true)
    try {
      const res  = await fetch(`/api/workspaces/${workspaceId}/executive`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setSnapshot(data.snapshot)
      setNarrative(data.narrative)
      setGeneratedAt(data.snapshot?.generated_at ?? null)
    } catch (err) {
      console.error("[executive]", err)
    } finally {
      setGenerating(false)
    }
  }

  // Extraer las 5 respuestas de la narrativa (5 párrafos separados por \n\n)
  const paragraphs = narrative
    ? narrative.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    : []

  const Q = [
    "¿Qué está pasando?",
    "¿Por qué está pasando?",
    "¿Qué cambió desde la última vez?",
    "¿Qué riesgo merece atención?",
    "¿Cuál es la decisión más importante esta semana?",
  ]

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-gray-400" />
          <h1 className="text-lg font-bold text-gray-900">Executive Intelligence</h1>
        </div>
        <div className="flex items-center gap-3">
          {generatedAt && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={11} />
              {new Date(generatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
            </span>
          )}
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition"
          >
            <RefreshCw size={11} className={generating ? "animate-spin" : ""} />
            {snapshot ? "Actualizar" : "Generar"}
          </button>
        </div>
      </div>

      {/* KPI strip */}
      {snapshot && (
        <div className="flex gap-3 bg-white border border-gray-100 rounded-2xl px-5 py-3">
          <div className="flex-1 text-center">
            <div className={cn("text-xl font-bold", confidenceColor(snapshot.confidence))}>
              {Math.round(snapshot.confidence * 100)}%
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Confianza del sistema</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-gray-900">{snapshot.status.active_campaigns}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Campañas activas</div>
          </div>
          <div className="w-px bg-gray-100" />
          <div className="flex-1 text-center">
            <div className="text-xl font-bold text-orange-500">{snapshot.status.pending_actions}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Acciones pendientes</div>
          </div>
          {snapshot.delta.has_previous && (
            <>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 flex flex-col items-center justify-center gap-0.5">
                {trendIcon(snapshot.delta.confidence_trend)}
                <div className="text-[10px] text-gray-400">vs anterior</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Sin snapshot */}
      {!snapshot && !generating && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm">
          No hay análisis ejecutivo generado todavía.<br />
          Presioná "Generar" para construirlo desde los datos disponibles.
        </div>
      )}

      {/* Generando */}
      {generating && (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 text-sm animate-pulse">
          El Executive Engine está analizando campañas, conocimientos y recomendaciones…
        </div>
      )}

      {/* Las 5 preguntas */}
      {snapshot && narrative && !generating && (
        <>
          {Q.map((q, i) => (
            <Question
              key={i}
              number={`${i + 1}`}
              question={q}
              answer={paragraphs[i] ?? "—"}
              accent={i === 4}
            />
          ))}

          {/* Decisión recomendada — detalle estructurado */}
          {snapshot.recommended_decision && (
            <div className="border border-[#FFE600]/40 bg-[#FFFDE7] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <Zap size={12} className="text-yellow-500" />
                  Decisión recomendada
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  urgencyLabel(snapshot.recommended_decision.urgency).cls
                )}>
                  {urgencyLabel(snapshot.recommended_decision.urgency).label}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {snapshot.recommended_decision.decision}
              </p>
              {snapshot.recommended_decision.expected_impact && (
                <p className="text-xs text-gray-500">
                  Impacto esperado: {snapshot.recommended_decision.expected_impact}
                </p>
              )}
            </div>
          )}

          {/* Riesgo principal */}
          {snapshot.top_risk && (
            <div className="border border-red-100 bg-red-50 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-red-700 mb-0.5">Riesgo principal</div>
                <p className="text-sm text-red-800">{snapshot.top_risk.signal}</p>
                <p className="text-xs text-red-500 mt-1">{snapshot.top_risk.source_campaign} · {Math.round(snapshot.top_risk.confidence * 100)}% confianza</p>
              </div>
            </div>
          )}

          {/* Evidencia */}
          <EvidenceDrawer evidence={snapshot.evidence_used} />
        </>
      )}

    </div>
  )
}
