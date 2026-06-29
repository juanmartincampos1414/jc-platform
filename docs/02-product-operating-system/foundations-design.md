# Foundations — Documento de Diseño
## RUN72 Core OS

**Versión:** 0.2 · 2026-06-28
**Estado:** Diseño — no implementado
**Propósito:** Responder una sola pregunta antes de introducir cualquier cambio estructural al framework.

> **¿Qué principios ya dejaron de pertenecer a un producto y empezaron a pertenecer a RUN72 Core OS?**

---

## Por qué aparece esta pregunta ahora

Hasta Sprint 6 de JC AI Agency, RUN72 fue acumulando:

- Componentes de implementación.
- Contratos de dominio.
- Motores de procesamiento.
- Build Rules operacionales.
- Capabilities mapeadas.
- ADRs de decisiones de arquitectura.

Todos esos artefactos comparten una propiedad: pertenecen a un producto concreto aunque puedan migrarse a otros.

Intelligence Levels es diferente.

No es una implementación. No es una librería. No es un motor. Es una propiedad que probablemente exista en cualquier producto construido sobre RUN72: Margin la necesitará, Stay la necesitará, JC AI Agency ya la necesita. Y cualquier producto futuro también.

Cuando aparece algo que es verdad en múltiples productos antes de que esos productos existan, esa cosa probablemente no pertenezca a ninguno de ellos.

Pertenece al Core.

---

## Tres capas de conocimiento

El framework actual tiene conocimiento de distinta estabilidad mezclado en el mismo nivel documental. Una distinción útil:

### Capa 1 — Lo que cambia frecuentemente
Código, componentes, esquemas de base de datos, rutas de API. Cambia con cada sprint. No aspira a ser permanente.

### Capa 2 — Lo que evoluciona lentamente
Build Rules, Capability Map, ADRs. Cambia cuando hay evidencia de que algo no funciona como se asumía. Evolución intencional, no frecuente.

### Capa 3 — Lo que cambia únicamente con evidencia extraordinaria
Leyes descubiertas en múltiples contextos. No son inmutables — son principios que requieren evidencia extraordinaria para modificarse, porque modificar uno implica modificar cómo RUN72 entiende el problema que resuelve.

La diferencia con Capa 2 no es de frecuencia. Es de criterio. Una Build Rule cambia cuando hay evidencia de que la regla es incorrecta. Un principio de Capa 3 cambia únicamente cuando hay evidencia suficiente para modificar RUN72 Core OS completo.

Esta tercera capa no tiene nombre todavía. La propuesta es llamarla **Foundations**.

---

## Qué es una Foundation

Una Foundation no es una decisión de implementación.

Es una propiedad permanente del sistema — una ley descubierta que se sostiene con evidencia a través de múltiples productos y contextos.

**Criterio de entrada:**
1. Aparece en más de un producto, o aparece en un producto pero es obvio que aparecerá en cualquier otro.
2. Modificarla requeriría re-pensar cómo el sistema funciona, no solo cómo está construido.
3. No describe qué hacer. Describe cómo el sistema entiende el problema.

**Criterio de exclusión:**
- Si puede implementarse de manera distinta en distintos productos → es un patrón, no una Foundation.
- Si describe una regla de proceso → es una Build Rule, no una Foundation.
- Si describe una decisión arquitectónica → es un ADR, no una Foundation.

---

## Core Candidate vs Core Primitive

Hasta ahora RUN72 usó el término **Core Candidate** para marcar algo que podría migrar al Core.

Intelligence Levels introdujo una distinción nueva.

Un Core Candidate es algo que funciona en un producto y podría funcionar en otros.

Un **Core Primitive** es algo que ya es verdad en cualquier producto antes de construirlo.

| | Core Candidate | Core Primitive |
|---|---|---|
| Naturaleza | Implementación portable | Propiedad del sistema |
| Origen | Funciona en producto A, podría funcionar en B | Verdad antes de construir cualquier producto |
| Validación | Se valida migrándolo | Se valida encontrándolo en múltiples contextos |
| Impacto de modificación | Cambia la implementación | Cambia cómo RUN72 entiende el problema |
| Ejemplo | `intelligence-renderer` module | Intelligence Levels como concepto |

