# Product Recomposition
## JC AI Agency × RUN72 OS — Sprint 0.5

**Tipo:** Documento de arquitectura de producto  
**Estado:** Definitivo — base para Sprint 1 en adelante  
**Fecha:** Junio 2026  
**Autor:** RUN72 OS × Claude Sonnet 4.6

---

> Este documento no propone cambios de código.  
> Propone cambios de modelo mental.  
> Si el modelo mental es correcto, el código que viene después se escribe solo.

---

## Prefacio: la pregunta honesta

> Si hoy empezáramos JC AI Agency desde cero, con todo lo que aprendimos durante Sprint -1 y Sprint 0, ¿volveríamos a organizar el producto exactamente igual?

**No.**

No porque las decisiones pasadas hayan sido incorrectas. Fueron las decisiones correctas para el momento. Se construyó lo que se podía ver entonces.

Pero durante Sprint -1 ocurrió algo importante: por primera vez se pudo ver el producto completo. Y esa visión completa revela una tensión estructural que no va a desaparecer si seguimos construyendo en la dirección actual.

La tensión es esta:

> El producto está organizado alrededor de **cómo trabaja una agencia**.  
> Pero debería estar organizado alrededor de **cómo ocurre el trabajo de marketing**.

La diferencia parece sutil. No lo es. Define todo lo que viene después.

---

## 1. ¿Cuál es realmente el objeto principal del sistema?

### Los candidatos

#### Workspace
**Lo que es hoy:** contenedor de todo. El workspace es el primer nivel después del login.  
**El problema:** un workspace no hace nada. Es una carpeta. Ningún usuario piensa "voy a trabajar en mi workspace". Es infraestructura, no producto.  
**Veredicto:** necesario como contenedor de multi-tenancy, pero jamás puede ser el centro.

#### Brand
**Lo que es:** la identidad persistente. Voz, audiencia, valores, paleta, tono.  
**Ventaja:** una Brand vive más tiempo que cualquier campaña. Es la fuente de verdad de todo lo que se genera.  
**El problema:** las marcas no *hacen* cosas. Son el contexto de lo que se hace. Una arquitectura centrada en Brand trae el riesgo de convertir el sistema en un repositorio de activos en lugar de un sistema operativo.  
**Veredicto:** Brand es el *contexto* central, no el *objeto* central.

#### Campaign
**Lo que es:** la unidad de trabajo. Una campaign tiene inicio, fin, objetivo, recursos, output medible.  
**Ventaja:** todo el trabajo real cuelga de una Campaign. Posts, ads, influencers, assets, landing pages. Una Campaign tiene estado: planning, active, paused, completed. Puede medirse. Puede aprenderse de ella.  
**El problema:** no todos los outputs del sistema son parte de una campaña formal. Un post suelto, una firma de documento, un brief exploratorio. Forzar todo a Campaign puede generar fricción en los workflows más simples.  
**Veredicto:** Campaign es el mejor candidato. El problema se resuelve permitiendo que una Campaign sea tan pequeña como un post único.

#### Client
**Lo que es:** la perspectiva de agencia. Un client es quien paga.  
**El problema:** esto es arquitectura de agencia, no arquitectura de producto. Si el sistema escala más allá de JC AIgency (que es el objetivo), "Client" no tiene sentido para un usuario que usa el producto directamente para su propia marca.  
**Veredicto:** Client es un rol de acceso, no un objeto de trabajo.

#### AI
**Lo que es:** la capacidad transversal de inteligencia.  
**El problema:** la IA no es un objeto, es una propiedad del sistema. Poner AI en el centro crea el error inverso: un sistema que piensa en sí mismo, no en el trabajo del usuario.  
**Veredicto:** la IA es un método de producción, no el producto.

#### Operating System
**Lo que es:** la metáfora de lo que queremos construir.  
**El problema:** un Operating System no es una entidad del dominio, es una promesa de diseño. No puede ser el objeto central porque no es modelable como dato.  
**Veredicto:** es la visión, no la arquitectura.

---

### La decisión

**El objeto central es: Campaign.**

Pero con una redefinición crítica.

Una Campaign en JC AI Agency no es una campaña publicitaria tradicional.

Es cualquier **intención de comunicación con objetivo, audiencia y tiempo definidos**.

Puede ser:
- Una campaña de lanzamiento de producto (grande, multi-canal, 3 meses)
- El contenido de redes del mes de julio (mediana, 30 posts, 1 mes)
- Un post único urgente para capitalizar una tendencia (pequeña, 1 asset, 24h)
- Una campaña de influencers para una colección específica

La Campaign absorbe todo. Y la Brand es su contexto permanente.

```
Workspace
└── Brand (1..N)
    ├── Brand Memory (persistente)
    ├── Brand Knowledge (permanente)
    └── Campaign (1..N)
        ├── Brief
        ├── Assets
        ├── Posts
        ├── Ads
        ├── Influencers
        ├── Landing
        ├── Performance
        ├── Insights
        └── Learning → Brand Memory
```

**Por qué Campaign y no Brand:**  
Brand es lo que somos. Campaign es lo que hacemos. El trabajo ocurre en campaigns. El aprendizaje regresa a Brand. El ciclo es: Brand informa Campaign → Campaign produce aprendizaje → aprendizaje enriquece Brand.

