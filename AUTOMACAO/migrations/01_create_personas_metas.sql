-- ============================================================================
-- MIGRATION: Criar tabela personas_metas
-- ============================================================================
-- Data: 06/12/2025
-- Objetivo: Sistema de metas objetivas SMART para personas
-- 
-- Como executar no Supabase SQL Editor:
-- 1. Copie este arquivo completo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute (Run)
-- ============================================================================

-- 1. Criar tabela personas_metas
CREATE TABLE IF NOT EXISTS personas_metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Identificação
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT DEFAULT 'performance', -- 'performance', 'desenvolvimento', 'kpi', 'projeto'
  
  -- SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
  valor_alvo NUMERIC NOT NULL, -- Valor que se quer atingir
  valor_atual NUMERIC DEFAULT 0, -- Valor atual alcançado
  unidade_medida TEXT, -- '%', 'unidades', 'horas', 'R$', 'clientes', etc
  
  -- Prazo
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_prazo DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'nao_iniciada', 
    -- Valores permitidos: 'nao_iniciada', 'em_progresso', 'concluida', 'pausada', 'cancelada'
  progresso_percentual INT DEFAULT 0 CHECK (progresso_percentual BETWEEN 0 AND 100),
  
  -- Metadata
  prioridade INT DEFAULT 2 CHECK (prioridade BETWEEN 1 AND 3), -- 1=alta, 2=media, 3=baixa
  responsavel TEXT, -- Pode ser outro persona_id ou nome externo
  observacoes TEXT,
  vinculada_kpi TEXT, -- Referência ao KPI original (se veio de personas_competencias.kpis)
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_personas_metas_persona ON personas_metas(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_metas_status ON personas_metas(status);
CREATE INDEX IF NOT EXISTS idx_personas_metas_prazo ON personas_metas(data_prazo);
CREATE INDEX IF NOT EXISTS idx_personas_metas_categoria ON personas_metas(categoria);

-- 3. Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_personas_metas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personas_metas_updated_at
  BEFORE UPDATE ON personas_metas
  FOR EACH ROW
  EXECUTE FUNCTION update_personas_metas_updated_at();

-- 4. Adicionar comentários para documentação
COMMENT ON TABLE personas_metas IS 'Metas objetivas SMART para personas';
COMMENT ON COLUMN personas_metas.titulo IS 'Título curto da meta';
COMMENT ON COLUMN personas_metas.descricao IS 'Descrição detalhada da meta';
COMMENT ON COLUMN personas_metas.categoria IS 'Tipo de meta: performance, desenvolvimento, kpi, projeto';
COMMENT ON COLUMN personas_metas.valor_alvo IS 'Valor numérico que se deseja atingir';
COMMENT ON COLUMN personas_metas.valor_atual IS 'Valor numérico atual alcançado';
COMMENT ON COLUMN personas_metas.unidade_medida IS 'Unidade de medida: %, unidades, horas, R$, etc';
COMMENT ON COLUMN personas_metas.progresso_percentual IS 'Percentual de conclusão: 0-100';
COMMENT ON COLUMN personas_metas.status IS 'Status: nao_iniciada, em_progresso, concluida, pausada, cancelada';

-- ============================================================================
-- EXEMPLOS DE METAS (Para referência - NÃO EXECUTAR automaticamente)
-- ============================================================================

-- Exemplo 1: Meta de Performance
-- INSERT INTO personas_metas (
--   persona_id, titulo, descricao, categoria,
--   valor_alvo, valor_atual, unidade_medida,
--   data_inicio, data_prazo, status, prioridade
-- ) VALUES (
--   'UUID_DA_PERSONA',
--   'Aumentar taxa de conversão',
--   'Aumentar a taxa de conversão de campanhas de email marketing de 2% para 5%',
--   'performance',
--   5.0, 2.0, '%',
--   '2025-12-01', '2026-03-31',
--   'em_progresso', 1
-- );

-- Exemplo 2: Meta de Desenvolvimento
-- INSERT INTO personas_metas (
--   persona_id, titulo, descricao, categoria,
--   valor_alvo, valor_atual, unidade_medida,
--   data_inicio, data_prazo, status, prioridade
-- ) VALUES (
--   'UUID_DA_PERSONA',
--   'Completar curso de Google Analytics 4',
--   'Concluir certificação GA4 para melhorar análise de dados',
--   'desenvolvimento',
--   100.0, 45.0, '%',
--   '2025-12-01', '2026-02-28',
--   'em_progresso', 2
-- );

-- Exemplo 3: Meta de KPI
-- INSERT INTO personas_metas (
--   persona_id, titulo, descricao, categoria,
--   valor_alvo, valor_atual, unidade_medida,
--   data_inicio, data_prazo, status, prioridade, vinculada_kpi
-- ) VALUES (
--   'UUID_DA_PERSONA',
--   'Reduzir tempo médio de resposta',
--   'Diminuir tempo médio de resposta de 3s para 2s',
--   'kpi',
--   2.0, 3.0, 'segundos',
--   '2025-12-01', '2026-01-31',
--   'nao_iniciada', 1,
--   'Tempo médio de resposta - 2 segundos'
-- );

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personas_metas'
ORDER BY ordinal_position;

-- Verificar índices criados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'personas_metas';

-- ============================================================================
-- ROLLBACK (Se necessário)
-- ============================================================================

-- Para reverter esta migração, execute:
-- DROP TRIGGER IF EXISTS trigger_update_personas_metas_updated_at ON personas_metas;
-- DROP FUNCTION IF EXISTS update_personas_metas_updated_at();
-- DROP TABLE IF EXISTS personas_metas CASCADE;
