-- =====================================================
-- SISTEMA DE TAREFAS PARA PERSONAS VCM
-- =====================================================
-- Execute este SQL no Supabase para criar o sistema de tarefas

-- Tabela principal de tarefas
CREATE TABLE IF NOT EXISTS persona_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    task_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) CHECK (task_type IN ('daily', 'weekly', 'monthly', 'ad_hoc')),
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    estimated_duration INTEGER, -- em minutos
    actual_duration INTEGER, -- em minutos
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Integração com sub-sistemas
    required_subsystems JSONB DEFAULT '[]'::jsonb,
    data_inputs JSONB DEFAULT '[]'::jsonb,
    data_outputs JSONB DEFAULT '[]'::jsonb,
    dependencies JSONB DEFAULT '[]'::jsonb,
    
    -- Recorrência
    frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    recurrence_rule JSONB DEFAULT '{}'::jsonb,
    parent_template_id UUID, -- Para tarefas geradas de templates
    
    -- Colaboração
    assigned_to UUID REFERENCES personas(id),
    collaborators JSONB DEFAULT '[]'::jsonb,
    inputs_from JSONB DEFAULT '[]'::jsonb,
    outputs_to JSONB DEFAULT '[]'::jsonb,
    
    -- Metadados
    tags JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de tarefas
CREATE TABLE IF NOT EXISTS task_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    position_type VARCHAR(100), -- CEO, Marketing Manager, SDR, etc.
    task_type VARCHAR(50) CHECK (task_type IN ('daily', 'weekly', 'monthly')),
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de execução
CREATE TABLE IF NOT EXISTS task_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES persona_tasks(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_persona_tasks_persona_id ON persona_tasks(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_tasks_status ON persona_tasks(status);
CREATE INDEX IF NOT EXISTS idx_persona_tasks_type ON persona_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_persona_tasks_due_date ON persona_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_templates_position ON task_templates(position_type);

-- RLS (Row Level Security)
ALTER TABLE persona_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_logs ENABLE ROW LEVEL SECURITY;

-- Inserir templates base para posições principais
INSERT INTO task_templates (name, description, position_type, task_type, template_data) VALUES
(
    'CEO Daily Tasks Template',
    'Tarefas diárias padrão para CEO',
    'CEO',
    'daily',
    '{
        "tasks": [
            {
                "title": "Revisão de Métricas Executivas",
                "description": "Análise do dashboard executivo com KPIs principais",
                "estimated_duration": 30,
                "priority": "HIGH",
                "required_subsystems": ["Analytics", "BI"],
                "inputs_from": ["CFO", "CTO", "Sales Director"],
                "outputs_to": ["Toda a equipe"]
            },
            {
                "title": "Aprovação de Decisões Pendentes",
                "description": "Review e aprovação de decisões escaladas",
                "estimated_duration": 45,
                "priority": "HIGH",
                "required_subsystems": ["CRM", "Financial", "HR"],
                "inputs_from": ["Todos os departamentos"],
                "outputs_to": ["Departamentos solicitantes"]
            }
        ]
    }'
),
(
    'Marketing Manager Daily Tasks Template',
    'Tarefas diárias padrão para Marketing Manager',
    'Marketing Manager',
    'daily',
    '{
        "tasks": [
            {
                "title": "Análise de Performance de Campanhas",
                "description": "Monitoramento de métricas de campanhas ativas",
                "estimated_duration": 60,
                "priority": "HIGH",
                "required_subsystems": ["Marketing", "Analytics"],
                "inputs_from": ["Marketing Metrics", "Social Media"],
                "outputs_to": ["Sales Director", "CEO"]
            },
            {
                "title": "Otimização de Anúncios",
                "description": "Ajustes em campanhas baseados em performance",
                "estimated_duration": 45,
                "priority": "MEDIUM",
                "required_subsystems": ["Marketing"],
                "inputs_from": ["Performance data"],
                "outputs_to": ["Marketing Metrics"]
            }
        ]
    }'
),
(
    'SDR Daily Tasks Template',
    'Tarefas diárias padrão para SDR',
    'SDR',
    'daily',
    '{
        "tasks": [
            {
                "title": "Prospecção de Novos Leads",
                "description": "Identificação e contato inicial com prospects",
                "estimated_duration": 120,
                "priority": "HIGH",
                "required_subsystems": ["CRM", "Email Management"],
                "inputs_from": ["Marketing leads", "Lead scoring"],
                "outputs_to": ["CRM pipeline", "Account Executives"]
            },
            {
                "title": "Follow-up de Leads Existentes",
                "description": "Sequência de follow-up com prospects",
                "estimated_duration": 90,
                "priority": "HIGH",
                "required_subsystems": ["CRM", "Email Management"],
                "inputs_from": ["CRM activities", "Lead status"],
                "outputs_to": ["Updated lead status", "Meeting bookings"]
            }
        ]
    }'
);