---

## 2. ¿Cuál es realmente el trabajo que hace el usuario?

### El cliente (dueño de empresa o marketing manager)

No quiere administrar un sistema.

Quiere saber tres cosas:
1. **¿Qué se está publicando esta semana?** → necesita visibilidad sobre el plan
2. **¿Esto representa bien a mi marca?** → necesita aprobar o rechazar con contexto
3. **¿Está funcionando?** → necesita ver resultados que le ayuden a decidir qué sigue

El cliente no quiere módulos. Quiere un flujo: *ver → decidir → ver resultado*.

Su flujo real:
```
Login
↓
Ver qué hay pendiente de mi aprobación
↓
Revisar contenido en contexto (no aislado)
↓
Aprobar / pedir cambios / rechazar
↓
Ver qué se publicó y cómo funcionó
↓
Cerrar sesión
```

Todo debería poder hacerse en menos de 10 minutos.

### El account manager (equipo JC)

Quiere operar con velocidad y sin fricción.

Su flujo real:
```
Recibir brief del cliente (por email, WhatsApp, reunión)
↓
Crear o actualizar la Campaign en el sistema
↓
Generar contenido con IA
↓
Revisar y ajustar antes de enviar al cliente
↓
Enviar a aprobación
↓
Publicar lo aprobado
↓
Reportar resultados
```

El account manager necesita velocidad de producción. Cada paso que requiere más de 2 clicks es fricción real.

### El marketer estratégico

Su flujo real es diferente:
```
Ver performance histórica de campaigns anteriores
↓
Identificar qué funcionó y qué no
↓
Diseñar estrategia para la próxima campaign
↓
Briefear a producción (humana o IA)
↓
Validar que el output ejecuta la estrategia
```

El marketer estratégico hoy no tiene lugar en el sistema. Los insights existen pero no están conectados con la planificación de lo que sigue.

### El dueño de empresa (cliente empresa)

Su flujo real:
```
Login mensual o quincenal
↓
Ver resumen ejecutivo: qué se publicó, qué funcionó, qué costaría
↓
Aprobar inversión publicitaria o nueva campaign
↓
Firmar documentos si los hay
↓
Cerrar sesión
```

Necesita densidad de información, no cantidad de pantallas.

---

## 3. El Workflow Universal (comparación)

### Workflow actual (implícito)
```
JClaude (genera contenido)
↓
Social Media (muestra contenido para aprobar)
↓
[publicación manual o automática]
↓
Ads (métricas, desconectado del contenido)
```

No hay Strategy. No hay Brief formal. No hay Performance conectado a lo que se generó. No hay Learning que cierre el ciclo.

### Workflow propuesto
```
Brand Context
↓
Strategy (qué queremos lograr, para quién, por qué ahora)
↓
Campaign Brief (objetivos, KPIs, audiencia, tono, restricciones)
↓
Planning (calendario, formatos, canales, recursos)
↓
Generation (IA produce drafts: copy, imagen, video)
↓
Internal Review (equipo JC revisa antes de mandar al cliente)
↓
Client Approval (cliente aprueba, rechaza o pide cambios)
↓
Publishing (automático o manual, con confirmación)
↓
Performance Import (métricas desde Meta, Instagram, etc.)
↓
Insights (IA analiza qué funcionó y por qué)
↓
Recommendations (qué deberíamos hacer diferente en la próxima)
↓
Learning (se escribe a Brand Memory para informar la próxima Campaign)
↓
Next Campaign (el ciclo empieza más rico que antes)
```

**Diferencias críticas con hoy:**
1. Strategy y Brief no existen como objetos en el sistema
2. Internal Review no existe (el contenido va directo al cliente)
3. Performance no está conectado con lo que se generó
4. Insights existen como feature de Ads, pero no como propiedad de Campaign
5. Learning nunca ocurre — cada campaign empieza desde cero

---

## 4. Análisis módulo por módulo

### Dashboard
**Hoy:** página de bienvenida con stats. El único valor es "¿qué tengo pendiente?"  
**Problema:** agrega una pantalla sin agregar trabajo. El usuario tiene que ir al Dashboard y después navegar a donde tiene que trabajar.  
**Decisión: desaparece como módulo.**  
Se reemplaza por un **Command Center** que vive dentro de Campaign. Las métricas de Dashboard pasan a ser la vista de resumen de cada Campaign y de Brand.

### Social Media
**Hoy:** lista de posts para aprobar. Funciona bien para lo que hace.  
**Problema:** está desconectado de la Campaign que generó esos posts. El cliente aprueba posts sin contexto de campaña.  
**Decisión: se convierte en la vista de Approval dentro de Campaign.**  
No desaparece el concepto, desaparece la página aislada.

### JClaude
**Hoy:** módulo de generación de contenido. El núcleo real del producto.  
**Problema:** está presentado como una herramienta más, al mismo nivel que Ads o Influencers.  
**Decisión: ver sección 7.**

### Ads
**Hoy:** métricas de publicidad paga con análisis IA. 100% mock.  
**Problema:** las métricas de ads no están relacionadas con el contenido que las generó.  
**Decisión: se convierte en Performance dentro de Campaign.**  
Los ads son un output de la Campaign, no un módulo separado.

