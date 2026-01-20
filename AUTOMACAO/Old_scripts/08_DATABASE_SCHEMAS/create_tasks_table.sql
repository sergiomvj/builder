-- Migration: create_tasks_table.sql
-- Purpose: cria a tabela `tasks` usada pelo CRUD do frontend (/api/tasks)
-- Run this in Supabase SQL editor or via psql with a service role connection.

-- Dependências: pgcrypto para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cria a tabela 'tasks' com colunas básicas e suporte a meta (jsonb)
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  empresa_id uuid REFERENCES empresas(id) ON DELETE SET NULL,
  meta jsonb,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger function to keep updated_at current
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tasks table
DROP TRIGGER IF EXISTS set_timestamp ON public.tasks;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Optional: create index for empresa_id and status for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_empresa_id ON public.tasks(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Optional grants: allow authenticated users to insert/select/update/delete via policies
-- If you're using RLS, configure policies instead of wide grants. Example shown for reference only:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;

-- Notes:
-- 1) Run this with a privileged connection (service_role) or via Supabase SQL Editor as project owner.
-- 2) If you prefer uuid_generate_v4(), enable the uuid-ossp extension instead of pgcrypto.
-- 3) After creating the table, consider adding Row-Level Security (RLS) policies so each empresa/user only accesses allowed tasks.
