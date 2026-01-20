-- ============================================================================
-- SCRIPT ALTERNATIVO: Popular subsistemas existentes via UPDATE
-- ============================================================================
-- Use este script se a tabela subsistemas já existe com empresa_id
-- Este script atualiza os registros existentes ao invés de fazer INSERT
-- ============================================================================

-- PASSO 1: Adicionar colunas necessárias (se não existirem)
ALTER TABLE subsistemas 
ADD COLUMN IF NOT EXISTS funcionalidades TEXT[],
ADD COLUMN IF NOT EXISTS metricas_principais TEXT[],
ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS icone TEXT;

-- PASSO 2: Atualizar registros existentes por código (se já existirem)
-- Se não existirem, o UPDATE não fará nada (sem erro)

-- Para cada subsistema: tenta UPDATE, se não afetar nenhuma linha, faz INSERT

-- 1. Gestão Empresarial
DO $$
BEGIN
  UPDATE subsistemas SET
    nome = 'Gestão Empresarial',
    descricao = 'Sistema central de gestão estratégica, planejamento, governança e tomada de decisões. Gerencia objetivos estratégicos, OKRs, indicadores corporativos e dashboards executivos. Inclui módulos de Business Intelligence, análise de cenários e gestão de portfólio.',
    categoria = 'core',
    funcionalidades = ARRAY['Planejamento Estratégico', 'Gestão de OKRs', 'Dashboards Executivos', 'BI e Analytics', 'Governança Corporativa', 'Gestão de Riscos'],
    metricas_principais = ARRAY['ROI', 'CAGR', 'Margem de Lucro', 'Fluxo de Caixa', 'NPS Global'],
    ordem_exibicao = 1,
    icone = 'building-office',
    status = 'ativo'
  WHERE codigo = 'gestao_empresarial';
  
  IF NOT FOUND THEN
    INSERT INTO subsistemas (codigo, nome, descricao, categoria, funcionalidades, metricas_principais, ordem_exibicao, icone, status)
    VALUES ('gestao_empresarial', 'Gestão Empresarial', 
      'Sistema central de gestão estratégica, planejamento, governança e tomada de decisões. Gerencia objetivos estratégicos, OKRs, indicadores corporativos e dashboards executivos. Inclui módulos de Business Intelligence, análise de cenários e gestão de portfólio.',
      'core',
      ARRAY['Planejamento Estratégico', 'Gestão de OKRs', 'Dashboards Executivos', 'BI e Analytics', 'Governança Corporativa', 'Gestão de Riscos'],
      ARRAY['ROI', 'CAGR', 'Margem de Lucro', 'Fluxo de Caixa', 'NPS Global'],
      1, 'building-office', 'ativo');
  END IF;
END $$;

-- 2. Produção
UPDATE subsistemas SET
  nome = 'Produção',
  descricao = 'Controle completo de processos produtivos, ordens de produção, gestão de capacidade, setup de máquinas, rastreabilidade e eficiência. Integra planejamento de produção (PCP), controle de qualidade em linha e manutenção preventiva.',
  categoria = 'core',
  funcionalidades = ARRAY['Ordens de Produção', 'Planejamento de Capacidade', 'Controle de Processos', 'Rastreabilidade', 'Setup de Máquinas', 'OEE (Overall Equipment Effectiveness)'],
  metricas_principais = ARRAY['OEE', 'Tempo de Ciclo', 'Taxa de Refugo', 'Produtividade', 'Utilização de Capacidade'],
  ordem_exibicao = 2,
  icone = 'cog',
  status = 'ativo'
WHERE codigo = 'producao';

-- 3. Financeiro
UPDATE subsistemas SET
  nome = 'Financeiro',
  descricao = 'Gestão financeira completa: contas a pagar, contas a receber, fluxo de caixa, conciliação bancária, DRE, balanço patrimonial e centro de custos. Inclui módulos de planejamento financeiro, controle orçamentário e análise de rentabilidade.',
  categoria = 'core',
  funcionalidades = ARRAY['Contas a Pagar/Receber', 'Fluxo de Caixa', 'Conciliação Bancária', 'DRE e Balanço', 'Controle Orçamentário', 'Centro de Custos', 'Planejamento Financeiro'],
  metricas_principais = ARRAY['Margem de Lucro', 'Fluxo de Caixa Livre', 'ROI', 'Liquidez Corrente', 'Endividamento'],
  ordem_exibicao = 3,
  icone = 'currency-dollar',
  status = 'ativo'
