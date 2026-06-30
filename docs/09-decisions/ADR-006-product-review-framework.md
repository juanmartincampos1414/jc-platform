# ADR-006 — Product Review: framework antes que caso

**Fecha:** 2026-06-30
**Estado:** ACEPTADO
**Autores:** Juan Campos, JC AI Agency

---

## Contexto

Durante el Product Review v1.0 se cerró el argumento del producto en cinco dimensiones (Trabajo actual, Trabajo absorbido, Cambio de rol, Cambio organizacional, Número observable), con la regla de que la quinta dimensión se basa únicamente en números observables, no en proyecciones.

El paso natural parecía ser construir el Product Review para un cliente específico. Pero eso haría que el conocimiento naciera mezclado con un cliente: el método y el caso quedarían acoplados, y los casos siguientes no serían comparables porque cada uno reinventaría la forma de medir.

El framework pertenece a RUN72 (es un método). El caso pertenece a JC AI Agency (es una instancia). Mezclarlos viola la separación de responsabilidades ya establecida en `evidence-package-protocol.md` (RUN72 decide, el producto descubre).

## Decisión

**Se construye primero el método, después la instancia.**

1. `Product Review Framework v1.0` se documenta como método puro: sin cliente, sin nombres, sin números específicos. Vive en `/docs/02-product-operating-system/product-review-framework.md` y se clasifica `[Core Primitive Candidate]`.
2. Recién después se crea la primera instancia (`Product Review — [Cliente]`) completando la plantilla del framework. El primer caso es un cliente real de Juan, elegido por contexto y confianza, **no** como lugar donde se diseña el método.
3. El framework solo se versiona si una instancia real demuestra que el método falla. Una instancia nunca modifica el método.

## Alternativas consideradas

- **Construir directamente el Product Review del primer cliente.** Rechazada: el método nacería acoplado a un caso y los clientes no serían comparables.
- **Mantener el Product Review como presentación comercial puntual.** Rechazada: sería un documento, no una herramienta. No alimentaría onboarding, success ni roadmap de forma sistemática.

## Por qué esta decisión

Si el framework nace correctamente, cualquier cliente se mide con la misma metodología, los casos son comparables, y el Product Review deja de ser una presentación para convertirse en un activo estratégico reutilizable: a la vez herramienta de ventas, onboarding y Customer Success (Health Check del cliente).

## Consecuencias

- Cada Product Review genera automáticamente tres mapas (operativo, organizacional, económico) que alimentan ventas, onboarding, success, roadmap y la evidencia para RUN72 Core.
- La regla "evidencia, no proyección" queda como invariante del método, no como criterio de un caso.
- Se introduce una distinción permanente framework / instancia que habrá que respetar en cada cliente nuevo.
- Cuando exista la primera instancia validada, se emite **EP-004 — Product Review Framework** al hilo de RUN72 Core.
- v1.0 incorpora dos secciones de cierre obligatorias — **Cost of Inaction** (por qué importaba) y **Next Constraint** (qué sigue) — que las cinco columnas no capturan. Con ellas, el Product Review deja de ser solo una evaluación del presente y pasa a ser un mecanismo permanente de aprendizaje para el producto, el cliente y RUN72 Core: Cost of Inaction se ancla en dolor observable (no es proyección); Next Constraint mira hacia adelante a propósito y alimenta roadmap/upsell sin entrar como evidencia en el argumento comercial.

## Qué revisar en el futuro

- Si al completar las primeras instancias reales el método de cinco dimensiones resulta insuficiente o ambiguo → versionar a `v1.1`.
- Si el Product Review se confirma como Health Check recurrente → evaluar convertirlo en capacidad estándar del producto (no solo método), con soporte en el sistema.

---

*Relacionado: `02-product-operating-system/product-review-framework.md` · `evidence-package-protocol.md`*
