# Customer Experience Blueprint
## Qué capacidades sostienen cada momento de la experiencia

**Fecha:** 2026-07-01
**Qué es:** el reverso técnico del [Customer Journey](customer-journey-v1.md). El Journey cuenta **qué vive** el cliente; este Blueprint explica **qué lo hace posible** — qué capacidades sostienen cada momento. Es, a la vez, un **mapa de gaps**: para cada momento, qué está construido y qué falta.
**No es** un roadmap, un PRD ni un doc de arquitectura. Es una brújula.

`✅ existe hoy` · `⚠️ existe pero flojo` · `🔨 falta construir`

---

## El producto, en una frase

> **JC AI Agency es un empleado de marketing que conoce una marca mejor cada día.**

Un empleado aprende, recuerda, entiende contexto, propone, ejecuta y mejora con la experiencia. Por eso **Brand Knowledge Ingestion** no es una feature: es el equivalente a cómo un empleado nuevo aprende cómo funciona la empresa **antes** de empezar a trabajar. Es la capacidad más estratégica del producto. (Ver `product-constitution.md`.)

---

## Blueprint por momento

### Día 0 — El cliente firma

| Capacidad | Rol en el momento | Estado |
|---|---|---|
| Auth | Deja entrar al cliente | ✅ |
| Workspace | Crea su espacio aislado | ✅ |
| Billing (con enforcement) | Sostiene la relación comercial | 🔨 (sin enforcement) |
| Welcome / Expectativa | Fija la promesa ("en 7 días…") | 🔨 |
| Organización inicial | Prepara el terreno para el Día 1 | ⚠️ |

### Día 1 — El cliente conecta su marca

| Capacidad | Rol | Estado |
|---|---|---|
| Instagram / Facebook OAuth | Conectar redes | ✅ |
| TikTok OAuth | Conectar TikTok | ⚠️ (sandbox / en audit) |
| Google Business | Conectar presencia local | 🔨 |
| Website / Dominio connect | Conectar el sitio | 🔨 |
| Manual de Marca (upload) | Cargar identidad formal | 🔨 |
| Assets iniciales (import) | Traer material existente | 🔨 |

### Día 1 — El sistema empieza a aprender ← *el corazón del "wow"*

| Capacidad | Rol | Estado |
|---|---|---|
| **Brand Knowledge Ingestion** (CAP-004) | Absorber conocimiento de cualquier fuente | 🔨 |
| Website Scanner | Leer el sitio | 🔨 |
| Instagram / Social Scanner | Leer redes existentes | 🔨 |
| OCR | Leer PDFs / manual de marca | 🔨 |
| Brand Memory | Recordar quién es la marca | ⚠️ (solo aprende de assets propios, no de fuentes externas) |
| Knowledge Engine | Convertir señales en conocimiento | ✅ (pero hoy alimentado por assets internos, no por ingestion) |

### Día 2 — El cliente genera contenido

| Capacidad | Rol | Estado |
|---|---|---|
| Claude | Generar copy | ✅ |
| Prompt Engine | Gobernar los prompts | ⚠️ (hardcodeados en código) |
| Image Engine (Flux) | Generar imágenes | ✅ |
| Video Engine (Seedance) | Generar videos | ✅ |
| Asset Engine | Modelar el contenido | ⚠️ (dual-write assets↔jclaude_posts) |
| Calendar | Organizar el mes | ✅ |
| Content Factory | Orquestar la generación | ✅ |

### Día 3 — El cliente revisa

| Capacidad | Rol | Estado |
|---|---|---|
| Review Workflow | Aprobar / rechazar / pedir cambios | ✅ |
| Decision Engine | Derivar decisiones del conocimiento | ✅ |
| Recommendation Engine | Proponer acciones | ✅ |
| Explainability | Explicar el "por qué" | ✅ |
| Autonomy | Ejecutar dentro de la policy | ⚠️ (funciona; UX floja + una sola acción) |

### Día 7 — El cliente publica (y confía)

| Capacidad | Rol | Estado |
|---|---|---|
| Scheduler (cron-publish) | Publicar en su horario | ✅ |
| **Storage permanente** | Que el contenido no se rompa nunca | 🔨 (vive en CDN de fal, puede expirar) |
| Meta API | Publicar en IG/FB | ✅ |
| TikTok API | Publicar en TikTok | ⚠️ (en audit) |
| Retry Engine | Reintentar si algo falla | 🔨 |
| Audit Trail | Registro de lo ejecutado | ✅ (autonomy) |
| Monitoring / Observability | Saber si algo se rompió | 🔨 |

---

## Lo que el Blueprint deja a la vista

- **El "wow" del Día 1 es casi todo 🔨** — la ingesta de conocimiento no existe todavía. Es el mayor gap de valor. → nace en **CAP-004 + Intelligent Onboarding**.
- **La confianza del Día 7 tiene 🔨 críticos** — Storage permanente, Retry, Monitoring. Sin eso, la promesa "no se rompe" es falsa. → es el **piso de Reliability**.
- **El Día 2 y Día 3 son mayormente ✅** — el motor de contenido e inteligencia ya existe; lo que falta es **calidad de entrada** (Día 1) y **confiabilidad de salida** (Día 7).

Conclusión: el producto tiene un **cuerpo real** (generar + revisar + publicar) pero le faltan **la cabeza** (conocimiento del Día 1) y **los cimientos** (confiabilidad del Día 7).

---

## Scope Definition (decisión de producto, antes del código)

Qué madurez comunica cada módulo. **Propuesta a confirmar** — es decisión de producto, no de ingeniería:

| Módulo | Etiqueta |
|---|---|
| JClaude · Social Media · Campaigns · Executive · Legales · Dashboard | ✅ Production Ready |
| Autonomy | 🟡 Beta (tras rediseño UX) |
| Ads · Influencers · Webs · Extras | ❌ Hidden |

*Mejor 8 módulos excelentes que 20 a medias.* Esta definición debe cerrarse antes de implementar el Scope.

---

*Documento vive en `/docs/00-start-here/customer-experience-blueprint.md`*
*Relacionado: `customer-journey-v1.md` · `experience-dependency-graph.md` · `product-state-snapshot.md` · `capability-portfolio.md`*
