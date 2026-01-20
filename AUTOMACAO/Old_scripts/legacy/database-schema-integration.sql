-- =====================================================
-- VCM Dashboard - Schema Integration Script
-- =====================================================
-- Este script adiciona apenas as tabelas necessárias para o CRUD
-- sem conflitar com o schema existente

-- =====================================================
-- VERIFICAR TABELAS EXISTENTES
-- =====================================================
SELECT 'Tabelas existentes detectadas:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('empresas', 'personas', 'competencias')
ORDER BY table_name;

-- =====================================================
-- ADICIONAR SYSTEM_CONFIGURATIONS (única tabela nova necessária)
-- =====================================================
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('api', 'system', 'ui', 'sync')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADICIONAR COLUNAS NECESSÁRIAS À TABELA EMPRESAS EXISTENTE
-- =====================================================
-- Verificar e adicionar colunas que podem estar faltando para o CRUD

-- Adicionar coluna de gênero do CEO se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'ceo_gender'
    ) THEN
        ALTER TABLE empresas ADD COLUMN ceo_gender VARCHAR(20) DEFAULT 'feminino';
    END IF;
END $$;

-- Adicionar colunas de distribuição de equipe se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'executives_male'
    ) THEN
        ALTER TABLE empresas ADD COLUMN executives_male INTEGER DEFAULT 0;
        ALTER TABLE empresas ADD COLUMN executives_female INTEGER DEFAULT 0;
        ALTER TABLE empresas ADD COLUMN assistants_male INTEGER DEFAULT 0;
        ALTER TABLE empresas ADD COLUMN assistants_female INTEGER DEFAULT 0;
        ALTER TABLE empresas ADD COLUMN specialists_male INTEGER DEFAULT 0;
        ALTER TABLE empresas ADD COLUMN specialists_female INTEGER DEFAULT 0;
    END IF;
END $$;

-- Adicionar coluna de indústria se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'industry'
    ) THEN
        ALTER TABLE empresas ADD COLUMN industry VARCHAR(100) DEFAULT 'tecnologia';
    END IF;
END $$;

-- Adicionar coluna de nacionalidades se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'nationalities'
    ) THEN
        ALTER TABLE empresas ADD COLUMN nationalities JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_is_active ON system_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(key);

-- Índices adicionais para empresas se não existirem
CREATE INDEX IF NOT EXISTS idx_empresas_status ON empresas(status);
CREATE INDEX IF NOT EXISTS idx_empresas_pais ON empresas(pais);

-- =====================================================
-- HABILITAR RLS NA NOVA TABELA
-- =====================================================
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Criar política permissiva para system_configurations
DROP POLICY IF EXISTS "Allow all operations" ON system_configurations;
CREATE POLICY "Allow all operations" ON system_configurations FOR ALL USING (true);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para system_configurations
DROP TRIGGER IF EXISTS update_system_configurations_updated_at ON system_configurations;
CREATE TRIGGER update_system_configurations_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DADOS DE EXEMPLO PARA SYSTEM_CONFIGURATIONS
-- =====================================================
INSERT INTO system_configurations (key, value, category, description, is_active) VALUES
    ('DEBUG_MODE', 'true', 'system', 'Enable debug mode for development', true),
    ('LOG_LEVEL', 'INFO', 'system', 'Default logging level', true),
    ('MAX_CONCURRENT_JOBS', '3', 'system', 'Maximum number of concurrent processing jobs', true),
    ('OPENAI_API_TIMEOUT', '30', 'api', 'Timeout for OpenAI API calls in seconds', true),
    ('SYNC_INTERVAL_MINUTES', '30', 'sync', 'Interval between synchronization runs', true),
    ('UI_THEME', 'light', 'ui', 'Default UI theme', true),
    ('ITEMS_PER_PAGE', '20', 'ui', 'Default number of items per page', true),
    ('ANTHROPIC_API_KEY', 'your-key-here', 'api', 'Anthropic API key for Claude', false),
    ('GOOGLE_AI_API_KEY', 'your-key-here', 'api', 'Google AI API key', false),
    ('RAG_CHUNK_SIZE', '1000', 'system', 'Default chunk size for RAG processing', true),
    ('RAG_OVERLAP', '200', 'system', 'Default overlap for RAG chunks', true),
    ('AUTO_SYNC_ENABLED', 'true', 'sync', 'Enable automatic synchronization', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ATUALIZAR DADOS EXISTENTES SE NECESSÁRIO
-- =====================================================
-- Atualizar empresas existentes com valores padrão para novas colunas
UPDATE empresas SET 
    ceo_gender = COALESCE(ceo_gender, 'feminino'),
    industry = COALESCE(industry, 'tecnologia'),
    executives_male = COALESCE(executives_male, 2),
    executives_female = COALESCE(executives_female, 2),
    assistants_male = COALESCE(assistants_male, 2),
    assistants_female = COALESCE(assistants_female, 3),
    specialists_male = COALESCE(specialists_male, 3),
    specialists_female = COALESCE(specialists_female, 3),
    nationalities = COALESCE(nationalities, '[{"tipo": "latinos", "percentual": 100}]'::jsonb)
WHERE industry IS NULL OR ceo_gender IS NULL;

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================
SELECT 'Schema integration completed successfully!' as status;

-- Verificar estrutura das tabelas principais
SELECT 'Tabela empresas - colunas:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'empresas' 
ORDER BY ordinal_position;

SELECT 'Tabela system_configurations criada:' as info;
SELECT COUNT(*) as total_configs FROM system_configurations;

SELECT 'Tabela personas existente:' as info;
SELECT COUNT(*) as total_personas FROM personas;