# ADR-001 — Next.js como framework principal

## Estado
Aceptada

## Contexto
Al iniciar JC AI Agency se necesitaba un framework que permitiera construir rápido un producto con:
- Páginas server-side para auth y redirección
- API routes para integraciones de IA (Claude, fal.ai, Meta, MercadoPago)
- Componentes de cliente para UI interactiva
- Deploy simple en Vercel

## Decisión
Usar **Next.js 15+ con App Router** como framework principal, en TypeScript.

## Alternativas consideradas
- **Remix** — Similar capacidades pero ecosistema más pequeño, menos soporte en Vercel
- **SvelteKit** — Más ligero pero menos familiaridad del equipo y menos integraciones disponibles
- **Next.js Pages Router** — Descartado por ser la versión legacy

## Por qué esta decisión
- App Router permite mezclar Server Components y Client Components de forma natural
- API routes en el mismo repo simplifican el desarrollo inicial
- Vercel tiene integración nativa (deployments automáticos, edge functions, cron jobs)
- Ecosistema amplio (Supabase SSR, shadcn/ui, etc.)
- Velocidad de desarrollo: landing + auth + dashboard + API en un solo proyecto

## Consecuencias
### Positivas
- Un solo repo para frontend + backend
- Deploy en Vercel sin configuración extra
- Server Components reducen JavaScript al cliente
- Middleware de auth simple con Next.js + Supabase SSR

### Negativas
- Timeout de 60s en Vercel Hobby limita las funciones de IA de larga duración
- API routes no son ideales para tareas de larga duración (generate-month)
- A medida que crece, puede ser necesario separar el backend en un servicio dedicado
- Mixing de lógica de servidor y cliente puede llevar a confusión en equipos grandes

## Qué revisar en el futuro
- Si el timeout de funciones sigue siendo un problema, mover generación de IA a Edge Functions o a un servicio dedicado (Supabase Edge Functions, Railway, etc.)
- Si el producto crece a un equipo de 3+, considerar separar API en Next.js de una capa de servicios dedicada
- Al llegar a v1.0 SaaS evaluar si conviene monorepo (Turborepo) con app separada del API
