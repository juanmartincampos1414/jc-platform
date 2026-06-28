# Architecture Retrospective v1.0

**Producto:** JC AI Agency
**Período:** Sprint -1 → Sprint 2B
**Fecha de cierre:** 2026-06-28
**Framework:** RUN72 OS

---

## Prefacio

Este documento no describe el producto.

Describe cómo evolucionó el producto y qué aprendimos durante ese proceso.

RUN72 ya no es solamente una metodología de diseño. Es una metodología validada mediante la evolución real de un producto en producción.

---

## 1. Timeline

### Sprint -1 — Product Documentation

**Objetivo:** Documentar lo que existía antes de intervenir.

**Problema inicial:** El producto funcionaba como una colección de features sin arquitectura subyacente. Había pantallas, rutas, componentes — pero no había un modelo conceptual que explicara por qué el producto existía.

**Decisión principal:** No tocar el código. Primero entender. Documentar el estado real, no el estado deseado.

**Resultado:** Primera foto clara del producto: qué funcionaba, qué estaba roto, qué era deuda técnica real y qué era complejidad accidental.

**Aprendizaje:** Sin documentación honesta del estado actual es imposible tomar decisiones de arquitectura. El sprint de documentación no es opcional — es la base de todo lo que viene.

---

### Sprint 0 — Technical Stabilization

**Objetivo:** Estabilizar la plataforma técnica antes de cualquier evolución.

**Problema inicial:** Errores TypeScript, mocks en rutas de producción, password reset sin implementar, estructura de código sin consistencia.

**Decisión principal:** Cero features nuevas. Solo estabilización. Resolver deuda técnica real antes de agregar complejidad.

**Resultado:** Build limpio. Rutas reales. Auth funcional. Base técnica confiable.

**Aprendizaje:** La deuda técnica no se resuelve "en paralelo" con el desarrollo. Se resuelve primero. Un producto inestable no puede evolucionar — solo puede acumular más inestabilidad.

---

### Sprint 0.5 — Product Recomposition

**Objetivo:** Redefinir conceptualmente qué es el producto.

**Problema inicial:** JClaude era tratada como una pantalla. Campaign no existía como entidad. El modelo mental del equipo era "postear en redes sociales con IA".

**Decisión principal:** Redefinir JClaude como capacidad del sistema, no como pantalla. Introducir Campaign como entidad central. Separar el modelo de UI del modelo de dominio.

**Resultado:** Primer modelo conceptual completo: Brand → Campaign → Creative → Asset → Distribution → Performance → Insight → Recommendation → Memory.

**Aprendizaje:** El producto organiza el código. El código no organiza el producto. Cuando el código organiza el producto, el resultado son carpetas que se llaman "pages" y archivos que se llaman "components". Eso no es arquitectura.

---

### Sprint 1 — Domain Migration

**Objetivo:** Migrar el producto al nuevo modelo de dominio sin romper producción.

**Problema inicial:** El producto operaba sobre tablas legacy (`jclaude_posts`, `social_posts`) que no reflejaban el dominio conceptual. Había 12 assets con `creative_id = NULL`.

**Decisión principal:** Dual-write pattern. Escribir simultáneamente en tablas legacy y nuevas tablas de dominio. Sin eliminar nada. Sin big bang.

**Resultado:** 36 creatives, 36 assets, 53 events, 2 memories. Dominio vivo en producción. Zero downtime.

**Aprendizaje:** Las migraciones de dominio no se hacen de una vez. El dual-write es costoso pero reversible. Un big bang es rápido pero irreversible. En sistemas en producción, la reversibilidad vale más que la velocidad.

---

### Sprint 2A — Knowledge Engine

**Objetivo:** Convertir el sistema de generativo a adaptativo.

**Problema inicial:** Cada generación de Claude era independiente. El sistema no aprendía de campañas anteriores. El conocimiento existía implícitamente en los datos pero nadie lo leía.

**Decisión principal:** Knowledge Engine como infraestructura transversal. No como feature de Claude. El conocimiento pertenece al producto — Claude es uno de los consumidores.

**Resultado:** 5 extractores funcionando. Knowledge Objects en `memories`. Confidence scoring. Prompt injection en generate-month v3. Ciclo de aprendizaje activo.

