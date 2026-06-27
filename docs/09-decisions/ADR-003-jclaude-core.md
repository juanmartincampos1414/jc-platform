# ADR-003 — JClaude como núcleo del producto y primer módulo premium

## Estado
Aceptada

## Contexto
Al definir qué construir primero, había dos opciones: (A) construir el portal de cliente completo con todos los módulos funcionales, o (B) construir un módulo de IA premium que genere valor inmediato y tenga modelo de negocio propio.

El portal de cliente completo requería conectar ads reales, firmas reales, influencers reales — cada uno con integraciones propias complejas. Riesgo alto de quedar todo a medias.

JClaude tenía un caso de uso claro: generar el calendario de contenido mensual con IA, que es una tarea que JC AIgency hace manualmente para sus clientes todos los meses.

## Decisión
Construir **JClaude como módulo premium separado** dentro de la plataforma, con:
- Su propio modelo de suscripción (MercadoPago)
- Sus propias tablas (jclaude_subscriptions, jclaude_profiles, jclaude_posts)
- Su propio flujo de onboarding (registro → perfil de marca → suscripción → generar)
- Acceso separado desde el login (botón "Acceder a JClaude")
- Planes: Starter $200K, Pro $300K, Enterprise $800K ARS/mes con 7 días free trial

El resto del portal de cliente quedó como portal de agencia (para clientes de JC AIgency), separado de JClaude.

## Alternativas consideradas
- **Construir todo el portal primero** — Descartado por dispersión. Todos los módulos habrían quedado mock.
- **Construir JClaude como producto separado** (otro dominio, otro repo) — Descartado por duplicar auth e infraestructura.
- **Integrar JClaude dentro del Social Media module** — Descartado porque JClaude tiene su propio modelo de negocio y audiencia distinta.

## Por qué esta decisión
- JClaude tiene propuesta de valor clara y mensurable: "generá tu calendario mensual en 1 click"
- Tiene modelo de negocio propio inmediato (subscripción MP)
- El caso de uso es el núcleo del trabajo diario de JC AIgency (generar contenido mensual)
- Permite validar IA + pagos + publicación antes de invertir en el resto del portal
- 7 días free trial reduce fricción de adopción
- Opción D del framework RUN72: JC lo usa primero con clientes propios → luego SaaS

## Consecuencias
### Positivas
- Producto real con ingresos propios desde el día 1
- Flujo end-to-end validado: registro → perfil → pago → IA → aprobación → publicación
- Base técnica para el AI Marketing Brain futuro
- Diferenciador claro frente al portal de agencia genérico

### Negativas
- Duplicación de tablas (`social_posts` para el portal y `jclaude_posts` para JClaude) — a unificar en Sprint 2
- JClaude y el Portal de Cliente son dos productos que hoy comparten una UI pero tienen lógica separada
- El usuario puede confundirse entre "Social Media" del portal y los posts de JClaude

## Deuda técnica relacionada
- Unificar `social_posts` y `jclaude_posts` en una tabla `posts` con campo `source: 'jclaude' | 'manual'` — Sprint 2
- Conectar JClaude con la entidad Campaign cuando exista — Sprint 2
- Externalizar prompts a `jclaude_prompts` table — Sprint 1

## Qué revisar en el futuro
- Cuando exista la entidad Campaign, evaluar si JClaude genera por mes o por campaña
- Cuando haya suficientes clientes, evaluar si JClaude merece su propio subdomain (`jclaude.jcmarketing.digital`)
- Si se hace white-label, JClaude debería ser un "addon" que otras agencias pueden activar para sus clientes
