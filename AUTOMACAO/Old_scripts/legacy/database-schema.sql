-- =====================================================
-- VCM Dashboard - Database Schema for Supabase
-- =====================================================
-- Execute this SQL in your Supabase SQL Editor
-- This creates the tables needed for the CRUD operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
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
-- SYSTEM_CONFIGURATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_configurations (
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
-- PERSONAS TABLE (for company management)
-- =====================================================
CREATE TABLE IF NOT EXISTS personas (
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

-- Add foreign key constraint after table creation
ALTER TABLE personas 
ADD CONSTRAINT fk_personas_company_id 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- =====================================================
-- INDEXES FOR BETTER PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at);

CREATE INDEX IF NOT EXISTS idx_system_configurations_category ON system_configurations(category);
CREATE INDEX IF NOT EXISTS idx_system_configurations_is_active ON system_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_system_configurations_key ON system_configurations(key);

CREATE INDEX IF NOT EXISTS idx_personas_company_id ON personas(company_id);
CREATE INDEX IF NOT EXISTS idx_personas_category ON personas(category);
CREATE INDEX IF NOT EXISTS idx_personas_bio_generated ON personas(bio_generated);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all operations for authenticated users" ON companies
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON system_configurations
    FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON personas
    FOR ALL USING (true);

-- =====================================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at
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
-- SAMPLE DATA (OPTIONAL)
-- =====================================================
-- Insert some sample system configurations
INSERT INTO system_configurations (key, value, category, description, is_active) VALUES
    ('DEBUG_MODE', 'true', 'system', 'Enable debug mode for development', true),
    ('LOG_LEVEL', 'INFO', 'system', 'Default logging level', true),
    ('MAX_CONCURRENT_JOBS', '3', 'system', 'Maximum number of concurrent processing jobs', true),
    ('OPENAI_API_TIMEOUT', '30', 'api', 'Timeout for OpenAI API calls in seconds', true),
    ('SYNC_INTERVAL_MINUTES', '30', 'sync', 'Interval between synchronization runs', true),
    ('UI_THEME', 'light', 'ui', 'Default UI theme', true),
    ('ITEMS_PER_PAGE', '20', 'ui', 'Default number of items per page', true)
ON CONFLICT (key) DO NOTHING;

-- Insert a sample company
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
    16, -- total_personas (including CEO)
    '["inglês", "espanhol"]'::jsonb,
    '[{"tipo": "latinos", "percentual": 60}, {"tipo": "europeus", "percentual": 40}]'::jsonb
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- If you see this message in the query results, the schema was created successfully!
SELECT 'VCM Dashboard database schema created successfully!' as status;