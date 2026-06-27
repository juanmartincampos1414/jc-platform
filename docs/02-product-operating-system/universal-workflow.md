# Universal Workflow
## JC AI Agency · Product Operating System
**Versión:** 0.1 · Junio 2026

---

> Todo en el producto sigue el mismo flujo fundamental. Independientemente del módulo, la dirección es siempre: Estrategia → Planificación → Generación → Revisión → Aprobación → Ejecución → Medición → Aprendizaje.

---

## El workflow universal

```
1. STRATEGY      Definir objetivo, audiencia y presupuesto
       ↓
2. BRIEF         Documentar instrucciones específicas para la ejecución
       ↓
3. PLANNING      Organizar qué, cuándo, en qué canal y con qué recursos
       ↓
4. GENERATION    Crear el contenido (IA, humano o híbrido)
       ↓
5. REVIEW        Revisar calidad y alineación con el brief
       ↓
6. APPROVAL      Aprobación formal por el cliente o responsable
       ↓
7. PUBLISHING    Ejecutar en el canal correspondiente
       ↓
8. MEASUREMENT   Recoger métricas de resultado
       ↓
9. INSIGHT       Interpretar los datos
       ↓
10. RECOMMENDATION  Sugerir acciones para la próxima iteración
       ↓
11. LEARNING     Actualizar brand memory y prompts con lo aprendido
       ↓
(back to STRATEGY — loop continuo)
```

---

## Aplicación por módulo

---

### JClaude (Content Generation)

```
STRATEGY
  Input: brand profile (nombre, industria, tono, audiencia, mensajes clave)
  Quién: client_admin al configurar JClaude
  Entidad: Brand

BRIEF
  Input: mes y año objetivo, redes disponibles, cantidad de posts del plan
  Quién: Usuario al hacer clic en "Generar mes"
  Entidad: (implícito en el prompt de generate-month)

PLANNING
  Proceso: Claude genera distribución de fechas, horarios, redes y tipos
  Quién: Sistema (Claude)
  Entidad: ai_job → plan de calendario

GENERATION
  Proceso: Claude genera copy + hashtags + image_brief por post. fal.ai genera imágenes.
  Quién: Sistema (Claude + fal.ai)
  Entidad: jclaude_posts (status: 'draft')

REVIEW
  Proceso: JClaude muestra posts generados al usuario para revisión
  Quién: client_admin en /jclaude
  Entidad: jclaude_posts (status: 'draft')

APPROVAL
  Proceso: Usuario aprueba o rechaza cada post individualmente
  Quién: client_admin
  Entidad: jclaude_posts (status: 'approved' | 'rejected')

PUBLISHING
  Proceso: Cron job publica posts aprobados y programados en Meta
  Quién: Sistema (cron-publish)
  Entidad: jclaude_posts (status: 'published')

MEASUREMENT
  Proceso: Importar métricas del post publicado desde Meta API
  Quién: Sistema (pendiente)
  Entidad: performance_snapshots (pendiente)

INSIGHT
  Proceso: Analizar engagement, alcance, clics del post
  Quién: Sistema (insights agent — pendiente)

RECOMMENDATION
  Proceso: Sugerir tipos de post o horarios que funcionan mejor
  Quién: Sistema (recommendation agent — pendiente)

LEARNING
  Proceso: Actualizar brand_memory con patrones de aprobación y performance
  Quién: Sistema automático
  Estado actual de este flujo: Generation → Review → Approval ✅. Publishing ⚠️. Todo lo demás ❌.
```

---

### Social Media (Content Approval Portal)

```
STRATEGY
  Ídem Campaign Planning (existe cuando se implementa Campaign)

BRIEF
  Input: Brief de campaña o instrucción de JC al equipo
  Entidad: CampaignBrief (pendiente)

PLANNING
  Proceso: JC crea posts manualmente o desde JClaude para el mes
  Quién: jc_admin
  Entidad: social_posts (status: 'draft')

GENERATION
  Proceso: Copy generado por humano (jc_admin) o importado desde JClaude
  Quién: jc_admin

REVIEW
  Proceso: JC revisa antes de enviar al cliente
  Quién: jc_admin

APPROVAL
  Proceso: Cliente ve, comenta y aprueba/rechaza cada post
  Quién: client_admin via /social-media
  Entidad: social_posts (status: 'approved' | 'rejected' | 'needs_changes')

PUBLISHING
  Proceso: Programación real en red social
  Quién: Sistema (pendiente) o manual

MEASUREMENT → INSIGHT → LEARNING: Ídem JClaude
Estado actual: Planning ✅ (mock), Generation ✅ (mock), Review ✅ (mock). Todo es mock — no persiste.
```

