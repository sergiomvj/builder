-- ============================================================================
-- UPSERT SUBSISTEMAS - Insere ou atualiza os 12 subsistemas VCM
-- ============================================================================
-- Este script usa INSERT ... ON CONFLICT (UPSERT) para garantir que os
-- subsistemas sejam criados ou atualizados independentemente do estado atual
-- ============================================================================

-- PASSO 1: Adicionar colunas necessárias (se não existirem) e ajustar constraints
ALTER TABLE subsistemas 
ADD COLUMN IF NOT EXISTS funcionalidades TEXT[],
ADD COLUMN IF NOT EXISTS metricas_principais TEXT[],
ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS icone TEXT;

-- Remover constraint NOT NULL de empresa_id (subsistemas são templates globais)
ALTER TABLE subsistemas ALTER COLUMN empresa_id DROP NOT NULL;

-- PASSO 2: Criar constraint UNIQUE no campo codigo (necessário para UPSERT)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subsistemas_codigo_key'
    ) THEN
        ALTER TABLE subsistemas ADD CONSTRAINT subsistemas_codigo_key UNIQUE (codigo);
    END IF;
END $$;

-- PASSO 3: UPSERT dos 12 subsistemas
INSERT INTO subsistemas (codigo, nome, descricao, categoria, funcionalidades, metricas_principais, ordem_exibicao, icone, status)
VALUES
  ('gestao_empresarial', 'Gestão Empresarial', 
    'Sistema central de gestão estratégica, planejamento, governança e tomada de decisões. Gerencia objetivos estratégicos, OKRs, indicadores corporativos e dashboards executivos. Inclui módulos de Business Intelligence, análise de cenários e gestão de portfólio.',
    'core',
    ARRAY['Planejamento Estratégico', 'Gestão de OKRs', 'Dashboards Executivos', 'BI e Analytics', 'Governança Corporativa', 'Gestão de Riscos'],
    ARRAY['ROI', 'CAGR', 'Margem de Lucro', 'Fluxo de Caixa', 'NPS Global'],
    1, 'building-office', 'ativo'),
    
  ('producao', 'Produção',
    'Controle completo de processos produtivos, ordens de produção, gestão de capacidade, setup de máquinas, rastreabilidade e eficiência. Integra planejamento de produção (PCP), controle de qualidade em linha e manutenção preventiva.',
    'core',
    ARRAY['Ordens de Produção', 'Planejamento de Capacidade', 'Controle de Processos', 'Rastreabilidade', 'Setup de Máquinas', 'OEE (Overall Equipment Effectiveness)'],
    ARRAY['OEE', 'Tempo de Ciclo', 'Taxa de Refugo', 'Produtividade', 'Utilização de Capacidade'],
    2, 'cog', 'ativo'),
    
  ('financeiro', 'Financeiro',
    'Gestão financeira completa: contas a pagar, contas a receber, fluxo de caixa, conciliação bancária, DRE, balanço patrimonial e centro de custos. Inclui módulos de planejamento financeiro, controle orçamentário e análise de rentabilidade.',
    'core',
    ARRAY['Contas a Pagar/Receber', 'Fluxo de Caixa', 'Conciliação Bancária', 'DRE e Balanço', 'Controle Orçamentário', 'Centro de Custos', 'Planejamento Financeiro'],
    ARRAY['Margem de Lucro', 'Fluxo de Caixa Livre', 'ROI', 'Liquidez Corrente', 'Endividamento'],
    3, 'currency-dollar', 'ativo'),
    
  ('recursos_humanos', 'Recursos Humanos (RH)',
    'Gestão completa de pessoas: recrutamento, seleção, onboarding, folha de pagamento, benefícios, avaliação de desempenho, treinamentos e desenvolvimento. Inclui gestão de ponto, férias, rescisões e conformidade trabalhista.',
    'suporte',
    ARRAY['Recrutamento e Seleção', 'Onboarding', 'Folha de Pagamento', 'Benefícios', 'Avaliação de Desempenho', 'Treinamentos', 'Gestão de Ponto'],
    ARRAY['Turnover', 'Tempo de Contratação', 'Satisfação de Funcionários', 'Taxa de Retenção', 'Horas de Treinamento'],
    4, 'users', 'ativo'),
    
  ('vendas', 'Vendas',
    'Gestão do ciclo completo de vendas: leads, oportunidades, propostas, negociações, contratos e comissões. CRM integrado, pipeline de vendas, previsões, metas e análise de conversão. Inclui gestão de relacionamento com clientes.',
    'core',
    ARRAY['CRM', 'Pipeline de Vendas', 'Propostas Comerciais', 'Gestão de Contratos', 'Comissões', 'Metas de Vendas', 'Análise de Conversão'],
    ARRAY['Taxa de Conversão', 'Ticket Médio', 'Ciclo de Vendas', 'Win Rate', 'MRR (Receita Recorrente)', 'CAC (Custo de Aquisição)'],
    5, 'chart-bar', 'ativo'),
    
  ('marketing', 'Marketing',
    'Gestão de campanhas, marketing digital, geração de leads, automação de marketing, SEO/SEM, mídias sociais e análise de ROI de marketing. Inclui gestão de conteúdo, email marketing e eventos.',
    'core',
    ARRAY['Campanhas de Marketing', 'Geração de Leads', 'Automação de Marketing', 'SEO/SEM', 'Redes Sociais', 'Email Marketing', 'Análise de ROI'],
    ARRAY['CPL (Custo por Lead)', 'Taxa de Conversão de Leads', 'Tráfego Orgânico', 'Engajamento', 'ROI de Marketing'],
    6, 'megaphone', 'ativo'),
    
  ('atendimento', 'Atendimento ao Cliente',
    'Gestão completa de suporte: tickets, chamados, SLA, base de conhecimento, chatbots e satisfação do cliente. Inclui help desk, service desk, gestão de reclamações e análise de CSAT/NPS.',
    'suporte',
    ARRAY['Gestão de Tickets', 'SLA', 'Base de Conhecimento', 'Chatbots', 'Help Desk', 'Pesquisas de Satisfação', 'Gestão de Reclamações'],
    ARRAY['CSAT', 'NPS', 'Tempo Médio de Resposta', 'Taxa de Resolução no Primeiro Contato', 'Taxa de Churn'],
    7, 'chat-bubble-left-right', 'ativo'),
    
  ('compras', 'Compras',
    'Gestão de fornecedores, cotações, pedidos de compra, aprovações, recebimento de mercadorias e avaliação de fornecedores. Inclui controle de contratos, gestão de custos de aquisição e compliance.',
    'operacional',
    ARRAY['Gestão de Fornecedores', 'Cotações', 'Pedidos de Compra', 'Recebimento', 'Contratos', 'Avaliação de Fornecedores', 'Controle de Custos'],
    ARRAY['Custo de Aquisição', 'Lead Time de Compras', 'Taxa de Conformidade', 'Número de Fornecedores Ativos'],
    8, 'shopping-cart', 'ativo'),
    
  ('estoque', 'Estoque',
    'Controle de inventário, movimentações, saldos, valorizações (FIFO/LIFO/Média), inventário físico, ponto de reposição e análise ABC. Inclui gestão de múltiplos depósitos e rastreabilidade de lotes.',
    'operacional',
    ARRAY['Controle de Inventário', 'Movimentações', 'Valorização de Estoque', 'Inventário Físico', 'Ponto de Reposição', 'Análise ABC', 'Rastreabilidade de Lotes'],
    ARRAY['Acurácia de Estoque', 'Giro de Estoque', 'Cobertura de Estoque', 'Taxa de Ruptura', 'Custo de Armazenagem'],
    9, 'archive-box', 'ativo'),
    
  ('logistica', 'Logística',
    'Gestão de transporte, roteirização, entregas, fretes, rastreamento de cargas e gestão de transportadoras. Inclui logística reversa, controle de devolução e otimização de rotas.',
    'operacional',
    ARRAY['Gestão de Transporte', 'Roteirização', 'Rastreamento de Cargas', 'Gestão de Fretes', 'Logística Reversa', 'Controle de Entregas', 'Otimização de Rotas'],
    ARRAY['On-Time Delivery', 'Custo de Frete', 'Taxa de Avarias', 'Tempo Médio de Entrega', 'Utilização de Frota'],
    10, 'truck', 'ativo'),
    
  ('qualidade', 'Qualidade',
    'Controle de qualidade, não conformidades, ações corretivas/preventivas (CAPA), auditorias, certificações (ISO) e melhoria contínua. Inclui gestão de calibrações, inspeções e análise de causas raízes.',
    'suporte',
    ARRAY['Controle de Qualidade', 'Não Conformidades', 'CAPA (Corretivas/Preventivas)', 'Auditorias', 'Certificações', 'Calibrações', 'Análise de Causa Raiz'],
    ARRAY['Taxa de Defeitos', 'Conformidade com SLAs', 'Número de Não Conformidades', 'Índice de Satisfação com Qualidade'],
    11, 'shield-check', 'ativo'),
    
  ('projetos', 'Projetos',
    'Gestão de projetos (metodologias ágeis e tradicionais), cronogramas, recursos, orçamentos, riscos e entregáveis. Inclui Kanban, Scrum, Gantt, gestão de portfólio de projetos e PMO.',
    'suporte',
    ARRAY['Planejamento de Projetos', 'Cronogramas (Gantt)', 'Gestão de Recursos', 'Gestão de Riscos', 'Kanban/Scrum', 'Entregáveis', 'PMO'],
    ARRAY['Taxa de Projetos no Prazo', 'Desvio de Orçamento', 'Utilização de Recursos', 'ROI de Projetos', 'Número de Projetos Concluídos'],
    12, 'briefcase', 'ativo')

ON CONFLICT (codigo) 
DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  funcionalidades = EXCLUDED.funcionalidades,
  metricas_principais = EXCLUDED.metricas_principais,
  ordem_exibicao = EXCLUDED.ordem_exibicao,
  icone = EXCLUDED.icone,
  status = EXCLUDED.status,
  updated_at = NOW();

-- Verificar resultado
SELECT COUNT(*) as total_subsistemas, 
       COUNT(CASE WHEN funcionalidades IS NOT NULL THEN 1 END) as com_funcionalidades,
       COUNT(CASE WHEN metricas_principais IS NOT NULL THEN 1 END) as com_metricas
FROM subsistemas 
WHERE status = 'ativo';
