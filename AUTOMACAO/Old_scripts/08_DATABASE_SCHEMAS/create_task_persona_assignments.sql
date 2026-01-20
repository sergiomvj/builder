-- Migration: create_task_persona_assignments.sql
-- Purpose: Permite atribuir uma tarefa a múltiplas personas (relação many-to-many)
-- Run this in Supabase SQL editor or via psql with service_role connection

BEGIN;

-- 1. Criar tabela de atribuições (junction table)
CREATE TABLE IF NOT EXISTS public.task_persona_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.personas_tasks(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid, -- opcional: quem atribuiu
  status character varying DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, persona_id) -- uma persona não pode ser atribuída 2x na mesma tarefa
);

-- 2. Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_persona_assignments_task_id ON public.task_persona_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_persona_assignments_persona_id ON public.task_persona_assignments(persona_id);
CREATE INDEX IF NOT EXISTS idx_task_persona_assignments_status ON public.task_persona_assignments(status);

-- 3. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_task_persona_assignments ON public.task_persona_assignments;
CREATE TRIGGER set_timestamp_task_persona_assignments
BEFORE UPDATE ON public.task_persona_assignments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. Migrar dados existentes (se existirem tarefas com persona_id)
-- Move existing persona_id relationships to the assignment table
INSERT INTO public.task_persona_assignments (task_id, persona_id, status, assigned_at)
SELECT 
  id as task_id, 
  persona_id, 
  status,
  created_at as assigned_at
FROM public.personas_tasks
WHERE persona_id IS NOT NULL
ON CONFLICT (task_id, persona_id) DO NOTHING;

-- 5. Opcional: Remover coluna persona_id da tabela personas_tasks (descomentar se quiser)
-- ALTER TABLE public.personas_tasks DROP COLUMN IF EXISTS persona_id;
-- Nota: Mantendo persona_id por enquanto para compatibilidade. Pode ser removido depois.

COMMIT;

-- Notas de uso:
-- 1) Para criar uma tarefa atribuída a múltiplas personas:
--    INSERT INTO personas_tasks (...) RETURNING id;
--    INSERT INTO task_persona_assignments (task_id, persona_id) VALUES (task_id, persona1), (task_id, persona2);
--
-- 2) Para buscar tarefas de uma persona:
--    SELECT pt.* FROM personas_tasks pt
--    INNER JOIN task_persona_assignments tpa ON pt.id = tpa.task_id
--    WHERE tpa.persona_id = 'uuid-da-persona';
--
-- 3) Para buscar todas as personas de uma tarefa:
--    SELECT p.* FROM personas p
--    INNER JOIN task_persona_assignments tpa ON p.id = tpa.persona_id
--    WHERE tpa.task_id = 'uuid-da-tarefa';
