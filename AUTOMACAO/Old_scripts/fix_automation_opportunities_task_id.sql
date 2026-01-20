-- ============================================================================
-- FIX: Tornar task_id opcional em automation_opportunities
-- ============================================================================
-- Problema: task_id é NOT NULL mas não temos tabela personas_tasks real
-- Solução: Tornar task_id NULL e adicionar campos alternativos
-- Data: 2 de Dezembro de 2025
-- ============================================================================

-- 1. Remover constraint UNIQUE em task_id
ALTER TABLE automation_opportunities 
DROP CONSTRAINT IF EXISTS automation_opportunities_task_id_key;

-- 2. Remover constraint NOT NULL
ALTER TABLE automation_opportunities 
ALTER COLUMN task_id DROP NOT NULL;

-- 3. Remover foreign key constraint se existir
ALTER TABLE automation_opportunities 
DROP CONSTRAINT IF EXISTS automation_opportunities_task_id_fkey;

-- 4. Adicionar colunas alternativas para identificar tarefas
ALTER TABLE automation_opportunities 
ADD COLUMN IF NOT EXISTS task_title TEXT,
ADD COLUMN IF NOT EXISTS task_description TEXT,
ADD COLUMN IF NOT EXISTS task_frequency TEXT;

-- 5. Criar índice composto para identificar duplicatas
CREATE INDEX IF NOT EXISTS idx_automation_opportunities_task_unique 
ON automation_opportunities(persona_id, task_title) 
WHERE task_title IS NOT NULL;

-- 6. Atualizar comentários
COMMENT ON COLUMN automation_opportunities.task_id IS 'UUID da tarefa (OPCIONAL - usado se tarefa está em personas_tasks)';
COMMENT ON COLUMN automation_opportunities.task_title IS 'Título da tarefa analisada';
COMMENT ON COLUMN automation_opportunities.task_description IS 'Descrição da tarefa';
COMMENT ON COLUMN automation_opportunities.task_frequency IS 'Frequência: diaria, semanal, mensal';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'automation_opportunities' 
  AND column_name IN ('task_id', 'task_title', 'task_description', 'task_frequency')
ORDER BY ordinal_position;

SELECT 'Fix aplicado com sucesso! task_id agora é NULL e temos campos alternativos.' as message;