### Influencers
**Hoy:** pipeline de influencers. Estado no persiste.  
**Problema:** los influencers están desconectados de las campaigns donde participan.  
**Decisión: se convierte en un Channel dentro de Campaign.**  
Un influencer es un canal de distribución de una campaign específica, no una entidad autónoma.

### Legales
**Hoy:** documentos para firmar. Funciona parcialmente.  
**Problema:** los documentos legales están flotando sin relación con el servicio que representan.  
**Decisión: persiste como módulo de Administración.**  
Los documentos legales son contratos de servicio, no parte del flujo de Campaign. Son un concern administrativo, no operativo. Se mueven a Admin / Billing.

### Webs
**Hoy:** probablemente placeholder o muy básico.  
**Decisión: se convierte en Landing dentro de Campaign.**  
Una landing page es un asset de la Campaign, no un servicio separado.

### Extras
**Hoy:** desconocido / catchall.  
**Decisión: desaparece.**  
Si un feature necesita un módulo "Extras" para existir, todavía no tiene modelo.

---

## 5. Capability Recomposition

El sistema tiene estas capacidades reales:

### Core Capabilities

**Identity**  
*Quién es la marca.* Voz, valores, audiencia, paleta, tono, competidores. Permanente. Base de todo lo que sigue.

**Strategy**  
*Qué quiere lograr la marca.* Objetivos de negocio traducidos a objetivos de marketing. Define qué tipo de campaigns tienen sentido.

**Campaign Management**  
*El ciclo completo de trabajo.* Desde el brief hasta el aprendizaje. Contiene Planning, Generation, Approval, Publishing, Performance, Insights, Learning.

**Content Production**  
*Generación de assets.* Copy, imágenes, videos. Impulsada por IA. Siempre en contexto de Campaign y Brand.

**Approval Workflow**  
*El ciclo de revisión.* Internal → Client. Con comentarios, estados, historial.

**Publishing**  
*Distribución del contenido aprobado.* Automática o manual. Multi-canal.

**Performance**  
*Qué pasó después de publicar.* Métricas importadas de canales. Conectadas al asset que se publicó.

**Intelligence**  
*Lo que el sistema aprende.* Insights sobre qué funcionó. Recommendations sobre qué hacer después. Learning que actualiza Brand Memory.

**Automation**  
*Lo que ocurre sin intervención humana.* Cron jobs de publicación, alertas de performance, generación programada.

**Knowledge**  
*La memoria acumulada del sistema.* Brand Memory, Campaign History, Trend Intelligence, Competitor Intel.

**Administration**  
*Lo que hace funcionar el negocio.* Billing, documentos legales, usuarios, accesos, workspaces.

### Capabilities que no existen todavía pero deberían

**Brief Builder**  
Interfaz para crear un brief de Campaign con asistencia IA. Hoy el brief es un campo de texto o no existe.

**Strategy Advisor**  
IA que sugiere tipo de campaign basada en Brand Memory y objetivos declarados.

**Performance Importer**  
Integración real con Meta API para traer métricas al sistema automáticamente.

---

## 6. Sidebar v2

El sidebar actual refleja los módulos. El sidebar ideal refleja el trabajo.

```
[Logo JC AIgency]

● Command Center        ← qué tengo pendiente ahora mismo

BRANDS
◆ [Nombre de la Marca]  ← switch de marca si hay más de una

CAMPAIGNS
+ Nueva Campaign
▸ Campaign activa 1
▸ Campaign activa 2
▸ Ver todas

MARCA
  Identity              ← quiénes somos
  Strategy              ← qué queremos lograr
  Performance           ← cómo nos fue históricamente
  Memory                ← qué aprendimos

─────────────────────

ADMINISTRACIÓN
  Equipo
  Documentos
  Facturación
  Configuración
```

**Decisiones de diseño:**

1. **Campaign está arriba** porque es donde ocurre el trabajo. No al final.
2. **No hay módulos de funcionalidad** (no dice "Social Media", dice "Campaign activa").
3. **Identity, Strategy, Performance, Memory** son propiedades de la Marca, no herramientas separadas.
4. **Command Center** reemplaza Dashboard. No es un resumen de módulos, es un inbox de trabajo pendiente.
5. **Administración está abajo** porque se usa poco. Los documentos legales son administración, no flujo de trabajo.

---

## 7. ¿Qué es realmente JClaude?

### Opción A: JClaude como pantalla
**Lo que implica:** JClaude es una herramienta de generación de contenido. El usuario va ahí, genera, y el resultado aparece en Social Media.  
**Ventaja:** simple de entender, simple de construir.  
**Problema:** convierte a JClaude en Jasper.ai. Una herramienta de escritura con IA. No un sistema operativo.  
**Veredicto:** esto es lo que tenemos hoy. Es correcto para MVP. Insuficiente para lo que queremos ser.

### Opción B: JClaude como servicio transversal
**Lo que implica:** JClaude es una API interna que otros módulos llaman. El usuario no lo ve directamente, pero todos los botones de IA del sistema usan JClaude por debajo.  
**Ventaja:** desacopla la IA de la UI. Más escalable.  
**Problema:** JClaude pierde identidad de producto. Se convierte en plumbing. La marca "JClaude" desaparece de la experiencia del usuario.  
**Veredicto:** arquitectura correcta, posicionamiento incorrecto.

