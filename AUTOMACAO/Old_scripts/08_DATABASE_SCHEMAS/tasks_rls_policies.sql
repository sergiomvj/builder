-- RLS example policies for `public.tasks`
-- WARNING: revise e adapte estas políticas ao seu modelo de autorização.
-- Assumimos a existência de uma tabela auxiliar `empresa_users(user_id uuid, empresa_id uuid)` que mapeia usuários a empresas.
-- Se você usa outro mecanismo (roles, claims JWT, etc.), adapte as condições conforme necessário.

-- Habilita Row Level Security
ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;

-- (Opcional) cria tabela de mapeamento empresa_users se não existir - somente exemplo
CREATE TABLE IF NOT EXISTS public.empresa_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  empresa_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Policy: SELECT - permitir ler tasks quando o usuário pertence à mesma empresa
CREATE POLICY IF NOT EXISTS select_tasks_if_member ON public.tasks
  FOR SELECT USING (
    -- permitir se chamada por service role (superuser) OU se existir mapeamento para a empresa
    (auth.role() = 'service_role') OR
    (EXISTS (
      SELECT 1 FROM public.empresa_users eu
      WHERE eu.user_id = auth.uid()
        AND eu.empresa_id = public.tasks.empresa_id
    ))
  );

-- Policy: INSERT - permitir inserir apenas se o usuário for membro da empresa informada
CREATE POLICY IF NOT EXISTS insert_tasks_if_member ON public.tasks
  FOR INSERT WITH CHECK (
    (auth.role() = 'service_role') OR
    (EXISTS (
      SELECT 1 FROM public.empresa_users eu
      WHERE eu.user_id = auth.uid()
        AND eu.empresa_id = NEW.empresa_id
    ))
  );

-- Policy: UPDATE - permitir atualizar apenas se o usuário pertencer à empresa do registro
CREATE POLICY IF NOT EXISTS update_tasks_if_member ON public.tasks
  FOR UPDATE USING (
    (auth.role() = 'service_role') OR
    (EXISTS (
      SELECT 1 FROM public.empresa_users eu
      WHERE eu.user_id = auth.uid()
        AND eu.empresa_id = public.tasks.empresa_id
    ))
  ) WITH CHECK (
    (auth.role() = 'service_role') OR
    (EXISTS (
      SELECT 1 FROM public.empresa_users eu
      WHERE eu.user_id = auth.uid()
        AND eu.empresa_id = NEW.empresa_id
    ))
  );

-- Policy: DELETE - permitir delete apenas a membros da mesma empresa
CREATE POLICY IF NOT EXISTS delete_tasks_if_member ON public.tasks
  FOR DELETE USING (
    (auth.role() = 'service_role') OR
    (EXISTS (
      SELECT 1 FROM public.empresa_users eu
      WHERE eu.user_id = auth.uid()
        AND eu.empresa_id = public.tasks.empresa_id
    ))
  );

-- Nota final:
-- 1) Teste as políticas no Supabase SQL Editor com um usuário de teste.
-- 2) Se você não usar `empresa_users`, substitua a condição EXISTS por outra verificação
--    (por exemplo: claims no JWT, coluna owner_id, ou uma view que resolva a empresa do usuário).
-- 3) Para chamadas administrativas (migrations, syncs) use a service_role key e a role 'service_role'.
