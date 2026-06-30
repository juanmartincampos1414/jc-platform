# Product Review Framework
## RUN72 Core OS — Método para medir el impacto real de un producto sobre la operación de un cliente

**Versión:** 1.0 · 2026-06-30
**Origen:** Product Review v1.0 — definición del método antes del primer caso real
**Clasificación:** `[Core Primitive Candidate]` — ver `foundations-design.md`
**Alcance:** JC AI Agency + cualquier producto construido sobre RUN72 Core OS

---

## El principio

El framework pertenece a RUN72. El caso pertenece al producto.

```
RUN72 Core          →    define el método
Producto (JC)       →    completa la instancia
```

El conocimiento no debe nacer mezclado con un cliente. Debe nacer como método.

Si el framework nace correctamente, cualquier cliente podrá medirse exactamente con la misma metodología, y el segundo, tercer y cuarto caso serán comparables entre sí. Ahí es donde el Product Review deja de ser una presentación y se convierte en un activo estratégico del producto.

**Este documento no contiene ningún cliente, ningún nombre, ningún número específico. Solo el método.**

---

## Qué es un Product Review

Un Product Review mide el estado de la operación de un cliente **antes y después** de implementar el producto.

No mide el estado del producto. Mide el estado del cliente.

Por eso funciona, al mismo tiempo, como tres herramientas:

| Herramienta | Cómo lo usa |
|---|---|
| **Ventas** | El argumento no es "nuestro producto es bueno". Es "esta es tu operación hoy, este es el número observable, así cambia". |
| **Onboarding** | Define qué trabajo absorbe el producto y qué rol pasa a tener cada persona. |
| **Customer Success** | Es el Health Check recurrente: mide si la operación efectivamente cambió. |

Es el equivalente a un **Health Check del cliente**: no diagnostica el software, diagnostica la operación del cliente en relación al software.

---

## Qué NO es un Product Review

- No es una proyección. Solo registra lo observable.
- No es una presentación comercial con números inventados.
- No es un caso de estudio narrativo.
- No es el lugar donde se diseña el método. Eso es este documento.
- No contiene un cliente. Las **instancias** contienen el cliente; el **framework** nunca.

---

## Separación framework / instancia

```
product-review-framework.md      →  el método (este documento). Vive en RUN72 / 02-product-operating-system.
product-review-cliente-X.md      →  una instancia. Completa la plantilla. Vive junto a los datos del cliente.
```

El framework se diseña una vez. Las instancias se generan muchas veces. Una instancia nunca modifica el método: si al completarla se descubre que el método falla, se versiona el framework (ver *Versionado*), no la instancia.

---

## Las cinco dimensiones

El Product Review modela la operación del cliente como una tabla. **Cada fila es una unidad de trabajo** de la operación actual. **Cada columna es una de las cinco dimensiones** que traza cómo esa unidad de trabajo se transforma al implementar el producto.

| # | Dimensión | Pregunta que responde |
|---|---|---|
| 1 | **Trabajo actual** | ¿Qué hace hoy el cliente, manualmente, antes del producto? |
| 2 | **Trabajo absorbido** | ¿Qué parte de ese trabajo pasa a ejecutarse dentro del producto? |
| 3 | **Cambio de rol** | ¿Cómo cambia el trabajo de la persona que lo hacía? |
| 4 | **Cambio organizacional** | ¿Cómo cambia la organización, más allá de la persona? |
| 5 | **Número observable** | ¿Qué número medible evidencia el cambio? |

Las cinco columnas, leídas en orden, cuentan el argumento completo: *esto se hacía a mano → el sistema absorbe esta parte → la persona pasa de ejecutar a decidir → la organización cambia de forma → y este número lo prueba.*

---

### Dimensión 1 — Trabajo actual

**Qué mide:** la tarea tal como existe hoy, antes del producto.

**Cómo se documenta:**
- Nombre de la tarea.
- Quién la ejecuta.
- Frecuencia (diaria, semanal, mensual, por campaña).
- Esfuerzo aproximado (tiempo real, no ideal).
- Herramientas actuales.
- Dependencias externas (agencia, freelancer, proveedor).

**Qué cuenta como evidencia:** la observación directa de cómo se trabaja **realmente**, no la descripción del proceso ideal.

**Error común:** documentar el proceso que *debería* existir en vez del que existe. El Product Review se rompe en la columna 1 si registra aspiraciones en lugar de la operación real.

---

### Dimensión 2 — Trabajo absorbido

**Qué mide:** qué porción del trabajo de la columna 1 pasa a ejecutarse dentro del producto.

