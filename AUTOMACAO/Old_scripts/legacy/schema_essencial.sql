-- =====================================================
-- VCM Dashboard - Schema Essencial V2.0
-- =====================================================
-- Execute este SQL no Supabase SQL Editor (Dashboard)
-- Crie as tabelas uma por vez se necessário

-- =====================================================
-- 1. ATUALIZAR TABELA EMPRESAS
-- =====================================================

-- Adicionar novos campos à tabela empresas
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS dominio VARCHAR(255);

ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS industria VARCHAR(100) NOT NULL DEFAULT 'tecnologia';

-- =====================================================
-- 2. TABELA DE METAS GLOBAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.metas_globais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    prazo DATE NOT NULL,
    prioridade VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    categoria VARCHAR(50) NOT NULL DEFAULT 'crescimento' CHECK (categoria IN ('crescimento', 'operacional', 'financeira', 'inovacao', 'sustentabilidade')),
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida', 'cancelada')),
    responsavel_principal VARCHAR(255),
    indicadores_sucesso TEXT[],
    budget_estimado DECIMAL(15,2),
    roi_esperado DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT metas_globais_empresa_titulo_unique UNIQUE(empresa_id, titulo)
);

-- =====================================================
-- 3. TABELA DE METAS POR PERSONA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.metas_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meta_global_id UUID NOT NULL REFERENCES public.metas_globais(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_persona VARCHAR(20) NOT NULL CHECK (tipo_persona IN ('executivo', 'especialista', 'assistente')),
    prazo DATE NOT NULL,
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    alinhamento_score INTEGER DEFAULT 0 CHECK (alinhamento_score >= 0 AND alinhamento_score <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida', 'cancelada')),
    dependencias TEXT[],
    recursos_necessarios TEXT[],
    milestones JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT metas_personas_global_persona_unique UNIQUE(meta_global_id, persona_id, titulo)
);

-- =====================================================
-- 4. TABELA DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.auditorias_compatibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    workflow_reference VARCHAR(255) NOT NULL,
    meta_global_id UUID REFERENCES public.metas_globais(id) ON DELETE SET NULL,
    meta_persona_id UUID REFERENCES public.metas_personas(id) ON DELETE SET NULL,
    compatibilidade_score INTEGER NOT NULL CHECK (compatibilidade_score >= 0 AND compatibilidade_score <= 100),
    compatibilidade_nivel VARCHAR(20) NOT NULL DEFAULT 'medio' CHECK (compatibilidade_nivel IN ('baixo', 'medio', 'alto', 'excelente')),
    analise_detalhada JSONB DEFAULT '{}'::jsonb,
    observacoes TEXT,
    acoes_sugeridas TEXT[],
    status_auditoria VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status_auditoria IN ('pendente', 'em_analise', 'aprovado', 'reprovado', 'requer_ajuste')),
    auditado_por VARCHAR(255),
    auditado_em TIMESTAMP WITH TIME ZONE,
    proxima_auditoria DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TABELA DE AVATARES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.avatares_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500) NOT NULL,
    avatar_thumbnail_url VARCHAR(500),
    prompt_usado TEXT NOT NULL,
    estilo VARCHAR(50) NOT NULL DEFAULT 'corporate' CHECK (estilo IN ('corporate', 'casual', 'creative', 'formal')),
    background_tipo VARCHAR(50) NOT NULL DEFAULT 'office' CHECK (background_tipo IN ('office', 'home_office', 'neutral', 'custom')),
    servico_usado VARCHAR(50) NOT NULL DEFAULT 'nano_banana' CHECK (servico_usado IN ('nano_banana', 'dall_e', 'midjourney', 'custom')),
    versao INTEGER NOT NULL DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT true,
    metadados JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. BIOGRAFIAS EXPANDIDAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.personas_biografias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    biografia_completa TEXT NOT NULL,
    historia_profissional TEXT,
    motivacoes JSONB DEFAULT '{}'::jsonb,
    desafios JSONB DEFAULT '{}'::jsonb,
    objetivos_pessoais TEXT[],
    soft_skills JSONB DEFAULT '{}'::jsonb,
    hard_skills JSONB DEFAULT '{}'::jsonb,
    educacao JSONB DEFAULT '{}'::jsonb,
    certificacoes TEXT[],
    idiomas_fluencia JSONB DEFAULT '{}'::jsonb,
    experiencia_internacional JSONB DEFAULT '{}'::jsonb,
    redes_sociais JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT personas_biografias_persona_unique UNIQUE(persona_id)
);

-- =====================================================
-- 7. TECH SPECS EXPANDIDAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.personas_tech_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    ai_model VARCHAR(100) NOT NULL DEFAULT 'gpt-4-turbo-preview',
    max_tokens INTEGER NOT NULL DEFAULT 2000 CHECK (max_tokens > 0 AND max_tokens <= 8000),
    temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    response_format VARCHAR(50) NOT NULL DEFAULT 'structured' CHECK (response_format IN ('structured', 'creative', 'analytical', 'conversational')),
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    decision_authority VARCHAR(50) NOT NULL DEFAULT 'operational' CHECK (decision_authority IN ('none', 'operational', 'tactical', 'strategic', 'full')),
    access_scope VARCHAR(100) NOT NULL DEFAULT 'department',
    tools_habilitadas JSONB DEFAULT '[]'::jsonb,
    integrações_sistemas JSONB DEFAULT '[]'::jsonb,
    limitações JSONB DEFAULT '{}'::jsonb,
    configuração_avançada JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT personas_tech_specs_persona_unique UNIQUE(persona_id)
);

-- =====================================================
-- 8. POLÍTICAS RLS BÁSICAS
-- =====================================================

ALTER TABLE public.metas_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias_compatibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatares_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas_biografias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas_tech_specs ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (ajustar conforme necessário)
CREATE POLICY "Allow all operations for authenticated users" ON public.metas_globais FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.metas_personas FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.auditorias_compatibilidade FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.avatares_personas FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.personas_biografias FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.personas_tech_specs FOR ALL USING (true);

-- =====================================================
-- 9. VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'metas_globais', 
    'metas_personas', 
    'auditorias_compatibilidade', 
    'avatares_personas',
    'personas_biografias',
    'personas_tech_specs'
  )
ORDER BY table_name;