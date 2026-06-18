"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Link, CheckCircle, AlertCircle, ExternalLink, Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Platform = "meta" | "google" | "tiktok"

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; bg: string; textColor: string }> = {
  meta: { label: "Meta Ads", color: "from-blue-600 to-blue-700", bg: "bg-blue-50", textColor: "text-blue-700" },
  google: { label: "Google Ads", color: "from-green-500 to-blue-500", bg: "bg-green-50", textColor: "text-green-700" },
  tiktok: { label: "TikTok Ads", color: "from-gray-900 to-gray-700", bg: "bg-gray-100", textColor: "text-gray-700" },
}

const MOCK_ACCOUNTS = [
  { id: "1", platform: "meta" as Platform, name: "Cuenta Meta — Principal", accountId: "act_1234567890", connected: true, monthlyBudget: 150000 },
  { id: "2", platform: "google" as Platform, name: "Google Ads — Marca", accountId: "123-456-7890", connected: true, monthlyBudget: 80000 },
  { id: "3", platform: "tiktok" as Platform, name: "TikTok Ads", accountId: "TK_98765", connected: false, monthlyBudget: 50000 },
]

const MOCK_METRICS = {
  meta: { spend: 112400, budget: 150000, impressions: 845200, clicks: 12340, ctr: 1.46, conversions: 234, cpa: 480, roas: 4.2 },
  google: { spend: 67300, budget: 80000, impressions: 320000, clicks: 9800, ctr: 3.06, conversions: 189, cpa: 356, roas: 5.8 },
  tiktok: { spend: 0, budget: 50000, impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0 },
}

const MOCK_CAMPAIGNS = [
  { id: "1", platform: "meta" as Platform, name: "Campaña Verano — Conversiones", status: "active", spend: 45200, budget: 60000, roas: 4.8, cpa: 420 },
  { id: "2", platform: "meta" as Platform, name: "Retargeting — Carritos abandonados", status: "active", spend: 38100, budget: 50000, roas: 6.2, cpa: 290 },
  { id: "3", platform: "meta" as Platform, name: "Awareness — Nueva colección", status: "paused", spend: 29100, budget: 40000, roas: 2.1, cpa: 680 },
  { id: "4", platform: "google" as Platform, name: "Search — Marca", status: "active", spend: 34200, budget: 40000, roas: 7.1, cpa: 180 },
  { id: "5", platform: "google" as Platform, name: "Shopping — Catálogo", status: "active", spend: 33100, budget: 40000, roas: 4.5, cpa: 520 },
]

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
}

function MetricCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-xl font-black text-[#0A0A0A]">{value}</p>
        {trend && (
          trend === "up"
            ? <TrendingUp size={14} className="text-green-500 mb-0.5" />
            : <TrendingDown size={14} className="text-red-500 mb-0.5" />
        )}
      </div>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AdsPage() {
  const [activePlatform, setActivePlatform] = useState<Platform>("meta")
  const metrics = MOCK_METRICS[activePlatform]
  const account = MOCK_ACCOUNTS.find(a => a.platform === activePlatform)!
  const campaigns = MOCK_CAMPAIGNS.filter(c => c.platform === activePlatform)
  const pct = metrics.budget > 0 ? Math.round((metrics.spend / metrics.budget) * 100) : 0

  const [aiLoading, setAiLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string; score: number; highlights: string[]; warnings: string[];
    recommendations: { priority: string; action: string; expected_impact: string }[]
  } | null>(null)

  async function analyzeAds() {
    setAiLoading(true)
    setAiAnalysis(null)
    try {
      const res = await fetch("/api/ai/ads-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: activePlatform,
          month: "Junio 2025",
          budget: { approved: metrics.budget, executed: metrics.spend },
          metrics,
          campaigns,
        })
      })
      const data = await res.json()
      setAiAnalysis(data)
    } catch {
      toast.error("Error analizando con IA")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">Publicidad Digital</p>
          <h1 className="text-2xl font-black text-[#0A0A0A]">Resultados de Ads</h1>
          <p className="text-gray-400 text-sm mt-1">Junio 2025 · Actualizado hace 2 horas</p>
        </div>
        <button
          onClick={analyzeAds}
          disabled={aiLoading || !account.connected}
          className="flex items-center gap-2 bg-[#0A0A0A] text-white font-bold rounded-xl px-4 py-2.5 text-sm hover:bg-black transition disabled:opacity-40"
        >
          {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} className="text-[#FFE600]" />}
          {aiLoading ? "Analizando..." : "Analizar con IA"}
        </button>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {MOCK_ACCOUNTS.map(acc => {
          const cfg = PLATFORM_CONFIG[acc.platform]
          return (
            <button
              key={acc.platform}
              onClick={() => setActivePlatform(acc.platform)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition font-bold text-sm ${
                activePlatform === acc.platform
                  ? "border-[#FFE600] bg-[#FFE600]/10 text-[#0A0A0A]"
                  : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
              }`}
            >
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                <span className="text-white text-[9px] font-black">{acc.platform.slice(0,2).toUpperCase()}</span>
              </div>
              {cfg.label}
              {acc.connected
                ? <CheckCircle size={13} className="text-green-500" />
                : <AlertCircle size={13} className="text-amber-500" />}
            </button>
          )
        })}
      </div>

      {/* Account info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-[#0A0A0A]">{account.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">ID: {account.accountId}</p>
        </div>
        <div className="flex items-center gap-3">
          {account.connected ? (
            <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Conectado
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
              <AlertCircle size={12} />
              Sin conectar
            </div>
          )}
          <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
            <ExternalLink size={11} /> Abrir plataforma
          </button>
        </div>
      </div>

      {!account.connected ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <Link className="mx-auto text-amber-500 mb-3" size={32} />
          <h3 className="font-black text-[#0A0A0A] mb-2">Cuenta no conectada</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">Esta cuenta publicitaria aún no está vinculada. Tu equipo de JC AIgency la va a conectar próximamente.</p>
        </div>
      ) : (
        <>
          {/* Budget progress */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-0.5">Inversión del mes</p>
                <p className="font-black text-xl text-[#0A0A0A]">{formatARS(metrics.spend)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Presupuesto aprobado</p>
                <p className="font-bold text-sm text-gray-600">{formatARS(metrics.budget)}</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FFE600] transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <p className="text-xs text-gray-400">{pct}% ejecutado</p>
              <p className="text-xs text-gray-400">Quedan {formatARS(metrics.budget - metrics.spend)}</p>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Impresiones" value={metrics.impressions.toLocaleString("es-AR")} trend="up" />
            <MetricCard label="Clics" value={metrics.clicks.toLocaleString("es-AR")} sub={`CTR ${metrics.ctr}%`} trend="up" />
            <MetricCard label="Conversiones" value={metrics.conversions.toString()} sub={`CPA ${formatARS(metrics.cpa)}`} trend="up" />
            <MetricCard label="ROAS" value={`${metrics.roas}x`} sub="Retorno sobre inversión" trend="up" />
          </div>

          {/* Campaigns table */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-black text-sm text-[#0A0A0A]">Campañas activas</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {campaigns.map(c => {
                const cpct = c.budget > 0 ? Math.round((c.spend / c.budget) * 100) : 0
                return (
                  <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#0A0A0A] truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatARS(c.spend)} / {formatARS(c.budget)}</p>
                    </div>
                    <div className="w-20 hidden sm:block">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-[#FFE600]" style={{ width: `${Math.min(cpct, 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 text-center">{cpct}%</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[#0A0A0A]">{c.roas}x ROAS</p>
                      <p className="text-xs text-gray-400">CPA {formatARS(c.cpa)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {c.status === "active" ? "Activa" : "Pausada"}
                    </span>
                  </div>
                )
              })}
              {campaigns.length === 0 && (
                <div className="px-5 py-10 text-center text-gray-400 text-sm">Sin campañas en esta plataforma</div>
              )}
            </div>
          </div>
          {/* AI Analysis panel */}
          {aiAnalysis && (
            <div className="mt-6 border-2 border-[#FFE600] rounded-2xl overflow-hidden">
              <div className="bg-[#0A0A0A] px-5 py-4 flex items-center gap-2">
                <Sparkles size={16} className="text-[#FFE600]" />
                <h2 className="font-black text-white text-sm">Análisis IA — {PLATFORM_CONFIG[activePlatform].label}</h2>
                <span className="ml-auto text-2xl font-black text-[#FFE600]">{aiAnalysis.score}/10</span>
              </div>
              <div className="p-5 bg-white space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiAnalysis.highlights?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Puntos positivos</p>
                      <div className="space-y-1">
                        {aiAnalysis.highlights.map((h, i) => <p key={i} className="text-xs text-gray-600">✅ {h}</p>)}
                      </div>
                    </div>
                  )}
                  {aiAnalysis.warnings?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Alertas</p>
                      <div className="space-y-1">
                        {aiAnalysis.warnings.map((w, i) => <p key={i} className="text-xs text-gray-600">⚠️ {w}</p>)}
                      </div>
                    </div>
                  )}
                </div>
                {aiAnalysis.recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wide mb-2">Recomendaciones</p>
                    <div className="space-y-2">
                      {aiAnalysis.recommendations.map((r, i) => (
                        <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 h-fit mt-0.5 ${r.priority === "alta" ? "bg-red-100 text-red-700" : r.priority === "media" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                            {r.priority.toUpperCase()}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-[#0A0A0A]">{r.action}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{r.expected_impact}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
