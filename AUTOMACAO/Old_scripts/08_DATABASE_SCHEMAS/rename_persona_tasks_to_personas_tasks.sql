-- Safe migration: rename persona_tasks -> personas_tasks
-- Usage: run this on a backup or via Supabase SQL Editor / psql using a service_role connection.
-- This script checks existence and renames table, primary key, indexes and constraints that include the old name.

BEGIN;

DO $$
DECLARE
  idx record;
  cn record;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'persona_tasks'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personas_tasks'
  ) THEN
    RAISE NOTICE 'Renaming table public.persona_tasks => public.personas_tasks';
    EXECUTE 'ALTER TABLE public.persona_tasks RENAME TO personas_tasks';

    -- Rename primary key index if it keeps old name
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind IN ('i','I') AND relname = 'persona_tasks_pkey') THEN
      EXECUTE 'ALTER INDEX public.persona_tasks_pkey RENAME TO personas_tasks_pkey';
    END IF;

    -- Rename indexes named with persona_tasks prefix
    FOR idx IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_persona_tasks_%' LOOP
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', idx.indexname, replace(idx.indexname, 'persona_tasks', 'personas_tasks'));
    END LOOP;

    -- Rename other constraints that include persona_tasks in their name (on the renamed table)
    FOR cn IN SELECT conname FROM pg_constraint WHERE conname LIKE '%persona_tasks%' LOOP
      EXECUTE format('ALTER TABLE public.personas_tasks RENAME CONSTRAINT %I TO %I', cn.conname, replace(cn.conname, 'persona_tasks', 'personas_tasks'));
    END LOOP;

    RAISE NOTICE 'Rename completed.';
  ELSE
    RAISE NOTICE 'Skipping: either public.persona_tasks does not exist or public.personas_tasks already exists.';
  END IF;
END$$;

COMMIT;

-- Notes:
-- 1) Back up your database before running this migration.
-- 2) Renaming the table will preserve data and most dependent objects (views, triggers, FK constraints reference by OID).
-- 3) This script attempts to rename indexes and constraints whose names contain 'persona_tasks' for consistency.
-- 4) After running, search your repository for literal occurrences of 'persona_tasks' in non-legacy scripts and update them if they are intended to run against the new table name.
