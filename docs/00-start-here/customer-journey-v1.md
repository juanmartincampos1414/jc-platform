# Customer Journey v1.0
## La Semana 1 de un cliente — la brújula de la Fase II

**Fecha:** 2026-07-01
**Qué es:** la experiencia que **queremos** que viva un cliente en sus primeros 7 días, contada casi como una historia. No es un flujo de pantallas ni un PRD. Es la referencia principal de la Fase II: cada Capability de los próximos sprints debería responder a una parte concreta de este recorrido.
**Honestidad:** cada momento está marcado con lo que hoy es real vs lo que falta construir.

`✅ existe hoy` · `⚠️ existe pero flojo` · `🔨 falta construir`

---

## La persona

**Sofía** tiene una marca de indumentaria en Buenos Aires. Vende bien por Instagram, pero vive corriendo: escribe los posts a la madrugada, le paga a un diseñador freelance por cada pieza, y nunca tiene tiempo para pensar la estrategia. Escuchó que JC AI Agency le arma el marketing con IA. Firma un jueves.

---

## Día 0 — Firma

**Qué vive Sofía:** recibe un email de bienvenida. No dice "gracias por registrarte". Le dice: *"En 7 días vas a tener un mes entero de contenido, con tu voz, listo para publicar."* Entra con un click. La primera pantalla no le pide trabajo — le muestra a dónde va a llegar.

- ¿Qué recibe? Un email que **fija una expectativa concreta** (qué va a tener y cuándo). 🔨
- ¿Cómo entra? Un acceso directo, sin fricción. Registro + auto-login ✅ · email de bienvenida 🔨
- ¿Qué expectativa generamos? *"No vengo a usar un software. Vengo a recibir un equipo."* 🔨 *(hoy entra directo a JClaude sin narrativa)*

> **Verdad de hoy:** el registro funciona ✅, pero no hay email ni promesa. Sofía entra a un calendario vacío sin entender qué va a pasar.

---

## Día 1 — Conecta, y el sistema empieza a conocerla

**Qué vive Sofía:** conecta su Instagram, su TikTok, sube su manual de marca en PDF y le da acceso a la carpeta de fotos de Drive. No llena un formulario largo. **Mientras toma un café, el sistema lee todo eso y empieza a entender su marca:** su paleta, su tono ("cercano, con humor"), su público (mujeres 25-40), sus productos, incluso a sus competidores. Cuando vuelve, la pantalla ya no está vacía: dice *"Esto es lo que entendí de tu marca"* y le muestra un perfil que ella solo tiene que confirmar o corregir.

- ¿Qué conecta? Redes, website, manual de marca, PDFs, Drive, fotos. Conexión de redes ✅ · resto de fuentes 🔨
- ¿Qué aprende el sistema? Brand, identidad visual, tono, audiencia, competidores. → **[CAP-004 Brand Knowledge Ingestion](../capabilities/CAP-004-brand-knowledge-ingestion.md)** 🔨
- ¿Qué hace automáticamente? Construye la Brand Memory desde fuentes reales. 🔨
- ¿Qué hace Sofía? **Casi nada** — conecta y confirma. Hoy: carga todo a mano en un formulario. ⚠️

> **Verdad de hoy:** hoy Sofía **llena un formulario** (brand_name, tono, audiencia) y el sistema **empieza vacío** — no aprende nada en el onboarding. Este es **el gap más grande** entre lo que es y lo que queremos. Es donde nace el "wow".

---

## Día 2 — Ya puede generar

**Qué vive Sofía:** aprieta un botón. En segundos, el sistema le arma **un mes completo de contenido** — posts, reels, copies que suenan a ella, hashtags, ideas de imagen — repartido en un calendario. Genera las imágenes y los videos. Sofía abre un post y piensa: *"esto lo hubiera escrito yo."*

- ¿Qué contenido ya puede generar? Un mes de posts + imágenes (Flux) + videos (Seedance). ✅
- ¿Qué conoce la Brand? Lo que aprendió el Día 1 → alimenta la calidad. Generación ✅ · **calidad gated por el conocimiento del Día 1** ⚠️
- ¿Qué falta que aprenda? Qué funciona de verdad (eso llega con las aprobaciones y el performance).

> **Verdad de hoy:** la generación **funciona de verdad** ✅ — es el corazón real del producto. Pero como el sistema arrancó con un formulario y no con conocimiento, la pieza suena "genérica-buena", no "inconfundiblemente tuya". El Día 2 ya es bueno; con el Día 1 resuelto, sería memorable.

---

## Día 3 — La sorpresa

**Qué debería sorprender a Sofía:** que no tiene que hacer nada raro. Aprueba lo que le gusta, pide cambios en dos piezas (y el sistema las rehace en su voz), y con un click **queda todo programado y publicándose solo** en sus redes. Y algo más: el sistema le dice *"noté que tus posts de los martes a la tarde funcionan mejor — te reorganicé el mes"*. Sofía siente que **alguien está prestando atención por ella**.

