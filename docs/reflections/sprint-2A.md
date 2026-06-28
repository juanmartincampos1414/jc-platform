# Sprint 2A — Product Reflection

**Fecha:** 2026-06-28
**Sprint:** 2A — Intelligence Layer

---

## ¿Qué construimos?

El primer ciclo de aprendizaje real del sistema.

No agregamos pantallas. No agregamos tablas. Convertimos el dominio que ya existía en un sistema que empieza a comprender lo que le pasa.

Concretamente:

- **Knowledge Engine**: extrae patrones de assets históricos y los almacena como Knowledge Objects en `memories`
- **5 extractores**: channel_affinity, content_mix, timing, approval_signals, brand_voice
- **Confidence scoring**: cada conocimiento tiene un score según tamaño de muestra
- **Prompt injection**: generate-month lee el conocimiento activo y lo inyecta en el prompt de Claude
- **API trigger**: `/api/knowledge/extract` para trigger manual o automático
- **Fire-and-forget**: la extracción ocurre después de cada generate-month sin bloquear la respuesta

La segunda generación del mes ya recibe contexto de la primera. La tercera recibe contexto de las dos anteriores. El sistema aprende de sí mismo.

---

## ¿Qué aprendimos?

**1. Knowledge no es logging. Es compresión.**

Memory registra hechos crudos. Knowledge los comprime en patrones útiles. La diferencia es crítica. Un log dice "se publicaron 12 posts en Instagram". Knowledge dice "esta brand prefiere Instagram en un 72%". El segundo es accionable. El primero es solo almacenamiento.

**2. Confidence como primer ciudadano.**

Tener un score de confianza no es cosmético. Con pocos datos, el sistema no debería opinar. Decidimos que < 0.3 de confianza no se inyecta en el prompt. Eso evita que el sistema confunda ruido con señal en sus etapas tempranas.

**3. El ciclo de aprendizaje ocurre sin Performance.**

Esperábamos necesitar métricas reales (likes, alcance, impresiones) para aprender. Pero el primer ciclo útil surge solo de assets + aprobaciones + scheduling. Hay suficiente señal en lo que ya existe para empezar a personalizar.

**4. Fire-and-forget como invariante arquitectural.**

La extracción de conocimiento no bloquea la generación. Si el Knowledge Engine falla, la generación igual ocurre. Este patrón —enriquecer el sistema sin bloquear el flujo principal— aparece en todos los sprints y es correcto mantenerlo.

**5. El prompt de Claude es la interfaz principal del sistema.**

No la UI. El prompt. Toda la inteligencia del sistema se materializa en qué contexto recibe Claude antes de generar. Mejorar el conocimiento del brand = mejorar el prompt = mejorar el output. La UI solo muestra el resultado.

---

## ¿Qué patrón descubrimos?

```
Datos históricos
    ↓
Extractor tipado (con confidence)
    ↓
Knowledge Object
    ↓
Filtro por confianza mínima
    ↓
Texto inyectable en prompt
    ↓
Claude genera con contexto
    ↓
Nuevo dato histórico
    ↓
(loop)
```

Este patrón —**Extract → Score → Filter → Inject → Generate → Learn**— es completamente genérico. No depende de marketing ni de JC AI Agency específicamente.

---

## ¿Qué parte pertenece solamente a JC AI Agency?

- El perfil de la marca (industry, tone, target_audience)
- Los tipos de assets (post, reel, story)
- Los canales soportados (Instagram, Facebook)
- El formato del calendario mensual
- Las reglas de copy (150 chars, 8 hashtags)
- La integración con `jclaude_posts` (tabla legacy)

---

## ¿Qué parte pertenece a RUN72 Core OS?

- El concepto de Knowledge Object con tipo y confidence
- El patrón Extractor → Store → Load → Inject
- La separación Memory / Knowledge / Recommendation
- El ciclo de aprendizaje post-generación (fire-and-forget)
- El confidence threshold como filtro de ruido
- La idempotencia de la extracción (deprecar anterior, insertar nuevo)

---

## ¿Qué documento del Core debería actualizarse?

**Core OS Engine — Knowledge Layer v1**

Debería documentarse el patrón con suficiente abstracción para aplicarse a cualquier producto:

```
KnowledgeEngine<T extends DomainEntity>
    extractors: Extractor<T>[]
    confidenceThreshold: number
    store: MemoryStore
    buildPromptContext(): string
```

Cuando aparezca en un segundo producto, este patrón se mueve formalmente al Core.

---

## ¿Qué simplificamos?

- No construimos un sistema de embeddings ni vector search. No lo necesitamos todavía.
- No creamos una tabla separada para Knowledge. Reutilizamos `memories` con tipos específicos.
- No construimos un dashboard de Knowledge. El valor está en el backend, no en la UI.
- No esperamos tener Performance data para empezar a aprender. El primer ciclo funciona con lo que existe.

---

## ¿Qué eliminamos?

- La idea de que el Knowledge Engine necesita ser un módulo separado del producto. Vive dentro de `src/lib/knowledge/` como una capa interna.
- La suposición de que necesitamos métricas externas (Meta, TikTok) para aprender. La señal más valiosa en esta etapa es la tasa de aprobación interna.

---

## ¿Qué decisión quedó congelada?

**El umbral de confianza es 0.3.**

Esto significa que se necesitan al menos ~6 assets para que un Knowledge Object se inyecte en el prompt. Este número es arbitrario y debería revisarse después de tener 50+ assets analizados.

**Knowledge Objects no se versionan públicamente todavía.**

La estrategia es deprecar el anterior e insertar el nuevo. Eso pierde el historial de evolución del conocimiento. Sprint 2B debería agregar `version` o `superseded_by` para trazar cómo evoluciona el conocimiento de la brand a lo largo del tiempo.

---

## Estado de madurez

| Componente | Estado |
|---|---|
| Knowledge Object types | ✅ Definidos |
| Extractores (5) | ✅ Implementados |
| Confidence scoring | ✅ Activo |
| Storage en memories | ✅ Idempotente |
| Prompt injection | ✅ En generate-month |
| API trigger | ✅ /api/knowledge/extract |
| Fire-and-forget post-generation | ✅ Activo |
| Performance-based extractors | ⬜ Sprint 2B |
| Competitive knowledge | ⬜ Sprint 2B |
| Recommendation Engine | ⬜ Sprint 2B |
| Knowledge versioning | ⬜ Sprint 2B |
| Brand Brain (JClaude invisible) | ⬜ Sprint 2B |
