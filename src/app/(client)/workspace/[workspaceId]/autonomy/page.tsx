"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  Shield, RotateCcw, CheckCircle, XCircle, Clock,
  AlertTriangle, Info, ChevronRight, AlertCircle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type PolicyLevel = 0 | 1 | 2 | 3

type AutonomyPolicy = {
  level:   PolicyLevel
  class_a: PolicyLevel
  class_b: PolicyLevel
  class_c: PolicyLevel
}

type AuditAction = {
  id:              string
  action_type:     string
  action_class:    string
  entity_type:     string
  entity_id:       string
  confidence:      number | null
  policy_level:    number
  payload:         Record<string, unknown>
  result:          "executed" | "failed" | "reverted"
  reverted_at:     string | null
  created_at:      string
}

const DEFAULT_POLICY: AutonomyPolicy = { level: 1, class_a: 1, class_b: 1, class_c: 0 }

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_META: Record<PolicyLevel, { label: string; color: string; bg: string }> = {
  0: { label: "Solo observación",      color: "text-white/40",  bg: "bg-white/5"       },
  1: { label: "Recomendaciones",        color: "text-blue-400",  bg: "bg-blue-500/10"   },
  2: { label: "Requiere aprobación",    color: "text-yellow-400",bg: "bg-yellow-500/10" },
  3: { label: "Autónomo",               color: "text-green-400", bg: "bg-green-500/10"  },
}

const CLASS_META: Record<"A" | "B" | "C", { label: string; desc: string; locked?: boolean }> = {
  A: { label: "Clase A",  desc: "Bajo riesgo · programar publicaciones, actualizar borradores" },
  B: { label: "Clase B",  desc: "Riesgo medio · publicar automáticamente, aprobar assets" },
  C: { label: "Clase C",  desc: "Riesgo alto · presupuestos, campañas, comunicaciones masivas", locked: true },
}

function formatActionType(type: string): string {
  const map: Record<string, string> = {
    "auto-schedule-approved-asset":        "Programación automática de asset",
    "revert:auto-schedule-approved-asset": "Reversión de programación",
  }
  return map[type] ?? type
}

// ─── PolicyLevelSelector ──────────────────────────────────────────────────────