WHERE codigo = 'financeiro';

-- 4. Recursos Humanos
UPDATE subsistemas SET
  nome = 'Recursos Humanos (RH)',
  descricao = 'Gestão completa de pessoas: recrutamento, seleção, onboarding, folha de pagamento, benefícios, avaliação de desempenho, treinamentos e desenvolvimento. Inclui gestão de ponto, férias, rescisões e conformidade trabalhista.',
  categoria = 'suporte',
  funcionalidades = ARRAY['Recrutamento e Seleção', 'Onboarding', 'Folha de Pagamento', 'Benefícios', 'Avaliação de Desempenho', 'Treinamentos', 'Gestão de Ponto'],
  metricas_principais = ARRAY['Turnover', 'Tempo de Contratação', 'Satisfação de Funcionários', 'Taxa de Retenção', 'Horas de Treinamento'],
  ordem_exibicao = 4,
  icone = 'users',
  status = 'ativo'
WHERE codigo = 'recursos_humanos';

-- 5. Vendas
UPDATE subsistemas SET
  nome = 'Vendas',
  descricao = 'Gestão do ciclo completo de vendas: leads, oportunidades, propostas, negociações, contratos e comissões. CRM integrado, pipeline de vendas, previsões, metas e análise de conversão. Inclui gestão de relacionamento com clientes.',
  categoria = 'core',
  funcionalidades = ARRAY['CRM', 'Pipeline de Vendas', 'Propostas Comerciais', 'Gestão de Contratos', 'Comissões', 'Metas de Vendas', 'Análise de Conversão'],
  metricas_principais = ARRAY['Taxa de Conversão', 'Ticket Médio', 'Ciclo de Vendas', 'Win Rate', 'MRR (Receita Recorrente)', 'CAC (Custo de Aquisição)'],
  ordem_exibicao = 5,
  icone = 'chart-bar',
  status = 'ativo'
WHERE codigo = 'vendas';

-- 6. Marketing
UPDATE subsistemas SET
  nome = 'Marketing',
  descricao = 'Gestão de campanhas, marketing digital, geração de leads, automação de marketing, SEO/SEM, mídias sociais e análise de ROI de marketing. Inclui gestão de conteúdo, email marketing e eventos.',
  categoria = 'core',
  funcionalidades = ARRAY['Campanhas de Marketing', 'Geração de Leads', 'Automação de Marketing', 'SEO/SEM', 'Redes Sociais', 'Email Marketing', 'Análise de ROI'],
  metricas_principais = ARRAY['CPL (Custo por Lead)', 'Taxa de Conversão de Leads', 'Tráfego Orgânico', 'Engajamento', 'ROI de Marketing'],
  ordem_exibicao = 6,
  icone = 'megaphone',
  status = 'ativo'
WHERE codigo = 'marketing';

-- 7. Atendimento
UPDATE subsistemas SET
  nome = 'Atendimento ao Cliente',
  descricao = 'Gestão completa de suporte: tickets, chamados, SLA, base de conhecimento, chatbots e satisfação do cliente. Inclui help desk, service desk, gestão de reclamações e análise de CSAT/NPS.',
  categoria = 'suporte',
  funcionalidades = ARRAY['Gestão de Tickets', 'SLA', 'Base de Conhecimento', 'Chatbots', 'Help Desk', 'Pesquisas de Satisfação', 'Gestão de Reclamações'],
  metricas_principais = ARRAY['CSAT', 'NPS', 'Tempo Médio de Resposta', 'Taxa de Resolução no Primeiro Contato', 'Taxa de Churn'],
  ordem_exibicao = 7,
  icone = 'chat-bubble-left-right',
  status = 'ativo'
WHERE codigo = 'atendimento';

