-- SQL SIMPLIFICADO para criar tabela personas_avatares
-- Execute este código no Supabase Dashboard > SQL Editor

CREATE TABLE public.personas_avatares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
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
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_personas_avatares_persona_id ON public.personas_avatares(persona_id);
CREATE INDEX idx_personas_avatares_ativo ON public.personas_avatares(ativo);

-- RLS
ALTER TABLE public.personas_avatares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for personas_avatares" ON public.personas_avatares FOR ALL USING (true);