-- Renomear tabela competencias para personas_competencias
-- Para manter nomenclatura consistente com personas_avatares, personas_atribuicoes, etc.

-- Verificar se a tabela antiga existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'competencias') THEN
    -- Renomear a tabela
    ALTER TABLE IF EXISTS competencias RENAME TO personas_competencias;
    
    RAISE NOTICE 'Tabela renomeada: competencias → personas_competencias';
  ELSE
    RAISE NOTICE 'Tabela competencias não existe, criando personas_competencias...';
  END IF;
END $$;

-- Criar tabela personas_competencias se não existir
CREATE TABLE IF NOT EXISTS personas_competencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  -- Competências técnicas e comportamentais
  competencias_tecnicas TEXT[] DEFAULT '{}',
  competencias_comportamentais TEXT[] DEFAULT '{}',
  ferramentas TEXT[] DEFAULT '{}',
  
  -- Tarefas por frequência
  tarefas_diarias TEXT[] DEFAULT '{}',
  tarefas_semanais TEXT[] DEFAULT '{}',
  tarefas_mensais TEXT[] DEFAULT '{}',
  
  -- KPIs e objetivos
  kpis TEXT[] DEFAULT '{}',
  objetivos_desenvolvimento TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(persona_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_personas_competencias_persona_id ON personas_competencias(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_competencias_empresa_id ON personas_competencias(empresa_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_personas_competencias_updated_at ON personas_competencias;
CREATE TRIGGER update_personas_competencias_updated_at
  BEFORE UPDATE ON personas_competencias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE personas_competencias IS 'Competências, tarefas e KPIs de cada persona';
COMMENT ON COLUMN personas_competencias.competencias_tecnicas IS 'Array de competências técnicas (hard skills)';
COMMENT ON COLUMN personas_competencias.competencias_comportamentais IS 'Array de competências comportamentais (soft skills)';
COMMENT ON COLUMN personas_competencias.ferramentas IS 'Array de ferramentas e tecnologias utilizadas';
COMMENT ON COLUMN personas_competencias.kpis IS 'Array de KPIs no formato "Nome - Meta"';