### Opción C: JClaude como cerebro operativo
**Lo que implica:** JClaude no es una pantalla ni un servicio oculto. Es el sistema de inteligencia que impregna todo el producto. Tiene identidad propia, pero no vive en una pantalla. Vive en la Campaign, en los insights, en las recomendaciones, en la memoria de marca.  
**Ventaja:** JClaude se convierte en un diferenciador de producto genuino. No es un botón de "generar con IA". Es el sistema que aprende y recomienda a lo largo del tiempo.  
**Problema:** es más difícil de explicar en una primera demostración. Requiere que el usuario confíe en el sistema antes de ver su valor.  
**Veredicto:** correcto estratégicamente. Requiere una estrategia de onboarding que muestre el valor desde el primer uso.

### Decisión: Opción C, con un matiz

JClaude es el AI Operating Brain del producto.

Pero necesita tener una **surface visible** durante la transición. La pantalla de JClaude actual no desaparece de inmediato — se convierte en el **Campaign Studio**: el lugar donde el usuario y JClaude colaboran para producir el contenido de una Campaign.

Con el tiempo, el Campaign Studio se vuelve tan natural que "JClaude" deja de ser el nombre de una pantalla y pasa a ser el nombre del sistema de inteligencia que hace funcionar todo.

---

## 8. El AI Marketing Brain

JClaude como cerebro operativo tiene esta estructura:

### Los Agentes

**Brand Agent**  
*Input:* información del cliente, briefings históricos, feedback acumulado  
*Output:* Brand Profile completo, Brand Voice guidelines, actualizaciones de Brand Memory  
*Cuándo actúa:* onboarding, cuando se detecta inconsistencia de voz, cuando se actualiza Brand Memory

**Strategy Agent**  
*Input:* Brand Profile, objetivos de negocio declarados, temporalidad, performance histórica  
*Output:* Strategy Brief, recomendación de tipo de Campaign, priorización de canales  
*Cuándo actúa:* inicio de campaign, revisión mensual

**Campaign Planner Agent**  
*Input:* Strategy Brief, calendario, capacidades de producción, historial de campaigns similares  
*Output:* Plan de contenidos con formatos, fechas, canales y prioridades  
*Cuándo actúa:* creación de Campaign, ajustes de calendario

**Copy Agent**  
*Input:* Campaign Brief, Brand Voice, tipo de post, red social, tendencias actuales  
*Output:* copy listo para revisar, con variaciones por tono  
*Cuándo actúa:* generación de contenido

**Image Agent**  
*Input:* copy del post, Brand Identity (paleta, estilo), tipo de asset  
*Output:* imagen generada via fal.ai, con prompt documentado  
*Cuándo actúa:* generación de assets visuales

**Video Agent** *(pendiente — Seedance)*  
*Input:* copy, imagen de referencia, duración, estilo  
*Output:* video generado  
*Cuándo actúa:* producción de reels o stories con video

**Ads Agent**  
*Input:* post aprobado, audiencia, presupuesto, objetivo de campaña  
*Output:* configuración de ad, variaciones de copy para testing, recomendación de segmentación  
*Cuándo actúa:* cuando un post aprobado se va a amplificar con pauta

**Influencer Fit Agent**  
*Input:* Campaign Brief, perfil de audiencia target, categoría de producto  
*Output:* score de fit para cada influencer del pipeline, reasoning  
*Cuándo actúa:* selección de influencers para Campaign

**Performance Agent**  
*Input:* métricas de posts publicados, benchmark histórico de la marca  
*Output:* análisis de performance, detección de anomalías, comparación contra objetivo  
*Cuándo actúa:* post-publicación (automático), cierre de Campaign

**Insights Agent**  
*Input:* Performance data de la Campaign completa  
*Output:* insights narrativos ("el contenido de video tuvo 3x más engagement que las imágenes estáticas en esta audiencia")  
*Cuándo actúa:* cierre de Campaign, análisis mensual

**Recommendation Agent**  
*Input:* Insights, Brand Memory, objetivos de la próxima Campaign  
*Output:* recomendaciones concretas para la próxima Campaign ("aumentar video en 40%, reducir posts de texto, probar martes y jueves a las 19h")  
*Cuándo actúa:* cierre de Campaign, inicio de planificación del siguiente período

**Learning Agent**  
*Input:* todo el output de los agentes anteriores en la Campaign  
*Output:* actualizaciones a Brand Memory, Campaign Memory, Creative Memory  
*Cuándo actúa:* cierre de Campaign, siempre en background

### Cómo colaboran los agentes

No en paralelo. En secuencia con contexto compartido.

```
Brand Agent (contexto permanente)
         ↓
Strategy Agent (al inicio de Campaign)
         ↓
Campaign Planner Agent
         ↓
[Para cada contenido:]
Copy Agent → Image Agent → Video Agent
         ↓
Ads Agent (para los que se amplíen)
Influencer Fit Agent (para los que usen influencers)
         ↓
Performance Agent (post-publicación)
         ↓
Insights Agent + Recommendation Agent
         ↓
Learning Agent → Brand Memory
         ↑
[ciclo siguiente]
```

