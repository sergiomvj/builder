-- =====================================================
-- VCM Dashboard - MINIMAL Schema for Testing
-- =====================================================
-- This is the absolute minimum needed to test the CRUD functionality

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create companies table (core table)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',
    total_personas INTEGER DEFAULT 0,
    ceo_gender VARCHAR(20) NOT NULL,
    executives_male INTEGER DEFAULT 0,
    executives_female INTEGER DEFAULT 0,
    assistants_male INTEGER DEFAULT 0,
    assistants_female INTEGER DEFAULT 0,
    specialists_male INTEGER DEFAULT 0,
    specialists_female INTEGER DEFAULT 0,
    languages JSONB DEFAULT '[]'::jsonb,
    nationalities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_configurations table (core table)
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (required for Supabase)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configurations ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for testing
CREATE POLICY "Allow all operations" ON companies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON system_configurations FOR ALL USING (true);

-- Insert test data
INSERT INTO companies (name, industry, ceo_gender, status) VALUES 
('Test Company', 'tecnologia', 'feminino', 'active');

INSERT INTO system_configurations (key, value, category) VALUES 
('TEST_CONFIG', 'test_value', 'system');

-- Verify creation
SELECT 'Success! Tables created and test data inserted.' as result;
SELECT COUNT(*) as companies_count FROM companies;
SELECT COUNT(*) as configs_count FROM system_configurations;