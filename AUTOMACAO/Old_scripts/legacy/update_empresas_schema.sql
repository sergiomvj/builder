-- =====================================================
-- VCM Dashboard - Schema Completo V2.0
-- =====================================================
-- Atualização completa com todas as novas funcionalidades:
-- 1. Campos empresas (dominio, industria)
-- 2. Sistema de Objetivos e Metas
-- 3. Sistema de Auditoria
-- 4. Sistema de Avatares
-- 5. CRUD expandido de Personas

-- Execute no Supabase SQL Editor

-- =====================================================
-- 1. ATUALIZAÇÃO DA TABELA EMPRESAS
-- =====================================================

-- Adicionar campo dominio (URL do site da empresa)
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS dominio VARCHAR(255);

-- Adicionar campo industria 
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS industria VARCHAR(100) NOT NULL DEFAULT 'tecnologia';

-- Atualizar descrição para ser obrigatória (se não for já)
ALTER TABLE public.empresas 
ALTER COLUMN descricao SET NOT NULL;

-- =====================================================
-- 2. SISTEMA DE OBJETIVOS E METAS
-- =====================================================

-- Tabela de Metas Globais da Empresa
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
    responsavel_principal VARCHAR(255), -- Nome ou cargo do responsável principal
    indicadores_sucesso TEXT[], -- Array de indicadores de sucesso
    budget_estimado DECIMAL(15,2), -- Orçamento estimado para a meta
    roi_esperado DECIMAL(5,2), -- ROI esperado em percentual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT metas_globais_empresa_titulo_unique UNIQUE(empresa_id, titulo)
);

-- Tabela de Metas por Persona (Executivos/Especialistas)
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
    dependencias TEXT[], -- Array de dependências de outras metas
    recursos_necessarios TEXT[], -- Array de recursos necessários
    milestones JSONB DEFAULT '[]'::jsonb, -- Array de marcos importantes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT metas_personas_global_persona_unique UNIQUE(meta_global_id, persona_id, titulo)
);

-- =====================================================
-- 3. SISTEMA DE AUDITORIA
-- =====================================================

-- Tabela de Auditorias de Compatibilidade
CREATE TABLE IF NOT EXISTS public.auditorias_compatibilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    workflow_reference VARCHAR(255) NOT NULL, -- Referência ao workflow (N8N ID ou nome)
    meta_global_id UUID REFERENCES public.metas_globais(id) ON DELETE SET NULL,
    meta_persona_id UUID REFERENCES public.metas_personas(id) ON DELETE SET NULL,
    compatibilidade_score INTEGER NOT NULL CHECK (compatibilidade_score >= 0 AND compatibilidade_score <= 100),
    compatibilidade_nivel VARCHAR(20) NOT NULL DEFAULT 'medio' CHECK (compatibilidade_nivel IN ('baixo', 'medio', 'alto', 'excelente')),
    analise_detalhada JSONB DEFAULT '{}'::jsonb, -- Detalhes da análise automatizada
    observacoes TEXT,
    acoes_sugeridas TEXT[], -- Array de ações sugeridas para melhorar compatibilidade
    status_auditoria VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status_auditoria IN ('pendente', 'em_analise', 'aprovado', 'reprovado', 'requer_ajuste')),
    auditado_por VARCHAR(255), -- Nome/ID de quem fez a auditoria
    auditado_em TIMESTAMP WITH TIME ZONE,
    proxima_auditoria DATE, -- Data da próxima auditoria programada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SISTEMA DE AVATARES
-- =====================================================

-- Tabela de Avatares das Personas
CREATE TABLE IF NOT EXISTS public.avatares_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    avatar_url VARCHAR(500) NOT NULL, -- URL do avatar gerado
    avatar_thumbnail_url VARCHAR(500), -- URL da miniatura
    prompt_usado TEXT NOT NULL, -- Prompt usado para gerar o avatar
    estilo VARCHAR(50) NOT NULL DEFAULT 'corporate' CHECK (estilo IN ('corporate', 'casual', 'creative', 'formal')),
    background_tipo VARCHAR(50) NOT NULL DEFAULT 'office' CHECK (background_tipo IN ('office', 'home_office', 'neutral', 'custom')),
    servico_usado VARCHAR(50) NOT NULL DEFAULT 'nano_banana' CHECK (servico_usado IN ('nano_banana', 'dall_e', 'midjourney', 'custom')),
    versao INTEGER NOT NULL DEFAULT 1, -- Versão do avatar (para histórico)
    ativo BOOLEAN NOT NULL DEFAULT true, -- Se é o avatar ativo atual
    metadados JSONB DEFAULT '{}'::jsonb, -- Metadados técnicos da geração
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT avatares_personas_ativo_unique UNIQUE(persona_id) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 5. EXPANSÃO DO SISTEMA DE PERSONAS
-- =====================================================

-- Tabela de Biografias Detalhadas (separada para melhor organização)
CREATE TABLE IF NOT EXISTS public.personas_biografias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
    biografia_completa TEXT NOT NULL,
    historia_profissional TEXT,
    motivacoes JSONB DEFAULT '{}'::jsonb, -- Motivações e drivers pessoais
    desafios JSONB DEFAULT '{}'::jsonb, -- Principais desafios enfrentados
    objetivos_pessoais TEXT[],
    soft_skills JSONB DEFAULT '{}'::jsonb, -- Habilidades interpessoais
    hard_skills JSONB DEFAULT '{}'::jsonb, -- Habilidades técnicas
    educacao JSONB DEFAULT '{}'::jsonb, -- Formação educacional
    certificacoes TEXT[],
    idiomas_fluencia JSONB DEFAULT '{}'::jsonb, -- Fluência em idiomas
    experiencia_internacional JSONB DEFAULT '{}'::jsonb,
    redes_sociais JSONB DEFAULT '{}'::jsonb, -- Perfis em redes sociais
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT personas_biografias_persona_unique UNIQUE(persona_id)
);

