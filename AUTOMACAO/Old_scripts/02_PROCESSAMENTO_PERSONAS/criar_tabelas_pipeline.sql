-- SQL para criar tabelas necessárias no banco VCM
-- Execute este script no SQL Editor do Supabase

-- Tabela tech_specifications
CREATE TABLE IF NOT EXISTS tech_specifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
    role text NOT NULL,
    tools text[] DEFAULT '{}',
    technologies text[] DEFAULT '{}',
    methodologies text[] DEFAULT '{}',
    sales_enablement text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela rag_knowledge_base
CREATE TABLE IF NOT EXISTS rag_knowledge_base (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
    content_type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela n8n_workflows  
CREATE TABLE IF NOT EXISTS n8n_workflows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
    workflow_name text NOT NULL,
    workflow_type text NOT NULL,
    nodes jsonb DEFAULT '[]',
    connections jsonb DEFAULT '{}',
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela objetivos
CREATE TABLE IF NOT EXISTS objetivos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
    objetivo_tipo text NOT NULL,
    titulo text NOT NULL,
    descricao text,
    meta_valor numeric,
    meta_unidade text,
    prazo date,
    status text DEFAULT 'ativo',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela auditorias
CREATE TABLE IF NOT EXISTS auditorias (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
    auditoria_tipo text NOT NULL,
    titulo text NOT NULL,
    resultados jsonb DEFAULT '{}',
    recomendacoes text[],
    score numeric,
    status text DEFAULT 'concluida',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tech_specifications_empresa_id ON tech_specifications(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tech_specifications_persona_id ON tech_specifications(persona_id);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_base_empresa_id ON rag_knowledge_base(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rag_knowledge_base_persona_id ON rag_knowledge_base(persona_id);
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_empresa_id ON n8n_workflows(empresa_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_empresa_id ON objetivos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_objetivos_persona_id ON objetivos(persona_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_empresa_id ON auditorias(empresa_id);