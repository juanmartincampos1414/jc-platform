# ADR-002 — Supabase como backend (auth, DB, storage)

## Estado
Aceptada

## Contexto
Se necesitaba un backend que cubriera auth, base de datos relacional y storage de archivos con:
- Setup rápido (días, no semanas)
- Multi-tenancy soportada nativamente via RLS
- Integración con Next.js SSR
- Sin gestionar infraestructura de servidor

## Decisión
Usar **Supabase** como plataforma de backend completa:
- Auth (Supabase Auth con email/password)
- Base de datos (PostgreSQL + RLS)
- Storage (configurado pero no inicializado aún — deuda técnica)
- Funciones helper (user_in_workspace, is_jc_admin)

## Alternativas consideradas
- **Firebase/Firestore** — NoSQL, más difícil modelar relaciones complejas, sin RLS nativa
- **PlanetScale + Clerk** — MySQL, no tiene storage nativo, más servicios separados
- **Neon + NextAuth** — Solo DB, sin storage ni auth integrado
- **Railway + PostgreSQL** — Requiere más configuración de auth y storage por separado

## Por qué esta decisión
- PostgreSQL es la DB correcta para un modelo relacional multi-tenant
- RLS (Row Level Security) resuelve el aislamiento de datos por workspace sin código adicional
- Auth integrada reduce un servicio externo
- Storage integrado (aunque no inicializado) está disponible cuando se necesite
- Plan gratuito generoso para fase inicial
- SDK oficial de Next.js (`@supabase/ssr`) bien mantenido

## Consecuencias
### Positivas
- Multi-tenant real con RLS — workspace_id en todas las tablas
- Auth + DB en un solo servicio
- Dashboard visual de Supabase para ver y editar datos
- Migrations SQL nativas
- Realtime disponible si se necesita (websockets para dashboards)

### Negativas
- Schema.sql como único archivo sin migrations versionadas (deuda actual)
- Supabase Storage no inicializado (imágenes expiran en fal.ai CDN)
- No hay backup automático configurado
- Si el proyecto crece mucho, Supabase puede volverse caro vs. PostgreSQL self-hosted
- Las funciones edge de Supabase son Deno (diferente a Node.js del resto del stack)

## Deuda técnica relacionada
- Inicializar Supabase Storage (`bucket: jc-assets`)
- Migrar de schema.sql monolítico a migrations individuales (`supabase/migrations/`)
- Configurar backup automático en Supabase dashboard
- Encriptar tokens OAuth que están en `social_credentials jsonb` plaintext

## Qué revisar en el futuro
- Cuando llegue a v1.0 multi-agencia, evaluar si un proyecto Supabase por agencia (isolation total) o sigue siendo multi-tenant en uno solo
- Si el costo de Supabase escala demasiado, evaluar migración a Neon + servicio de auth dedicado