La absorción **no es binaria**. Se mide por nivel, y el nivel se corresponde con la Autonomy Policy del producto (ver `build-rules.md`, Regla 21):

| Nivel de absorción | Qué significa | Equivale a |
|---|---|---|
| **No absorbido** | El producto no toca esta tarea. | — |
| **Asistido** | El sistema ayuda; el humano ejecuta. | Recommendations |
| **Absorbido con aprobación** | El sistema ejecuta; el humano aprueba. | Approval Required |
| **Absorbido autónomo** | El sistema ejecuta solo, dentro de su policy. | Autonomous (Action Class permitida) |

**Regla dura:** solo cuenta como absorbido lo que el producto hace **en producción, real, hoy**. Un mock no absorbe trabajo. (Build Rules, Regla 2.)

**Error común:** marcar como "absorbido" una capacidad que existe en la UI pero no está conectada. Si no es real, el nivel es "No absorbido".

---

### Dimensión 3 — Cambio de rol

**Qué mide:** cómo cambia el trabajo de la **persona**, no si la persona desaparece.

El patrón típico es un ascenso de altitud:

```
ejecutor   →   revisor   →   estratega
(hace)         (aprueba)     (define)
```

**Cómo se documenta:**
- Rol antes.
- Rol después.
- Qué deja de hacer.
- Qué empieza a hacer (trabajo de mayor valor que antes no tenía tiempo de hacer).

**Principio:** el cambio de rol no es reducción de personas. Es **reasignación de capacidad humana** desde trabajo absorbible hacia trabajo que solo un humano puede hacer.

---

### Dimensión 4 — Cambio organizacional

**Qué mide:** el efecto a nivel **estructura**, no a nivel persona individual.

**Ejemplos de lo que se documenta:**
- Menor dependencia de una agencia externa o freelancer.
- Capacidad de escalar (más clientes / más output) sin crecer headcount de forma lineal.
- Menor turnaround entre pedido y entrega.
- Trabajo que antes requería coordinar a varias personas y ahora ocurre en un solo lugar.

**Cómo se documenta:** estructura antes → estructura después → qué dependencia se elimina o reduce.

**Qué cuenta como evidencia:** cambios reales en cómo opera la organización. No aspiraciones de cómo *podría* operar.

---

### Dimensión 5 — Número observable

**Qué mide:** la evidencia cuantitativa del cambio.

**Regla absoluta — solo números observables, nunca proyecciones.**

Un número es **observable** si se puede señalar **dónde está hoy**, con una fuente, idealmente con un valor antes y un valor después.

**Estructura mínima de un número observable:**

| Campo | Ejemplo de tipo (no de valor) |
|---|---|
| Métrica | qué se mide |
| Valor antes | medido en la operación pre-producto |
| Valor después | medido en la operación post-producto |
| Fuente | de dónde sale el número (sistema, factura, registro de tiempo, calendario) |
| Fecha de medición | cuándo se midió |
| Delta | la diferencia observada |

**Tipos válidos de número observable:**
- Tiempo (horas/semana dedicadas a la tarea).
- Throughput (piezas producidas por mes).
- Velocidad (días de turnaround).
- Costo (gasto mensual en agencia / freelancers / herramientas).
- Cobertura (cantidad de clientes o marcas atendidas con la misma estructura).

**Prohibido en la columna 5:** "ahorraría", "podría", "estimamos", "proyectamos", "se espera". Si no se midió, no entra. Las hipótesis, si existen, viven en el **Anexo de hipótesis**, claramente separadas, y nunca se presentan como evidencia.

---

## La regla de oro: evidencia vs proyección

Todo el valor del Product Review depende de esta distinción.

| | Evidencia | Proyección |
|---|---|---|
| Tiempo | Pasado o presente | Futuro |
| Definición | Algo que ya ocurrió y se puede mostrar | Algo que se espera que ocurra |
| Dónde vive | En las cinco columnas | En el Anexo de hipótesis |

**Test de una sola pregunta:**

> *"¿Puedo señalar dónde está este número hoy?"*

Si la respuesta es **sí**, es evidencia → va al Product Review.
Si la respuesta es **no**, es proyección → va al anexo, separada, nunca en la columna 5.

Un Product Review construido solo con evidencia es defendible frente a cualquier cliente. Uno que mezcla evidencia con proyección pierde toda su fuerza comercial, porque vuelve a ser una promesa.

---

## Cómo evaluar absorción parcial

La mayoría de las tareas no se absorben al 100% ni al 0%. El framework lo resuelve con los cuatro niveles de la Dimensión 2.

Para evaluar el nivel de una tarea, preguntar en orden:

