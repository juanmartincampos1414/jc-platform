// Extractors — detectan patrones en datos de campaña y los convierten en Knowledge Objects
// Trabajan sobre datos que ya existen: assets, events, agent_jobs
// No requieren Performance ni Distribution (esos son Sprint 2B)

import type { KnowledgeObject } from "./types"

type AssetRow = {
  id: string
  channel: string
  asset_type: string
  status: string
  caption: string | null
  scheduled_at: string | null
  metadata: Record<string, unknown>
}

// ─── Channel Affinity ─────────────────────────────────────────────────────────

export function extractChannelAffinity(assets: AssetRow[]): KnowledgeObject {
  const counts: Record<string, number> = {}
  for (const a of assets) {
    counts[a.channel] = (counts[a.channel] ?? 0) + 1
  }

  const total = assets.length
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const dominant = sorted[0]?.[0] ?? "instagram"
  const dominantPct = total > 0 ? Math.round((counts[dominant] ?? 0) / total * 100) : 0

  const lines = sorted.map(([ch, n]) =>
    `${ch}: ${n} posts (${Math.round(n / total * 100)}%)`
  )

  return {
    type:        "channel_affinity",
    title:       "Preferencia de canal",
    content:     `Canal principal: ${dominant} (${dominantPct}%). Distribución: ${lines.join(", ")}.`,
    data:        { counts, dominant, dominant_pct: dominantPct, sorted },
    confidence:  Math.min(total / 20, 1),   // 100% confidence con 20+ assets
    source:      "observed",
    sample_size: total,
  }
}

// ─── Content Mix ─────────────────────────────────────────────────────────────

export function extractContentMix(assets: AssetRow[]): KnowledgeObject {
  const counts: Record<string, number> = {}
  for (const a of assets) {
    counts[a.asset_type] = (counts[a.asset_type] ?? 0) + 1
  }

  const total = assets.length
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const lines = sorted.map(([t, n]) =>
    `${t}: ${Math.round(n / total * 100)}%`
  )

  return {
    type:        "content_mix",
    title:       "Mix de contenido",
    content:     `Distribución de formatos: ${lines.join(", ")}.`,
    data:        { counts, sorted },
    confidence:  Math.min(total / 15, 1),
    source:      "observed",
    sample_size: total,
  }
}

// ─── Timing Patterns ─────────────────────────────────────────────────────────

export function extractTimingPatterns(assets: AssetRow[]): KnowledgeObject {
  const hours: Record<number, number>   = {}
  const weekdays: Record<number, number> = {}

  for (const a of assets) {
    if (!a.scheduled_at) continue
    const d = new Date(a.scheduled_at)
    const h = d.getUTCHours()
    const w = d.getUTCDay()   // 0=Sun, 6=Sat
    hours[h]   = (hours[h]   ?? 0) + 1
    weekdays[w] = (weekdays[w] ?? 0) + 1
  }

  const topHours   = Object.entries(hours).sort((a, b) => +b[1] - +a[1]).slice(0, 3)
  const topWeekdays = Object.entries(weekdays).sort((a, b) => +b[1] - +a[1]).slice(0, 3)

  const dayNames = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"]
  const weekdayText = topWeekdays.map(([d]) => dayNames[+d]).join(", ")
  const hourText    = topHours.map(([h]) => `${h}:00`).join(", ")

  const scheduled = assets.filter(a => a.scheduled_at).length

  return {
    type:        "timing",
    title:       "Patrones de publicación",
    content:     `Horarios más usados: ${hourText}. Días preferidos: ${weekdayText}.`,
    data:        { hours, weekdays, top_hours: topHours, top_weekdays: topWeekdays },
    confidence:  Math.min(scheduled / 20, 1),
    source:      "observed",
    sample_size: scheduled,
  }
}

// ─── Approval Signals ────────────────────────────────────────────────────────

export function extractApprovalSignals(assets: AssetRow[]): KnowledgeObject {
  const approved = assets.filter(a => a.status === "approved" || a.status === "published")
  const rejected = assets.filter(a => a.status === "rejected" || a.status === "needs_changes")
  const total    = approved.length + rejected.length

  // Tasa de aprobación por canal
  const byChannel: Record<string, { ok: number; bad: number }> = {}
  for (const a of [...approved, ...rejected]) {
    if (!byChannel[a.channel]) byChannel[a.channel] = { ok: 0, bad: 0 }
    if (a.status === "approved" || a.status === "published") byChannel[a.channel].ok++
    else byChannel[a.channel].bad++
  }

  // Longitud promedio del copy en aprobados vs rechazados
  const avgLen = (list: AssetRow[]) =>
    list.length === 0 ? 0 : Math.round(list.reduce((s, a) => s + (a.caption?.length ?? 0), 0) / list.length)

  const approvedLen = avgLen(approved)
  const rejectedLen = avgLen(rejected)

  let content = total === 0
    ? "Sin datos de aprobación suficientes todavía."
    : `${approved.length} aprobados / ${rejected.length} rechazados. `
      + `Copy aprobado: ~${approvedLen} caracteres. `
      + (approvedLen !== rejectedLen && rejectedLen > 0
          ? `Copy rechazado: ~${rejectedLen} caracteres. `
          : "")

  return {
    type:        "approval_signals",
    title:       "Señales de aprobación",
    content,
    data:        { approved: approved.length, rejected: rejected.length, by_channel: byChannel, avg_len_approved: approvedLen, avg_len_rejected: rejectedLen },
    confidence:  Math.min(total / 10, 1),   // requiere 10+ revisados para alta confianza
    source:      "observed",
    sample_size: total,
  }
}

// ─── Brand Voice ─────────────────────────────────────────────────────────────

export function extractBrandVoice(assets: AssetRow[]): KnowledgeObject {
  const lengths = assets
    .map(a => a.caption?.length ?? 0)
    .filter(l => l > 0)

  const avgLen = lengths.length > 0
    ? Math.round(lengths.reduce((s, l) => s + l, 0) / lengths.length)
    : 0

  const hashtagCounts = assets
    .map(a => (a.metadata?.hashtags as string ?? "").split(" ").filter(Boolean).length)

  const avgHashtags = hashtagCounts.length > 0
    ? Math.round(hashtagCounts.reduce((s, n) => s + n, 0) / hashtagCounts.length)
    : 0

  return {
    type:    "brand_voice",
    title:   "Voz de la marca",
    content: `Copy promedio: ${avgLen} caracteres. Hashtags promedio: ${avgHashtags} por post.`,
    data:    { avg_caption_length: avgLen, avg_hashtags: avgHashtags, sample: lengths.length },
    confidence:  Math.min(assets.length / 10, 1),
    source:      "observed",
    sample_size: assets.length,
  }
}

// ─── Run all extractors ───────────────────────────────────────────────────────

export function runAllExtractors(assets: AssetRow[]): KnowledgeObject[] {
  if (assets.length === 0) return []
  return [
    extractChannelAffinity(assets),
    extractContentMix(assets),
    extractTimingPatterns(assets),
    extractApprovalSignals(assets),
    extractBrandVoice(assets),
  ]
}
