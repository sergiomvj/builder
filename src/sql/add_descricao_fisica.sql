-- Adicionar coluna descricao_fisica na tabela personas
-- Esta coluna é CRÍTICA para manter consistência dos avatares
-- Sem ela, cada geração de avatar cria uma pessoa diferente

ALTER TABLE public.personas 
ADD COLUMN IF NOT EXISTS descricao_fisica TEXT;

-- Comentário da coluna para documentação
COMMENT ON COLUMN public.personas.descricao_fisica IS 'Descrição física detalhada da persona para geração consistente de avatares';