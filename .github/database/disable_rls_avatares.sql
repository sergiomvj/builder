-- Execute este SQL no Supabase para permitir inserções de teste
-- Desabilita temporariamente RLS para testes

ALTER TABLE public.avatares_multimedia DISABLE ROW LEVEL SECURITY;

-- Ou, se preferir manter RLS ativo, adicione uma política permissiva:

DROP POLICY IF EXISTS avatares_multimedia_allow_all ON public.avatares_multimedia;
CREATE POLICY avatares_multimedia_allow_all ON public.avatares_multimedia
  FOR ALL
  USING (true)
  WITH CHECK (true);