**Aprendizaje:** La primera arquitectura del Knowledge Engine lo acoplaba a Claude. El review de sprint corrigió eso: el conocimiento debe poder ser consumido por el Dashboard, por Recommendations, por futuros agentes — no solo por el modelo. Ese cambio conceptual fue más importante que el código.

---

### Sprint 2B — Decision Engine

**Objetivo:** Transformar conocimiento en criterio.

**Problema inicial:** El sistema sabía cosas pero no decidía nada. El conocimiento terminaba siendo texto inyectado en un prompt. Claude seguía siendo quien "decidía" qué generar.

**Decisión principal:** Separar definitivamente Knowledge de Decision. Toda Recommendation debe derivar de una Decision. Las Decisions son entidades del dominio — trazables, independientes del modelo, auditables.

**Resultado:** Tabla `decisions`. 4 derivadores (content, channel, timing, creative). Pipeline completo: Events → Knowledge → Decision → Claude. generate-month v4.

**Aprendizaje:** Fire-and-forget no funciona en Vercel serverless. Toda operación crítica del pipeline debe ser awaited. Además: el CHECK constraint de `memory_type` y la columna `metadata` faltante causaron fallos silenciosos durante tres iteraciones de validación. Los errores silenciosos son los más difíciles de debuggear.

---

## 2. Decisiones que cambiaron el producto

### Campaign como entidad central

**Problema:** Sin Campaign, no existía un contenedor conceptual para Assets, Performance ni Insights. Todo flotaba sin contexto temporal ni objetivo.

**Alternativa descartada:** Usar "proyectos" o "listas" como contenedor. Habría resuelto el problema de UI pero no el problema conceptual.

**Si no se tomaba:** El sistema seguiría siendo una lista de posts. No una plataforma de marketing.

---

### JClaude deja de ser pantalla

**Problema:** JClaude como pantalla imponía una organización de código basada en UI. Impedía que la capacidad de generación fuera consumida desde otros contextos (cron jobs, APIs, agentes).

**Alternativa descartada:** Mantener JClaude como pantalla y agregar APIs secundarias. Habría resultado en duplicación.

**Si no se tomaba:** La lógica de generación seguiría viviendo en un componente de React. Imposible de reutilizar, testear o evolucionar.

---

### Knowledge Engine como infraestructura

**Problema:** El conocimiento acumulado era texto en un prompt. Desaparecía con cada request. No podía ser consumido por Dashboard, Recommendations ni futuros agentes.

**Alternativa descartada:** Mantener el knowledge acoplado al prompt de Claude. Hubiera sido más rápido de implementar pero habría creado dependencia del modelo.

**Si no se tomaba:** Cambiar Claude por otro modelo hubiera requerido reescribir la lógica de conocimiento.

---

### Decision Engine desacoplado del modelo

**Problema:** Claude decidía qué generar basado en el prompt. Eso significa que el criterio del producto vivía en el modelo — no en el producto.

**Alternativa descartada:** Dejar que Claude "razone" sobre el conocimiento y genere sus propias decisiones. Habría sido más rápido pero las decisiones serían opacas, no trazables, y dependientes del modelo.

**Si no se tomaba:** Cada cambio de modelo o de prompt hubiera alterado el criterio del producto sin que el equipo lo controlara.

---

### Events como origen del sistema

**Problema:** Sin eventos, el sistema no tenía memoria de lo que había ocurrido. Cada operación era atómica y sin contexto.

**Alternativa descartada:** Usar los logs de Supabase como fuente de verdad. No hubieran sido consultables ni estructurados.

**Si no se tomaba:** Knowledge y Decision no podrían existir — no habría hechos que analizar.

---

### Memory desde Sprint 1

**Problema:** Sin memoria, el sistema no tenía identidad de marca. Cada generación comenzaba desde cero.

**Alternativa descartada:** Pasar el perfil de marca como parámetro en cada request. Habría funcionado a corto plazo pero no habría permitido la evolución hacia Knowledge ni Decision.

**Si no se tomaba:** Knowledge Engine no tendría dónde almacenar lo que aprende.

