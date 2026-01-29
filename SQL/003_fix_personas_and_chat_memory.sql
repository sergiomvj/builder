-- Migration: Fix Personas Schema and Add Chat Memory

-- 1. Ensure Personas table has all required columns for the Agent
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS descricao_funcao TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS nivel_senioridade TEXT;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS responsibilities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS tracos_personalidade JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.personas ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create Chat Logs table for persistent memory
CREATE TABLE IF NOT EXISTS public.chat_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    mode TEXT NOT NULL, -- 'team' | 'workflows'
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT,
    proposal JSONB, -- Stores the proposed action payload
    confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add index for faster chat retrieval
CREATE INDEX IF NOT EXISTS idx_chat_logs_project_mode ON public.chat_logs(project_id, mode, created_at);

-- 4. RLS for Chat Logs
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read chat_logs" ON public.chat_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert chat_logs" ON public.chat_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update chat_logs" ON public.chat_logs FOR UPDATE USING (true);
