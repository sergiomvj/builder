-- Allow anon (unauthenticated) users to view logs
-- This is useful for development environments where the frontend might use anon key
-- or if session cookies are not perfectly synced for the viewer component.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'llm_logs' AND policyname = 'Anon can view logs'
    ) THEN
        create policy "Anon can view logs"
          on llm_logs for select
          to anon
          using (true);
    END IF;
END
$$;
