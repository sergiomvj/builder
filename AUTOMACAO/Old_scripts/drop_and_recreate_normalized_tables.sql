-- ==========================================
-- DROP E RECREATE DAS TABELAS NORMALIZADAS
-- ==========================================
-- ATENÇÃO: Este script DELETA e RECRIA as tabelas
-- Use apenas se as tabelas existentes estiverem com estrutura incorreta
-- ==========================================

-- 1. Drop tabelas existentes (ordem inversa por causa das foreign keys)
DROP TABLE IF EXISTS personas_competencias CASCADE;
DROP TABLE IF EXISTS personas_atribuicoes CASCADE;
DROP TABLE IF EXISTS personas_biografias CASCADE;

-- 2. Recriar tabelas com estrutura correta

-- ==========================================
-- Tabela: personas_biografias
-- ==========================================

CREATE TABLE personas_biografias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Biografia completa e resumida
  biografia_completa TEXT,
  biografia_resumida TEXT,
  
  -- Dados estruturados
  formacao_academica JSONB DEFAULT '[]'::jsonb,
  experiencia_profissional JSONB DEFAULT '[]'::jsonb,
  habilidades_tecnicas JSONB DEFAULT '[]'::jsonb,
  certificacoes JSONB DEFAULT '[]'::jsonb,
  idiomas JSONB DEFAULT '[]'::jsonb,
  interesses_profissionais JSONB DEFAULT '[]'::jsonb,
  motivacoes TEXT,
  valores_profissionais JSONB DEFAULT '[]'::jsonb,
  estilo_trabalho TEXT,
  objetivos_carreira TEXT,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_biografia_persona UNIQUE (persona_id)
);

CREATE INDEX idx_personas_biografias_persona_id ON personas_biografias(persona_id);

COMMENT ON TABLE personas_biografias IS 'Biografias estruturadas das personas geradas por IA';

-- ==========================================
-- Tabela: personas_atribuicoes
-- ==========================================

CREATE TABLE personas_atribuicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Atribuição
  atribuicao TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 1,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_atribuicao_persona_ordem UNIQUE (persona_id, ordem)
);

CREATE INDEX idx_personas_atribuicoes_persona_id ON personas_atribuicoes(persona_id);
CREATE INDEX idx_personas_atribuicoes_ordem ON personas_atribuicoes(persona_id, ordem);

COMMENT ON TABLE personas_atribuicoes IS 'Atribuições específicas do cargo de cada persona';

-- ==========================================
-- Tabela: personas_competencias
-- ==========================================

CREATE TABLE personas_competencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Competências Técnicas (hard skills)
  competencias_tecnicas JSONB DEFAULT '[]'::jsonb,
  
  -- Competências Comportamentais (soft skills)
  competencias_comportamentais JSONB DEFAULT '[]'::jsonb,
  
  -- Ferramentas e Tecnologias
  ferramentas JSONB DEFAULT '[]'::jsonb,
  
  -- Tarefas Diárias
  tarefas_diarias JSONB DEFAULT '[]'::jsonb,
  
  -- Tarefas Semanais
  tarefas_semanais JSONB DEFAULT '[]'::jsonb,
  
  -- Tarefas Mensais
  tarefas_mensais JSONB DEFAULT '[]'::jsonb,
  
  -- KPIs (Key Performance Indicators)
  kpis JSONB DEFAULT '[]'::jsonb,
  
  -- Objetivos de Desenvolvimento
  objetivos_desenvolvimento JSONB DEFAULT '[]'::jsonb,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_competencias_persona UNIQUE (persona_id)
);

CREATE INDEX idx_personas_competencias_persona_id ON personas_competencias(persona_id);

COMMENT ON TABLE personas_competencias IS 'Competências, tarefas, KPIs e objetivos de desenvolvimento das personas gerados por IA';

-- ==========================================
-- FIM - Tabelas recriadas com estrutura correta
-- ==========================================
