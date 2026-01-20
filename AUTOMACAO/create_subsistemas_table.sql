-- ============================================================================
-- TABELA: subsistemas
-- ============================================================================
-- Armazena os 12 subsistemas do VCM que podem ser usados nas tarefas/atribuições
-- Esta tabela será consultada pela LLM ao gerar atribuições para decidir
-- quais ferramentas/subsistemas usar em cada tarefa
-- ============================================================================

CREATE TABLE IF NOT EXISTS subsistemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  codigo TEXT NOT NULL UNIQUE, -- Ex: 'gestao_empresarial', 'producao'
  descricao TEXT NOT NULL, -- Descrição detalhada para a LLM entender o subsistema
  categoria TEXT NOT NULL, -- 'core', 'operacional', 'suporte'
  funcionalidades TEXT[], -- Lista de funcionalidades principais
  metricas_principais TEXT[], -- KPIs que este subsistema gerencia
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'em_desenvolvimento')),
  ordem_exibicao INTEGER DEFAULT 0,
  icone TEXT, -- Nome do ícone (opcional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas caso a tabela já exista sem elas
ALTER TABLE subsistemas 
ADD COLUMN IF NOT EXISTS funcionalidades TEXT[],
ADD COLUMN IF NOT EXISTS metricas_principais TEXT[],
ADD COLUMN IF NOT EXISTS icone TEXT,
ADD COLUMN IF NOT EXISTS ordem_exibicao INTEGER DEFAULT 0;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_subsistemas_status ON subsistemas(status);
CREATE INDEX IF NOT EXISTS idx_subsistemas_categoria ON subsistemas(categoria);
CREATE INDEX IF NOT EXISTS idx_subsistemas_codigo ON subsistemas(codigo);

-- ============================================================================
-- POPULAR COM OS 12 SUBSISTEMAS VCM
-- ============================================================================
-- Limpar dados antigos (se existirem)
DELETE FROM subsistemas;

-- Nota: Se a tabela tiver empresa_id, precisamos fornecer um UUID válido
-- Como subsistemas são globais (não específicos de empresa), vamos inserir sem empresa_id
-- ou usar ON CONFLICT para atualizar registros existentes

INSERT INTO subsistemas (nome, codigo, descricao, categoria, funcionalidades, metricas_principais, ordem_exibicao, icone) VALUES

-- CORE BUSINESS (1-3)
(
  'Gestão Empresarial',
  'gestao_empresarial',
  'Sistema central de gestão estratégica, planejamento, governança e tomada de decisões. Gerencia objetivos estratégicos, OKRs, indicadores corporativos e dashboards executivos. Inclui módulos de Business Intelligence, análise de cenários e gestão de portfólio.',
  'core',
  ARRAY['Planejamento Estratégico', 'Gestão de OKRs', 'Dashboards Executivos', 'BI e Analytics', 'Governança Corporativa', 'Gestão de Riscos'],
  ARRAY['ROI', 'CAGR', 'Margem de Lucro', 'Fluxo de Caixa', 'NPS Global'],
  1,
  'building-office'
),

(
  'Produção',
  'producao',
  'Controle completo de processos produtivos, ordens de produção, gestão de capacidade, setup de máquinas, rastreabilidade e eficiência. Integra planejamento de produção (PCP), controle de qualidade em linha e manutenção preventiva.',
  'core',
  ARRAY['Ordens de Produção', 'Planejamento de Capacidade', 'Controle de Processos', 'Rastreabilidade', 'Setup de Máquinas', 'OEE (Overall Equipment Effectiveness)'],
  ARRAY['OEE', 'Tempo de Ciclo', 'Taxa de Refugo', 'Produtividade', 'Utilização de Capacidade'],
  2,
  'cog'
),

(
  'Financeiro',
  'financeiro',
  'Gestão financeira completa: contas a pagar, contas a receber, fluxo de caixa, conciliação bancária, DRE, balanço patrimonial e centro de custos. Inclui módulos de planejamento financeiro, controle orçamentário e análise de rentabilidade.',
  'core',
  ARRAY['Contas a Pagar/Receber', 'Fluxo de Caixa', 'Conciliação Bancária', 'DRE e Balanço', 'Controle Orçamentário', 'Centro de Custos', 'Planejamento Financeiro'],
  ARRAY['Margem de Lucro', 'Fluxo de Caixa Livre', 'ROI', 'Liquidez Corrente', 'Endividamento'],
  3,
  'currency-dollar'
),

-- GESTÃO DE RECURSOS (4-5)
(
  'Recursos Humanos (RH)',
  'recursos_humanos',
  'Gestão completa de pessoas: recrutamento, seleção, onboarding, folha de pagamento, benefícios, avaliação de desempenho, treinamentos e desenvolvimento. Inclui gestão de ponto, férias, rescisões e conformidade trabalhista.',
  'suporte',
  ARRAY['Recrutamento e Seleção', 'Onboarding', 'Folha de Pagamento', 'Benefícios', 'Avaliação de Desempenho', 'Treinamentos', 'Gestão de Ponto'],
  ARRAY['Turnover', 'Tempo de Contratação', 'Satisfação de Funcionários', 'Taxa de Retenção', 'Horas de Treinamento'],
  4,
  'users'
),

(
  'Vendas',
  'vendas',
  'Gestão do ciclo completo de vendas: leads, oportunidades, propostas, negociações, contratos e comissões. CRM integrado, pipeline de vendas, previsões, metas e análise de conversão. Inclui gestão de relacionamento com clientes.',
  'core',
  ARRAY['CRM', 'Pipeline de Vendas', 'Propostas Comerciais', 'Gestão de Contratos', 'Comissões', 'Metas de Vendas', 'Análise de Conversão'],
  ARRAY['Taxa de Conversão', 'Ticket Médio', 'Ciclo de Vendas', 'Win Rate', 'MRR (Receita Recorrente)', 'CAC (Custo de Aquisição)'],
  5,
  'chart-bar'
),

-- RELACIONAMENTO E COMUNICAÇÃO (6-7)
(
  'Marketing',
  'marketing',
  'Gestão de campanhas, marketing digital, geração de leads, automação de marketing, SEO/SEM, mídias sociais e análise de ROI de marketing. Inclui gestão de conteúdo, email marketing e eventos.',
  'core',
  ARRAY['Campanhas de Marketing', 'Geração de Leads', 'Automação de Marketing', 'SEO/SEM', 'Redes Sociais', 'Email Marketing', 'Análise de ROI'],
  ARRAY['CPL (Custo por Lead)', 'Taxa de Conversão de Leads', 'Tráfego Orgânico', 'Engajamento', 'ROI de Marketing'],
  6,
  'megaphone'
),

(
  'Atendimento ao Cliente',
  'atendimento',
  'Gestão completa de suporte: tickets, chamados, SLA, base de conhecimento, chatbots e satisfação do cliente. Inclui help desk, service desk, gestão de reclamações e análise de CSAT/NPS.',
  'suporte',
  ARRAY['Gestão de Tickets', 'SLA', 'Base de Conhecimento', 'Chatbots', 'Help Desk', 'Pesquisas de Satisfação', 'Gestão de Reclamações'],
  ARRAY['CSAT', 'NPS', 'Tempo Médio de Resposta', 'Taxa de Resolução no Primeiro Contato', 'Taxa de Churn'],
  7,
  'chat-bubble-left-right'
),

-- OPERAÇÕES (8-10)
(
  'Compras',
  'compras',
  'Gestão de fornecedores, cotações, pedidos de compra, aprovações, recebimento de mercadorias e avaliação de fornecedores. Inclui controle de contratos, gestão de custos de aquisição e compliance.',
  'operacional',
  ARRAY['Gestão de Fornecedores', 'Cotações', 'Pedidos de Compra', 'Recebimento', 'Contratos', 'Avaliação de Fornecedores', 'Controle de Custos'],
  ARRAY['Custo de Aquisição', 'Lead Time de Compras', 'Taxa de Conformidade', 'Número de Fornecedores Ativos'],
  8,
  'shopping-cart'
),

(
  'Estoque',
  'estoque',
  'Controle de inventário, movimentações, saldos, valorizações (FIFO/LIFO/Média), inventário físico, ponto de reposição e análise ABC. Inclui gestão de múltiplos depósitos e rastreabilidade de lotes.',
  'operacional',
  ARRAY['Controle de Inventário', 'Movimentações', 'Valorização de Estoque', 'Inventário Físico', 'Ponto de Reposição', 'Análise ABC', 'Rastreabilidade de Lotes'],
  ARRAY['Acurácia de Estoque', 'Giro de Estoque', 'Cobertura de Estoque', 'Taxa de Ruptura', 'Custo de Armazenagem'],
  9,
  'archive-box'
),

(
  'Logística',
  'logistica',
  'Gestão de transporte, roteirização, entregas, fretes, rastreamento de cargas e gestão de transportadoras. Inclui logística reversa, controle de devolução e otimização de rotas.',
  'operacional',
  ARRAY['Gestão de Transporte', 'Roteirização', 'Rastreamento de Cargas', 'Gestão de Fretes', 'Logística Reversa', 'Controle de Entregas', 'Otimização de Rotas'],
  ARRAY['On-Time Delivery', 'Custo de Frete', 'Taxa de Avarias', 'Tempo Médio de Entrega', 'Utilização de Frota'],
  10,
  'truck'
),

-- QUALIDADE E PROJETOS (11-12)
(
  'Qualidade',
  'qualidade',
  'Controle de qualidade, não conformidades, ações corretivas/preventivas (CAPA), auditorias, certificações (ISO) e melhoria contínua. Inclui gestão de calibrações, inspeções e análise de causas raízes.',
  'suporte',
  ARRAY['Controle de Qualidade', 'Não Conformidades', 'CAPA (Corretivas/Preventivas)', 'Auditorias', 'Certificações', 'Calibrações', 'Análise de Causa Raiz'],
  ARRAY['Taxa de Defeitos', 'Conformidade com SLAs', 'Número de Não Conformidades', 'Índice de Satisfação com Qualidade'],
  11,
  'shield-check'
),

(
  'Projetos',
  'projetos',
  'Gestão de projetos (metodologias ágeis e tradicionais), cronogramas, recursos, orçamentos, riscos e entregáveis. Inclui Kanban, Scrum, Gantt, gestão de portfólio de projetos e PMO.',
  'suporte',
  ARRAY['Planejamento de Projetos', 'Cronogramas (Gantt)', 'Gestão de Recursos', 'Gestão de Riscos', 'Kanban/Scrum', 'Entregáveis', 'PMO'],
  ARRAY['Taxa de Projetos no Prazo', 'Desvio de Orçamento', 'Utilização de Recursos', 'ROI de Projetos', 'Número de Projetos Concluídos'],
  12,
  'briefcase'
);

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE subsistemas IS 'Subsistemas do VCM que podem ser usados nas tarefas/atribuições das personas. Consultado pela LLM ao gerar workflows.';
COMMENT ON COLUMN subsistemas.descricao IS 'Descrição detalhada para a LLM entender quando usar este subsistema';
COMMENT ON COLUMN subsistemas.funcionalidades IS 'Lista de funcionalidades principais para a LLM decidir uso';
COMMENT ON COLUMN subsistemas.metricas_principais IS 'KPIs gerenciados por este subsistema';
