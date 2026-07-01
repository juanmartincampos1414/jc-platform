-- ============================================================
-- Migration 015 — Storage propio para media generado
-- ============================================================
-- Hoy las imágenes (Flux) y videos (Seedance) viven en la CDN de fal.ai,
-- referenciados por URL — efímeros: si fal expira la URL, el contenido del
-- cliente se rompe. Este bucket re-hostea el media generado en storage propio
-- con URLs permanentes. Lectura pública (Meta y TikTok fetchean la URL).
--
-- Escritura: solo desde el servidor con service role (bypass RLS) — no se
-- necesita policy de INSERT.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('generated-media', 'generated-media', true, 104857600)  -- 100 MB
on conflict (id) do update set public = excluded.public;

drop policy if exists "generated_media_public_read" on storage.objects;
create policy "generated_media_public_read" on storage.objects
  for select using (bucket_id = 'generated-media');
