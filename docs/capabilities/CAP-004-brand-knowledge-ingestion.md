# CAP-004 — Brand Knowledge Ingestion

**Fecha:** 2026-07-01
**Framework:** Capability Validation v1.0
**Capability Version:** (planned)
**Estado:** `Planned` (backlog — aún sin Designed, sin código)

> No es Onboarding. No es una pantalla. Es un **motor**. Su única responsabilidad es **absorber conocimiento de marca desde cualquier fuente** y alimentar el Knowledge Engine.

---

## Por qué es central

La materia prima del producto ya no son posts, anuncios ni campañas. Es **el conocimiento de una marca**. Cuanto mejor entienda el sistema a la marca, mejores serán el contenido, las imágenes, los videos, los anuncios, el sitio, la estrategia, las recomendaciones y las decisiones. Por eso Brand Knowledge Ingestion probablemente se convierta en **una de las capacidades más importantes** de JC AI Agency: todo depende de la calidad del conocimiento que absorba.

## Qué hace (visión)

Absorbe conocimiento desde múltiples fuentes y lo convierte en Knowledge Objects:

```
Instagram · Facebook · TikTok · Google Business · Website ·
Manual de Marca · Logos · PDFs · Google Drive · Dropbox · Notion ·
Fotos · Videos · Podcast · Entrevistas · CRM · Campañas anteriores
        ↓
   Brand Knowledge Ingestion (motor)
        ↓
   Knowledge Engine  →  Brand · Assets · Visual Identity ·
   Tone of Voice · Audience · Competitors · Campaign Suggestions
```

## Las 4 preguntas (preliminar — se completan en Designed)

- **Trabajo que elimina:** que el cliente (y el equipo) tenga que explicar/cargar manualmente quién es la marca. El sistema deja de empezar vacío.
- **Decisión que mejora:** toda decisión posterior (contenido, campañas, ads, presencia) parte de conocimiento real, no de un formulario.
- **Cómo sabremos que funcionó (evidencia, a definir):** conectada ≥1 fuente real → el sistema genera Knowledge Objects verificables (visual identity, tono, audiencia) sin carga manual.
- **Comportamiento esperado del cliente:** conecta sus fuentes una vez y confía en que el sistema "ya conoce" su marca.

## Relación con el resto

Alimenta transversalmente: Intelligent Onboarding (Sprint 11, la experiencia que lo usa), AI Content Factory (Sprint 12), Brand Presence (Sprint 13), Paid Media OS (Sprint 14). **No debe existir conocimiento duplicado** — una sola Brand Memory alimenta todo.

## Estado

```
Planned    ✓  (identificada como capacidad clave; sin card completa ni código)
Designed   —
Built      —
Frozen     —
Validated  —
```

---

*Card vive en `/docs/capabilities/CAP-004-brand-knowledge-ingestion.md`*
*Relacionado: `capability-portfolio.md` · `07-knowledge-architecture/` · `capability-validation.md`*
