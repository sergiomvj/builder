-- =====================================================
-- VCM Dashboard - Step-by-Step Database Schema
-- =====================================================
-- Execute this SQL step by step in your Supabase SQL Editor
-- Run each section separately if needed

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: CLEAN SLATE (OPTIONAL - ONLY IF NEEDED)
-- =====================================================
-- Uncomment and run these lines if you need to start fresh
-- DROP TABLE IF EXISTS personas CASCADE;
-- DROP TABLE IF EXISTS system_configurations CASCADE;
-- DROP TABLE IF EXISTS companies CASCADE;

-- =====================================================
-- STEP 2: CREATE COMPANIES TABLE
-- =====================================================
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    total_personas INTEGER NOT NULL DEFAULT 0,
    ceo_gender VARCHAR(20) NOT NULL CHECK (ceo_gender IN ('masculino', 'feminino')),
    executives_male INTEGER NOT NULL DEFAULT 0 CHECK (executives_male >= 0 AND executives_male <= 10),
    executives_female INTEGER NOT NULL DEFAULT 0 CHECK (executives_female >= 0 AND executives_female <= 10),
    assistants_male INTEGER NOT NULL DEFAULT 0 CHECK (assistants_male >= 0 AND assistants_male <= 10),
    assistants_female INTEGER NOT NULL DEFAULT 0 CHECK (assistants_female >= 0 AND assistants_female <= 10),
    specialists_male INTEGER NOT NULL DEFAULT 0 CHECK (specialists_male >= 0 AND specialists_male <= 10),
    specialists_female INTEGER NOT NULL DEFAULT 0 CHECK (specialists_female >= 0 AND specialists_female <= 10),
    languages JSONB DEFAULT '[]'::jsonb,
    nationalities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE SYSTEM_CONFIGURATIONS TABLE
-- =====================================================
CREATE TABLE system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('api', 'system', 'ui', 'sync')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE PERSONAS TABLE (WITHOUT FOREIGN KEY FIRST)
-- =====================================================
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('executivos', 'especialistas', 'assistentes')),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('masculino', 'feminino')),
    nationality VARCHAR(100),
    languages JSONB DEFAULT '[]'::jsonb,
    bio_generated BOOLEAN NOT NULL DEFAULT FALSE,
    competencies_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: VERIFY TABLES EXIST
-- =====================================================
SELECT 'Companies table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies');
SELECT 'System_configurations table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_configurations');
SELECT 'Personas table created' as status WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personas');

-- =====================================================
-- STEP 6: ADD FOREIGN KEY CONSTRAINT
-- =====================================================
ALTER TABLE personas 
ADD CONSTRAINT fk_personas_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 7: CREATE INDEXES
-- =====================================================
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_created_at ON companies(created_at);

CREATE INDEX idx_system_configurations_category ON system_configurations(category);
CREATE INDEX idx_system_configurations_is_active ON system_configurations(is_active);
CREATE INDEX idx_system_configurations_key ON system_configurations(key);

CREATE INDEX idx_personas_company_id ON personas(company_id);
CREATE INDEX idx_personas_category ON personas(category);
CREATE INDEX idx_personas_bio_generated ON personas(bio_generated);

-- =====================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 9: CREATE RLS POLICIES
-- =====================================================
CREATE POLICY "Allow all operations" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON system_configurations FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON personas FOR ALL USING (true);

-- =====================================================
-- STEP 10: CREATE UPDATE TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_configurations_updated_at
    BEFORE UPDATE ON system_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personas_updated_at
    BEFORE UPDATE ON personas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 11: INSERT SAMPLE DATA
-- =====================================================
INSERT INTO system_configurations (key, value, category, description, is_active) VALUES
    ('DEBUG_MODE', 'true', 'system', 'Enable debug mode for development', true),
    ('LOG_LEVEL', 'INFO', 'system', 'Default logging level', true),
    ('MAX_CONCURRENT_JOBS', '3', 'system', 'Maximum number of concurrent processing jobs', true),
    ('OPENAI_API_TIMEOUT', '30', 'api', 'Timeout for OpenAI API calls in seconds', true),
    ('SYNC_INTERVAL_MINUTES', '30', 'sync', 'Interval between synchronization runs', true),
    ('UI_THEME', 'light', 'ui', 'Default UI theme', true),
    ('ITEMS_PER_PAGE', '20', 'ui', 'Default number of items per page', true);

INSERT INTO companies (
    name, 
    industry, 
    description, 
    status, 
    ceo_gender,
    executives_male,
    executives_female,
    assistants_male,
    assistants_female,
    specialists_male,
    specialists_female,
    total_personas,
    languages,
    nationalities
) VALUES (
    'TechVision Solutions',
    'tecnologia',
    'Empresa de desenvolvimento de software e soluções tecnológicas inovadoras',
    'active',
    'feminino',
    2, 2, 2, 3, 3, 3,
    16,
    '["inglês", "espanhol"]'::jsonb,
    '[{"tipo": "latinos", "percentual": 60}, {"tipo": "europeus", "percentual": 40}]'::jsonb
);

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================
SELECT 'Database schema created successfully!' as status;
SELECT 'Sample company created: ' || name as company FROM companies LIMIT 1;
SELECT 'Sample configurations created: ' || count(*) || ' items' as configurations FROM system_configurations;