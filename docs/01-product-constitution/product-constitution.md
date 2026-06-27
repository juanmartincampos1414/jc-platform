# Product Constitution
## JC AI Agency
**Versión:** 0.1 · Junio 2026

---

## 1. Qué es JC AI Agency

> **JC AI Agency es un AI Marketing Operating System que ayuda a marcas y agencias a planificar, generar, aprobar, publicar, medir y optimizar campañas de contenido y performance usando IA, integraciones sociales y aprendizaje continuo.**

No es una herramienta. Es un sistema operativo de marketing.

El diferencial no es que genera contenido. Es que conecta estrategia → ejecución → performance → aprendizaje en un loop continuo, con IA como motor y humanos como aprobadores.

---

## 2. Qué NO es

- No es solamente un generador de posts.
- No es solamente un dashboard de agencia.
- No es solamente un calendario de contenido.
- No es solamente un portal de cliente.
- No es solamente una herramienta de reporting.
- No es solamente JClaude.
- No es un reemplazo de la agencia humana — es un amplificador.
- No es un CRM.
- No es una herramienta de diseño.
- No es una plataforma de gestión de redes sociales genérica.

---

## 3. Para quién es

### Usuario primario: La marca o empresa

Empresas de 5 a 500 empleados que:
- Tienen redes sociales activas pero sin proceso consistente.
- Pagan a una agencia o tienen un equipo interno pequeño.
- Quieren más control y visibilidad sobre su marketing.
- No quieren pensar todos los meses qué publicar.
- Quieren aprobar antes de que se publique.
- Necesitan ver qué funciona y qué no.

### Usuario secundario: La agencia (JC AIgency primero, otras después)

Agencias de marketing digital que:
- Manejan múltiples clientes.
- Quieren escalar sin crecer el equipo proporcionalmente.
- Quieren diferenciarse con IA.
- Quieren reducir tiempo en tareas operativas (calendarios, aprobaciones, reportes).

### Usuario terciario: El cliente de la agencia (cliente final)

El decisor o equipo de la marca cliente que:
- Necesita aprobar contenido.
- Quiere ver resultados de sus campañas.
- Quiere firmar documentos.
- Quiere dar feedback sin usar WhatsApp o email.

---

## 4. Propuesta de valor

### Para marcas

> "Conectá tu marca, definí tu voz, y recibí un plan de contenido mensual listo para aprobar. IA que trabaja como tu equipo de marketing, vos solo aprobás."

### Para agencias

> "Un sistema que escala tu operación. Más clientes, mismo equipo. Todo trazado, todo aprobado, todo documentado."

---

## 5. Principios del producto

### 1. Campaign-first, no post-first
Toda acción pertenece a una campaña. Un post aislado no existe. Existe como parte de una estrategia.

### 2. Brand memory before content generation
Antes de generar cualquier contenido, el sistema debe conocer la marca. Tono, audiencia, mensajes clave, historial. Sin memoria de marca, la IA genera genérico.

### 3. Every output must be traceable
Todo lo que genera la IA debe tener: origen (qué prompt), modelo (qué versión), input (qué datos usó), output (qué produjo), estado (draft/approved/published), resultado (qué performance tuvo).

### 4. No AI without approval layer
Nada se publica sin que un humano apruebe. La IA propone. El humano decide. Siempre.

### 5. Performance must feed learning
Si algo funciona, el sistema debe aprender. Si algo no funciona, también. El loop es: generate → approve → publish → measure → learn → generate mejor.

### 6. Client simplicity over agency complexity
El cliente final ve lo mínimo necesario para tomar decisiones. La complejidad la absorbe el sistema y la agencia. La UI del cliente debe ser tan simple como aprobar o rechazar.

### 7. Every module must produce reusable knowledge
Legales produce contratos reutilizables. Social produce copies que alimentan brand memory. Ads produce insights que alimentan planning. Ningún módulo es una isla.

