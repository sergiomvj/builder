-- ============================================================================
-- ADICIONAR COLUNAS PARA IMAGENS DE AVATAR GERADAS PELO NANO BANANA
-- ============================================================================
-- Execute no Supabase SQL Editor
-- Data: 2 de Dezembro de 2025
-- ============================================================================

-- Adicionar colunas para armazenar imagens geradas pelo Nano Banana
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS avatar_image_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_image_generated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS avatar_image_prompt TEXT;

-- Criar índice para buscar personas com/sem imagem
CREATE INDEX IF NOT EXISTS idx_personas_avatar_image ON personas(avatar_image_url) 
WHERE avatar_image_url IS NOT NULL;

-- Comentários
COMMENT ON COLUMN personas.avatar_image_url IS 'URL da imagem gerada pelo Gemini 2.5 Flash Image (Nano Banana)';
COMMENT ON COLUMN personas.avatar_image_generated_at IS 'Data e hora da geração da imagem';
COMMENT ON COLUMN personas.avatar_image_prompt IS 'Prompt usado para gerar a imagem (opcional, para auditoria)';

-- ============================================================================
-- CRIAR STORAGE BUCKET PARA IMAGENS (OPCIONAL)
-- ============================================================================
-- Se quiser usar Supabase Storage em vez de salvar localmente

INSERT INTO storage.buckets (id, name, public)
VALUES ('persona-avatars', 'persona-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso público para leitura
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'persona-avatars');

-- Política de upload autenticado
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'persona-avatars' 
  AND auth.role() = 'authenticated'
);

-- Política de update autenticado
CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'persona-avatars' 
  AND auth.role() = 'authenticated'
);

-- Política de delete autenticado
CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'persona-avatars' 
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personas' 
  AND column_name LIKE '%avatar_image%'
ORDER BY ordinal_position;

SELECT 'Colunas para Nano Banana criadas com sucesso!' as message;
