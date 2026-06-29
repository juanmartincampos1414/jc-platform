# Product Roadmap
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

## North Star

> Un cliente puede conectar su marca, definir su voz, aprobar su contenido y recibir ejecución — todo en menos de 15 minutos desde el registro.

---

## Versión actual: v0.0 — Foundation (hoy)

**Estado:** Núcleo técnico real + portal con mocks

**Lo que funciona:**
- Auth + workspaces multi-tenant
- JClaude: generación de calendario, imágenes, suscripción MP, OAuth Meta (parcial)
- Portal de cliente con UI completa (pero sin backend en 6/8 módulos)

**Lo que no funciona:**
- Dashboard con datos reales
- Firma de documentos persistente
- Social Media y Ads conectados a DB
- Autopublish verificado
- Storage de imágenes permanente

---

## v0.1 — Stabilized JClaude
**Objetivo:** JClaude funciona como producto SaaS real y confiable. Cero mocks en el flujo principal.  
**Tiempo estimado:** 2-3 semanas  

### Features
- [ ] Password reset funcional
- [ ] Dashboard leyendo datos reales de DB
- [ ] Firma de documentos persistente en DB con audit trail
- [ ] Social Media conectado a `social_posts` (aprobar/rechazar persiste)
- [ ] Supabase Storage inicializado (imágenes no expiran)
- [ ] Imágenes de JClaude guardadas en Storage permanente
- [ ] Tokens OAuth Meta encriptados
- [ ] activity_logs table (feed de actividad real)
- [ ] Banner de "datos de ads en actualización" (reemplaza mock de Ads)
- [ ] Prompts de JClaude en DB (tabla `jclaude_prompts`)
- [ ] AI Jobs trazables (tabla `ai_jobs`)
- [ ] Calendar view en JClaude (grilla mensual)
- [ ] Vercel Pro para eliminar timeout de 60s

### Definición de "done"
Un cliente real puede:
1. Registrarse en /login → JClaude
2. Configurar perfil de marca
3. Suscribirse con 7 días free trial
4. Generar hasta 20+ posts del mes
5. Ver posts en calendario mensual
6. Aprobar cada post (persiste al recargar)
7. Generar imagen para cada post (guardada en Storage)
8. Conectar Instagram
9. Ver su dashboard con datos reales

---

## v0.2 — Agency Portal Real
**Objetivo:** JC AIgency puede usar el portal completo con clientes propios. Cero mocks.  
**Tiempo estimado:** 3-4 semanas después de v0.1  

### Features
- [ ] Influencers conectados a DB (pipeline real)
- [ ] Admin panel completo (ver todos los workspaces, gestionar suscripciones)
- [ ] Invitations flow (JC invita a clientes al workspace)
- [ ] Billing UI (historial de pagos, facturas)
- [ ] Notificaciones básicas (cuando hay algo para aprobar)
- [ ] Workspace settings (logo, servicios activos)
- [ ] Seedance video generation
- [ ] Autopublish Meta verificado y monitoreado
- [ ] Meta approval para `instagram_content_publishing` completada

### Definición de "done"
JC AIgency usa la plataforma con 3+ clientes reales sin workarounds manuales.

---

## v0.3 — Campaign OS
**Objetivo:** El producto se organiza alrededor de campañas, no de módulos.  
**Tiempo estimado:** 4-6 semanas después de v0.2  

### Features
- [ ] Entidad Campaign (tabla campaigns, campaign_briefs)
- [ ] Crear campaña con brief de IA
- [ ] Posts de JClaude asignados a campaña
- [ ] Social posts por campaña
- [ ] Influencers por campaña
- [ ] Meta Ads conectado (métricas reales, no mock)
- [ ] Dashboard por campaña (budget, posts publicados, métricas)
- [ ] Vista unificada: todo lo de una campaña en un solo lugar
- [ ] performance_snapshots table con datos reales

### Definición de "done"
Un cliente puede ver "Campaña Verano 2026" y ver: brief, posts, ads, influencers y métricas en un solo lugar.

---

## v0.4 — AI Marketing Brain
**Objetivo:** JClaude deja de ser generador y se convierte en cerebro que aprende y recomienda.  
**Tiempo estimado:** 6-8 semanas después de v0.3  

### Features
- [ ] Brand Memory table con Learning Agent
- [ ] Aprobaciones alimentan la memoria (lo que aprueba/rechaza el cliente)
- [ ] Performance data alimenta la memoria (horarios óptimos, tipos de post)
- [ ] Próxima generación de JClaude incorpora memorias del mes anterior
- [ ] Insights Agent (Claude analiza performance y genera observaciones)
- [ ] Recommendation Agent (sugiere acciones concretas con prioridad)
- [ ] Strategy Agent (ayuda a definir objectives y briefs)
- [ ] Trend ingestion (detectar tendencias por industria)
- [ ] Calidad de outputs medida (tasa de aprobación por versión de prompt)

### Definición de "done"
El mes 3 de JClaude para un cliente tiene un 20% más de tasa de aprobación que el mes 1 — sin intervención manual.

---

## v1.0 — White-label SaaS
**Objetivo:** Otras agencias pueden usar JC AI Agency con su propia marca.  
**Tiempo estimado:** 3+ meses después de v0.4  

