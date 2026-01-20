-- Adicionar campo idiomas na tabela personas
-- Este campo armazenará um array de idiomas que a persona fala

ALTER TABLE personas 
ADD COLUMN idiomas JSONB DEFAULT '["Português"]'::jsonb;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN personas.idiomas IS 'Array de idiomas que a persona fala para realizar seu trabalho';

-- Criar um índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_personas_idiomas ON personas USING GIN (idiomas);