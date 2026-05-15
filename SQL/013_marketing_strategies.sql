-- ==============================================================================
-- MARKETING STRATEGY - Tabela para armazenar estratégias geradas
-- ==============================================================================

DROP TABLE IF EXISTS public.marketing_strategies CASCADE;
CREATE TABLE public.marketing_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Dados do wizard (respostas do usuário)
    wizard_answers JSONB DEFAULT '{}'::jsonb,
    
    -- Estratégia gerada pela LLM (JSON completo das 4 camadas)
    strategy_data JSONB DEFAULT '{}'::jsonb,
    
    -- Metadados
    versao VARCHAR(10) DEFAULT '1.0',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'reviewed', 'approved')),
    generated_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Uma estratégia por projeto
    CONSTRAINT unique_project_strategy UNIQUE (project_id)
);

-- Index para busca rápida por projeto
CREATE INDEX idx_marketing_strategies_project ON public.marketing_strategies(project_id);
CREATE INDEX idx_marketing_strategies_status ON public.marketing_strategies(status);

-- RLS
ALTER TABLE public.marketing_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on marketing_strategies" ON public.marketing_strategies
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_marketing_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_marketing_strategies_updated_at
    BEFORE UPDATE ON public.marketing_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_marketing_strategies_updated_at();