---

## 3. Principios descubiertos

Estos principios no fueron definidos al inicio. Emergieron durante la construcción.

**El dominio debe congelarse antes que la base de datos.**
Si la base de datos lleva la delantera, el esquema refleja la conveniencia técnica del momento, no el modelo conceptual del producto. Crear tablas antes de tener un modelo de dominio es construir sobre arena.

**La IA consume el dominio. No define el dominio.**
Claude no sabe qué es una Brand. No sabe qué es una Campaign. El producto sí lo sabe. El producto define las reglas. La IA ejecuta instrucciones dentro de esas reglas.

**El conocimiento existe una sola vez.**
Si el conocimiento vive en el prompt de Claude, muere con el request. Si vive en el dominio, puede ser consumido por cualquier componente — hoy y en el futuro.

**Todo pipeline crítico debe ser awaited en serverless.**
Fire-and-forget es una ilusión en funciones serverless. La función termina cuando retorna. Si algo debe ejecutarse, debe ejecutarse antes del return.

**Los errores silenciosos son el enemigo de la validación.**
Un INSERT que falla por un CHECK constraint no lanza excepción si está dentro de un try/catch silencioso. Validar en base de datos después de cada deploy es obligatorio — no opcional.

**El producto organiza el código. El código no organiza el producto.**
Carpetas por pantallas → el código organiza el producto. Carpetas por dominio → el producto organiza el código. La diferencia determina qué tan fácil es evolucionar la arquitectura.

**Una migración sin rollback no es una migración.**
Toda modificación al esquema debe poder revertirse. En producción no existe "vamos para adelante nomás".

**La documentación no es el final del sprint. Es el principio del siguiente.**
Cada reflection y cada retrospectiva es contexto que el equipo necesita para tomar mejores decisiones en el próximo sprint.

---

## 4. Anti-patrones detectados

**Organizar el producto por pantallas.**
Resulta en código donde la lógica de negocio vive en componentes de React. Imposible de reutilizar, testear o evolucionar sin reescribir la UI.

**Mezclar prompts con conocimiento.**
El prompt de Claude no es el lugar donde vive el conocimiento de la marca. Es el lugar donde se consume. Confundir los dos crea dependencia del modelo y hace el conocimiento desechable.

**Acoplar el dominio al modelo de IA.**
Si el dominio depende de Claude para funcionar, cambiar el modelo rompe el dominio. El modelo es un detalle de implementación — no una entidad del dominio.

**Crear tablas antes de definir contratos.**
Crear `jclaude_posts` antes de tener un modelo de dominio produjo una tabla que mezclaba concepto de post, asset, creative y distribution en un solo registro. Imposible de separar después sin una migración costosa.

**Resolver con features lo que es un problema de arquitectura.**
Agregar una nueva pantalla no resuelve un problema de modelo conceptual. Agregar un nuevo campo no resuelve un problema de dominio. Las features resuelven problemas de usuario — la arquitectura resuelve problemas del sistema.

**Asumir que fire-and-forget funciona en serverless.**
No funciona. Toda operación asíncrona que debe completarse debe ser awaited.

**Validar solo con TypeScript.**
TypeScript verifica tipos. No verifica que la base de datos acepte los valores. No verifica que las políticas RLS permitan el INSERT. No verifica que el CHECK constraint coincida con los valores del código. La validación real ocurre en producción con datos reales.

---

## 5. Patrones reutilizables

### Product Specific (JC AI Agency)

- Generación de calendario mensual de contenido
- Tipos de assets: post, reel, story, carousel
- Canales: Instagram, Facebook
- Reglas de copy: 150 chars, 8 hashtags
- Flujo OAuth con Meta Graph API
- Publicación automática vía `media_publish`
- Perfil de marca: industry, tone, target_audience

### RUN72 Core Candidates

**Domain Event Emitter**
`emitEvent()` + `emitActivity()` con separación de eventos de dominio y actividad legible. Genérico — no sabe nada de marketing.

**Knowledge Engine v1**
`Extractors → KnowledgeObject (typed + confidence) → Memory Store → Context Builder`
Reutilizable en cualquier producto con historial de entidades. Condición: 2+ productos.