1. ¿El producto toca esta tarea en producción? → si no, **No absorbido**.
2. ¿El humano todavía ejecuta el trabajo? → si sí, **Asistido**.
3. ¿El sistema ejecuta pero requiere aprobación humana? → **Absorbido con aprobación**.
4. ¿El sistema ejecuta solo dentro de su policy? → **Absorbido autónomo**.

La absorción parcial es **información, no debilidad**: muestra exactamente dónde está la frontera actual del producto, y por lo tanto alimenta el roadmap (qué falta para subir un nivel).

---

## Cómo documentar cambios organizacionales

Los cambios organizacionales (Dimensión 4) son los más fáciles de exagerar y los más difíciles de probar. Disciplina:

- Documentar **solo lo que cambió**, no lo que podría cambiar.
- Anclar cada cambio organizacional a una o más tareas absorbidas (columna 2). Un cambio organizacional sin trabajo absorbido detrás es una proyección disfrazada.
- Distinguir cambio de **estructura** (cómo se organiza el trabajo) de cambio de **costo** (eso es número observable, Dimensión 5).
- Si el cambio aún no ocurrió pero es esperable, va al Anexo de hipótesis.

---

## Los tres mapas que produce

Un Product Review completo genera tres mapas. Cada cliente, al completar la plantilla, los genera automáticamente:

| Mapa | Se construye con | Responde |
|---|---|---|
| **Mapa operativo** | Dimensiones 1 y 2 | ¿Qué trabajo cambió y cuánto absorbe el producto? |
| **Mapa organizacional** | Dimensiones 3 y 4 | ¿Cómo cambian los roles y la estructura? |
| **Mapa económico** | Dimensión 5 | ¿Cuál es el número observable del cambio? |

Estos tres mapas son la salida reutilizable del método.

---

## Dos secciones de cierre obligatorias

Las cinco dimensiones y los tres mapas describen el **presente**: qué cambió y qué lo prueba. Todo Product Review cierra, además, con dos secciones obligatorias que las cinco columnas no capturan: una mira hacia atrás (por qué importaba), otra hacia adelante (qué sigue).

Estas dos secciones **no son columnas de la tabla**. Son secciones narrativas al final del documento. La estructura de cinco columnas no cambia.

### Cost of Inaction — el costo de no hacer nada

**Pregunta obligatoria:** *Si este producto nunca existiera, ¿qué seguiría ocurriendo dentro de la organización?*

Mide el costo de oportunidad real del problema. **No siempre es dinero.** A menudo es:
- crecimiento bloqueado;
- dependencia de personas puntuales;
- lentitud;
- errores;
- pérdida de conocimiento;
- imposibilidad de escalar;
- desgaste operativo.

**Disciplina de evidencia:** el Cost of Inaction no es una catástrofe inventada. Se construye sobre el dolor **ya observable hoy** (Dimensión 1) y describe su **continuación** si nada cambia. Es la trayectoria del status quo anclada en lo que ya ocurre — no una proyección de desastre.

**Para qué sirve:** explica *por qué era importante cambiar*. Fortalece el argumento de ventas (quedarse quieto también cuesta) y la priorización interna (qué problemas duelen de verdad).

### Next Constraint — el siguiente cuello de botella

**Pregunta obligatoria:** *Ahora que resolvimos este problema, ¿cuál es el siguiente cuello de botella que aparece?*

Cuando se absorbe un trabajo, el límite de la operación se mueve a otro lado. Esta sección nombra ese nuevo límite.

**Naturaleza:** a diferencia de la Dimensión 5, esta sección **mira hacia adelante a propósito**. No es número observable ni pretende serlo. Es dirección, no evidencia, y por eso vive fuera de las cinco columnas y nunca entra en el argumento comercial como prueba.

**Para qué sirve:** alimenta directamente roadmap (qué construir después), upsell (qué necesita el cliente a continuación), Customer Success (próximo problema a acompañar), nuevos productos y RUN72 Core (qué constraint se repite entre clientes).

Con esta sección, el Product Review deja de ser un cierre y se convierte en el **inicio del siguiente ciclo**.

---

## Cómo se convierte en argumento comercial

El argumento comercial **no se inventa**: se lee directamente de los tres mapas.

```
"Esta es tu operación hoy."            →  Mapa operativo (columna 1)
"Esto es lo que el sistema absorbe."   →  Mapa operativo (columna 2)
"Así cambia tu equipo y tu estructura."→  Mapa organizacional (columnas 3-4)
"Y este es el número observable."      →  Mapa económico (columna 5)
"Y esto seguiría costándote si no cambia." →  Cost of Inaction
```

