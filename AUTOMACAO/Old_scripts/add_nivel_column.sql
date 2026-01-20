-- Adicionar coluna nivel à tabela personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS nivel TEXT;

-- Comentário na coluna
COMMENT ON COLUMN personas.nivel IS 'Nível hierárquico do cargo (ceo, vp, gerente, senior, pleno, junior)';