- ¿Qué debería sorprender? Que el sistema **ejecuta y aprende solo**, y que ya le devuelve una observación útil sobre su propia operación. Publicación IG/FB ✅ · TikTok (en audit) ⚠️ · recomendaciones/aprendizaje ✅ *(early)* · autopublicación programada ✅

> **Verdad de hoy:** el loop aprobar → publicar → aprender **existe** ✅. La "sorpresa" (que el sistema le devuelva inteligencia sobre su marca) es real pero **incipiente** — necesita algunos días de datos para brillar.

---

## Día 7 — Mira hacia atrás

**Qué siente Sofía:** en una semana pasó de escribir posts a la madrugada a **aprobar un mes de contenido en 20 minutos**, que se está publicando solo en sus redes con su voz. No abrió Photoshop, no le escribió al diseñador, no programó nada a mano. Cuando entra, el sistema le resume *"esto pasó esta semana, esto te recomiendo hacer ahora"*. Sofía no siente que compró un software.

> **Siente que tiene un equipo de marketing trabajando para su marca.**

- ¿Qué obtuvo? Un mes de contenido publicándose, con su voz, sin trabajo manual.
- ¿Qué trabajo dejó de hacer? Escribir posts, briefear al diseñador, programar, pensar el calendario.
- ¿Qué confianza ganó? Que lo que aprueba **se publica y no se rompe**, y que el sistema **la entiende cada vez mejor**.
- ¿Qué capacidad nueva adquirió? Operar su marketing de redes con IA, ella sola.

> **Verdad de hoy:** el Día 7 es **alcanzable en su mayor parte** ✅ — pero tiene **dos grietas que romperían la confianza**: (1) el contenido generado vive en una CDN externa que puede expirar → una imagen rota el Día 30 destruye el "no se rompe" ⚠️🔨; (2) no hay cobro real → no se puede sostener la relación. La confianza del Día 7 **se apoya en la Reliability del Sprint 10.**

---

## Qué revela este recorrido (el orden de los Epics sale de acá)

No priorizamos por intuición. Miramos qué sostiene la experiencia:

**1. El "wow" de la Semana 1 nace en el Día 1 → Brand Knowledge Ingestion (CAP-004) + Intelligent Onboarding.** Todo lo bueno del Día 2 en adelante (que el contenido suene a Sofía) depende de que el sistema **arranque con conocimiento y no vacío**. Es el mayor diferencial de experiencia. → **Sprint 11 es el salto de valor.**

**2. Pero la experiencia se apoya en un piso: Product Reliability (Sprint 10, Epic 1).** El Día 7 promete "lo que aprobás se publica y no se rompe". Eso es **falso** si el media vive en una CDN que expira o si no se puede cobrar. **No se puede construir un gran Día 7 sobre contenido que puede desaparecer.** → **Storage propio + billing son el piso, van primero.**

**3. Product Scope (Epic 3) es un win barato y temprano.** Sofía **no debería ver** Ads/Influencers/Webs a medio hacer en su Día 0 — eso rompe la sensación de "producto terminado" desde el minuto uno. Ocultarlos cuesta poco y sube la confianza inmediatamente. → **Hacerlo primero, es casi gratis.**

**4. Product Experience / UX (Epic 2) es el pulido del uso diario.** Importa, pero **no es el camino crítico de la Semana 1** de un cliente nuevo (Autonomy, por ejemplo, no es una acción de sus primeros 7 días). → **Corre en paralelo; Autonomy se rediseña cuando llegue su momento en el journey.**

### El orden que propone el journey

```
Sprint 10 (piso de confianza):
  1. Scope   — ocultar lo inmaduro (barato, inmediato)
  2. Reliability — storage propio + billing + consolidar dominio (el piso del Día 7)
  3. Experience — pulido UX de las pantallas del uso diario

Sprint 11 (el salto de valor):
  CAP-004 Brand Knowledge Ingestion + Intelligent Onboarding
  → resuelve el Día 1, que es donde nace todo el "wow"
```

---

## El norte de la Fase II

> Hasta ahora diseñamos **cómo funciona** el sistema. Ahora diseñamos **cómo se siente usarlo.**
> El objetivo de cada sprint de la Fase II es acercar la realidad a este recorrido, hasta que un cliente, en su Día 7, sienta que tiene un equipo de marketing trabajando para su marca.

---

*Documento vive en `/docs/00-start-here/customer-journey-v1.md`*
*Relacionado: `product-state-snapshot.md` (qué es real hoy) · `10-sprints/sprint-10-product-experience.md` · `capability-portfolio.md` · `capabilities/CAP-004-brand-knowledge-ingestion.md`*
