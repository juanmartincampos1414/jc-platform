"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Shield, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle, Info } from "lucide-react"

type AutonomyPolicy = {
  level:   0 | 1 | 2 | 3
  class_a: 0 | 1 | 2 | 3
  class_b: 0 | 1 | 2 | 3
  class_c: 0 | 1 | 2 | 3
}

type AuditAction = {
  id:              string
  action_type:     string
  action_class:    string
  entity_type:     string
  entity_id:       string
  confidence:      number | null
  policy_level:    number
  policy_snapshot: AutonomyPolicy
  payload:         Record<string, unknown>
  result:          "executed" | "failed" | "reverted"
  error_message:   string | null
  reverted_at:     string | null
  triggered_by:    string
  created_at:      string
}

const LEVEL_LABELS: Record<number, string> = {
  0: "Solo observación",
  1: "Solo recomendaciones",
  2: "Requiere aprobación",
  3: "Autónomo",
}

const LEVEL_COLORS: Record<number, string> = {
  0: "text-white/40",
  1: "text-blue-400",
  2: "text-yellow-400",
  3: "text-green-400",
}

function ResultIcon({ result }: { result: string }) {
  if (result === "executed") return <CheckCircle size={14} className="text-green-400 shrink-0" />
  if (result === "failed")   return <XCircle size={14} className="text-red-400 shrink-0" />
  return <RotateCcw size={14} className="text-yellow-400 shrink-0" />
}

function PolicyLevelSelector({
  label, value, onChange, locked,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  locked?: boolean
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/70">{label}</span>
        <span className={`text-xs font-semibold ${LEVEL_COLORS[value]}`}>
          Nivel {value} — {LEVEL_LABELS[value]}
        </span>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(level => {
          const isDisabled = locked && level === 3
          return (
            <button
              key={level}
              onClick={() => !isDisabled && onChange(level)}
              disabled={isDisabled}
              className={`
                flex-1 py-1.5 rounded text-xs font-semibold transition
                ${value === level
                  ? "bg-[#FFE600] text-[#0A0A0A]"
                  : isDisabled
                    ? "bg-white/5 text-white/20 cursor-not-allowed"
                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
                }
              `}
            >
              {level}
            </button>
          )
        })}
      </div>
      {locked && (
        <p className="text-[10px] text-yellow-400/60 flex items-center gap-1">
          <AlertTriangle size={10} />
          Clase C no puede ser Autónoma — riesgo alto
        </p>
      )}
    </div>
  )
}

function formatActionType(type: string): string {
  const map: Record<string, string> = {
    "auto-schedule-approved-asset":         "Programación automática",
    "revert:auto-schedule-approved-asset":  "Revertir programación",
  }
  return map[type] ?? type
}

