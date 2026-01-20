-- =====================================================
-- TABELA: subsistemas
-- Descrição: Armazena os sub-sistemas da empresa virtual
-- Data: 2025-11-28
-- =====================================================

-- Excluir tabela se existir (cuidado em produção!)
DROP TABLE IF EXISTS subsistemas CASCADE;

-- Criar tabela subsistemas
CREATE TABLE subsistemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Informações básicas
    nome VARCHAR(200) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    descricao TEXT,
    
    -- Categorização
    categoria VARCHAR(100) NOT NULL, -- ex: 'comercial', 'operacional', 'administrativo', 'tecnologia'
    tipo VARCHAR(50), -- ex: 'crm', 'erp', 'marketing', 'financeiro'
    
    -- Configuração visual
    icone VARCHAR(50) DEFAULT 'Box', -- Nome do ícone lucide-react
    cor VARCHAR(20) DEFAULT '#3B82F6', -- Cor hexadecimal
    
    -- Status e metadados
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'desenvolvimento', 'arquivado')),
    prioridade INTEGER DEFAULT 0, -- Ordem de exibição
    
    -- Métricas e KPIs
    total_personas INTEGER DEFAULT 0, -- Contador de personas vinculadas
    total_tarefas INTEGER DEFAULT 0, -- Contador de tarefas vinculadas
    total_workflows INTEGER DEFAULT 0, -- Contador de workflows vinculados
    
    -- Configurações adicionais (JSON)
    configuracoes JSONB DEFAULT '{}', -- Configurações específicas do sub-sistema
    integracao_config JSONB DEFAULT '{}', -- Configurações de integração com sistemas externos
    
    -- Auditoria
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Índices para performance
CREATE INDEX idx_subsistemas_empresa_id ON subsistemas(empresa_id);
CREATE INDEX idx_subsistemas_status ON subsistemas(status);
CREATE INDEX idx_subsistemas_categoria ON subsistemas(categoria);
CREATE INDEX idx_subsistemas_codigo ON subsistemas(codigo);
CREATE UNIQUE INDEX idx_subsistemas_codigo_empresa ON subsistemas(empresa_id, codigo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_subsistemas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_subsistemas_updated_at
    BEFORE UPDATE ON subsistemas
    FOR EACH ROW
    EXECUTE FUNCTION update_subsistemas_updated_at();

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Subsistemas com estatísticas agregadas
CREATE OR REPLACE VIEW subsistemas_summary AS
SELECT 
    s.id,
    s.empresa_id,
    s.nome,
    s.codigo,
    s.descricao,
    s.categoria,
    s.tipo,
    s.icone,
    s.cor,
    s.status,
    s.prioridade,
    s.total_personas,
    s.total_tarefas,
    s.total_workflows,
    e.nome AS empresa_nome,
    e.codigo AS empresa_codigo,
    s.created_at,
    s.updated_at
FROM subsistemas s
INNER JOIN empresas e ON s.empresa_id = e.id
WHERE s.status != 'arquivado'
ORDER BY s.prioridade DESC, s.nome ASC;

-- View: Estatísticas por empresa
CREATE OR REPLACE VIEW subsistemas_stats_by_empresa AS
SELECT 
    empresa_id,
    COUNT(*) AS total_subsistemas,
    COUNT(*) FILTER (WHERE status = 'ativo') AS total_ativos,
    COUNT(*) FILTER (WHERE status = 'inativo') AS total_inativos,
    COUNT(*) FILTER (WHERE status = 'desenvolvimento') AS total_desenvolvimento,
    SUM(total_personas) AS total_personas_vinculadas,
    SUM(total_tarefas) AS total_tarefas_vinculadas,
    SUM(total_workflows) AS total_workflows_vinculados
FROM subsistemas
GROUP BY empresa_id;

-- View: Subsistemas por categoria
CREATE OR REPLACE VIEW subsistemas_by_categoria AS
SELECT 
    empresa_id,
    categoria,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'ativo') AS total_ativos,
    ARRAY_AGG(nome ORDER BY nome) AS subsistemas_nomes