function PolicyLevelSelector({
  classKey, value, onChange,
}: {
  classKey: "global" | "A" | "B" | "C"
  value: PolicyLevel
  onChange: (v: PolicyLevel) => void
}) {
  const locked = classKey === "C"
  const meta   = classKey === "global" ? null : CLASS_META[classKey as "A" | "B" | "C"]
  const active = LEVEL_META[value]

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 space-y-3">
      {/* Class header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">
            {classKey === "global" ? "Nivel global" : meta?.label}
          </p>
          {meta && (
            <p className="text-xs text-white/40 mt-0.5">{meta.desc}</p>
          )}
        </div>
        <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${active.bg} ${active.color}`}>
          {active.label}
        </span>
      </div>

      {/* Level buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {([0, 1, 2, 3] as PolicyLevel[]).map(level => {
          const isLocked   = locked && level === 3
          const isSelected = value === level
          const m          = LEVEL_META[level]
          return (
            <button
              key={level}
              onClick={() => !isLocked && onChange(level)}
              disabled={isLocked}
              title={isLocked ? "Clase C nunca puede ser Autónoma" : m.label}
              className={`
                py-2 rounded-lg text-xs font-bold transition
                ${isSelected
                  ? `${m.bg} ${m.color} ring-1 ring-inset ring-white/20`
                  : isLocked
                    ? "bg-white/[0.02] text-white/15 cursor-not-allowed"
                    : "bg-white/[0.04] text-white/30 hover:bg-white/10 hover:text-white/60"
                }
              `}
            >
              {level}
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-4 gap-1.5 px-0.5">
        {([0, 1, 2, 3] as PolicyLevel[]).map(level => (
          <p key={level} className="text-[9px] text-white/20 text-center leading-tight">
            {LEVEL_META[level].label}
          </p>
        ))}
      </div>

      {locked && (
        <div className="flex items-center gap-1.5 text-[11px] text-yellow-400/70">
          <AlertTriangle size={11} />
          Clase C no puede ser Autónoma — riesgo alto
        </div>
      )}
    </div>
  )
}

// ─── ResultIcon ───────────────────────────────────────────────────────────────

function ResultIcon({ result }: { result: string }) {
  if (result === "executed") return <CheckCircle size={14} className="text-green-400 shrink-0" />
  if (result === "failed")   return <XCircle     size={14} className="text-red-400 shrink-0"   />
  return <RotateCcw size={14} className="text-yellow-400 shrink-0" />
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AutonomyPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [policy,    setPolicy]    = useState<AutonomyPolicy>(DEFAULT_POLICY)
  const [draft,     setDraft]     = useState<AutonomyPolicy>(DEFAULT_POLICY)
  const [actions,   setActions]   = useState<AuditAction[]>([])
  const [saving,    setSaving]    = useState(false)
  const [saveMsg,   setSaveMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [reverting, setReverting] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [loadErr,   setLoadErr]   = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/autonomy/policy?workspaceId=${workspaceId}`).then(r => r.json()),
      fetch(`/api/autonomy/actions?workspaceId=${workspaceId}`).then(r => r.json()),
    ]).then(([policyRes, actionsRes]) => {
      if (policyRes.error) {
        setLoadErr(`No se pudo cargar la política: ${policyRes.error}`)
      } else if (policyRes.policy) {
        setPolicy(policyRes.policy)
        setDraft(policyRes.policy)
      }
      if (actionsRes.actions) {
        setActions(actionsRes.actions)
      }
    }).catch(err => {
      setLoadErr(`Error de red: ${err.message}`)
    }).finally(() => setLoading(false))
  }, [workspaceId])

  async function savePolicy() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res  = await fetch("/api/autonomy/policy", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ workspaceId, policy: draft }),
      })
      const data = await res.json()
      if (data.success) {
        setPolicy(draft)
        setSaveMsg({ ok: true, text: "Política guardada" })
        setTimeout(() => setSaveMsg(null), 4000)
      } else {
        setSaveMsg({ ok: false, text: data.error ?? "No se pudo guardar" })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de red"
      setSaveMsg({ ok: false, text: msg })
    } finally {
      setSaving(false)
    }
  }

  async function revertAction(actionId: string) {
    setReverting(actionId)
    try {
      const res = await fetch(`/api/autonomy/actions/${actionId}/revert`, { method: "POST" })
      if (res.ok) {
        setActions(prev => prev.map(a =>
          a.id === actionId
            ? { ...a, result: "reverted" as const, reverted_at: new Date().toISOString() }
            : a
        ))
      }
    } finally {
      setReverting(null)
    }
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(policy)

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#FFE600]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Shield size={20} className="text-[#FFE600]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Política de Autonomía</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Define hasta dónde puede actuar el sistema en este workspace.
          </p>
        </div>
      </div>

      {/* ── Load error ── */}
      {loadErr && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Error al cargar la política</p>
            <p className="text-xs text-white/50 mt-0.5">{loadErr}</p>
            <p className="text-xs text-white/30 mt-1">
              Si la migración 013 no fue aplicada todavía, la columna{" "}
              <code className="text-white/50">autonomy_policy</code> no existe en la DB.
            </p>
          </div>
        </div>
      )}

      {/* ── Info banner ── */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-white/60 space-y-1">
          <p>
            Toda acción autónoma requiere{" "}
            <span className="text-white/80">tres condiciones simultáneas</span>:{" "}
            confidence suficiente, política habilitada y clase autorizada.
          </p>
          <p className="text-xs text-white/40">
            Esta página controla la segunda condición. La autoridad siempre pertenece al cliente.
          </p>
        </div>
      </div>

      {/* ── Policy config ── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white">Configuración de política</h2>
          <p className="text-xs text-white/30 mt-0.5">
            Los cambios no tienen efecto hasta presionar "Guardar".
          </p>
        </div>

        <div className="px-5 py-5 space-y-3">
          <PolicyLevelSelector
            classKey="global"
            value={draft.level}
            onChange={v => setDraft(d => ({ ...d, level: v }))}
          />

          <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-white/5" />
            <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold">
              Override por clase de acción
            </p>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <PolicyLevelSelector
            classKey="A"
            value={draft.class_a}
            onChange={v => setDraft(d => ({ ...d, class_a: v }))}
          />
          <PolicyLevelSelector
            classKey="B"
            value={draft.class_b}
            onChange={v => setDraft(d => ({ ...d, class_b: v }))}
          />
          <PolicyLevelSelector
            classKey="C"
            value={draft.class_c}
            onChange={v => setDraft(d => ({ ...d, class_c: v }))}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
          <div className="text-xs min-w-0">
            {saveMsg ? (
              <span className={saveMsg.ok ? "text-green-400" : "text-red-400"}>
                {saveMsg.ok ? "✓ " : "✗ "}{saveMsg.text}
              </span>
            ) : isDirty ? (
              <span className="text-yellow-400">Cambios sin guardar</span>
            ) : (
              <span className="text-white/20">Sin cambios pendientes</span>
            )}
          </div>
          <button
            onClick={savePolicy}
            disabled={!isDirty || saving}
            className="shrink-0 px-5 py-2 rounded-lg bg-[#FFE600] text-[#0A0A0A] text-sm font-bold disabled:opacity-30 transition hover:bg-yellow-300"
          >
            {saving ? "Guardando…" : "Guardar política"}
          </button>
        </div>
      </div>

      {/* ── Audit trail ── */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Historial de acciones autónomas</h2>
          <span className="text-xs text-white/30">
            {actions.length} registro{actions.length !== 1 ? "s" : ""}
          </span>
        </div>

        {actions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Clock size={28} className="text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/30">No hay acciones autónomas registradas.</p>
            <p className="text-xs text-white/20 mt-1">
              Configura Clase A en nivel 3 y aprueba un asset con fecha futura para ver la primera.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {actions.map(action => (
              <div key={action.id} className="px-5 py-4 flex items-start gap-3">
                <div className="mt-0.5">
                  <ResultIcon result={action.result} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {formatActionType(action.action_type)}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                      Clase {action.action_class}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      action.result === "executed" ? "bg-green-500/10 text-green-400" :
                      action.result === "reverted" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {action.result === "executed" ? "Ejecutado" :
                       action.result === "reverted" ? "Revertido" : "Fallido"}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-white/30 flex-wrap">
                    <span>Política nivel {action.policy_level}</span>
                    <ChevronRight size={10} className="text-white/15" />
                    <span>{action.entity_type}</span>
                    <ChevronRight size={10} className="text-white/15" />
                    <span>
                      {new Date(action.created_at).toLocaleString("es-AR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    {action.confidence != null && (
                      <>
                        <ChevronRight size={10} className="text-white/15" />
                        <span>conf. {Math.round(action.confidence * 100)}%</span>
                      </>
                    )}
                  </div>

                  {/* Payload */}
                  {action.payload?.before != null && action.payload?.after != null && (
                    <div className="text-xs text-white/25 font-mono">
                      {String(JSON.stringify(action.payload.before))}
                      {" → "}
                      {String(JSON.stringify(action.payload.after))}
                    </div>
                  )}

                  {/* Reverted at */}
                  {action.reverted_at && (
                    <div className="text-xs text-yellow-400/60 flex items-center gap-1">
                      <RotateCcw size={10} />
                      Revertido el {new Date(action.reverted_at).toLocaleString("es-AR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  )}
                </div>

                {/* Revert button */}
                {action.result === "executed" && (
                  <button
                    onClick={() => revertAction(action.id)}
                    disabled={reverting === action.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition disabled:opacity-40"
                  >
                    <RotateCcw size={12} />
                    {reverting === action.id ? "Revirtiendo…" : "Revertir"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
