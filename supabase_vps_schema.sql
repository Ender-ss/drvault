-- ==============================================================================
-- SCRIPT DE INICIALIZAÇÃO COMPLETA DO BANCO DE DADOS - DRVAULT (SUPABASE SELF-HOSTED)
-- ==============================================================================

-- 1. Habilitar Extensões Necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Mídias (media_items)
CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    thumb_url TEXT,
    drive_link TEXT,
    niche TEXT,
    category TEXT, -- 'avatar', 'broll', 'hook', etc.
    broll_type TEXT,
    tags TEXT[] DEFAULT '{}'::text[]
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_media_items_category ON public.media_items(category);
CREATE INDEX IF NOT EXISTS idx_media_items_niche ON public.media_items(niche);
CREATE INDEX IF NOT EXISTS idx_media_items_created_at ON public.media_items(created_at DESC);

-- 3. Tabela de Criativos / Copies (copies)
CREATE TABLE IF NOT EXISTS public.copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT, -- Nicho da copy
    status TEXT DEFAULT 'Teste',
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_copies_created_at ON public.copies(created_at DESC);

-- 4. Tabela de Favoritos dos Usuários (user_favorites)
CREATE TABLE IF NOT EXISTS public.user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES public.media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, media_item_id)
);

-- ==============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas para media_items (Biblioteca compartilhada para todos os usuários autenticados)
DROP POLICY IF EXISTS "Authenticated users can manage all items" ON public.media_items;
CREATE POLICY "Authenticated users can manage all items"
ON public.media_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir leitura pública para mídias se necessário (ou apenas autenticados)
DROP POLICY IF EXISTS "Public can view media items" ON public.media_items;
CREATE POLICY "Public can view media items"
ON public.media_items
FOR SELECT
TO anon
USING (true);

-- Políticas para copies (Criativos compartilhados)
DROP POLICY IF EXISTS "Allow authenticated users to manage all copies" ON public.copies;
CREATE POLICY "Allow authenticated users to manage all copies"
ON public.copies
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para user_favorites (Cada usuário gerencia seus próprios favoritos)
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.user_favorites;
CREATE POLICY "Users can manage their own favorites"
ON public.user_favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- CONFIGURAÇÃO DE BUCKETS DO STORAGE (thumbnails)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para o bucket thumbnails
DROP POLICY IF EXISTS "Public Access to thumbnails" ON storage.objects;
CREATE POLICY "Public Access to thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Authenticated users can update thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can update thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "Authenticated users can delete thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can delete thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'thumbnails');