FROM subsistemas
WHERE status != 'arquivado'
GROUP BY empresa_id, categoria
ORDER BY empresa_id, total DESC;

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função: Atualizar contador de personas
CREATE OR REPLACE FUNCTION update_subsistema_persona_count(
    p_subsistema_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE subsistemas
    SET total_personas = (
        SELECT COUNT(*)
        FROM personas
        WHERE subsistema_id = p_subsistema_id
        AND status = 'ativa'
    )
    WHERE id = p_subsistema_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Atualizar contador de tarefas
CREATE OR REPLACE FUNCTION update_subsistema_tarefa_count(
    p_subsistema_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE subsistemas
    SET total_tarefas = (
        SELECT COUNT(*)
        FROM personas_tasks pt
        INNER JOIN personas p ON pt.persona_id = p.id
        WHERE p.subsistema_id = p_subsistema_id
    )
    WHERE id = p_subsistema_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Ativar/Desativar subsistema
CREATE OR REPLACE FUNCTION toggle_subsistema_status(
    p_subsistema_id UUID
)
RETURNS TEXT AS $$
DECLARE
    v_current_status VARCHAR(20);
    v_new_status VARCHAR(20);
BEGIN
    SELECT status INTO v_current_status
    FROM subsistemas
    WHERE id = p_subsistema_id;
    
    IF v_current_status = 'ativo' THEN
        v_new_status := 'inativo';
    ELSE
        v_new_status := 'ativo';
    END IF;
    
    UPDATE subsistemas
    SET status = v_new_status
    WHERE id = p_subsistema_id;
    
    RETURN v_new_status;
END;
$$ LANGUAGE plpgsql;

-- Função: Arquivar subsistema (soft delete)
CREATE OR REPLACE FUNCTION archive_subsistema(
    p_subsistema_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE subsistemas
    SET status = 'arquivado',
        updated_at = NOW()
    WHERE id = p_subsistema_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DADOS DE EXEMPLO (12 SUB-SISTEMAS PRINCIPAIS)
-- =====================================================

-- Inserir sub-sistemas para ARVA Tech Solutions
INSERT INTO subsistemas (empresa_id, nome, codigo, descricao, categoria, tipo, icone, cor, status, prioridade, configuracoes) VALUES
-- COMERCIAL (Prioridade 10-12)
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'CRM - Gestão de Relacionamento',
    'CRM',
    'Sistema de gestão de clientes, leads, oportunidades e funil de vendas. Centraliza todo o relacionamento comercial.',
    'comercial',
    'crm',
    'Users',
    '#10B981',
    'ativo',
    12,
    '{"features": ["leads", "pipeline", "oportunidades", "contatos"], "integracao": ["email", "telefonia", "whatsapp"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Vendas e Propostas',
    'VENDAS',
    'Gestão de propostas comerciais, cotações, negociações e fechamento de contratos.',
    'comercial',
    'vendas',
    'TrendingUp',
    '#3B82F6',
    'ativo',
    11,
    '{"features": ["propostas", "cotacoes", "contratos", "comissoes"], "workflow": ["aprovacao", "assinatura"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Marketing Digital',
    'MARKETING',
    'Campanhas, automação de marketing, geração de leads e análise de performance.',
    'comercial',
    'marketing',
    'Megaphone',
    '#F59E0B',
    'ativo',
    10,
    '{"features": ["campanhas", "email_marketing", "social_media", "seo"], "plataformas": ["google_ads", "meta_ads"]}'::jsonb
),

-- OPERACIONAL (Prioridade 7-9)
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Projetos e Entregas',
    'PROJETOS',
    'Gestão de projetos, sprints, tarefas e cronogramas de entrega para clientes.',
    'operacional',
    'projetos',
    'Briefcase',
    '#8B5CF6',
    'ativo',
    9,
    '{"metodologia": "agile", "features": ["sprints", "kanban", "gantt", "milestones"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Suporte ao Cliente',
    'SUPORTE',
    'Atendimento, tickets, base de conhecimento e satisfação do cliente.',
    'operacional',
    'suporte',
    'Headphones',
    '#EC4899',
    'ativo',
    8,
    '{"features": ["tickets", "chat", "knowledge_base", "sla"], "canais": ["email", "chat", "telefone"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Qualidade e Processos',
    'QUALIDADE',
    'Gestão de qualidade, auditorias, não conformidades e melhoria contínua.',
    'operacional',
    'qualidade',
    'CheckCircle',
    '#14B8A6',
    'ativo',
    7,
    '{"features": ["auditorias", "nao_conformidades", "acoes_corretivas", "indicadores"]}'::jsonb
),

-- ADMINISTRATIVO (Prioridade 4-6)
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Recursos Humanos',
    'RH',
    'Gestão de pessoas, recrutamento, folha de pagamento, benefícios e desenvolvimento.',
    'administrativo',
    'rh',
    'Users',
    '#6366F1',
    'ativo',
    6,
    '{"features": ["recrutamento", "folha", "beneficios", "treinamento", "desempenho"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Financeiro e Contábil',
    'FINANCEIRO',
    'Contas a pagar/receber, fluxo de caixa, conciliação bancária e relatórios financeiros.',
    'administrativo',
    'financeiro',
    'DollarSign',
    '#EF4444',
    'ativo',
    5,
    '{"features": ["contas_pagar", "contas_receber", "fluxo_caixa", "dre", "balanco"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Compras e Fornecedores',
    'COMPRAS',
    'Gestão de fornecedores, cotações, pedidos de compra e controle de estoque.',
    'administrativo',
    'compras',
    'ShoppingCart',
    '#F97316',
    'ativo',
    4,
    '{"features": ["fornecedores", "cotacoes", "pedidos", "estoque"]}'::jsonb
),

