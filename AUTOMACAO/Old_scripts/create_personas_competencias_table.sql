-- ==========================================
-- TABELAS NORMALIZADAS PARA DADOS DE PERSONAS
-- ==========================================
-- Este arquivo cria as 3 tabelas que substituem ia_config:
-- 1. personas_biografias: dados biográficos estruturados
-- 2. personas_atribuicoes: atribuições específicas do cargo
-- 3. personas_competencias: competências, tarefas, KPIs
-- ==========================================

-- ==========================================
-- Tabela: personas_biografias
-- Descrição: Armazena biografia estruturada gerada pelo script
--            01_generate_biografias_REAL.js
-- ==========================================

CREATE TABLE IF NOT EXISTS personas_biografias (
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

-- Índice
CREATE INDEX IF NOT EXISTS idx_personas_biografias_persona_id ON personas_biografias(persona_id);

-- Comentários
COMMENT ON TABLE personas_biografias IS 'Biografias estruturadas das personas geradas por IA';
COMMENT ON COLUMN personas_biografias.biografia_completa IS 'Biografia completa em texto corrido';
COMMENT ON COLUMN personas_biografias.biografia_resumida IS 'Resumo executivo da biografia (2-3 parágrafos)';

-- ==========================================
-- Tabela: personas_atribuicoes
-- Descrição: Armazena atribuições específicas do cargo geradas pelo script
--            01.5_generate_atribuicoes_contextualizadas.cjs
-- ==========================================

CREATE TABLE IF NOT EXISTS personas_atribuicoes (
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

-- Índices
CREATE INDEX IF NOT EXISTS idx_personas_atribuicoes_persona_id ON personas_atribuicoes(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_atribuicoes_ordem ON personas_atribuicoes(persona_id, ordem);

-- Comentários
COMMENT ON TABLE personas_atribuicoes IS 'Atribuições específicas do cargo de cada persona';
COMMENT ON COLUMN personas_atribuicoes.atribuicao IS 'Descrição da atribuição/responsabilidade';
COMMENT ON COLUMN personas_atribuicoes.ordem IS 'Ordem de prioridade da atribuição (1 = mais importante)';

-- ==========================================
-- Tabela: personas_competencias
-- Descrição: Armazena competências técnicas, comportamentais, ferramentas,
--            tarefas (diárias/semanais/mensais), KPIs e objetivos de desenvolvimento
--            gerados pelo script 02_generate_competencias_grok.cjs
-- ==========================================

CREATE TABLE IF NOT EXISTS personas_competencias (
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

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_personas_competencias_persona_id ON personas_competencias(persona_id);

-- Comentários para documentação
COMMENT ON TABLE personas_competencias IS 'Competências, tarefas, KPIs e objetivos de desenvolvimento das personas gerados por IA';
COMMENT ON COLUMN personas_competencias.competencias_tecnicas IS 'Array de strings com competências técnicas (hard skills)';
COMMENT ON COLUMN personas_competencias.competencias_comportamentais IS 'Array de strings com competências comportamentais (soft skills)';
COMMENT ON COLUMN personas_competencias.ferramentas IS 'Array de strings com ferramentas e tecnologias dominadas';
COMMENT ON COLUMN personas_competencias.tarefas_diarias IS 'Array de strings com tarefas executadas diariamente';
COMMENT ON COLUMN personas_competencias.tarefas_semanais IS 'Array de strings com tarefas executadas semanalmente';
COMMENT ON COLUMN personas_competencias.tarefas_mensais IS 'Array de strings com tarefas executadas mensalmente';
COMMENT ON COLUMN personas_competencias.kpis IS 'Array de objetos com KPIs: [{nome, meta, frequencia_medicao}]';
COMMENT ON COLUMN personas_competencias.objetivos_desenvolvimento IS 'Array de strings com objetivos de crescimento profissional';

-- ==========================================
-- Exemplo de estrutura de dados esperada:
-- ==========================================
--
-- competencias_tecnicas: ["JavaScript avançado", "Node.js", "PostgreSQL", "Docker"]
-- competencias_comportamentais: ["Comunicação assertiva", "Trabalho em equipe", "Resolução de problemas"]
-- ferramentas: ["VS Code", "Git", "Jira", "Figma"]
-- tarefas_diarias: ["Code review de pull requests", "Atualização de documentação técnica"]
-- tarefas_semanais: ["Reunião de planejamento de sprint", "Mentoria de desenvolvedores júnior"]
-- tarefas_mensais: ["Revisão de arquitetura", "Apresentação de resultados"]
-- kpis: [{"nome": "Bugs em produção", "meta": "< 2 por mês", "frequencia_medicao": "mensal"}]
-- objetivos_desenvolvimento: ["Certificação AWS Solutions Architect", "Aprender Kubernetes"]
--
-- ==========================================
