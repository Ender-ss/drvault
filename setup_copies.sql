-- SCRIPT DE CRIAÇÃO DA TABELA DE COPIES (CRIATIVOS)
-- Execute este script no SQL Editor do Supabase para garantir que a funcionalidade de Criativos funcione na Vercel.

-- 1. Criar a tabela 'copies' se ela não existir
CREATE TABLE IF NOT EXISTS public.copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    category TEXT, -- No frontend usamos 'niche'
    status TEXT DEFAULT 'Teste',
    data JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para permitir acesso completo a usuários autenticados (Shared Library Philosophy)
-- Como o usuário solicitou que "o restante tem que ser igual para todos", removemos a restrição de user_id no acesso.
CREATE POLICY "Allow authenticated users to manage all copies"
ON public.copies
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Adicionar um comentário para documentação
COMMENT ON TABLE public.copies IS 'Tabela que armazena os scripts de anúncios (criativos) compartilhados.';