Una Foundation es la formalización de un Core Primitive.

---

## Hipótesis: candidatos a Foundation

Los siguientes principios ya demuestran comportamiento de Core Primitive. No son documentos que deban crearse — son propiedades que ya existen y están siendo descubiertas.

### 1. Intelligence Levels

**Evidencia:** JC AI Agency necesita tres formas distintas de presentar la misma inteligencia según el consumidor (Operacional / Management / Executive). Cualquier producto con IA que sirva a múltiples roles tendrá exactamente este problema.

**Por qué es una Foundation y no una Build Rule:** no describe cómo construir la presentación. Describe que la presentación es inherentemente múltiple cuando la inteligencia sirve a roles distintos.

**Estado:** formalizado en `intelligence-levels.md`. Pendiente de elevación al Core.

---

### 2. Learning Boundaries

**Evidencia:** JC AI Agency definió tres scopes de aprendizaje (Workspace / Brand / Platform). El principio — que el aprendizaje de una entidad no puede contaminar otra sin consentimiento explícito — es verdad en cualquier producto multi-tenant con IA.

**Por qué es una Foundation:** no describe cómo almacenar Memories. Describe que el aprendizaje tiene límites por diseño, no por implementación.

**Estado:** documentado en `docs/05-data-architecture/learning-boundary.md`. Pendiente de elevación.

---

### 3. Universal Workflow

**Evidencia:** el flujo Input → Brief → Generation → Review → Approval → Publication aparece en contenido orgánico, ads, documentos legales, influencers. Cada dominio tiene su variante pero el patrón es el mismo.

**Por qué es una Foundation:** no describe un módulo. Describe que cualquier creación de valor en estos productos sigue una secuencia invariante.

**Estado:** documentado en `universal-workflow.md`. Ya reconocido como patrón del Core.

---

### 4. Knowledge Philosophy

**Hipótesis:** cualquier producto construido sobre RUN72 que aprenda del comportamiento del usuario necesita distinguir entre hecho observado, inferencia y feedback explícito. La forma en que el sistema trata esas tres cosas determina si el aprendizaje es confiable o contaminado.

**Por qué es una Foundation:** no describe la tabla `memories`. Describe cómo el sistema entiende qué es conocimiento y qué no lo es.

**Estado:** implícito en el Knowledge Engine de JC AI Agency. No formalizado. Requiere extracción.

---

### 5. Decision Philosophy

**Hipótesis:** cualquier sistema que tome decisiones sobre datos necesita separar la evidencia del razonamiento y el razonamiento del resultado. Esa separación no es una conveniencia de implementación — es lo que hace que las decisiones sean auditables y mejorables.

**Por qué es una Foundation:** no describe la tabla `decisions`. Describe por qué las decisiones tienen estructura y no son strings.

**Estado:** implícito en el modelo de datos de JC AI Agency. No formalizado.

---

## Dos dimensiones que completan Intelligence Levels

Durante el review de este documento aparecieron dos dimensiones que el modelo actual de Intelligence Levels no captura y que probablemente sean propias de una Foundation:

### Refresh Strategy

La inteligencia no solo se presenta distinto según el nivel — se actualiza distinto.

| Nivel | Refresh | Razón |
|---|---|---|
| Operacional | Real Time | El usuario toma una decisión ahora. El dato debe ser actual. |
| Management | Near Real Time | El usuario evalúa tendencias. Un lag de minutos es aceptable. |
| Executive | Scheduled / Cached | El usuario lee narrativa. Calcularla en tiempo real es caro e innecesario. Generación periódica (cron semanal) con caché. |

Esta dimensión tiene implicancias de implementación concretas: el Executive Panel no debe calcularse on-demand. Debe generarse por cron y servirse desde caché. El costo computacional de generar narrativa Claude para un CMO que entra dos veces por semana no justifica cálculo en tiempo real.

### Compute Budget

La inteligencia en cada nivel tiene distinta densidad de procesamiento.

