-- Schema para sistema de metas globais e por persona
-- Para o VCM Central Database

-- Tabela de metas globais da empresa
CREATE TABLE IF NOT EXISTS metas_globais (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'atrasada')),
    prazo DATE,
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de metas específicas por persona
CREATE TABLE IF NOT EXISTS metas_personas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_progresso', 'concluida', 'atrasada')),
    prazo DATE,
    progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_metas_globais_empresa ON metas_globais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_metas_personas_persona ON metas_personas(persona_id);
CREATE INDEX IF NOT EXISTS idx_metas_globais_status ON metas_globais(status);
CREATE INDEX IF NOT EXISTS idx_metas_personas_status ON metas_personas(status);

-- RLS (Row Level Security)
ALTER TABLE metas_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_personas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Allow all operations on metas_globais" ON metas_globais
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on metas_personas" ON metas_personas
    FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_metas_globais_updated_at 
    BEFORE UPDATE ON metas_globais 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metas_personas_updated_at 
    BEFORE UPDATE ON metas_personas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de exemplo
INSERT INTO metas_globais (titulo, descricao, status, prazo, progresso, empresa_id) 
SELECT 
    'Crescimento de Receita 2024',
    'Aumentar receita anual em 25% através de novos produtos e expansão de mercado',
    'em_progresso',
    '2024-12-31',
    45,
    id
FROM empresas 
WHERE nome = 'LifewayUSA'
LIMIT 1;

INSERT INTO metas_globais (titulo, descricao, status, prazo, progresso, empresa_id)
SELECT 
    'Certificação ISO 27001',
    'Obter certificação de segurança da informação ISO 27001',
    'pendente', 
    '2025-06-30',
    15,
    id
FROM empresas 
WHERE nome = 'LifewayUSA'
LIMIT 1;

-- Metas para personas (usando CEOs como exemplo)
INSERT INTO metas_personas (persona_id, titulo, descricao, status, prazo, progresso)
SELECT 
    p.id,
    'Liderança Estratégica 2024',
    'Desenvolver e implementar plano estratégico quinquenal da empresa',
    'em_progresso',
    '2024-06-30',
    75
FROM personas p
JOIN empresas e ON p.empresa_id = e.id
WHERE e.nome = 'LifewayUSA' AND p.is_ceo = true
LIMIT 1;

INSERT INTO metas_personas (persona_id, titulo, descricao, status, prazo, progresso)
SELECT 
    p.id,
    'Transformação Digital',
    'Liderar iniciativa de transformação digital da organização',
    'pendente',
    '2025-03-31',
    20
FROM personas p  
JOIN empresas e ON p.empresa_id = e.id
WHERE e.nome = 'LifewayUSA' AND p.cargo ILIKE '%CTO%'
LIMIT 1;