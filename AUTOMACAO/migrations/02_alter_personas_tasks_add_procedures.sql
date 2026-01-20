-- ============================================================================
-- MIGRATION: Adicionar campo procedimento_execucao em personas_tasks
-- ============================================================================
-- Data: 06/12/2025
-- Objetivo: Enriquecer tarefas com procedimentos detalhados step-by-step
-- 
-- Como executar no Supabase SQL Editor:
-- 1. Copie este arquivo completo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute (Run)
-- ============================================================================

-- 1. Adicionar campo procedimento_execucao (se não existir)
ALTER TABLE personas_tasks 
  ADD COLUMN IF NOT EXISTS procedimento_execucao JSONB DEFAULT '[]';

-- 2. Adicionar comentários para documentação
COMMENT ON COLUMN personas_tasks.procedimento_execucao IS 'Array de steps detalhados para executar a tarefa';
COMMENT ON COLUMN personas_tasks.required_subsystems IS 'Array com os subsistemas VCM necessários (1-12)';
COMMENT ON COLUMN personas_tasks.inputs_from IS 'Array de dependências: de onde vêm os dados (persona_id ou subsistema)';
COMMENT ON COLUMN personas_tasks.outputs_to IS 'Array de destinatários: para onde vão os resultados';
COMMENT ON COLUMN personas_tasks.success_criteria IS 'Critérios mensuráveis de sucesso da tarefa';
COMMENT ON COLUMN personas_tasks.complexity_score IS 'Score de complexidade: 1 (simples) a 10 (muito complexo)';

-- ============================================================================
-- ESTRUTURA DO JSONB procedimento_execucao
-- ============================================================================
--
-- Formato esperado:
-- [
--   {
--     "step": 1,
--     "acao": "Acessar HubSpot e selecionar campanha",
--     "ferramenta": "HubSpot",
--     "tempo_estimado_min": 5,
--     "detalhes": "Fazer login, navegar até Campaigns > Email Marketing"
--   },
--   {
--     "step": 2,
--     "acao": "Configurar segmentação de público",
--     "ferramenta": "HubSpot Lists",
--     "tempo_estimado_min": 15,
--     "detalhes": "Criar lista filtrada por: última interação < 30 dias"
--   },
--   {
--     "step": 3,
--     "acao": "Elaborar copy do email",
--     "ferramenta": "HubSpot Email Editor",
--     "tempo_estimado_min": 30,
--     "detalhes": "Seguir template aprovado, incluir CTA claro"
--   }
-- ]

-- ============================================================================
-- EXEMPLOS DE DADOS (Para referência - NÃO EXECUTAR automaticamente)
-- ============================================================================

-- Exemplo 1: Tarefa com procedimento completo
-- UPDATE personas_tasks SET
--   procedimento_execucao = '[
--     {
--       "step": 1,
--       "acao": "Abrir Google Analytics 4",
--       "ferramenta": "Google Analytics",
--       "tempo_estimado_min": 3
--     },
--     {
--       "step": 2,
--       "acao": "Selecionar período de análise (últimos 30 dias)",
--       "ferramenta": "GA4 Dashboard",
--       "tempo_estimado_min": 2
--     },
--     {
--       "step": 3,
--       "acao": "Exportar relatório de conversões por canal",
--       "ferramenta": "GA4 Reports",
--       "tempo_estimado_min": 5
--     },
--     {
--       "step": 4,
--       "acao": "Analisar métricas e identificar tendências",
--       "ferramenta": "Excel / Google Sheets",
--       "tempo_estimado_min": 20
--     },
--     {
--       "step": 5,
--       "acao": "Preparar apresentação com insights",
--       "ferramenta": "Google Slides",
--       "tempo_estimado_min": 30
--     }
--   ]'::jsonb,
--   required_subsystems = ARRAY['business_intelligence', 'comunicacao', 'documentacao'],
--   inputs_from = ARRAY['google_analytics', 'hubspot'],
--   outputs_to = ARRAY['gestao_projetos', 'gestao_kpis'],
--   success_criteria = 'Relatório completo com pelo menos 5 insights acionáveis, apresentado ao time',
--   complexity_score = 6
-- WHERE task_id = 'exemplo-task-001';

-- Exemplo 2: Tarefa simples
-- UPDATE personas_tasks SET
--   procedimento_execucao = '[
--     {
--       "step": 1,
--       "acao": "Verificar inbox do Gmail",
--       "ferramenta": "Gmail",
--       "tempo_estimado_min": 5
--     },
--     {
--       "step": 2,
--       "acao": "Responder emails prioritários",
--       "ferramenta": "Gmail",
--       "tempo_estimado_min": 20
--     },
--     {
--       "step": 3,
--       "acao": "Arquivar emails processados",
--       "ferramenta": "Gmail",
--       "tempo_estimado_min": 3
--     }
--   ]'::jsonb,
--   required_subsystems = ARRAY['comunicacao'],
--   inputs_from = ARRAY['clientes_externos', 'equipe_interna'],
--   outputs_to = ARRAY['clientes_externos', 'equipe_interna'],
--   success_criteria = 'Inbox zero, todos os emails prioritários respondidos em até 24h',
--   complexity_score = 2
-- WHERE task_id = 'exemplo-task-002';

-- ============================================================================
-- SUBSISTEMAS VCM (Para referência)
-- ============================================================================
--
-- Os 12 subsistemas do Virtual Company Manager:
-- 
-- 1. gestao_personas       - Gestão de Personas
-- 2. gestao_kpis          - Gestão de KPIs e Métricas
-- 3. comunicacao          - Comunicação (Chat/Email/Voice)
-- 4. automacao_workflows  - Automação e Workflows (N8N)
-- 5. rag_knowledge        - RAG (Knowledge Base)
-- 6. documentacao         - Documentação e Arquivos
-- 7. gestao_tarefas       - Gestão de Tarefas
-- 8. gestao_projetos      - Gestão de Projetos
-- 9. gestao_financeira    - Gestão Financeira
-- 10. business_intelligence - Business Intelligence (Analytics)
-- 11. integracao_externa   - Integração Externa (APIs)
-- 12. seguranca_auditoria  - Segurança e Auditoria

-- ============================================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- ============================================================================

-- Verificar se a coluna foi adicionada
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'personas_tasks'
  AND column_name = 'procedimento_execucao';

-- Verificar tarefas existentes (devem ter procedimento_execucao = [])
SELECT 
  task_id,
  title,
  procedimento_execucao,
  required_subsystems,
  complexity_score
FROM personas_tasks
LIMIT 5;

-- ============================================================================
-- ROLLBACK (Se necessário)
-- ============================================================================

-- Para reverter esta migração, execute:
-- ALTER TABLE personas_tasks DROP COLUMN IF EXISTS procedimento_execucao;
