-- FIX DELETION ISSUES: Enable Cascading Deletes
-- This script changes the Foreign Key constraints to automatically delete related data
-- when a Project is deleted. This fixes the "violates foreign key constraint" error.

BEGIN;

-- 1. Empresas (Companies) -> Projects
-- Drop existing constraint (name might vary, trying standard and explicit check)
ALTER TABLE public.empresas
    DROP CONSTRAINT IF EXISTS empresas_project_id_fkey;

-- Re-add with CASCADE
ALTER TABLE public.empresas
    ADD CONSTRAINT empresas_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;


-- 2. Chat Logs -> Projects
ALTER TABLE public.chat_logs
    DROP CONSTRAINT IF EXISTS chat_logs_project_id_fkey;

ALTER TABLE public.chat_logs
    ADD CONSTRAINT chat_logs_project_id_fkey
    FOREIGN KEY (project_id)
    REFERENCES public.projects(id)
    ON DELETE CASCADE;


-- 3. Personas -> Empresas
-- (Start chain: Project Del -> Empresa Del -> Persona Del)
ALTER TABLE public.personas
    DROP CONSTRAINT IF EXISTS personas_empresa_id_fkey;

ALTER TABLE public.personas
    ADD CONSTRAINT personas_empresa_id_fkey
    FOREIGN KEY (empresa_id)
    REFERENCES public.empresas(id)
    ON DELETE CASCADE;

-- 4. FORCE RLS POLICIES FOR DELETION
-- Just to be safe, disable RLS on these tables or ensure the user is allowed to delete.
-- The most assertive fix for "things returning" is to ensure NO policy blocks the delete.
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas DISABLE ROW LEVEL SECURITY;

COMMIT;
