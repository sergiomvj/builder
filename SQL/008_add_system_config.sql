-- Tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO system_config (key, value, description) VALUES
  ('llm_provider', '"openai"', 'Provedor de LLM: openai ou openrouter'),
  ('llm_model', '"gpt-4o"', 'Modelo de LLM a ser usado'),
  ('genesis_prompt', '""', 'Prompt personalizado para análise Genesis (vazio = usar padrão)')
ON CONFLICT (key) DO NOTHING;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS system_config_updated_at ON system_config;
CREATE TRIGGER system_config_updated_at
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_updated_at();

-- RLS (permitir leitura e escrita para todos - ajustar conforme necessário)
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to system_config" ON system_config
  FOR ALL USING (true) WITH CHECK (true);