**Decision Engine v1**
`Knowledge Objects → Derivers → Decision (trazable, con evidencia) → Consumer Context`
Reutilizable en cualquier producto que necesite transformar observaciones en criterio. Condición: 2+ productos.

**Confidence Scoring**
Score 0.0–1.0 basado en sample size. Umbral configurable. Filtro de ruido antes de cualquier consumo. Genérico.

**Agent Job Observability**
Registro de cada llamada a modelo de IA: model, tokens, duration, cost, status. Genérico — no depende del modelo ni del dominio.

**Dual-Write Migration Pattern**
Escribir en tablas legacy + nuevas tablas simultáneamente durante migración de dominio. Mantener ambas hasta validación completa. Rollback siempre disponible.

**Fire-and-Forget → Await Pipeline Rule**
En serverless: toda operación del pipeline crítico debe ser awaited. Documentar como invariante de infraestructura.

---

## 6. Evolución del Framework

### Qué cambió en RUN72 gracias a JC AI Agency

**Antes de JC AI Agency:** RUN72 era un framework teórico con principios definidos pero sin validación empírica en un producto real en producción.

**Después de JC AI Agency:** RUN72 tiene un caso documentado de aplicación completa — desde un dashboard sin arquitectura hasta un AI Marketing Operating System con dominio congelado, pipeline de aprendizaje y motor de decisiones.

### Qué quedó validado

- El concepto de Domain Model First: el dominio debe preceder al esquema.
- El ciclo Events → Memory → Knowledge → Decision como estructura base de inteligencia operativa.
- La separación entre producto (criterio) y modelo de IA (ejecución).
- El valor de documentar cada sprint antes de comenzar el siguiente.

### Qué cambió durante la construcción

- Knowledge Engine fue concebido originalmente como enriquecedor de prompts. Fue redefinido como infraestructura del producto. Ese cambio surgió del Sprint 2A Review — no estaba en el plan original.
- Decision Engine no estaba en el roadmap inicial de Sprint 2A. Surgió naturalmente como el siguiente paso después de consolidar Knowledge.

### Qué todavía necesita validación

- El ciclo completo con Performance real (métricas de Meta).
- El Recommendation Engine derivando acciones desde Decisions.
- Que el mismo Knowledge Engine funcione en un segundo producto (Margin, Stay).
- Que el mismo Decision Engine funcione en un dominio diferente al marketing.

---

## 7. Métricas de transformación

| Antes (Sprint -1) | Después (Sprint 2B) |
|---|---|
| Pantallas | Capacidades |
| Posts (`jclaude_posts`) | Assets vinculados a Creatives y Campaigns |
| Claude como cerebro del producto | Claude como consumidor del dominio |
| Dashboard de métricas | Command Center con decisiones trazables |
| Datos | Datos → Eventos → Conocimiento → Decisiones |
| Generación estática | Generación adaptativa (v4) |
| 0 tablas de dominio | 12 entidades de dominio |
| 0 events | 169 events |
| 0 knowledge objects | 5 knowledge objects activos |
| 0 decisions | 2 decisions activas |
| 0 agent_jobs trazados | 6 agent_jobs con modelo, tokens y duración |
| Sin memoria de marca | Brand Memory + Knowledge + Decisions |

---

## 8. Lecciones para futuros productos

### Haríamos igual

- Documentar antes de intervenir (Sprint -1).
- Estabilizar antes de evolucionar (Sprint 0).
- Congelar el dominio antes de crear tablas.
- Dual-write durante migraciones de dominio.
- Validar en producción con SQL después de cada deploy.
- Documentar decisiones arquitectónicas en ADRs.
- Escribir el Product Reflection al cerrar cada sprint.

### Haríamos distinto

- Definir el schema de `memories` con `metadata jsonb` desde el inicio. No descubrirlo en Sprint 2B.
- Definir los tipos válidos de `memory_type` incluyendo los del Knowledge Engine desde la migración inicial.
- Establecer desde Sprint 0 la regla "todo pipeline crítico es awaited" como constraint de infraestructura.
- Diseñar el CHECK constraint de `memory_type` coordinado con los tipos del código, no independientemente.

