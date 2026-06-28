"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Layers, Brain, Zap, Activity,
  CheckCircle2, Clock, XCircle, AlertCircle,
  Image, Video, BookOpen,
  ChevronDown, ChevronUp
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
  supporting_knowledge: unknown[]; supporting_evidence: unknown[]
  generated_at: string
}

type Knowledge = {
  id: string; memory_type: string; title: string
  content: string; confidence: number; created_at: string
}

type DomainEvent = {
  id: string; event_type: string; entity_type: string
  actor_type: string; metadata: Record<string, unknown>; created_at: string
}

// ─── Helpers ──────────────────────────────────────────────────

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
}

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-400" : "bg-gray-300"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[80px]">
        <div className={cn("h-1.5 rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 tabular-nums">{pct}%</span>
    </div>
  )
}

function Section({
  title, icon: Icon, count, children, defaultOpen = true
}: {
  title: string; icon: React.ElementType; count?: number
  children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition text-left"
      >
        <Icon size={16} className="text-gray-400" />
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
  return (
    <div className="py-8 text-center text-gray-400 text-sm">{label}</div>
  )
}

// ─── Page ─────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { workspaceId, campaignId } = useParams<{ workspaceId: string; campaignId: string }>()
  const router = useRouter()
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [campaignId, workspaceId])

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

  const { campaign, assets, decisions, knowledge, activity } = data

  // Asset stats
  const assetByStatus = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc
  }, {})

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

        {/* Meta row */}
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

        {/* Summary counters */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Assets",    value: assets.length,    color: "text-blue-600" },
            { label: "Decisions", value: decisions.length, color: "text-purple-600" },
            { label: "Knowledge", value: knowledge.length, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
              <div className={cn("text-2xl font-bold", color)}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Assets ── */}
      <Section title="Assets" icon={Layers} count={assets.length}>
        {assets.length === 0 ? <EmptyState label="No hay assets en esta campaign." /> : (
          <div className="space-y-1">
            {/* Status summary */}
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
              const AIcon = ASSET_ICON[a.asset_type] ?? Image
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

      {/* ── Decisions ── */}
      <Section title="Decisions" icon={Zap} count={decisions.length}>
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
                <Confidence value={d.confidence} />
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Knowledge Used ── */}
      <Section title="Knowledge Used" icon={Brain} count={knowledge.length} defaultOpen={false}>
        {knowledge.length === 0 ? (
          <EmptyState label="No hay Knowledge Objects activos todavía." />
        ) : (
          <div className="space-y-3">
            {knowledge.map(k => (
              <div key={k.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{k.memory_type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-sm text-gray-700">{k.content}</p>
                </div>
                <div className="shrink-0 w-28">
                  <Confidence value={k.confidence} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── Recommendations ── */}
      <Section title="Recommendations" icon={CheckCircle2} count={0} defaultOpen={false}>
        <EmptyState label="Las Recommendations derivadas de Decisions están disponibles en Sprint 3B." />
      </Section>

      {/* ── Activity ── */}
      <Section title="Activity" icon={Activity} count={activity.length} defaultOpen={false}>
        {activity.length === 0 ? <EmptyState label="Sin actividad registrada." /> : (
          <div className="space-y-1">
            {activity.map(e => {
              const Icon = e.event_type.includes("fail") ? XCircle
                : e.event_type.includes("complet") ? CheckCircle2
                : e.event_type.includes("start") ? Clock
                : AlertCircle
              return (
                <div key={e.id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <Icon size={14} className={cn(
                    "mt-0.5 shrink-0",
                    e.event_type.includes("fail") ? "text-red-400"
                    : e.event_type.includes("complet") ? "text-green-500"
                    : "text-gray-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 font-medium">{e.event_type.replace(/\./g, " → ")}</span>
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
