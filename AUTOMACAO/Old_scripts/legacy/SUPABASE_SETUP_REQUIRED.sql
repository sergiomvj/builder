-- =====================================================
-- AJUSTES CRÍTICOS NECESSÁRIOS NO SUPABASE
-- =====================================================
-- Execute este script no painel do Supabase -> SQL Editor

-- 1. ADICIONAR COLUNA DESCRICAO_FISICA (CRÍTICO PARA AVATARES)
-- Esta coluna é fundamental para manter consistência dos avatares gerados
ALTER TABLE public.personas 
ADD COLUMN IF NOT EXISTS descricao_fisica TEXT;

-- 2. Adicionar comentário para documentação
COMMENT ON COLUMN public.personas.descricao_fisica IS 'Descrição física detalhada da persona para geração consistente de avatares. CRÍTICO: Sem esta coluna, cada geração de avatar cria uma pessoa diferente.';

-- 3. VERIFICAR SE A COLUNA FOI CRIADA
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name = 'descricao_fisica';

-- 4. TESTAR INSERÇÃO DE DADOS
-- (Opcional) Inserir uma persona de teste para verificar se tudo funciona
/*
INSERT INTO public.personas (
  persona_code,
  full_name,
  role,
  email,
  whatsapp,
  empresa_id,
  descricao_fisica,
  biografia_completa
) VALUES (
  'TEST_PERSONA_001',
  'Maria Silva Teste',
  'Desenvolvedora Frontend',
  'maria.teste@exemplo.com',
  '+5511999999999',
  (SELECT id FROM public.empresas LIMIT 1),
  'Mulher de 28 anos, altura média (1,65m), cabelos castanhos ondulados até os ombros, olhos castanhos, pele clara, sorriso acolhedor, usa óculos de grau discretos.',
  'Maria é uma desenvolvedora frontend experiente...'
);
*/

-- 5. VERIFICAR PERMISSÕES RLS (Row Level Security)
-- Verificar se as políticas RLS permitem operações na nova coluna
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'personas';

-- 6. Se necessário, atualizar políticas RLS para incluir a nova coluna
-- (Normalmente não é necessário, mas pode ser útil verificar)

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- =====================================================
-- 1. Acesse seu painel do Supabase
-- 2. Vá em "SQL Editor"
-- 3. Cole e execute o comando ALTER TABLE acima
-- 4. Verifique se a coluna foi criada executando a query de verificação
-- =====================================================