El contexto viaja entre agentes. Un agente nunca empieza desde cero si hay Brand Memory disponible.

### La memoria que usan

Ver sección 12 para detalle completo.

---

## 9. El Knowledge Layer

> El conocimiento vale más que el código.

### Qué conocimiento produce el sistema

| Tipo | Fuente | Formato |
|---|---|---|
| Brand Voice | onboarding + feedback | Brand Profile JSON |
| Campaign History | campaigns completadas | structured data |
| Content Performance | Meta API + analytics | time-series data |
| Approval Patterns | qué aprueba y qué rechaza el cliente | logs con razones |
| Trend Intelligence | APIs externas, JClaude trending | structured summaries |
| Creative Patterns | qué tipos de assets funcionan mejor | performance-tagged assets |

### Qué conocimiento consume el sistema

| Agente | Consume |
|---|---|
| Copy Agent | Brand Voice, Trends, historial de copies exitosos |
| Image Agent | Brand Identity, Creative Patterns |
| Campaign Planner | Campaign History, Performance histórica, calendario |
| Strategy Agent | Objetivos de negocio, Brand Memory, benchmarks del sector |
| Recommendation Agent | Todo lo anterior |

### Qué conocimiento nunca debería perderse

1. **Por qué el cliente rechazó un post.** El motivo del rechazo es conocimiento de marca más valioso que el post en sí.
2. **Qué campaigns funcionaron y cuándo.** No solo métricas: contexto, audiencia, temporada.
3. **La voz de la marca en evolución.** Cómo fue cambiando el tono a lo largo del tiempo.
4. **Los aprendizajes de cada cierre de Campaign.** El insight final de cada campaña.

### Cómo el conocimiento se convierte en activo reutilizable

Hoy no se convierte. Cada campaign empieza desde cero.

El mecanismo de conversión es Brand Memory (sección 12).

El trigger para escribir a Brand Memory es el cierre formal de una Campaign.

El formato es un `BrandMemoryEntry` con: tipo, contenido, fuente, Campaign de origen, fecha, confidence score.

---

## 10. Campaign First Architecture — veredicto

**¿Es esta una mejor arquitectura? Sí.**

Pero con una advertencia importante.

### Por qué sí

Cuando Campaign es el objeto central, todos los datos cuelgan de ella:

- El Brief dice *qué* se quiere lograr
- Los Assets son *lo que se produce*
- Los Posts son *lo que se publica*
- Los Ads son *cómo se amplifica*
- Los Influencers son *quiénes lo distribuyen*
- La Performance dice *cómo funcionó*
- Los Insights dicen *por qué funcionó o no*
- El Learning actualiza Brand Memory para la próxima

Esto crea una **trazabilidad completa**: podés ir desde un resultado de negocio hasta el asset específico que lo generó, hasta el brief que lo originó, hasta la decisión estratégica que lo motivó.

Hoy esa trazabilidad no existe.

### La advertencia

No toda interacción del sistema debe encapsularse en una Campaign formal.

Hay micro-workflows que necesitan ser posibles sin crear una Campaign:
- Aprobar un documento legal
- Cambiar el perfil de la marca
- Responder un comentario
- Generar un post urgente de 24h

La solución: toda Campaign puede ser "lightweight" (1 post, sin brief formal, sin workflow completo). La Campaign es el modelo de datos, no un proceso burocrático.

---

## 11. El producto como sistema de eventos

Cada acción significativa en el sistema emite un evento.

```
WorkspaceCreated
BrandCreated
BrandProfileUpdated

CampaignCreated          ← el trabajo empieza
CampaignBriefApproved   ← la estrategia está clara
CampaignPlanGenerated   ← el calendario está listo

ContentDraftCreated      ← IA produce un borrador
ContentDraftRevised      ← account manager ajusta
ContentSentForApproval  ← va al cliente

PostApproved             ← el cliente dice sí
PostRejected             ← el cliente dice no (con razón)
PostChangesRequested     ← el cliente pide ajustes

PostScheduled            ← entra al calendario de publicación
PostPublished            ← sale al mundo
PostPublishFailed        ← algo salió mal

PerformanceImported      ← métricas vuelven al sistema
InsightGenerated         ← IA analiza qué pasó
RecommendationCreated    ← IA sugiere qué hacer después

CampaignClosed          ← el ciclo cierra formalmente
LearningWritten         ← el aprendizaje va a Brand Memory

SubscriptionActivated
SubscriptionRenewed
SubscriptionCancelled

DocumentSigned
TeamMemberAdded
SocialAccountConnected
```

### Por qué esto importa

Cuando el sistema emite eventos en lugar de simplemente actualizar estado, ganamos:

1. **Activity feed real** (hoy es mock)
2. **Audit trail completo** (quién hizo qué y cuándo)
3. **Triggers de automatización** (PostApproved → programar publicación automáticamente)
4. **Datos para Intelligence** (el Learning Agent suscribe a CampaignClosed)
5. **Observabilidad** (podés ver exactamente qué pasó en una Campaign)

La tabla `activity_logs` creada en Sprint 0 es la base. En Sprint 1 se convierte en el event bus interno.

---

## 12. Memory Architecture

Nueve tipos de memoria. Cada una tiene propietario, TTL y acceso definidos.

