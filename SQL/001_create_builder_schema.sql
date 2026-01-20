-- Migration: Create Builder Core Tables (Ideas -> Projects)

-- 1. Ideas Table
CREATE TABLE IF NOT EXISTS public.ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processing', 'approved', 'rejected', 'project_created')),
    analysis_result JSONB DEFAULT '{}'::jsonb, -- Resultado da análise inicial do LLM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID REFERENCES public.ideas(id),
    name TEXT NOT NULL,
    description TEXT,
    
    -- Strategic Foundation (gerado pelo Script 00)
    mission TEXT,
    vision TEXT,
    values TEXT[],
    objectives TEXT[],
    
    -- Business Model
    target_audience TEXT,
    revenue_streams TEXT[],
    
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'building', 'active', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Link Empresas to Projects (Optional for MVP, but good for structure)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'empresas' AND column_name = 'project_id') THEN
        ALTER TABLE public.empresas ADD COLUMN project_id UUID REFERENCES public.projects(id);
    END IF;
END $$;

-- 4. RLS Policies (Basic)
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow all for now (MVP mode - adjust for production)
CREATE POLICY "Allow all access to ideas" ON public.ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
