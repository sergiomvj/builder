-- ============================================================================
-- MIGRAÇÃO: Adicionar campos de subsistemas em personas_atribuicoes
-- ============================================================================
-- Adiciona 3 novos campos para vincular tarefas aos subsistemas do VCM:
-- 1. use_subsystem (boolean) - Se a tarefa usa algum subsistema
-- 2. which_subsystem (TEXT) - Código do subsistema usado
-- 3. how_use (TEXT) - Instruções de como usar o subsistema na tarefa
-- ============================================================================

-- Adicionar novos campos
ALTER TABLE personas_atribuicoes 
ADD COLUMN IF NOT EXISTS use_subsystem BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS which_subsystem TEXT,
ADD COLUMN IF NOT EXISTS how_use TEXT;

-- Índice para queries por subsistema
CREATE INDEX IF NOT EXISTS idx_atribuicoes_subsystem 
ON personas_atribuicoes(which_subsystem) 
WHERE use_subsystem = TRUE;

-- Foreign key (soft reference, não obrigatório)
-- Permite que which_subsystem seja NULL ou um código válido
CREATE INDEX IF NOT EXISTS idx_atribuicoes_use_subsystem 
ON personas_atribuicoes(use_subsystem);

-- Comentários
COMMENT ON COLUMN personas_atribuicoes.use_subsystem IS 'Se TRUE, esta tarefa requer uso de um ou mais subsistemas VCM';
COMMENT ON COLUMN personas_atribuicoes.which_subsystem IS 'Código do subsistema VCM usado (ex: gestao_empresarial, producao, vendas)';
COMMENT ON COLUMN personas_atribuicoes.how_use IS 'Instruções detalhadas de como usar o subsistema para executar esta tarefa. Gerado pela LLM.';