### Construiríamos primero

1. Domain Model (entidades, relaciones, invariantes).
2. Events (facts del dominio).
3. Memory (persistencia de contexto).
4. Agent Job Observability (trazabilidad de IA).
5. Dual-write hacia el nuevo dominio.
6. Knowledge Engine.
7. Decision Engine.
8. UI last.

### Jamás volveríamos a hacer

- Crear tablas según la conveniencia del frontend.
- Acoplar lógica de dominio a componentes de React.
- Dejar que el modelo de IA defina el criterio del producto.
- Usar fire-and-forget en serverless para operaciones críticas.
- Hacer big bang migrations en producción.
- Validar solo con TypeScript y asumir que la base de datos acepta lo que el código envía.

---

## 9. Actualización del Core

Los siguientes componentes están validados en producción y son candidatos formales a RUN72 Core OS:

**Domain Event System**
`emitEvent()` inmutable + `emitActivity()` legible. Validado en producción. Genérico.

**Agent Job Observability**
Registro completo de toda llamada a modelo de IA. Validado en producción. Genérico.

**Knowledge Engine v1**
Extractors → Confidence → Store → Context. Validado en producción con 5 tipos de conocimiento. Candidato al Core cuando aparezca en un segundo producto.

**Decision Engine v1**
Knowledge → Derivers → Decision trazable → Consumer. Validado en producción con 4 tipos de decisión. Candidato al Core cuando aparezca en un segundo producto.

**Dual-Write Migration Pattern**
Validado en Sprint 1. Cero downtime. Rollback disponible. Documentado.

**Await Pipeline Rule**
Toda operación crítica del pipeline debe ser awaited en serverless. Validado por falla y corrección en Sprint 2B. Debe documentarse como invariante en el Core.

---

## 10. Preparación para Sprint 3

**¿Está el producto listo para comenzar la etapa de Inteligencia Operativa?**

**Sí.**

Por estas razones:

El dominio está congelado. Brand → Campaign → Creative → Asset → Distribution → Performance → Insight → Recommendation → Memory. Ninguna entidad central falta.

El pipeline de aprendizaje funciona en producción. Events → Knowledge → Decision → Claude. Cada generación es más informada que la anterior.

La IA está en su lugar correcto. Claude consume contexto y decisiones. No define criterio. No posee conocimiento. No toma decisiones del dominio.

La observabilidad está activa. Cada llamada a Claude está registrada en `agent_jobs` con modelo, tokens, duración y costo.

La arquitectura es extensible. Agregar un nuevo extractor de conocimiento no requiere modificar el motor. Agregar un nuevo derivador de decisiones no requiere modificar el pipeline. Los contratos están definidos.

Lo que empieza en Sprint 3 no es más arquitectura.

Es inteligencia operativa real: conectar Performance → Evidence → Knowledge → Decision → Recommendation → Nueva Campaign.

Ese ciclo cierra el loop completo.

En ese momento JC AI Agency deja de ser una plataforma que ayuda a crear contenido y se convierte en un sistema que aprende, razona, decide y mejora continuamente la operación de marketing de cada Brand.

---

## Disciplina de artefactos — a partir de Sprint 3

Cada etapa produce exactamente cuatro artefactos:

| Artefacto | Contenido | Cuándo |
|---|---|---|
| **Build Spec** | Qué vamos a construir, contratos, Definition of Done | Antes del sprint |
| **Implementation** | El código. Commits. Migraciones. Tests. | Durante el sprint |
| **Reflection** | Qué aprendimos. Qué simplificamos. Qué eliminamos. | Al cerrar el sprint |
| **Architecture Retrospective** | Qué cambió en RUN72. Qué se mueve al Core. | Al cerrar cada etapa mayor |

Esta disciplina garantiza que el conocimiento no se disperse y que el Framework evolucione al mismo ritmo que los productos.

Es una ventaja competitiva estructural: cada producto que construimos hace al Framework más inteligente. Cada sprint que documentamos hace al siguiente más rápido.

---

*RUN72 OS — Architecture Retrospective v1.0*
*JC AI Agency — primer caso documentado de aplicación completa*
*2026-06-28*