-- TECNOLOGIA (Prioridade 1-3)
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'TI e Infraestrutura',
    'TI',
    'Gestão de infraestrutura, servidores, segurança, backups e suporte técnico.',
    'tecnologia',
    'infraestrutura',
    'Server',
    '#64748B',
    'ativo',
    3,
    '{"features": ["servidores", "seguranca", "backups", "monitoramento"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Desenvolvimento de Software',
    'DEV',
    'Desenvolvimento de sistemas, APIs, integrações e automações customizadas.',
    'tecnologia',
    'desenvolvimento',
    'Code',
    '#06B6D4',
    'ativo',
    2,
    '{"features": ["apis", "integracoes", "automacoes", "testes"], "tech_stack": ["nodejs", "react", "python"]}'::jsonb
),
(
    '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
    'Dados e Business Intelligence',
    'BI',
    'Análise de dados, dashboards, relatórios e inteligência de negócios.',
    'tecnologia',
    'bi',
    'BarChart',
    '#A855F7',
    'ativo',
    1,
    '{"features": ["dashboards", "relatorios", "kpis", "analytics"], "ferramentas": ["powerbi", "tableau", "metabase"]}'::jsonb
);

-- =====================================================
-- COMENTÁRIOS E OBSERVAÇÕES
-- =====================================================

-- Total de sub-sistemas inseridos: 12
-- Empresas contempladas: ARVA Tech Solutions
-- Categorias: comercial (3), operacional (3), administrativo (3), tecnologia (3)

-- Para adicionar mais sub-sistemas:
-- INSERT INTO subsistemas (empresa_id, nome, codigo, descricao, categoria, tipo, icone, cor, status, prioridade)
-- VALUES (...);

-- Para verificar inserções:
-- SELECT * FROM subsistemas ORDER BY prioridade DESC;
-- SELECT * FROM subsistemas_summary;
-- SELECT * FROM subsistemas_stats_by_empresa;

-- Para atualizar contadores de personas/tarefas:
-- SELECT update_subsistema_persona_count('subsistema_id_here');
-- SELECT update_subsistema_tarefa_count('subsistema_id_here');

COMMENT ON TABLE subsistemas IS 'Tabela de sub-sistemas da empresa virtual (CRM, Vendas, Marketing, RH, Financeiro, etc.)';
COMMENT ON COLUMN subsistemas.configuracoes IS 'JSON com configurações específicas do sub-sistema (features, integrações, etc.)';
COMMENT ON COLUMN subsistemas.integracao_config IS 'JSON com configurações de integração com sistemas externos (credenciais, endpoints, etc.)';
COMMENT ON COLUMN subsistemas.total_personas IS 'Contador de personas vinculadas a este sub-sistema';
COMMENT ON COLUMN subsistemas.total_tarefas IS 'Contador de tarefas vinculadas a personas deste sub-sistema';
COMMENT ON COLUMN subsistemas.total_workflows IS 'Contador de workflows vinculados a este sub-sistema';