### Brand Memory
*Qué guarda:* voz de la marca, valores, qué tipos de contenido funcionan, qué no funciona, preferencias del cliente, restricciones de comunicación  
*Quién escribe:* Learning Agent, Brand Agent, usuario (explícitamente)  
*Quién lee:* todos los agentes de producción  
*Cómo evoluciona:* se actualiza al cierre de cada Campaign  
*TTL:* permanente, con versioning  
*Formato:* `BrandMemoryEntry { type, content, source_campaign_id, confidence, created_at, deprecated_at }`

### Campaign Memory
*Qué guarda:* brief, decisiones tomadas durante la campaign, adjustments hechos por el cliente, qué se publicó vs qué se planeó  
*Quién escribe:* Campaign Planner, eventos del workflow  
*Quién lee:* Insights Agent, Recommendation Agent, Campaign Planner (para la próxima)  
*TTL:* permanente, pero se archiva al cerrar la Campaign  
*Formato:* asociado al campaign_id, como metadata estructurada

### Creative Memory
*Qué guarda:* qué assets funcionaron, prompts que produjeron buenos resultados, combinaciones de formato+tono+canal que tuvieron alto engagement  
*Quién escribe:* Performance Agent, Learning Agent  
*Quién lee:* Copy Agent, Image Agent  
*TTL:* permanente, con decay gradual (lo antiguo pesa menos)  
*Formato:* `CreativeMemoryEntry { asset_type, channel, tone, performance_score, prompt, created_at }`

### Audience Memory
*Qué guarda:* qué audiencias respondieron mejor, qué horarios, qué formatos, qué mensajes  
*Quién escribe:* Performance Agent (con datos de Meta)  
*Quién lee:* Strategy Agent, Ads Agent  
*TTL:* rolling 6 meses (las audiencias cambian)  
*Formato:* agregado por segmento de audiencia

### Competitor Memory
*Qué guarda:* qué publica la competencia, con qué frecuencia, qué formatos, qué engagement logran  
*Quién escribe:* feed externo (futuro), usuario explícitamente  
*Quién lee:* Strategy Agent, Insights Agent  
*TTL:* rolling 3 meses  
*Formato:* snapshot por competidor

### Trend Memory
*Qué guarda:* tendencias de contenido detectadas, trending hashtags, formatos emergentes  
*Quién escribe:* Trending endpoint de JClaude (ya existe), feed externo  
*Quién lee:* Copy Agent, Campaign Planner  
*TTL:* rolling 2 semanas (las tendencias mueren rápido)  
*Formato:* `TrendEntry { trend, network, relevance_score, detected_at, expires_at }`

### Performance Memory
*Qué guarda:* benchmarks históricos de la marca, mejores y peores performances, estacionalidad  
*Quién escribe:* Performance Agent  
*Quién lee:* Insights Agent, Recommendation Agent  
*TTL:* permanente (el historial de performance nunca caduca)  
*Formato:* time-series por métrica, por canal

### Decision Memory
*Qué guarda:* decisiones estratégicas tomadas, con contexto y resultado  
*Quién escribe:* usuario explícitamente, Learning Agent al cierre de Campaign  
*Quién lee:* Strategy Agent, Recommendation Agent  
*TTL:* permanente  
*Formato:* `DecisionEntry { decision, context, outcome, campaign_id, created_at }`

### Knowledge Memory
*Qué guarda:* todo lo que el equipo JC o el cliente saben sobre la marca que no está en ningún otro lado  
*Quién escribe:* usuario explícitamente (notas, aprendizajes manuales)  
*Quién lee:* Brand Agent, Strategy Agent  
*TTL:* permanente  
*Formato:* libre, con tags y embeddings para búsqueda semántica (futuro)

---

## 13. El Product Graph

El producto no es una jerarquía. Es un grafo.

```
Workspace
  │
  ├── Brand ──────────────── Brand Memory
  │     │                        │
  │     ├── Campaign ──────── Campaign Memory
  │     │     │
  │     │     ├── Brief
  │     │     ├── Asset ──── Creative Memory
  │     │     │     ├── Copy
  │     │     │     ├── Image
  │     │     │     └── Video
  │     │     ├── Post ────── Performance ─── Performance Memory
  │     │     │     └── Comment
  │     │     ├── Ad ─────── Performance
  │     │     ├── Influencer
  │     │     ├── Landing
  │     │     ├── Insight ── Recommendation
  │     │     └── Learning → Brand Memory
  │     │
  │     ├── Strategy
  │     └── Knowledge ──── Knowledge Memory
  │
  ├── Team (Users con roles)
  ├── Subscription
  └── LegalDocuments
```

**Nodos clave:**

- `Brand` → `Campaign` → `Asset` → `Post` → `Performance` → `Insight` → `Learning` → `Brand Memory` → (siguiente `Campaign`)  
  Este es el ciclo principal. Todo lo demás es soporte.

- `Memory` es el sistema de estado persistente. Sin Memory, cada Campaign empieza desde cero. Con Memory, el sistema mejora con el tiempo.

- `Agent` no es un nodo del grafo de datos, es una función que opera sobre el grafo. Los agentes leen y escriben nodos, pero no son nodos.

---

## 14. Deuda Conceptual

