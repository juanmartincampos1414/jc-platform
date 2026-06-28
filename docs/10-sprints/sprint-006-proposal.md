# Sprint 6 — Brand Intelligence
## Proposal

**Objetivo:** Hacer visible la inteligencia que ya existe.

El sistema aprende. El usuario no lo ve. Este sprint cierra esa brecha.

---

## Principio guía

> Regla 18 — Visible Intelligence Rule:
> Toda capacidad nueva del backend debe responder: ¿dónde la ve el usuario?
> Si la respuesta es "en ningún lado" → la capacidad no está terminada.

Sprint 6 aplica esta regla retroactivamente a todo lo construido en Sprints 1-5.

---

## Superficie propuesta — Brand Intelligence Panel

Una sección nueva en Campaign Detail (o página propia de Brand) que muestre:

### 1. Knowledge Snapshot

El estado actual del conocimiento acumulado sobre la Brand, ordenado por `confidence`:

```
Voz de marca           ████████████ 100%   brand_voice
Mix de contenido       ████████████ 100%   content_mix
Patrones de timing     ████████████ 100%   timing
Preferencia de canal   ██████████░░  85%   channel_affinity  ← bajó
Señales de aprobación  █░░░░░░░░░░░  10%   approval_signals
```

Cada barra es un Knowledge Object. El usuario ve, de un vistazo, qué tan bien conoce el sistema a su marca.

### 2. Learning Timeline

Una línea de tiempo de las últimas acciones con su efecto en el conocimiento:

```
Ayer, 16:32
Rechazaste "Rebalancear distribución de canales"
→ Motivo: "Ya estamos en IG y FB. Enfocar en calidad."
→ Efecto: Preferencia de canal bajó de 100% a 85%
→ El sistema ya no priorizará redistribución de canales

Ayer, 16:32
Aceptaste "Optimizar mix de formatos"
→ Efecto: Mix de contenido se mantiene en 100%
→ Estrategia de formatos confirmada
```

### 3. Why this changed (por decisión)

Cuando el sistema genera una Recommendation, mostrar el razonamiento:

```
¿Por qué recomendamos esto?

Basado en:
• Rechazaste 1 vez redistribuir canales → priorizamos contenido sobre expansión
• Instagram mantiene 100% de affinity → seguimos enfocados ahí
• Mix de contenido aceptado → continuamos con Reels + carruseles
```

---

## Scope del sprint

**In:**
- `BrandIntelligencePanel` component (Campaign Detail o página /brand/[brandId])
- Knowledge Snapshot: leer `memories` activas de la brand, mostrar confidence bars por tipo
- Learning Timeline: leer `events` de tipo `memory.feedback_applied`, `recommendation.accepted`, `recommendation.rejected`; mostrar cronología con efecto
- "Why this changed": en cada Recommendation, mostrar el `supporting_knowledge` de la Decision padre como explicación legible

**Out:**
- No construir nuevos engines
- No modificar tablas
- No nuevas migraciones (todos los datos ya existen)
- No Performance Story (datos reales de métricas — sprint posterior)
- No Executive Insights (requiere múltiples campañas — sprint posterior)

---

## Data disponible hoy (sin nuevos endpoints)

| Superficie | Fuente | Endpoint |
|-----------|--------|----------|
| Knowledge bars | `memories` activas de la brand | `GET /api/campaigns/[id]` → `knowledge` |
| Learning Timeline | `events` tipo `memory.feedback_applied` | `GET /api/campaigns/[id]` → `activity` |
| Decision reasoning | `decisions.supporting_knowledge` | `GET /api/campaigns/[id]` → `decisions` |
| Recommendation + reason | `recommendations.decision_reason` | `GET /api/campaigns/[id]` → `recommendations` |

**Toda la información ya está en el API existente.** Sprint 6 es 100% frontend.

---

## Resultado esperado

Cuando un cliente entra a su Campaign Detail:

1. Ve exactamente qué sabe el sistema sobre su marca, con nivel de confianza visual.
2. Ve cuándo cambió algo y por qué.
3. Ve en cada Recommendation por qué el sistema llegó a esa conclusión.

El sistema deja de ser una caja negra. La inteligencia se vuelve legible.

---

## Tag de cierre

`v0.6-brand-intelligence`
