-- ==============================================================================
-- STRATEGIC DOCUMENTS - Tabela para armazenar o grande json base
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.strategic_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- O grande documento contendo os insights de negócios, marketing, leads, etc.
    document_data JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Restrição: 1 documento estratégico mestre por projeto
    CONSTRAINT unique_project_strategic_doc UNIQUE (project_id)
);

-- Index para busca rápida por projeto
CREATE INDEX IF NOT EXISTS idx_strategic_documents_project ON public.strategic_documents(project_id);

-- RLS
ALTER TABLE public.strategic_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on strategic_documents" ON public.strategic_documents
    FOR ALL USING (true) WITH CHECK (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_strategic_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_strategic_documents_updated_at ON public.strategic_documents;
CREATE TRIGGER trigger_strategic_documents_updated_at
    BEFORE UPDATE ON public.strategic_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_strategic_documents_updated_at();