---

### Ads

```
STRATEGY
  Input: Objetivo de campaña, audiencia target, presupuesto total
  Entidad: Campaign

BRIEF
  Input: Segmentación, creatividades, mensajes clave, landing pages
  Entidad: CampaignBrief, Ad

PLANNING
  Proceso: Definir campañas, ad sets, ads y distribución de presupuesto
  Quién: jc_admin + Meta Ads Manager

GENERATION
  Proceso: Crear creatividades (images/videos) + copy para los ads
  Quién: JClaude (assets) + jc_admin (configuración en Meta)

REVIEW
  Proceso: Revisión interna de JC
  Quién: jc_admin

APPROVAL
  Proceso: Cliente aprueba presupuesto y creatividades
  Quién: client_admin

PUBLISHING
  Proceso: Activar campañas en Meta Ads (externo, fuera del sistema)

MEASUREMENT
  Proceso: Importar métricas via Meta Ads API
  Entidad: performance_snapshots

INSIGHT
  Proceso: Claude analiza métricas y detecta patrones (api/ai/ads-analysis)
  Quién: Sistema

RECOMMENDATION
  Proceso: Sugerir ajustes de budget, segmentación o creatividades

LEARNING
  Proceso: Actualizar campaign_memory con what works

Estado actual: Strategy/Brief ❌, Planning ❌, Generation ❌ (usa JClaude assets pero no conectado), Review ❌, Approval ❌, Publishing ❌ (externo), Measurement ❌ (mock), Insight ⚠️ (funciona pero con datos mock), Recommendation ❌, Learning ❌
```

---

### Influencers

```
STRATEGY
  Input: Tipo de influencer buscado, categoría, budget, red principal

BRIEF
  Input: Qué debe hacer el influencer, qué debe publicar, cuándo, cuánto gana

PLANNING
  Proceso: Scouting — identificar influencers candidatos
  Entidad: influencer (status: 'scouting')

GENERATION
  Proceso: Influencer crea el contenido (externo al sistema)
  Quién: El influencer

REVIEW
  Proceso: JC revisa el contenido entregado
  Entidad: influencer (status: 'content_review')

APPROVAL
  Proceso: Cliente aprueba el contenido del influencer
  Quién: client_admin

PUBLISHING
  Proceso: Influencer publica en su red (externo)
  Entidad: influencer (status: 'published')

MEASUREMENT
  Proceso: Registrar alcance, engagement e impacto de la publicación
  Entidad: performance_snapshots (pendiente)

Estado actual: Planning ❌ (mock), Review ❌ (mock), Approval ❌ (mock). Todo es mock.
```

---

### Legales

```
BRIEF
  Input: JC decide qué documento enviar al cliente (carta oferta, contrato, NDA)
  Quién: jc_admin

GENERATION
  Proceso: JC prepara el PDF externamente

REVIEW
  Proceso: Revisión interna del documento
  Quién: jc_admin

APPROVAL (firma)
  Proceso: Cliente revisa y firma el documento
  Quién: client_admin
  Entidad: legal_documents (status: 'pending' → 'signed')

PUBLISHING (archivo)
  Proceso: Documento firmado guardado en Storage, auditoría registrada

MEASUREMENT: N/A para legales puros
LEARNING: Reutilizar templates de documentos en futuras propuestas

Estado actual: Generation ❌ (no hay upload en el sistema), Review ❌, Approval ⚠️ (UI existe pero no persiste en DB), Publishing ❌ (no hay Storage).
```

---

## Matriz de completitud del workflow

| Módulo | Strategy | Brief | Planning | Generation | Review | Approval | Publishing | Measurement | Insight | Learning |
|---|---|---|---|---|---|---|---|---|---|---|
| JClaude | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Social Media | ❌ | ❌ | Mock | Mock | Mock | Mock | ❌ | ❌ | ❌ | ❌ |
| Ads | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ext. | ❌ | ⚠️ | ❌ |
| Influencers | ❌ | ❌ | Mock | ext. | Mock | Mock | ext. | ❌ | ❌ | ❌ |
| Legales | N/A | ❌ | N/A | ext. | ❌ | Mock | ❌ | N/A | N/A | ❌ |

**Leyenda:** ✅ Funcional · ⚠️ Parcial · Mock = UI sin backend · ext. = proceso externo al sistema · ❌ No existe

---

*Documento vive en `/docs/02-product-operating-system/universal-workflow.md`*
