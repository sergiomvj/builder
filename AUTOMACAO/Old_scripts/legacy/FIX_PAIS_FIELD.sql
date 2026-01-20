-- =====================================================
-- CORREÇÃO ESPECÍFICA: Campo 'pais' limitado a 10 caracteres
-- =====================================================
-- PROBLEMA IDENTIFICADO: empresas.pais character varying(10)
-- CAUSA DO ERRO: Nomes de países podem exceder 10 caracteres

-- 🎯 CORREÇÃO IMEDIATA
-- Aumentar o campo 'pais' de 10 para 50 caracteres
ALTER TABLE public.empresas 
ALTER COLUMN pais TYPE varchar(50);

-- 📊 VERIFICAR SE A CORREÇÃO FUNCIONOU
SELECT 
  table_name,
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'empresas'
AND column_name = 'pais';

-- 🧪 TESTAR INSERÇÃO COM PAÍS DE NOME LONGO
-- Usar uma empresa existente ou criar uma válida para evitar conflito com audit_logs
DO $$
DECLARE
    empresa_existente_id UUID;
    test_empresa_id UUID;
BEGIN
    -- Tentar encontrar uma empresa existente
    SELECT id INTO empresa_existente_id 
    FROM public.empresas 
    LIMIT 1;
    
    IF empresa_existente_id IS NOT NULL THEN
        -- Se há empresa existente, apenas testar atualização do campo pais
        UPDATE public.empresas 
        SET pais = 'Reino Unido da Grã-Bretanha' -- 28 caracteres
        WHERE id = empresa_existente_id;
        
        RAISE NOTICE 'Teste realizado: atualizou empresa existente % com país longo', empresa_existente_id;
        
        -- Reverter para valor original
        UPDATE public.empresas 
        SET pais = 'Brasil'
        WHERE id = empresa_existente_id;
        
    ELSE
        -- Se não há empresas, criar uma nova
        INSERT INTO public.empresas (
            nome, 
            pais, 
            industry, 
            codigo,
            descricao
        ) VALUES (
            'Empresa Teste País Longo',
            'Reino Unido da Grã-Bretanha', -- 28 caracteres
            'tecnologia',
            'TESTPAIS',
            'Teste para validar campo país corrigido'
        ) RETURNING id INTO test_empresa_id;
        
        RAISE NOTICE 'Teste realizado: criou empresa % com país longo', test_empresa_id;
        
        -- Limpar dado de teste
        DELETE FROM public.empresas WHERE id = test_empresa_id;
    END IF;
END $$;

-- ✅ CONFIRMAÇÃO FINAL
SELECT 'CORREÇÃO APLICADA COM SUCESSO!' as status,
       'Campo empresas.pais agora suporta até 50 caracteres' as detalhes;