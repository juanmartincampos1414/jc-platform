# Learning Boundary v1.0
## RUN72 OS — Congelado

**Fecha:** 2026-06-28
**Estado:** CONGELADO — no modificar sin ADR

---

## Principio fundamental

Todo Knowledge Object tiene exactamente un dueño.

Antes de almacenar cualquier pieza de conocimiento, existe una sola pregunta que responder:

> ¿A quién pertenece este conocimiento?

La respuesta debe ser única. Si hay ambigüedad, el conocimiento no está correctamente clasificado.

---

## Los tres niveles

### Nivel 1 — Workspace Learning

Conocimiento operativo del workspace. Administra la relación entre la agencia y el cliente.

**Pertenece aquí:**
- Usuarios y roles
- Permisos y accesos
- Configuración de integraciones (Meta, canales)
- Billing y plan
- Auditoría de acciones de usuario
- Tokens de acceso a plataformas externas

**Regla de aislamiento:** nunca sale del workspace. No se agrega. No se comparte. No alimenta modelos.

**`learning_scope = "workspace"`**

---

### Nivel 2 — Brand Learning

Conocimiento específico de una marca. Es el activo más valioso del sistema.

**Pertenece aquí:**
- Tono de comunicación y voz de marca
- Canales preferidos y comportamiento de audiencia
- Horarios con mejor rendimiento para esa marca
- Estilo creativo y restricciones visuales
- Decisiones aceptadas por el cliente
- Decisiones rechazadas por el cliente
- Razones de rechazo (user_feedback)
- Patrones de aprobación de contenido
- Historial de campañas y resultados

**Regla de aislamiento:** nunca se mezcla con otra Brand. El Knowledge Engine solo carga memories de `brand_id` de la Brand activa. Una Brand no puede ver ni aprender del conocimiento de otra Brand, aunque pertenezcan al mismo Workspace.

**`learning_scope = "brand"`**

---

### Nivel 3 — Platform Learning

Conocimiento agregado que pertenece al producto. Nunca contiene información identificable de una Brand.

**Pertenece aquí:**
- Tendencias de canales (qué canales crecen en la industria)
- Formatos con mejor rendimiento a nivel industria (reel vs. post vs. story en promedio)
- Estacionalidad de categorías (fechas clave por rubro)
- Benchmarks anónimos por industria y canal

**Regla de construcción:** se construye únicamente a partir de señales agregadas y anonimizadas. Nunca de datos crudos de una Brand. La agregación debe hacerse en una capa separada antes de escribir en este nivel.

**`learning_scope = "platform"`**

**Estado actual:** no implementado. Las bases están sentadas. Se implementará cuando haya suficientes Brands activas para que los agregados sean estadísticamente válidos.

---

## Atributo obligatorio

A partir de esta definición, todo Knowledge Object en la tabla `memories` deberá incluir en su `metadata`:

```json
{
  "learning_scope": "workspace" | "brand" | "platform"
}
```

Este atributo es obligatorio en nuevas inserciones. Los registros existentes sin `learning_scope` se asumen `"brand"` (son todos Brand Learning por contexto).

---

## Matriz de pertenencia

| Tipo de conocimiento | Scope | Razón |
|---------------------|-------|-------|
| `brand_voice` | brand | Específico de una marca |
| `channel_affinity` | brand | Preferencia de esa marca en particular |
| `content_mix` | brand | Mix de formatos que funciona para esa marca |
| `timing` | brand | Horarios de su audiencia específica |
| `approval_signals` | brand | Cómo aprueba el cliente de esa marca |
| `creative_style` | brand | Estilo visual de esa marca |
| `campaign_pattern` | brand | Patrones de campañas de esa marca |
| `user_feedback` | brand | Decisión explícita del cliente de esa marca |
| `performance` | brand | Resultados de esa marca en esa plataforma |
| `competitor` | brand | Competidores de esa marca |
| `audience` | brand | Audiencia de esa marca |
| `trend` | platform | Tendencia de mercado, no de una marca |
| `knowledge` (genérico) | brand | Por defecto, brand |

---

## Product Reflection

### 1. ¿Qué conocimiento nunca debería abandonar una Brand?

El feedback explícito del cliente.

Cuando un cliente rechaza una recomendación y explica por qué, esa información es irreemplazable. No puede deducirse de patrones agregados. No puede transferirse a otra Brand. Es la única señal de preferencia directa que el sistema recibe del humano que toma decisiones.

Todo el historial de decisiones aceptadas y rechazadas es Brand Learning puro. Define qué tipo de agencia quiere ser el cliente con su marca.

### 2. ¿Qué conocimiento podría compartirse entre clientes?

Únicamente el conocimiento de nivel Platform — y solo después de anonimización rigurosa.

Ejemplos válidos:
- "Los reels de 15-30 segundos tienen 40% más engagement que los de 60s en cuentas de menos de 10K seguidores en Enero-Febrero" (industria: gastronomía, sin Brand identificable)
- "Las cuentas de retail muestran pico de engagement los jueves entre 19-21h en Argentina"

Lo que nunca puede compartirse: el tono de marca, los rechazos del cliente, los canales preferidos, los resultados históricos de una Brand específica.

### 3. ¿Qué conocimiento pertenece al Core del producto?

El Knowledge Engine, el Decision Engine y el Learning Engine son el core.

El conocimiento que producen — las `memories`, las `decisions`, las señales de feedback — es lo que diferencia a este producto de un generador de contenido genérico.

El valor no está en los templates ni en el modelo de lenguaje. Está en que el sistema recuerda, aprende y mejora específicamente para cada Brand. Eso es irreplicable sin el historial acumulado.

### 4. ¿Qué conocimiento debería permanecer únicamente en JC AIgency?

El Platform Learning que se construya a partir de las Brands de JC AIgency es un activo de la agencia, no del cliente.

Los benchmarks agregados, los patrones de rendimiento por industria, la inteligencia sobre qué formatos y horarios funcionan en el mercado argentino — todo eso es conocimiento que la agencia acumula por operar con múltiples clientes simultáneamente.

Es el equivalente digital a lo que un director creativo experimentado sabe después de años en el mercado: intuición convertida en datos.

Ese conocimiento es de JC AIgency y no debe trasladarse si un cliente se va.

---

## Implicancias para el producto

### Portabilidad de datos

Cuando un cliente termina su relación con la agencia:
- **Brand Learning** (`learning_scope = "brand"`): el cliente tiene derecho a exportarlo — es su marca, sus decisiones, su historia.
- **Platform Learning** (`learning_scope = "platform"`): no es exportable — fue construido con señales de múltiples clientes anonimizadas.
- **Workspace Learning** (`learning_scope = "workspace"`): se archiva junto con el workspace.

### Multi-Brand (próximo sprint)

Cuando se implemente Multi-Brand, el aislamiento entre Brands es el invariante más crítico. El Knowledge Engine debe garantizar que nunca se cargan memories de `brand_id` distinto al de la Brand activa.

### Platform Learning (futuro)

Solo implementar cuando haya ≥5 Brands activas con historial de al menos 3 meses. El mínimo estadístico importa — los promedios con N pequeño son más ruido que señal.

---

## Regla permanente

```
Antes de almacenar cualquier Knowledge Object:

1. ¿A quién pertenece este conocimiento?
   → workspace / brand / platform

2. ¿Existe exactamente una respuesta?
   → Si hay ambigüedad, no almacenar hasta resolver.

3. ¿El brand_id es correcto?
   → Verificar antes de insertar.

4. Agregar learning_scope al metadata.
```

Este límite está congelado. Cualquier excepción requiere ADR documentado.