-- Função para arbitrar tarefas automaticamente (versão simplificada)
CREATE OR REPLACE FUNCTION arbitrate_daily_tasks(p_persona_id UUID)
RETURNS JSON AS $$
DECLARE
    persona_exists BOOLEAN;
    template_record RECORD;
    task_data JSON;
    result JSON;
    tasks_created INTEGER := 0;
BEGIN
    -- Verificar se a persona existe
    SELECT EXISTS(SELECT 1 FROM personas WHERE id = p_persona_id) INTO persona_exists;
    
    IF NOT persona_exists THEN
        RETURN '{"error": "Persona not found"}';
    END IF;
    
    -- Para esta versão simplificada, vamos usar templates genéricos
    -- Buscar template de tarefas diárias genéricas
    SELECT * INTO template_record 
    FROM task_templates 
    WHERE task_type = 'daily' 
    AND is_active = true
    LIMIT 1;
    
    IF FOUND THEN
        -- Gerar tarefas baseadas no template
        FOR task_data IN SELECT json_array_elements(template_record.template_data->'tasks')
        LOOP
            INSERT INTO persona_tasks (
                persona_id,
                task_id,
                title,
                description,
                task_type,
                priority,
                estimated_duration,
                required_subsystems,
                inputs_from,
                outputs_to,
                due_date,
                parent_template_id
            ) VALUES (
                p_persona_id,
                'daily_' || p_persona_id::text || '_' || to_char(now(), 'YYYYMMDD') || '_' || extract(epoch from now()),
                task_data->>'title',
                task_data->>'description',
                'daily',
                task_data->>'priority',
                (task_data->>'estimated_duration')::INTEGER,
                task_data->'required_subsystems',
                task_data->'inputs_from',
                task_data->'outputs_to',
                date_trunc('day', now()) + interval '23 hours 59 minutes',
                template_record.id
            );
            
            tasks_created := tasks_created + 1;
        END LOOP;
        
        result := json_build_object(
            'success', true,
            'message', 'Tasks arbitrated successfully',
            'persona_id', p_persona_id,
            'tasks_created', tasks_created
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'No daily template found'
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar tarefas de uma persona
CREATE OR REPLACE FUNCTION get_persona_tasks(p_persona_id UUID, p_status TEXT DEFAULT NULL)
RETURNS TABLE (
    task_id UUID,
    title VARCHAR,
    description TEXT,
    task_type VARCHAR,
    priority VARCHAR,
    status VARCHAR,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INTEGER,
    required_subsystems JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.title,
        pt.description,
        pt.task_type,
        pt.priority,
        pt.status,
        pt.due_date,
        pt.estimated_duration,
        pt.required_subsystems
    FROM persona_tasks pt
    WHERE pt.persona_id = p_persona_id
    AND (p_status IS NULL OR pt.status = p_status)
    ORDER BY 
        CASE pt.priority 
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
        END,
        pt.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_persona_tasks_updated_at BEFORE UPDATE ON persona_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View para dashboard de tarefas (versão simplificada)
CREATE OR REPLACE VIEW persona_tasks_dashboard AS
SELECT 
    pt.id,
    pt.task_id,
    pt.title,
    pt.description,
    pt.task_type,
    pt.priority,
    pt.status,
    pt.due_date,
    pt.estimated_duration,
    pt.actual_duration,
    pt.completed_at,
    pt.persona_id,
    pt.empresa_id,
    pt.required_subsystems,
    pt.inputs_from,
    pt.outputs_to,
    CASE 
        WHEN pt.due_date < now() AND pt.status != 'completed' THEN 'overdue'
        WHEN pt.due_date <= now() + interval '2 hours' AND pt.status != 'completed' THEN 'due_soon'
        ELSE 'normal'
    END as urgency_status
FROM persona_tasks pt
ORDER BY 
    CASE pt.priority 
        WHEN 'URGENT' THEN 1
        WHEN 'HIGH' THEN 2
        WHEN 'MEDIUM' THEN 3
        WHEN 'LOW' THEN 4
    END,
    pt.due_date ASC;

SELECT 'Sistema de Tarefas VCM criado com sucesso!' as status;