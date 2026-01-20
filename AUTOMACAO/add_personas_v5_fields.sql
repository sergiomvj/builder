-- ============================================================================
-- SCRIPT SQL: Adicionar Campos V5.0 na Tabela personas
-- ============================================================================
-- Adiciona campos necessários para o paradigma top-down
-- Executar antes de rodar Script 01 V5.0
-- ============================================================================

-- 1. Adicionar referência ao bloco funcional
ALTER TABLE personas ADD COLUMN IF NOT EXISTS bloco_funcional_id UUID REFERENCES empresas_blocos_funcionais(id);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS bloco_funcional_nome TEXT;

-- 2. Adicionar ownership de OKRs
ALTER TABLE personas ADD COLUMN IF NOT EXISTS okr_owner_ids UUID[];

-- 3. Adicionar responsabilidade por resultado
ALTER TABLE personas ADD COLUMN IF NOT EXISTS responsabilidade_resultado TEXT;

-- 4. Adicionar métricas de responsabilidade
ALTER TABLE personas ADD COLUMN IF NOT EXISTS metricas_responsabilidade TEXT[];

-- 5. Adicionar nível hierárquico
ALTER TABLE personas ADD COLUMN IF NOT EXISTS nivel_hierarquico TEXT CHECK (nivel_hierarquico IN ('gerencial', 'especialista', 'operacional'));

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_personas_bloco_funcional ON personas(bloco_funcional_id);
CREATE INDEX IF NOT EXISTS idx_personas_okr_owners ON personas USING GIN(okr_owner_ids);
CREATE INDEX IF NOT EXISTS idx_personas_nivel ON personas(nivel_hierarquico);

-- 7. Comentários para documentação
COMMENT ON COLUMN personas.bloco_funcional_id IS 'UUID do bloco funcional ao qual a persona pertence';
COMMENT ON COLUMN personas.bloco_funcional_nome IS 'Nome do bloco funcional (cache para queries rápidas)';
COMMENT ON COLUMN personas.okr_owner_ids IS 'Array de UUIDs dos OKRs que esta persona é owner';
COMMENT ON COLUMN personas.responsabilidade_resultado IS 'Resultado mensurável que a persona garante (ex: Gerar 150 leads/mês com CAC < $50)';
COMMENT ON COLUMN personas.metricas_responsabilidade IS 'Array de métricas que a persona monitora e é responsável';
COMMENT ON COLUMN personas.nivel_hierarquico IS 'Nível hierárquico: gerencial (owner de OKRs), especialista (executa com autonomia), operacional (tarefas específicas)';

-- ============================================================================
-- VALIDAÇÃO: Consultas de Teste
-- ============================================================================

-- Verificar se os campos foram criados
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'personas'
AND column_name IN (
  'bloco_funcional_id',
  'bloco_funcional_nome',
  'okr_owner_ids',
  'responsabilidade_resultado',
  'metricas_responsabilidade',
  'nivel_hierarquico'
)
ORDER BY column_name;

-- Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'personas'
AND indexname LIKE 'idx_personas_%';
