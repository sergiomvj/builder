-- ==============================================================================
-- BUILDER MVP - RELAX RLS FOR PUBLIC ACCESS (MVP MODE)
-- ==============================================================================
-- INSTRUÇÕES:
-- Execute este script no SQL Editor do Supabase para permitir que visitantes
-- (usuários anônimos) criem ideias e projetos a partir da landing page.
-- ==============================================================================

-- 1. Ideas Table Policies
DROP POLICY IF EXISTS "Allow authenticated create" ON public.ideas;
CREATE POLICY "Allow public insert" ON public.ideas FOR INSERT WITH CHECK (true);

-- 2. Projects Table Policies
CREATE POLICY "Allow public insert" ON public.projects FOR INSERT WITH CHECK (true);

-- Ensure public read is active (should already be there from init script, but reinforcing)
DROP POLICY IF EXISTS "Allow public read" ON public.ideas;
CREATE POLICY "Allow public read" ON public.ideas FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read" ON public.projects;
CREATE POLICY "Allow public read" ON public.projects FOR SELECT USING (true);
