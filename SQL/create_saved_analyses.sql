-- Create table for saved analyses and strategic reports
CREATE TABLE IF NOT EXISTS saved_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content JSONB NOT NULL,
  analysis_type TEXT DEFAULT 'strategic', -- strategic, financial, operational, etc.
  author_persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_analyses_empresa ON saved_analyses(empresa_id);

-- Enable RLS
ALTER TABLE saved_analyses ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (following project pattern)
CREATE POLICY "Allow public access to saved_analyses" ON saved_analyses
  FOR ALL USING (true) WITH CHECK (true);