No técnica. Conceptual.

### Decisiones correctas para arrancar que hoy quedaron chicas

**Organización por módulos tipo agencia**  
Fue correcta para definir el alcance inicial. Hoy limita la visión de lo que el producto puede ser.

**JClaude como pantalla**  
Fue correcta para demostrar el valor de la IA rápidamente. Hoy oculta el potencial real de JClaude como cerebro del sistema.

**Social posts desconectados de campaigns**  
Fue correcta para simplificar el MVP. Hoy crea confusión: ¿un post de Social Media es lo mismo que un post de JClaude?

### Módulos que existen solo por herencia

**Dashboard**  
Existe porque todos los SaaS tienen un dashboard. No existe porque el usuario lo necesita.

**Extras**  
Existe como placeholder. No tiene modelo conceptual propio.

### Nombres que ya no representan el producto

**"JClaude"** como nombre de módulo → debería ser el nombre del sistema de inteligencia, no de una pantalla  
**"Social Media"** como módulo → debería ser "Approval" o "Content Calendar" dentro de Campaign  
**"Influencers"** como módulo → debería ser "Distribution Channels" dentro de Campaign  
**"Ads"** como módulo → debería ser "Performance" dentro de Campaign

### Conceptos duplicados

- `Post` en `jclaude_posts` y `Post` en `social_posts` → dos tablas para el mismo concepto  
- `Campaign` en el dominio mental pero sin tabla propia en el schema  
- `Brief` como concepto en la documentación pero sin objeto en el sistema

### Conceptos que todavía no existen

- **Brief**: el punto de partida de todo workflow no tiene entidad en el sistema
- **Campaign**: el objeto central propuesto no existe como tabla
- **Insight**: existe como feature de Ads pero no como entidad del sistema
- **Recommendation**: no existe
- **Learning**: no existe
- **Memory**: diseñada en docs, no implementada

---

## 15. Arquitectura V2

### Estado actual (V1)

```
Workspace
  └── [módulos desconectados]
      ├── JClaude (genera jclaude_posts)
      ├── Social Media (muestra social_posts) ← dos tablas diferentes
      ├── Ads (mock)
      ├── Influencers (mock)
      ├── Legales (parcial)
      └── Dashboard (mock)
```

**Problemas estructurales:**
- Dos tablas de posts sin relación entre sí
- No hay Campaign como objeto
- No hay Brand como objeto con sus propiedades
- No hay ciclo de aprendizaje
- La IA solo existe en generación, no en análisis

### Arquitectura propuesta (V2)

```
Workspace
  └── Brand
      ├── Brand Profile (voz, identidad, restricciones)
      ├── Brand Memory (aprendizaje acumulado)
      └── Campaign
          ├── Brief
          ├── Calendar (planificación)
          ├── Assets
          │   ├── Copy (generado por Copy Agent)
          │   ├── Images (generado por Image Agent)
          │   └── Videos (generado por Video Agent)
          ├── Posts (para aprobar y publicar)
          ├── Ads (amplificación paga)
          ├── Influencers (distribución)
          ├── Landing (si aplica)
          ├── Performance (métricas post-publicación)
          ├── Insights (análisis IA)
          ├── Recommendations (qué hacer después)
          └── Learning (→ Brand Memory)
```

### Plan de migración

No reescribir todo. Evolución en 4 pasos.

**Paso 1 — Unificar posts (Sprint 1)**  
`jclaude_posts` y `social_posts` se fusionan en una sola tabla `posts`. Los posts de JClaude son posts en estado `draft`. Los de Social Media son los mismos posts en estado `pending/approved`. Una sola fuente de verdad.

**Paso 2 — Agregar Campaign y Brand como objetos (Sprint 1-2)**  
Crear tablas `brands` y `campaigns`. Los posts existentes se asocian a una "Default Campaign" por workspace. La migración es transparente para el usuario.

**Paso 3 — Reestructurar navegación (Sprint 2)**  
El sidebar cambia de módulos a Campaign-centric. La pantalla de JClaude se convierte en Campaign Studio. Social Media desaparece como módulo y pasa a ser la vista de Posts dentro de Campaign.

**Paso 4 — Activar Memory y Learning (Sprint 3)**  
Crear tablas de Memory. Implementar Learning Agent que escribe al cierre de Campaign. Conectar Brand Memory a los prompts de generación.

---

## 16. Alineación con RUN72 Framework

### Patrones que aparecen en todos los productos RUN72

**El ciclo Strategy → Execution → Learning**  
En Margin: receta → producción → margen real  
En JC AI Agency: brief → contenido → performance  
En RUN72 Core: siempre hay un loop de mejora continua  
→ *Este patrón debería estar codificado en RUN72 Core OS como "The Learning Loop"*

**Memory como activo de primera clase**  
En todos los productos RUN72, el conocimiento acumulado vale más que el feature que lo generó.  
→ *RUN72 Core OS debería tener una Memory Architecture estándar que cada producto implementa*

**El objeto central varía por dominio pero el patrón es el mismo**  
En Margin: Recipe es el objeto central  
En JC AI Agency: Campaign es el objeto central  
En Tips+: probablemente Tip o Collection  
→ *El patrón "Core Entity → Workflow → Learning" es el framework. La entidad central es específica del dominio.*

