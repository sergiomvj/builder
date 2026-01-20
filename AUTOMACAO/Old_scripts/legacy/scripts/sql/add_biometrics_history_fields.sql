-- Adicionar novos campos na tabela avatares_personas
-- Script SQL para executar no Supabase

-- 1. Campo BIOMETRICS: Descrição física minuciosa para consistência de geração
ALTER TABLE avatares_personas 
ADD COLUMN IF NOT EXISTS biometrics TEXT;

-- 2. Campo HISTORY: Trajetória profissional que contextualiza habilidades
ALTER TABLE avatares_personas 
ADD COLUMN IF NOT EXISTS history TEXT;

-- Comentários nos campos para documentação
COMMENT ON COLUMN avatares_personas.biometrics IS 'Descrição física detalhada para consistência na geração de avatares AI - inclui características faciais, corporais, estilo e tags para IA';

COMMENT ON COLUMN avatares_personas.history IS 'Trajetória profissional e pessoal que justifica competências - educação, experiência internacional, marcos de carreira e contexto pessoal';

-- Verificar se os campos foram adicionados corretamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'avatares_personas' 
AND column_name IN ('biometrics', 'history')
ORDER BY column_name;

-- Exemplo de consulta para ver a estrutura completa da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'avatares_personas' 
ORDER BY ordinal_position;