| Nivel | Budget | Qué justifica |
|---|---|---|
| Operacional | Bajo | Lectura de datos ya procesados. Sin Claude en el path crítico. |
| Management | Medio | Agregación + síntesis ligera. Claude opcional en path secundario. |
| Executive | Alto | Narrativa generada por Claude sobre múltiples fuentes. Justifica costo porque el usuario es el decisor de mayor impacto. |

La regla de diseño implícita: el presupuesto computacional debe ser proporcional al impacto de la decisión que habilita — no a la frecuencia de uso.

Estas dos dimensiones deben añadirse a `intelligence-levels.md` cuando se eleve al Core.

---

## Lo que este documento no propone

Este documento no propone:

- Crear una nueva carpeta de documentación todavía.
- Mover ningún documento existente.
- Cambiar la estructura del repositorio.
- Definir cuántas Foundations existen.

Propone una sola cosa:

> Reconocer que existe una tercera capa de conocimiento en RUN72 — más permanente que las Build Rules, más abstracta que las implementaciones — y que algunos principios ya están viviendo en esa capa aunque no la hayamos nombrado todavía.

La nomenclatura (Foundations, Core Primitives) es tentativa. Lo que no es tentativo es la distinción que describe.

---

## Ciclo de vida de un Core Primitive

### Promoción: de Candidate a Foundation

Un Core Primitive puede promoverse a Foundation únicamente cuando cumple las condiciones (A o B) **y además** la condición C:

**A.** Ha aparecido de forma independiente en al menos dos productos.

**o**

**B.** Ha demostrado gobernar una decisión arquitectónica fuera del producto donde nació.

**y además**

**C.** No depende de un dominio específico — es verdad independientemente del tipo de producto construido sobre RUN72.

La promoción deja de ser cuantitativa. Pasa a ser empírica. No se mide por cantidad de documentos ni de productos. Se mide por evidencia de universalidad.

---

### Degradación: de Foundation a Candidate

Una Core Primitive puede degradarse a Candidate cuando:

- Nueva evidencia contradice el principio en múltiples contextos.
- Deja de aparecer de manera consistente en productos posteriores.
- Una Primitive más general la absorbe y la hace redundante.

La degradación no es un fracaso. Es el sistema aprendiendo que su comprensión anterior era incompleta.

Este ciclo convierte a RUN72 en un sistema evolutivo, no únicamente acumulativo. Foundations crece con evidencia y encoge con evidencia. Nunca crece por inercia.

---

### Condición para crear la capa formal

La capa Foundations como estructura documental debería existir formalmente cuando al menos un Core Primitive haya completado el ciclo de promoción según los criterios anteriores.

Hasta entonces, los candidatos viven en sus documentos actuales con el tag `[Core Primitive Candidate]`.

---

## Próximos pasos

No hay próximos pasos de implementación.

El único próximo paso es:

> Tagear los documentos candidatos (`intelligence-levels.md`, `learning-boundary.md`, `universal-workflow.md`) con `[Core Primitive Candidate]` para distinguirlos del resto de la documentación.

Cuando aparezca el segundo producto activo de RUN72, revisar este documento y decidir si la evidencia es suficiente para crear la capa formal.

---

---

## RUN72 Principle — Las preguntas estables son más valiosas que las respuestas estables

Las respuestas cambian cuando aparece nueva evidencia.

Las preguntas correctas sobreviven a los productos.

RUN72 no avanzó porque encontró respuestas definitivas. Avanzó porque fue formulando preguntas cada vez mejores. La pregunta que abre este documento — *¿qué principios ya dejaron de pertenecer a un producto?* — es más útil que cualquier respuesta concreta que el documento ofrezca. Las respuestas serán reemplazadas. La pregunta seguirá siendo válida.

Esto describe algo profundo sobre cómo evoluciona RUN72: el sistema no busca certezas permanentes. Busca preguntas permanentes desde las cuales derivar certezas temporales.

Una Foundation, entonces, no es una respuesta congelada. Es una pregunta tan bien formulada que sus respuestas resultan predecibles antes de construir cada producto nuevo.

---

*Documento vive en `/docs/02-product-operating-system/foundations-design.md`*
*Relacionado: `build-rules.md` (Reglas 16-20) · `intelligence-levels.md` · `learning-boundary.md` · `universal-workflow.md`*
