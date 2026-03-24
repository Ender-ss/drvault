-- 1. CRIAR TABELA DE FAVORITOS INDIVIDUAIS
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    media_item_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, media_item_id)
);

-- 2. HABILITAR RLS NA TABELA DE FAVORITOS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS PARA FAVORITOS (USUÁRIO GERENCIA APENAS OS SEUS)
CREATE POLICY "Users can manage their own favorites"
ON user_favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. ATUALIZAR POLÍTICAS DA TABELA media_items PARA SER COMPARTILHADA
-- (Assumindo que já existem políticas, vamos garantir que todos possam ALL)
DROP POLICY IF EXISTS "Users can manage their own items" ON media_items;
DROP POLICY IF EXISTS "Authenticated users can manage all items" ON media_items;

CREATE POLICY "Authenticated users can manage all items"
ON media_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. AJUSTE NO STORAGE (BUCKET thumbnails)
-- É recomendado criar uma regra na interface do Supabase para a pasta "shared/"
-- Permitindo INSERT/UPDATE/DELETE para usuários autenticados na pasta shared.