-- 8. Compras
UPDATE subsistemas SET
  nome = 'Compras',
  descricao = 'Gestão de fornecedores, cotações, pedidos de compra, aprovações, recebimento de mercadorias e avaliação de fornecedores. Inclui controle de contratos, gestão de custos de aquisição e compliance.',
  categoria = 'operacional',
  funcionalidades = ARRAY['Gestão de Fornecedores', 'Cotações', 'Pedidos de Compra', 'Recebimento', 'Contratos', 'Avaliação de Fornecedores', 'Controle de Custos'],
  metricas_principais = ARRAY['Custo de Aquisição', 'Lead Time de Compras', 'Taxa de Conformidade', 'Número de Fornecedores Ativos'],
  ordem_exibicao = 8,
  icone = 'shopping-cart',
  status = 'ativo'
WHERE codigo = 'compras';

-- 9. Estoque
UPDATE subsistemas SET
  nome = 'Estoque',
  descricao = 'Controle de inventário, movimentações, saldos, valorizações (FIFO/LIFO/Média), inventário físico, ponto de reposição e análise ABC. Inclui gestão de múltiplos depósitos e rastreabilidade de lotes.',
  categoria = 'operacional',
  funcionalidades = ARRAY['Controle de Inventário', 'Movimentações', 'Valorização de Estoque', 'Inventário Físico', 'Ponto de Reposição', 'Análise ABC', 'Rastreabilidade de Lotes'],
  metricas_principais = ARRAY['Acurácia de Estoque', 'Giro de Estoque', 'Cobertura de Estoque', 'Taxa de Ruptura', 'Custo de Armazenagem'],
  ordem_exibicao = 9,
  icone = 'archive-box',
  status = 'ativo'
WHERE codigo = 'estoque';

-- 10. Logística
UPDATE subsistemas SET
  nome = 'Logística',
  descricao = 'Gestão de transporte, roteirização, entregas, fretes, rastreamento de cargas e gestão de transportadoras. Inclui logística reversa, controle de devolução e otimização de rotas.',
  categoria = 'operacional',
  funcionalidades = ARRAY['Gestão de Transporte', 'Roteirização', 'Rastreamento de Cargas', 'Gestão de Fretes', 'Logística Reversa', 'Controle de Entregas', 'Otimização de Rotas'],
  metricas_principais = ARRAY['On-Time Delivery', 'Custo de Frete', 'Taxa de Avarias', 'Tempo Médio de Entrega', 'Utilização de Frota'],
  ordem_exibicao = 10,
  icone = 'truck',
  status = 'ativo'
WHERE codigo = 'logistica';

-- 11. Qualidade
UPDATE subsistemas SET
  nome = 'Qualidade',
  descricao = 'Controle de qualidade, não conformidades, ações corretivas/preventivas (CAPA), auditorias, certificações (ISO) e melhoria contínua. Inclui gestão de calibrações, inspeções e análise de causas raízes.',
  categoria = 'suporte',
  funcionalidades = ARRAY['Controle de Qualidade', 'Não Conformidades', 'CAPA (Corretivas/Preventivas)', 'Auditorias', 'Certificações', 'Calibrações', 'Análise de Causa Raiz'],
  metricas_principais = ARRAY['Taxa de Defeitos', 'Conformidade com SLAs', 'Número de Não Conformidades', 'Índice de Satisfação com Qualidade'],
  ordem_exibicao = 11,
  icone = 'shield-check',
  status = 'ativo'
WHERE codigo = 'qualidade';

-- 12. Projetos
UPDATE subsistemas SET
  nome = 'Projetos',
  descricao = 'Gestão de projetos (metodologias ágeis e tradicionais), cronogramas, recursos, orçamentos, riscos e entregáveis. Inclui Kanban, Scrum, Gantt, gestão de portfólio de projetos e PMO.',
  categoria = 'suporte',
  funcionalidades = ARRAY['Planejamento de Projetos', 'Cronogramas (Gantt)', 'Gestão de Recursos', 'Gestão de Riscos', 'Kanban/Scrum', 'Entregáveis', 'PMO'],
  metricas_principais = ARRAY['Taxa de Projetos no Prazo', 'Desvio de Orçamento', 'Utilização de Recursos', 'ROI de Projetos', 'Número de Projetos Concluídos'],
  ordem_exibicao = 12,
  icone = 'briefcase',
  status = 'ativo'
WHERE codigo = 'projetos';

-- Verificar quantos registros foram atualizados
SELECT COUNT(*) as total_subsistemas FROM subsistemas WHERE status = 'ativo';
