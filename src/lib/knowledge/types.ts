// Knowledge Layer — separación formal entre Memory, Knowledge y Recommendation
//
// Memory      → recuerda hechos ("brand generó 12 posts en junio")
// Knowledge   → comprende patrones ("brand prefiere Instagram 2:1 y publica a las 9am")
// Recommendation → actúa sobre conocimiento ("próxima campaña: más reels en Instagram")

// ─── Knowledge Object ─────────────────────────────────────────────────────────

export type KnowledgeType =
  | "brand_voice"      // Cómo comunica la marca: tono, extensión, estilo
  | "content_mix"      // Qué tipos de contenido y canales prefiere
  | "timing"           // Cuándo publica: hora, día de semana, frecuencia
  | "creative_style"   // Qué enfoques creativos obtienen aprobación
  | "approval_signals" // Señales de qué consigue approved vs rejected
  | "campaign_pattern" // Qué hace a una campaña exitosa para esta brand
  | "channel_affinity" // Preferencia por canal con métricas de uso

export type KnowledgeSource = "generated" | "observed" | "inferred"

export type KnowledgeObject = {
  type:        KnowledgeType
  title:       string
  content:     string                    // Texto legible para inyectar en prompts
  data:        Record<string, unknown>   // Datos estructurados para queries
  confidence:  number                   // 0.0 – 1.0 según tamaño de muestra
  source:      KnowledgeSource
  sample_size: number                   // Cantidad de registros analizados
  period?:     { start: string; end: string }
}

// ─── Knowledge Context ────────────────────────────────────────────────────────
// Shape listo para inyectar en el prompt de Claude

export type BrandKnowledgeContext = {
  brandId:    string
  brandName:  string
  objects:    KnowledgeObject[]
  // Texto consolidado para incluir directamente en el prompt
  promptContext: string
  // Metadata de la extracción
  extractedAt: string
  totalAssets: number
}
