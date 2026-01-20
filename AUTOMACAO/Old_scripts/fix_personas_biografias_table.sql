-- ==========================================
-- RECREATE APENAS personas_biografias com JSONB
-- ==========================================

DROP TABLE IF EXISTS personas_biografias CASCADE;

CREATE TABLE personas_biografias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Biografia estruturada completa em JSONB (aceita qualquer estrutura)
  biografia_estruturada JSONB,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_biografia_persona UNIQUE (persona_id)
);

CREATE INDEX idx_personas_biografias_persona_id ON personas_biografias(persona_id);

COMMENT ON TABLE personas_biografias IS 'Biografias estruturadas das personas geradas por IA';
COMMENT ON COLUMN personas_biografias.biografia_estruturada IS 'Dados completos da biografia em formato JSONB flexível';