**Event-Driven como lenguaje común**  
Todos los productos deberían emitir eventos con el mismo esquema base.  
→ *RUN72 Core OS debería definir un Event Schema estándar: `{ event, workspace_id, entity_type, entity_id, actor_id, metadata, created_at }`*

### Qué parte puede convertirse en activo de RUN72 Core OS

1. **Memory Architecture Pattern** — el diseño de las 9 memorias es reutilizable en cualquier producto RUN72
2. **Universal Workflow Pattern** — `Strategy → Brief → Planning → Generation → Review → Approval → Publishing → Performance → Insights → Recommendations → Learning` es reutilizable
3. **AI Agent Collaboration Pattern** — la forma en que los agentes se encadenan con contexto compartido
4. **Event Schema** — el estándar de eventos para `activity_logs`
5. **Campaign-First Domain Model** — la estructura `Brand → Campaign → Assets → Performance → Learning` aparecerá en proyectos similares

---

## 17. ¿Es esto un AI-Native Product?

Respuesta honesta: **todavía no. Pero tiene la estructura correcta para serlo.**

### Qué sería un AI-Native Product

Un producto AI-Native no es un producto tradicional con botones de IA. Es un producto donde:

1. **La IA toma decisiones, no solo genera contenido**
2. **El sistema mejora con el tiempo** sin intervención del developer
3. **El usuario delega al sistema**, no solo lo usa como herramienta
4. **La IA tiene contexto permanente**, no empieza desde cero cada vez

### Evaluación actual

| Criterio | Estado actual | Estado propuesto (V2) |
|---|---|---|
| IA genera contenido | ✅ Sí | ✅ Sí |
| IA analiza performance | ⚠️ Parcial (Ads mock) | ✅ Completo |
| IA recomienda qué hacer | ❌ No | ✅ Sí |
| IA aprende con el tiempo | ❌ No | ✅ Sí (Brand Memory) |
| IA toma decisiones autónomas | ❌ No | ⚠️ Parcial (scheduling) |
| El sistema mejora sin code changes | ❌ No | ✅ Sí (via Memory) |

### El diagnóstico

Hoy JC AI Agency es **un software tradicional con IA de generación agregada**.

El punto de inflexión hacia AI-Native ocurre cuando se activa Brand Memory y el sistema empieza a **contextualizar** cada generación con aprendizaje previo. Eso ocurre en V2, Sprint 3.

Antes de ese punto, JClaude es una interfaz sobre un modelo de lenguaje. Después de ese punto, JClaude es un sistema que conoce a sus clientes.

---

## 18. Recomendación

### Opción A: Continuar la arquitectura actual
Bajo riesgo a corto plazo. Alto riesgo a largo plazo. Cada feature nueva se construye sobre un modelo mental incorrecto y la deuda conceptual crece.

### Opción B: Realizar pequeños ajustes
Insuficiente. Los problemas identificados (dos tablas de posts, ausencia de Campaign, JClaude como módulo) no se resuelven con ajustes. Son decisiones de arquitectura.

### Opción C: Recomponer el modelo conceptual antes de Sprint 1

**La recomendación es C.**

Pero no es un rewrite. Es una recomposición.

La recomposición tiene cuatro movimientos:

**Movimiento 1 — Conceptual (hoy)**  
Este documento. Acordar el modelo mental correcto antes de escribir una línea de código. ✅

**Movimiento 2 — Data (Sprint 1)**  
Unificar posts. Agregar Campaign y Brand como objetos reales. Migrar datos existentes sin romper nada.

**Movimiento 3 — Navigation (Sprint 2)**  
Reestructurar el sidebar. Campaign Studio reemplaza JClaude como pantalla. Módulos desaparecen, capabilities emergen.

**Movimiento 4 — Intelligence (Sprint 3)**  
Brand Memory live. Learning Agent activo. El sistema empieza a mejorar con el tiempo. AI-Native.

---

### Por qué ahora y no después

Hay exactamente un momento en la vida de un producto donde recomponer el modelo conceptual es barato: antes de que escale.

Hoy JC AI Agency tiene:
- Pocos clientes reales
- Deuda técnica manejable
- El código correcto para ser refactorizado sin reescribirse
- El equipo disponible para hacer la transición

Si esperamos a tener 100 clientes, la recomposición costará 10x más.

Si esperamos a Sprint 3 o 4 con el modelo actual, cada feature que agreguemos profundizará la deuda conceptual.

**El momento es ahora.**

---

### El resultado de ejecutar esta recomposición

JC AI Agency deja de ser un portal de agencia con IA.

Se convierte en el primer **AI Marketing Operating System** que aprende de cada campaña, mejora con el tiempo, y eventualmente puede operar con menos intervención humana.

Y, en paralelo, la arquitectura que construimos aquí se convierte en el primer caso de éxito real donde **RUN72 OS demuestra que puede absorber, reorganizar y hacer escalar un producto existente** sin perder su historia, su velocidad ni su conocimiento acumulado.

Ese aprendizaje vale más que el código.

---

*Documento generado durante Sprint 0.5 — Product Recomposition*  
*RUN72 OS × JC AI Agency × Claude Sonnet 4.6*  
*Junio 2026*
