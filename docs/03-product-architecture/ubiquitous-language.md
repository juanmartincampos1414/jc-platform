# Ubiquitous Language
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

> Este documento congela el lenguaje del sistema. Todo el código, las bases de datos, las APIs, la UI y las conversaciones deben usar estos términos. Cuando hay ambigüedad en el lenguaje, hay ambigüedad en el producto.

---

## Entidades principales

### Workspace
**Qué es:** La unidad de aislamiento del sistema. Cada cliente de JC AIgency tiene un workspace. Cada marca que usa JClaude tiene un workspace. Todo dato pertenece a un workspace.

**NO confundir con:** client, tenant, account, company.

**En código:** `workspace_id uuid`, tabla `workspaces`.

---

### Brand
**Qué es:** La identidad de la marca dentro de un workspace. Incluye nombre, industria, tono de comunicación, audiencia target, mensajes clave y assets de marca (logo, colores, tipografía).

**NO confundir con:** workspace (el contenedor), client (la empresa).

**En código:** `jclaude_profiles` (hoy), `brands` (futuro).

---

### Campaign
**Qué es:** La unidad estratégica principal. Una campaña tiene un objetivo, una audiencia, canales, fechas de inicio y fin, presupuesto, y agrupa todos los assets, posts, ads, influencers y landing pages que pertenecen a esa iniciativa.

**NO confundir con:** post (una pieza de contenido), calendar (la distribución temporal).

**Ejemplo:** "Campaña Verano 2026 — Conversiones" es una Campaign. Los 12 posts de Instagram que la componen son Posts.

**En código:** tabla `campaigns` (pendiente de crear).

---

### Campaign Brief
**Qué es:** El documento de entrada de una campaña. Define el qué, para quién, por qué, con qué presupuesto y hasta cuándo. Es el input principal para los agentes de IA.

**NO confundir con:** campaign (la campaña en ejecución), brief de contenido (instrucciones para una pieza específica).

**En código:** tabla `campaign_briefs` (pendiente de crear).

---

### Post
**Qué es:** Una pieza de contenido orgánico publicable en una red social. Tiene copy, hashtags, imagen o video adjunto, red social destino, fecha y hora programada, y estado en el workflow de aprobación.

**NO confundir con:** ad (unidad paga), creative (la idea conceptual), asset (el archivo en sí).

**Estados:** `draft → approved → rejected → scheduled → published`

**En código:** tabla `jclaude_posts` (JClaude), tabla `social_posts` (portal de cliente).

---

### Ad
**Qué es:** Una pieza de contenido publicitaria paga, asociada a una campaign. Tiene segmentación de audiencia, presupuesto asignado, objetivo de conversión y métricas de performance.

**NO confundir con:** post (contenido orgánico).

**En código:** no existe aún como entidad propia — actualmente parte de `ad_accounts`.

---

### Creative
**Qué es:** La idea o concepto detrás de una o más piezas. Un creative puede materializarse en múltiples assets para múltiples canales. Es la unidad conceptual, no el archivo.

**Ejemplo:** "La foto de la modelo en la playa" es un Creative. Los exports en formato 1:1 para Instagram, 16:9 para Facebook y 9:16 para TikTok son Assets del mismo Creative.

**En código:** no existe aún — futuro.

---

### Asset
**Qué es:** Un archivo concreto y almacenado. Puede ser imagen, video, PDF, copy text, landing page, etc. Todo Asset pertenece a un workspace, tiene un tipo, un owner y una URL de storage permanente.

**NO confundir con:** creative (la idea), post (la unidad publicable que usa el asset).

**En código:** tabla `files` / `assets` (pendiente de crear). HOY: `image_url` en `jclaude_posts` es la URL del Asset (temporal, expira).

---

### Copy
**Qué es:** El texto de un Post o Ad. Incluye el cuerpo del texto y los hashtags. Es un campo dentro de Post, no una entidad separada.

**NO confundir con:** brief (la instrucción para generar copy), caption (sinónimo de copy en algunos contextos).

**En código:** campo `copy` en `jclaude_posts` y `social_posts`.

---

### Image Brief
**Qué es:** La descripción textual que le dice a la IA qué imagen generar para un Post. Es el puente entre el copy y el Asset visual.

**NO confundir con:** copy (el texto del post), asset (la imagen generada).

**En código:** campo `image_brief` en `jclaude_posts`.

---

### Approval
**Qué es:** La acción de un usuario autorizado que valida o rechaza un contenido, documento o decisión. Todo Approval tiene: objeto aprobado, usuario que aprueba, timestamp y estado.

**NO confundir con:** comment (feedback sin decisión), review (proceso de evaluación).

**Estados:** `pending → approved | rejected | needs_changes`

**En código:** campo `status` en posts y docs. Tabla `approvals` (pendiente — centraliza todos los tipos de aprobación).

---

### Document
**Qué es:** Un archivo legal o contractual. Puede ser carta oferta, contrato, NDA, orden de servicio, presupuesto. Tiene estado de firma y audit trail.

**NO confundir con:** asset (archivo de marketing), file (cualquier archivo).

**Estados:** `pending → signed`

**En código:** tabla `legal_documents`.

---

