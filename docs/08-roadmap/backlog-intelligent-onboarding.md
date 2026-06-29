# Backlog Candidate — Intelligent Onboarding
**Estado:** Candidato de backlog — no implementar hasta que Sprint 9 esté consolidado
**Registrado:** 2026-06-28
**Sprint de evaluación:** Post Sprint 9

---

## El problema

Hoy cuando un cliente firma contrato y crea su Workspace, el producto empieza desde cero.

No hay Brand Memory. No hay Knowledge. No hay contexto de partida.

El pipeline funciona — pero solo después de que el sistema acumula suficiente evidencia para operar con confianza. Ese período de calentamiento es caro en tiempo y en experiencia para el cliente.

---

## La hipótesis

Existe una etapa antes de la primera campaña que podría construir el primer estado de la Brand Memory de forma activa, usando fuentes de información que el cliente ya tiene.

El objetivo no es configurar el producto.

El objetivo es que el sistema entienda la Brand antes de generar la primera campaña.

---

## Fuentes de información candidatas

| Fuente | Tipo de dato | Impacto sobre Brand Memory |
|---|---|---|
| Brand Book / Manual de Marca | PDF | Voz, tono, identidad visual, valores |
| Sitio web | URL scraping | Propuesta de valor, productos, servicios |
| Redes sociales existentes | Instagram/Facebook API | Frecuencia, mix de contenido, engagement |
| Campañas históricas | Upload | Creatividades que funcionaron / no funcionaron |
| Buyer Personas | Documento | Audiencia, problemas, lenguaje |
| Competidores | URLs | Benchmarks, diferenciadores |
| Objetivos de negocio | Formulario | Prioridades estratégicas |
| Paleta de colores / Tipografías | Archivos | Guías de estilo creativo |

---

## Diagnóstico inicial

Antes de generar la primera campaña, el sistema podría producir automáticamente:

- Consistencia de marca (¿el tono es coherente entre canales?)
- Mix de contenido actual (¿qué tipo de posts predominan?)
- Frecuencia de publicación histórica
- Canales activos y su performance relativa
- Fortalezas de comunicación detectadas
- Riesgos o inconsistencias
- Vacíos de información (qué no pudo analizar)
- Oportunidades inmediatas

Este diagnóstico no sería un reporte aislado. Sería el primer estado de las Brand Memories — directamente en el dominio del producto.

---

## Relación con el pipeline existente

No crea un nuevo motor. Inicializa mejor los motores que ya existen.

```
Intelligent Onboarding
  ↓
Brand Memory (primer estado con alta confidence)
  ↓
Knowledge Engine (arranca con contexto, no vacío)
  ↓
Decision / Recommendation / Strategy / Executive
```

La diferencia con el estado actual no es arquitectónica. Es temporal: el sistema llega a confianza útil desde el día 1 en lugar de semanas después.

---

## Diferencia con herramientas de diagnóstico existentes (ej. MOD)

Herramientas de auditoría de marca producen diagnósticos. Buenos diagnósticos. Pero aislados — el resultado es un PDF o reporte que el cliente lee y luego archiva.

Lo que este módulo haría es distinto:

> El diagnóstico se convierte directamente en Brand Memory del sistema.

No hay paso intermedio. No hay PDF. El análisis alimenta el dominio y el sistema empieza a operar con ese conocimiento desde el primer día.

---

## Criterio de implementación

**No implementar durante Sprint 9.**

Evaluar únicamente cuando se cumpla alguna de estas condiciones:

1. Sprint 9 (Autonomous Operations) está completo y en producción.
2. Hay un cliente nuevo en onboarding que podría beneficiarse directamente.
3. Se identifica que el tiempo de calentamiento del Knowledge Engine es el principal friccionante de la experiencia de cliente nuevo.

---

## Preguntas abiertas para cuando se evalúe

- ¿Qué fuentes tienen mayor ROI para la calidad de la Brand Memory inicial?
- ¿Cómo medir que el onboarding mejoró efectivamente el tiempo hasta "confianza útil"?
- ¿El cliente sube los archivos o el sistema los descubre automáticamente?
- ¿Hay un paso de revisión humana antes de que el diagnóstico se convierta en Memory?
- ¿Cómo se diferencia una Memory de onboarding de una Memory aprendida durante la operación?

---

*Documento vive en `/docs/08-roadmap/backlog-intelligent-onboarding.md`*
*No modifica el roadmap activo. No afecta Sprint 9.*
