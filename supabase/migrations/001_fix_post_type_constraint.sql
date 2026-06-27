-- Migration 001: Actualizar constraint post_type para incluir post, reel, story
-- Aplicar en Supabase SQL Editor
-- Este cambio ya fue aplicado manualmente — esta migration lo documenta formalmente

ALTER TABLE public.jclaude_posts
  DROP CONSTRAINT IF EXISTS jclaude_posts_post_type_check;

ALTER TABLE public.jclaude_posts
  ADD CONSTRAINT jclaude_posts_post_type_check
  CHECK (post_type IN ('post', 'reel', 'story', 'standard', 'trending'));