La prueba del producto es la propia operación del cliente, medida con evidencia. No hay promesa que defender porque no hay proyección que vender.

---

## A quién alimenta

Cada Product Review completado alimenta directamente cinco destinos:

| Destino | Qué consume |
|---|---|
| **Ventas** | El argumento de los tres mapas + el Cost of Inaction. |
| **Onboarding** | El mapa operativo: qué se absorbe, qué rol cambia. |
| **Customer Success** | El Product Review recurrente como Health Check + el Next Constraint. |
| **Upsell** | El Next Constraint: qué necesita el cliente a continuación. |
| **Roadmap** | Las tareas en nivel "Asistido" o "No absorbido" + el Next Constraint: qué falta y qué sigue. |
| **RUN72 Core** | Evidencia real de que el método de absorción funciona en un producto. (Evidence Package.) |

---

## Cómo se corre un Product Review (proceso)

```
1. Observar la operación real del cliente (estado pre).
2. Mapear las unidades de trabajo → filas.
3. Para cada fila, completar Dimensiones 1 a 4.
4. Medir los números observables (estado antes) → Dimensión 5.
5. Implementar el producto.
6. Volver a medir los números observables (estado después).
7. Generar los tres mapas.
8. Responder las dos secciones de cierre: Cost of Inaction y Next Constraint.
9. Leer el argumento comercial desde los mapas + el Cost of Inaction.
10. Si el método falló en algún punto → versionar el framework, no la instancia.
```

Los pasos 1–4 se pueden completar antes de vender (diagnóstico). El paso 6 cierra el ciclo después de implementar (validación). Por eso el mismo documento sirve para ventas y para Customer Success.

---

## Versionado del framework

- El framework se versiona de forma independiente de las instancias (`Product Review Framework v1.0`, `v1.1`, …).
- Una instancia declara **con qué versión del framework fue medida**, para que las comparaciones entre clientes sean válidas.
- El framework solo se versiona cuando completar una instancia real demuestra que el método falla o le falta algo. Nunca se modifica para acomodar un cliente puntual.

---

## Relación con RUN72 Core

Este método es un `[Core Primitive Candidate]`. Cuando exista la primera instancia validada con un cliente real, emitir el **Evidence Package EP-004 — Product Review Framework** (ver `evidence-package-protocol.md`) para que el hilo de RUN72 Core decida si se promueve a Foundation.

La discusión sobre si el Product Review pertenece al Core como primitiva universal **no ocurre en este documento**. Ocurre en el hilo de RUN72 Core, a partir del Evidence Package.

---

## Anexo — Plantilla canónica (instancia vacía)

> Copiar esta plantilla a `product-review-cliente-[X].md` para crear una instancia.
> La plantilla no contiene cliente, nombre ni número: es parte del método.

```markdown
# Product Review — [Cliente]

**Framework:** Product Review Framework v1.0
**Fecha de diagnóstico (pre):** YYYY-MM-DD
**Fecha de validación (post):** YYYY-MM-DD
**Estado:** Diagnóstico / Implementado / Validado

## Tabla de operación (cinco dimensiones)

| Unidad de trabajo | 1. Trabajo actual | 2. Trabajo absorbido (nivel) | 3. Cambio de rol | 4. Cambio organizacional | 5. Número observable |
|---|---|---|---|---|---|
|   |   |   |   |   |   |

## Números observables (detalle)

| Métrica | Valor antes | Valor después | Fuente | Fecha | Delta |
|---|---|---|---|---|---|
|   |   |   |   |   |   |

## Mapa operativo
[Derivado de columnas 1-2.]

## Mapa organizacional
[Derivado de columnas 3-4.]

## Mapa económico
[Derivado de columna 5.]

## Argumento comercial
[Leído desde los tres mapas. Solo evidencia.]

## Cost of Inaction
[Si este producto nunca existiera, ¿qué seguiría ocurriendo en la organización? Anclado en el dolor ya observable hoy, no en catástrofe inventada.]

## Next Constraint
[Resuelto este problema, ¿cuál es el siguiente cuello de botella? Mira hacia adelante; alimenta roadmap y upsell. No es número observable.]

## Anexo de hipótesis (NO es evidencia)
[Proyecciones esperables, claramente separadas. Nunca se presentan como número observable.]
```

---

*Documento vive en `/docs/02-product-operating-system/product-review-framework.md`*
*Relacionado: `evidence-package-protocol.md` · `build-rules.md` (Regla 21) · `foundations-design.md` · `ADR-006-product-review-framework.md`*
