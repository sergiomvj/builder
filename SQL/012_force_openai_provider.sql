-- Force LLM Provider to OpenAI
-- This overrides any previous setting in the database

INSERT INTO system_config (key, value, description)
VALUES 
  ('llm_provider', '"openai"', 'Provider LLM (openai, openrouter)'),
  ('llm_model', '"gpt-4o"', 'Modelo LLM padrao')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value;

-- Verify the result
SELECT key, value FROM system_config WHERE key IN ('llm_provider', 'llm_model');
