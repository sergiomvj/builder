-- Adicionar campo de atribuições na tabela competencias
-- Este campo conterá a descrição detalhada das funções de cada persona (máx 1000 caracteres)

ALTER TABLE public.competencias 
ADD COLUMN IF NOT EXISTS atribuicoes_detalhadas TEXT 
CHECK (char_length(atribuicoes_detalhadas) <= 1000);

-- Adicionar campo para escopo SDR híbrido
ALTER TABLE public.competencias 
ADD COLUMN IF NOT EXISTS escopo_sdr_hibrido BOOLEAN DEFAULT FALSE;

-- Comentários para documentação
COMMENT ON COLUMN public.competencias.atribuicoes_detalhadas IS 'Descrição detalhada das atribuições e responsabilidades da persona (máximo 1000 caracteres)';
COMMENT ON COLUMN public.competencias.escopo_sdr_hibrido IS 'Indica se a persona tem funções híbridas de SDR além de suas responsabilidades principais';

-- Atualizar updated_at quando atribuicoes_detalhadas for modificada
CREATE OR REPLACE FUNCTION update_competencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_update_competencias_updated_at ON public.competencias;
CREATE TRIGGER trigger_update_competencias_updated_at
  BEFORE UPDATE ON public.competencias
  FOR EACH ROW
  EXECUTE FUNCTION update_competencias_updated_at();