### Signature
**Qué es:** La acción de firma de un Document. Incluye: quién firmó, cuándo, qué escribió como firma, y opcionalmente el archivo firmado resultante.

**En código:** campos `signed_by`, `signed_at`, `signature_data` en `legal_documents`.

---

### Influencer
**Qué es:** Una persona con audiencia en redes sociales que potencialmente colabora con la marca. Tiene perfil (handle, red, seguidores, engagement), propuesta económica y un estado en el pipeline de colaboración.

**Pipeline:** `scouting → proposal_sent → approved → in_production → content_review → published`

**En código:** tabla `influencers`.

---

### Subscription
**Qué es:** El plan de pago activo de un workspace para acceder a JClaude. Tiene plan (starter/pro/enterprise), estado (active/paused/cancelled), fechas de período y límites (posts, redes, autopublish).

**NO confundir con:** billing (el registro de cobros), invoice (el comprobante).

**En código:** tabla `jclaude_subscriptions`.

---

### Performance Metric
**Qué es:** Una medición cuantitativa del resultado de un Post, Ad o Campaign. Incluye impresiones, clics, CTR, conversiones, CPA, ROAS, engagement rate.

**NO confundir con:** insight (la interpretación de las métricas), recommendation (la acción sugerida a partir de las métricas).

**En código:** tabla `performance_snapshots` (pendiente de crear).

---

### Insight
**Qué es:** Una lectura o conclusión generada a partir de datos de performance. Puede ser generada por IA o por un analista humano. Es una observación, no una acción.

**Ejemplo:** "Los posts publicados los martes a las 18:00 tienen 40% más engagement que los publicados los lunes."

**NO confundir con:** recommendation (la acción derivada del insight).

**En código:** tabla `insights` (pendiente de crear).

---

### Recommendation
**Qué es:** Una acción concreta sugerida por IA a partir de insights. Tiene prioridad, acción específica e impacto esperado. Puede ser aceptada o rechazada por el usuario.

**Ejemplo:** "Mover los posts de lunes al martes a las 18:00 — impacto esperado: +40% engagement."

**NO confundir con:** insight (la observación), suggestion (feedback informal sin base de datos).

**En código:** tabla `recommendations` (pendiente de crear).

---

### AI Job
**Qué es:** Un registro de cada llamada hecha a un modelo de IA. Contiene: agente que lo ejecutó, prompt usado, modelo, input completo, output completo, tokens consumidos, costo estimado, duración, estado y workspace_id.

**Por qué existe:** Para trazabilidad, costos, versionado y mejora de prompts.

**En código:** tabla `ai_jobs` (pendiente de crear).

---

### Memory
**Qué es:** Conocimiento persistente del sistema que se reutiliza en futuras generaciones. No es un registro de conversación — es conocimiento destilado y estructurado. Puede ser de tipo: brand, campaign, audience, performance, approval pattern.

**En código:** tabla `brand_memories` y futuras (pendiente de crear).

---

### Activity Log
**Qué es:** El registro cronológico de eventos importantes ocurridos en un workspace. Alimenta el dashboard, el audit trail y eventualmente el aprendizaje del sistema.

**NO confundir con:** ai_job (registro de llamadas IA), audit_log (registro de seguridad/compliance).

**En código:** tabla `activity_logs` (pendiente de crear).

---

## Estados canónicos

### Estados de Post / Ad
```
draft          → generado por IA, no revisado
pending        → enviado al cliente para aprobación
approved       → aprobado, listo para programar
rejected       → rechazado, descartado
needs_changes  → necesita revisión con comentarios
scheduled      → programado para publicar
published      → publicado en la red social
```

### Estados de Document
```
pending   → enviado al cliente, esperando firma
signed    → firmado con timestamp y firma
```

### Estados de Influencer
```
scouting        → identificado, en evaluación
proposal_sent   → propuesta económica enviada
approved        → confirmado para la campaña
rejected        → descartado
in_production   → grabando/creando contenido
content_review  → contenido enviado para revisión
published       → contenido publicado
```

### Estados de Subscription
```
pending    → creada, esperando primer pago
active     → pagando, acceso completo
paused     → pago fallido, acceso limitado
cancelled  → cancelada, sin acceso
```

### Estados de Campaign
```
draft      → en construcción, sin brief aprobado
active     → en ejecución
paused     → pausada temporalmente
completed  → finalizada, midiendo resultados
archived   → cerrada, solo lectura
```

---

## Términos prohibidos en código

Estos términos son ambiguos y no deben usarse en nombres de variables, tablas, rutas o componentes:

| Término prohibido | Usar en cambio |
|---|---|
| `content` | `post`, `ad`, `creative`, `asset` (ser específico) |
| `data` | el tipo específico: `brand_data`, `metrics`, etc. |
| `info` | el campo específico |
| `item` | la entidad específica |
| `thing` | nunca |
| `object` | la entidad específica |
| `record` | la tabla específica |
| `entity` | la entidad específica |
| `draft` (como nombre de ruta) | `posts/draft`, `documents/pending` |
| `content_data` | nunca |

---

*Documento vive en `/docs/03-product-architecture/ubiquitous-language.md`*  
*Este documento debe revisarse antes de nombrar cualquier nueva tabla, ruta o componente*
