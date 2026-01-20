-- Criação da tabela personas_avatares seguindo nomenclatura padrão
-- Baseada nas tabelas personas_competencias e personas_atribuicoes existentes

CREATE TABLE public.personas_avatares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    persona_id UUID NOT NULL,
    avatar_url TEXT,
    avatar_thumbnail_url TEXT,
    prompt_usado TEXT,
    estilo VARCHAR(100),
    background_tipo VARCHAR(50),
    servico_usado VARCHAR(50) DEFAULT 'gemini_ai',
    versao VARCHAR(20) DEFAULT 'v1.0',
    ativo BOOLEAN DEFAULT true,
    biometrics JSONB,
    history JSONB,
    metadados JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key para personas
    CONSTRAINT fk_personas_avatares_persona_id 
        FOREIGN KEY (persona_id) 
        REFERENCES public.personas(id) 
        ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_personas_avatares_persona_id ON public.personas_avatares(persona_id);
CREATE INDEX idx_personas_avatares_ativo ON public.personas_avatares(ativo);
CREATE INDEX idx_personas_avatares_created_at ON public.personas_avatares(created_at);

-- RLS (Row Level Security) - seguindo padrão das outras tabelas
ALTER TABLE public.personas_avatares ENABLE ROW LEVEL SECURITY;

-- Política para permitir operações (similar às outras tabelas personas)
CREATE POLICY "Enable all operations for personas_avatares" ON public.personas_avatares
    FOR ALL USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.personas_avatares IS 'Tabela para armazenar avatares gerados via LLM para personas';
COMMENT ON COLUMN public.personas_avatares.persona_id IS 'ID da persona (FK para personas.id)';
COMMENT ON COLUMN public.personas_avatares.avatar_url IS 'URL principal do avatar gerado';
COMMENT ON COLUMN public.personas_avatares.avatar_thumbnail_url IS 'URL do thumbnail do avatar';
COMMENT ON COLUMN public.personas_avatares.prompt_usado IS 'Prompt utilizado para gerar o avatar';
COMMENT ON COLUMN public.personas_avatares.estilo IS 'Estilo do avatar (ex: Profissional, Casual, Criativo)';
COMMENT ON COLUMN public.personas_avatares.background_tipo IS 'Tipo de background (ex: escritório, neutro, criativo)';
COMMENT ON COLUMN public.personas_avatares.biometrics IS 'Dados biométricos do avatar (JSON)';
COMMENT ON COLUMN public.personas_avatares.history IS 'Histórico profissional usado no avatar (JSON)';
COMMENT ON COLUMN public.personas_avatares.metadados IS 'Metadados adicionais da geração (JSON)';