-- Tabela de Tech Specs das Personas (separada do sistema principal)
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
    tools_habilitadas JSONB DEFAULT '[]'::jsonb, -- Array de ferramentas habilitadas
    integrações_sistemas JSONB DEFAULT '[]'::jsonb, -- Sistemas integrados
    limitações JSONB DEFAULT '{}'::jsonb, -- Limitações técnicas específicas
    configuração_avançada JSONB DEFAULT '{}'::jsonb, -- Configurações específicas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT personas_tech_specs_persona_unique UNIQUE(persona_id)
);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices empresas
CREATE INDEX IF NOT EXISTS idx_empresas_industria ON public.empresas(industria);
CREATE INDEX IF NOT EXISTS idx_empresas_dominio ON public.empresas(dominio) WHERE dominio IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_empresas_status ON public.empresas(status);

-- Índices metas
CREATE INDEX IF NOT EXISTS idx_metas_globais_empresa_status ON public.metas_globais(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_metas_globais_prazo ON public.metas_globais(prazo);
CREATE INDEX IF NOT EXISTS idx_metas_globais_prioridade ON public.metas_globais(prioridade);
CREATE INDEX IF NOT EXISTS idx_metas_personas_global_id ON public.metas_personas(meta_global_id);
CREATE INDEX IF NOT EXISTS idx_metas_personas_persona_id ON public.metas_personas(persona_id);
CREATE INDEX IF NOT EXISTS idx_metas_personas_alinhamento ON public.metas_personas(alinhamento_score DESC);

-- Índices auditoria
CREATE INDEX IF NOT EXISTS idx_auditorias_empresa_persona ON public.auditorias_compatibilidade(empresa_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_compatibilidade_score ON public.auditorias_compatibilidade(compatibilidade_score DESC);
CREATE INDEX IF NOT EXISTS idx_auditorias_status ON public.auditorias_compatibilidade(status_auditoria);
CREATE INDEX IF NOT EXISTS idx_auditorias_proxima ON public.auditorias_compatibilidade(proxima_auditoria) WHERE proxima_auditoria IS NOT NULL;

-- Índices avatares
CREATE INDEX IF NOT EXISTS idx_avatares_persona_ativo ON public.avatares_personas(persona_id, ativo);
CREATE INDEX IF NOT EXISTS idx_avatares_versao ON public.avatares_personas(persona_id, versao DESC);

-- Índices personas expandidas
CREATE INDEX IF NOT EXISTS idx_personas_biografias_persona ON public.personas_biografias(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_tech_specs_persona ON public.personas_tech_specs(persona_id);

-- =====================================================
-- 7. TRIGGERS PARA ATUALIZAÇÕES AUTOMÁTICAS
-- =====================================================

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_metas_globais_updated_at BEFORE UPDATE ON public.metas_globais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metas_personas_updated_at BEFORE UPDATE ON public.metas_personas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auditorias_updated_at BEFORE UPDATE ON public.auditorias_compatibilidade FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_biografias_updated_at BEFORE UPDATE ON public.personas_biografias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personas_tech_specs_updated_at BEFORE UPDATE ON public.personas_tech_specs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

-- Empresas
COMMENT ON COLUMN public.empresas.dominio IS 'URL do site/domínio da empresa (opcional)';
COMMENT ON COLUMN public.empresas.industria IS 'Setor de atuação da empresa (tecnologia, saude, servicos, etc.)';
COMMENT ON COLUMN public.empresas.descricao IS 'Descrição obrigatória do negócio e atividades da empresa';

-- Metas
COMMENT ON TABLE public.metas_globais IS 'Metas estratégicas globais da empresa';
COMMENT ON TABLE public.metas_personas IS 'Metas específicas alinhadas às globais para cada persona';
COMMENT ON COLUMN public.metas_personas.alinhamento_score IS 'Score 0-100 de alinhamento com a meta global';

-- Auditoria
COMMENT ON TABLE public.auditorias_compatibilidade IS 'Auditorias de compatibilidade entre workflows e metas';
COMMENT ON COLUMN public.auditorias_compatibilidade.compatibilidade_score IS 'Score 0-100 de compatibilidade workflow-meta';

-- Avatares
COMMENT ON TABLE public.avatares_personas IS 'Avatares realistas gerados para cada persona';
COMMENT ON COLUMN public.avatares_personas.ativo IS 'Indica se é o avatar ativo atual (apenas um por persona)';

-- Biografias e Tech Specs
COMMENT ON TABLE public.personas_biografias IS 'Biografias detalhadas e expandidas das personas';
COMMENT ON TABLE public.personas_tech_specs IS 'Especificações técnicas de IA para cada persona';

-- =====================================================
-- 9. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.metas_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias_compatibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatares_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas_biografias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas_tech_specs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir tudo por enquanto - ajustar conforme necessário)
CREATE POLICY "Allow all operations for authenticated users" ON public.metas_globais FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.metas_personas FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.auditorias_compatibilidade FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.avatares_personas FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.personas_biografias FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON public.personas_tech_specs FOR ALL USING (true);

-- =====================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura da tabela empresas atualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'empresas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar todas as novas tabelas criadas
SELECT table_name, table_type 
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

-- Verificar índices criados
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'empresas',
    'metas_globais', 
    'metas_personas', 
    'auditorias_compatibilidade', 
    'avatares_personas',
    'personas_biografias',
    'personas_tech_specs'
  )
ORDER BY tablename, indexname;