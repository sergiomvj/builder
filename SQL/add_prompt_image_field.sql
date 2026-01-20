-- Adicionar campo prompt_image na tabela personas_avatares
-- Este campo armazenará uma versão condensada do system_prompt otimizada para geração de imagens

ALTER TABLE public.personas_avatares
ADD COLUMN IF NOT EXISTS prompt_image text;

-- Comentário para documentar o campo
COMMENT ON COLUMN public.personas_avatares.prompt_image IS 'Versão condensada do system_prompt otimizada para geração de imagens de avatar';