export default function AutonomyPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [policy, setPolicy]     = useState<AutonomyPolicy | null>(null)
  const [draft, setDraft]       = useState<AutonomyPolicy | null>(null)
  const [actions, setActions]   = useState<AuditAction[]>([])
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [reverting, setReverting] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/autonomy/policy?workspaceId=${workspaceId}`).then(r => r.json()),
      fetch(`/api/autonomy/actions?workspaceId=${workspaceId}`).then(r => r.json()),
    ]).then(([policyRes, actionsRes]) => {
      if (policyRes.policy) {
        setPolicy(policyRes.policy)
        setDraft(policyRes.policy)
      }
      if (actionsRes.actions) {
        setActions(actionsRes.actions)
      }
    }).finally(() => setLoading(false))
  }, [workspaceId])

  async function savePolicy() {
    if (!draft) return
    setSaving(true)
    const res = await fetch("/api/autonomy/policy", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ workspaceId, policy: draft }),
    })
    const data = await res.json()
    if (data.success) {
      setPolicy(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  async function revertAction(actionId: string) {
    setReverting(actionId)
    const res = await fetch(`/api/autonomy/actions/${actionId}/revert`, { method: "POST" })
    if (res.ok) {
      setActions(prev => prev.map(a =>
        a.id === actionId ? { ...a, result: "reverted", reverted_at: new Date().toISOString() } : a
      ))
    }
    setReverting(null)
  }

  const isDirty = draft && policy && JSON.stringify(draft) !== JSON.stringify(policy)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#FFE600]/10 flex items-center justify-center shrink-0">
          <Shield size={20} className="text-[#FFE600]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Política de Autonomía</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Define hasta dónde el sistema puede actuar por su cuenta en este workspace.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm text-white/60 space-y-1">
          <p>Toda acción autónoma requiere tres condiciones: <span className="text-white/80">confidence suficiente</span>, <span className="text-white/80">política habilitada</span> y <span className="text-white/80">clase de acción autorizada</span>.</p>
          <p>Esta página controla la segunda condición. La autoridad siempre pertenece al cliente.</p>
        </div>
      </div>

      {/* Policy config */}
      {draft && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Configuración de política</h2>
          </div>
          <div className="px-5 py-5 space-y-5">
            <PolicyLevelSelector
              label="Nivel global"
              value={draft.level}
              onChange={v => setDraft(d => d ? { ...d, level: v as 0|1|2|3 } : d)}
            />
            <div className="border-t border-white/5 pt-4 space-y-4">
              <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">Nivel por clase de acción</p>
              <PolicyLevelSelector
                label="Clase A — Bajo riesgo (programar publicaciones, actualizar borradores)"
                value={draft.class_a}
                onChange={v => setDraft(d => d ? { ...d, class_a: v as 0|1|2|3 } : d)}
              />
              <PolicyLevelSelector
                label="Clase B — Riesgo medio (publicar automáticamente, aprobar assets)"
                value={draft.class_b}
                onChange={v => setDraft(d => d ? { ...d, class_b: v as 0|1|2|3 } : d)}
              />
              <PolicyLevelSelector
                label="Clase C — Riesgo alto (presupuestos, campañas, comunicaciones masivas)"
                value={draft.class_c}
                onChange={v => setDraft(d => d ? { ...d, class_c: v as 0|1|2|3 } : d)}
                locked
              />
            </div>
          </div>
          <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-white/30">
              {saved ? (
                <span className="text-green-400">Política guardada</span>
              ) : isDirty ? (
                <span className="text-yellow-400">Cambios sin guardar</span>
              ) : (
                "Sin cambios pendientes"
              )}
            </div>
            <button
              onClick={savePolicy}
              disabled={!isDirty || saving}
              className="px-4 py-2 rounded-lg bg-[#FFE600] text-[#0A0A0A] text-sm font-bold disabled:opacity-40 transition"
            >
              {saving ? "Guardando..." : "Guardar política"}
            </button>
          </div>
        </div>
      )}

      {/* Audit trail */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Historial de acciones autónomas</h2>
          <span className="text-xs text-white/30">{actions.length} registro{actions.length !== 1 ? "s" : ""}</span>
        </div>

        {actions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Clock size={24} className="text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30">Todavía no hay acciones autónomas registradas.</p>
            <p className="text-xs text-white/20 mt-1">
              Cuando el sistema ejecute su primera acción aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {actions.map(action => (
              <div key={action.id} className="px-5 py-4 flex items-start gap-3">
                <div className="mt-0.5"><ResultIcon result={action.result} /></div>
                <div className="flex-1 min-w-0">
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
                  <div className="mt-1 text-xs text-white/40 space-y-0.5">
                    <div>
                      Política nivel {action.policy_level} · {action.entity_type} ·{" "}
                      {new Date(action.created_at).toLocaleString("es-AR", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                    {action.payload?.before != null && action.payload?.after != null && (
                      <div className="text-white/30">
                        {String(JSON.stringify(action.payload.before))} → {String(JSON.stringify(action.payload.after))}
                      </div>
                    )}
                    {action.reverted_at && (
                      <div className="text-yellow-400/60">
                        Revertido el {new Date(action.reverted_at).toLocaleString("es-AR", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {action.result === "executed" && (
                  <button
                    onClick={() => revertAction(action.id)}
                    disabled={reverting === action.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white hover:border-white/20 transition disabled:opacity-40"
                  >
                    <RotateCcw size={12} />
                    {reverting === action.id ? "Revirtiendo..." : "Revertir"}
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