### 8. Product must work first for JC, then for other agencies
Se construye con clientes propios de JC AIgency. Se valida en producción real. Se empaqueta después. No se vende humo antes de que funcione internamente.

### 9. No mock should survive into production workflows
Si algo es mock, está marcado como mock y tiene fecha de resolución. Mock no es un estado permanente. Es deuda con deadline.

### 10. Every decision must be documented
Las decisiones técnicas, de producto y de negocio viven en ADRs. No en conversaciones de Claude. No en la cabeza de Juan. En el repo.

---

## 6. Invariantes — Lo que nunca se puede romper

Estas son las reglas que no cambian, sin importar qué features se agreguen o quiten.

1. **Todo dato pertenece a un workspace.** No existe dato sin `workspace_id`. La arquitectura multi-tenant es no negociable.

2. **Todo contenido generado por IA tiene origen, prompt, modelo y estado.** Si no se puede trazar, no se puede mejorar ni auditar.

3. **Todo asset tiene owner, campaña y destino.** Una imagen generada sin contexto no tiene valor en el sistema.

4. **Toda publicación debe tener approval state.** `draft → approved → published` es el flujo mínimo. Nada salta etapas.

5. **Toda campaña debe poder medirse.** Si no tiene métricas, no se puede aprender de ella.

6. **Toda recomendación debe tener fuente de datos.** La IA no opina. La IA analiza y fundamenta.

7. **Todo cliente debe tener brand profile.** Sin perfil de marca, no hay generación de contenido.

8. **Todo agente IA debe dejar trazabilidad.** Cada llamada a un modelo registra: timestamp, modelo, tokens usados, resultado, workspace_id.

9. **Todo token externo se guarda encriptado.** Los tokens de OAuth (Meta, Google, TikTok) son secretos de cliente. No van en plaintext.

10. **Toda integración puede desconectarse.** El sistema no puede quedar en estado inconsistente si una red social desconecta su token.

---

## 7. El loop central del producto

```
Brand Memory
    ↓
Campaign Planning
    ↓
AI Generation (copy, imagen, video)
    ↓
Human Approval
    ↓
Publishing
    ↓
Performance Measurement
    ↓
AI Insights
    ↓
Recommendations
    ↓
Learning → actualiza Brand Memory
    ↓
(next campaign)
```

Toda feature que no alimenta este loop es secundaria o no pertenece al core.

---

## 8. North star métrica

> **Tiempo desde "tengo una marca" hasta "mi primer post aprobado está publicado en Instagram"**

Meta: < 15 minutos para un cliente nuevo.

---

## 9. Modelo de negocio

### Fase 1 (actual): Portal de cliente + JClaude SaaS

- JC AIgency usa la plataforma con sus clientes propios.
- Los clientes acceden al portal como servicio incluido en el fee de la agencia.
- JClaude se vende como módulo adicional con suscripción mensual en MercadoPago.
- Planes: Starter $200K, Pro $300K, Enterprise $800K ARS/mes.
- 7 días de prueba gratuita.

### Fase 2: SaaS white-label para agencias

- Otras agencias pueden usar la plataforma con su propia marca.
- Multi-agency: cada agencia tiene sus workspaces de clientes.
- Plan adicional de agencia con billing separado.

### Fase 3: Self-service para marcas

- Marcas que no tienen agencia contratan directamente.
- Onboarding self-service.
- JC AIgency como agencia opcional disponible desde la plataforma.

---

## 10. Definición de "done" para v0.1

Un cliente puede:
1. Registrarse y crear su workspace.
2. Configurar su perfil de marca.
3. Suscribirse a JClaude con trial gratuito.
4. Generar un calendario mensual de 12 posts.
5. Ver, aprobar y rechazar posts individualmente.
6. Generar una imagen por post.
7. Conectar su cuenta de Instagram.
8. Ver posts programados para publicación.

Sin mocks en ninguno de estos pasos.

---

*Documento vive en `/docs/01-product-constitution/product-constitution.md`*  
*Próxima revisión: al finalizar Sprint 0 con feedback de clientes reales*
