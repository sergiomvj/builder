-- =====================================================
-- INVESTIGAÇÃO E CORREÇÃO: character varying(10)
-- =====================================================
-- Execute este script no painel do Supabase -> SQL Editor

-- 1. VERIFICAR SCHEMA ATUAL DAS TABELAS
-- Identificar quais campos têm limitação de 10 caracteres
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (table_name = 'empresas' OR table_name = 'personas')
AND data_type = 'character varying'
AND character_maximum_length IS NOT NULL
ORDER BY table_name, character_maximum_length, column_name;

-- 2. VERIFICAR ESPECIFICAMENTE CAMPOS COM 10 CARACTERES
SELECT 
  table_name,
  column_name,
  'character varying(' || character_maximum_length || ')' as full_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (table_name = 'empresas' OR table_name = 'personas')
AND data_type = 'character varying'
AND character_maximum_length = 10;

-- 3. VERIFICAR DADOS EXISTENTES QUE EXCEDEM 10 CARACTERES
-- Se existir algum campo com limitação de 10, verificar quais dados excedem
DO $$
DECLARE
    field_record RECORD;
    query_text TEXT;
    result_count INTEGER;
BEGIN
    FOR field_record IN
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND (table_name = 'empresas' OR table_name = 'personas')
        AND data_type = 'character varying'
        AND character_maximum_length = 10
    LOOP
        query_text := 'SELECT COUNT(*) FROM ' || field_record.table_name || 
                     ' WHERE length(' || field_record.column_name || ') > 10';
        
        EXECUTE query_text INTO result_count;
        
        IF result_count > 0 THEN
            RAISE NOTICE 'PROBLEMA ENCONTRADO: %.% tem % registros com mais de 10 caracteres', 
                        field_record.table_name, field_record.column_name, result_count;
        END IF;
    END LOOP;
END $$;

-- 4. PROPOSTA DE CORREÇÃO
-- Se encontrarmos campos com limitação de 10 caracteres, aumentar para valores adequados

-- Para tabela EMPRESAS (se houver campos limitados):
-- ALTER TABLE public.empresas ALTER COLUMN campo_limitado TYPE varchar(50);

-- Para tabela PERSONAS (se houver campos limitados):
-- ALTER TABLE public.personas ALTER COLUMN role TYPE varchar(50);
-- ALTER TABLE public.personas ALTER COLUMN specialty TYPE varchar(50);
-- ALTER TABLE public.personas ALTER COLUMN department TYPE varchar(50);

-- 5. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON SCHEMA public IS 'Schema atualizado para suportar campos mais longos em empresas e personas';

-- 6. VERIFICAÇÃO FINAL
-- Após as alterações, verificar se não há mais limitações de 10 caracteres
SELECT 
  'Verificação Final:' as status,
  table_name,
  column_name,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (table_name = 'empresas' OR table_name = 'personas')
AND data_type = 'character varying'
AND character_maximum_length < 20
ORDER BY character_maximum_length;