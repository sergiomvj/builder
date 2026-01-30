-- Create table for storing LLM interaction logs
create table if not exists llm_logs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete set null,
  prompt_type varchar not null, -- 'genesis', 'team', 'workflow', etc.
  full_prompt_sent text,
  llm_response jsonb,
  expected_deliverables jsonb, -- Array of keys expected
  missing_deliverables jsonb, -- Array of keys missing
  status varchar check (status in ('success', 'partial_failure', 'error')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies (viewable by auth users)
alter table llm_logs enable row level security;

create policy "Users can view logs"
  on llm_logs for select
  using (auth.role() = 'authenticated');

-- Service role can insert/update
create policy "Service role can insert logs"
  on llm_logs for insert
  with check (true);