### Features
- [ ] Multi-agency: cada agencia tiene su propia instancia de workspaces
- [ ] Custom domain por agencia
- [ ] Branding configurable (logo, colores, nombre del producto)
- [ ] Plan de agencia con billing separado
- [ ] Self-service onboarding para agencias
- [ ] Documentación de API pública (si se expone)
- [ ] SLA formal (uptime 99.5%)
- [ ] Soporte con tickets
- [ ] Observability completo (Sentry, métricas, alertas)
- [ ] Compliance (GDPR si aplica, datos de clientes)

### Definición de "done"
Una agencia distinta a JC AIgency puede hacer onboarding, agregar clientes y usar la plataforma completamente sin intervención de Juan.

---

## Integraciones por versión

| Integración | v0.1 | v0.2 | v0.3 | v1.0 |
|---|---|---|---|---|
| Meta / Instagram (OAuth) | ✅ parcial | ✅ completo | ✅ | ✅ |
| Meta Ads API | ❌ | ❌ | ✅ | ✅ |
| fal.ai (imágenes) | ✅ | ✅ | ✅ | ✅ |
| Seedance (videos) | ❌ | ✅ | ✅ | ✅ |
| Supabase Storage | ✅ | ✅ | ✅ | ✅ |
| MercadoPago | ✅ | ✅ | ✅ | ✅ |
| Email (reset/notifs) | ✅ | ✅ | ✅ | ✅ |
| TikTok | ❌ | ❌ | ❌ | ✅ |
| LinkedIn | ❌ | ❌ | ❌ | ✅ |
| Google Ads | ❌ | ❌ | ❌ | ✅ |
| Firma digital real | ❌ | ❌ | ❌ | ✅ |

---

## Preguntas críticas a responder antes de v0.2

1. **¿JClaude se vende como módulo separado del portal?**  
   Hoy sí — suscripción propia. ¿Se mantiene así o se fusiona con el portal?

2. **¿El objeto principal es workspace, campaña o cliente?**  
   Hoy: workspace. En v0.3 debería ser campaña. ¿Cuándo hacemos ese pivot?

3. **¿Qué parte paga el cliente de JC AIgency vs. qué parte paga JClaude?**  
   El portal es "free" (incluido en el fee de la agencia). JClaude es subscripción extra.

4. **¿Autopublish es parte del plan o siempre aprobación manual primero?**  
   Hoy: autopublish solo en Pro/Enterprise. ¿Se puede desactivar por cliente?

5. **¿Cuántos clientes reales queremos tener al finalizar v0.1?**  
   Define el nivel de estabilidad necesario.

---

---

## Sprint 9 — Autonomous Operations

**Regla de trabajo:**

> Sprint 9 no agrega inteligencia nueva. La inteligencia ya existe. Sprint 9 se concentra únicamente en ejecución.

El primer ciclo cognitivo completo está en producción:

```
Knowledge → Decision → Recommendation → Learning → Strategy → Executive Intelligence
```

Sprint 9 pasa de *"el sistema sabe qué hacer"* a *"el sistema puede hacerlo"*.

**Si durante Sprint 9 aparece una idea nueva de IA, nuevos modelos, nuevos agentes o nuevas capas de conocimiento** → registrar en backlog. No incluir en el sprint.

**Objetivo:**
Que determinadas Recommendations puedan convertirse en acciones automáticas bajo reglas definidas por el cliente, con supervisión configurable y audit trail completo.

**Conceptos centrales — tres condiciones para toda acción autónoma:**

```
Confidence suficiente AND Autonomy Policy lo permite AND Action Class está autorizada
```

Las tres son obligatorias. Ninguna reemplaza a las otras.

**Autonomy Policy** (decide el cliente):

| Nivel | Nombre | Comportamiento |
|---|---|---|
| 0 | Observation Only | Observa. No recomienda. No ejecuta. |
| 1 | Recommendations | Recomienda. El usuario ejecuta. |
| 2 | Approval Required | Prepara la acción. Queda pendiente de aprobación. |
| 3 | Autonomous | Ejecuta acciones de las clases autorizadas. Audit trail completo. Siempre reversible. |

**Action Class** (decide el dominio del producto):

| Clase | Riesgo | Ejemplos |
|---|---|---|
| A — Low Risk | Bajo | Programar publicaciones, generar contenido, actualizar borradores |
| B — Medium Risk | Medio | Publicar automáticamente, aprobar assets |
| C — High Risk | Alto | Modificar presupuestos, activar/detener campañas, enviar comunicaciones masivas |

**Definition of Done:**
- `autonomy_policy` persistido por Workspace: nivel global (0-3) + nivel por Action Class.
- Toda acción autónoma declara su Action Class antes de ejecutarse.
- El sistema verifica las tres condiciones antes de cada acción autónoma.
- Toda acción autónoma genera un evento inmutable en el audit trail (política vigente, clase, confidence al momento).
- El cliente puede revertir cualquier acción autónoma desde la UI.
- El cliente puede configurar la política desde la UI.
- El sistema nunca ejecuta nada sin autorización explícita por política y clase.

---

## Backlog registrado (post Sprint 9)

- `backlog-intelligent-onboarding.md` — Diagnóstico inicial de Brand al crear Workspace, para inicializar Brand Memory con contexto real antes de la primera campaña.

---

*Documento vive en `/docs/08-roadmap/product-roadmap.md`*  
*Revisión mensual al finalizar cada versión*
