-- Adicionar configurações para os novos prompts
INSERT INTO system_config (key, value, description) VALUES
  ('team_prompt', '""', 'Prompt personalizado para geração de equipe (vazio = usar padrão)'),
  ('workflow_prompt', '""', 'Prompt personalizado para geração de workflows (vazio = usar padrão)')
ON CONFLICT (key) DO NOTHING;
