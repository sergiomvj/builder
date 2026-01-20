-- ==============================================================================
-- BUILDER MVP - INITIAL DATABASE SETUP
-- ==============================================================================
-- Este script cria a estrutura completa do banco de dados para o projeto Builder MVP.
-- Ele combina tabelas essenciais do sistema legado (VCM) com as novas tabelas de ideação.
-- 
-- INSTRUÇÕES:
-- 1. Copie todo o conteúdo deste arquivo.
-- 2. Acesse o Supabase Dashboard > SQL Editor.
-- 3. Cole e execute (Run).
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. New Builder Tables (Top Level)

CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processing', 'approved', 'rejected', 'project_created')),
    analysis_result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    idea_id UUID REFERENCES public.ideas(id),
    name TEXT NOT NULL,
    description TEXT,
    mission TEXT,
    vision TEXT,
    values TEXT[],
    objectives TEXT[],
    target_audience TEXT,
    revenue_streams TEXT[],
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'building', 'active', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Core VCM Tables (Adapted)

CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id), -- Link to Builder Project
    nome VARCHAR(255) NOT NULL,
    setor VARCHAR(100),
    descricao TEXT,
    owner_id UUID REFERENCES auth.users(id),
    configuracoes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.personas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(255),
    departamento VARCHAR(100),
    nivel_senioridade VARCHAR(50), -- 'Junior', 'Pleno', 'Senior', 'C-Level'
    descricao_funcao TEXT,
    tracos_personalidade TEXT[],
    objetivos TEXT[],
    avatar_url TEXT,
    tipo VARCHAR(50) DEFAULT 'virtual_assistant', -- 'virtual_assistant', 'human', 'system'
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.competencias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    persona_id UUID REFERENCES public.personas(id) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('principal', 'tecnica', 'soft_skill')),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    nivel VARCHAR(50) DEFAULT 'avancado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id),
    assigned_to UUID REFERENCES public.personas(id),
    created_by UUID REFERENCES public.personas(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    automation_id UUID, -- Link to future automation table
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Automation & Audit (N8N & ML Support)

CREATE TABLE IF NOT EXISTS public.automation_opportunities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) NOT NULL,
    persona_id UUID REFERENCES public.personas(id) NOT NULL,
    task_title TEXT NOT NULL,
    task_description TEXT,
    automation_score INTEGER CHECK (automation_score BETWEEN 0 AND 100),
    workflow_type VARCHAR(50), -- 'webhook', 'cron', 'event'
    n8n_workflow_id VARCHAR(255),
    n8n_webhook_url TEXT,
    status VARCHAR(50) DEFAULT 'identified' CHECK (status IN ('identified', 'analyzed', 'implemented', 'active', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.auditorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id),
    auditoria_tipo VARCHAR(100) NOT NULL, -- 'workflow_integrity', 'persona_performance', 'security'
    titulo TEXT NOT NULL,
    resultados JSONB DEFAULT '{}'::jsonb,
    score NUMERIC,
    status VARCHAR(50) DEFAULT 'concluida',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) - Basic Policies
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users for now (MVP mode)
-- PROD WARNING: Tighten these policies later!
CREATE POLICY "Allow public read" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Allow authenticated create" ON public.ideas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow owner update" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow public read" ON public.projects FOR SELECT USING (true);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.personas (empresa_id, nome, tipo, status)
  VALUES (NULL, new.raw_user_meta_data->>'full_name', 'human', 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
