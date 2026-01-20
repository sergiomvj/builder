-- Tornar campos opcionais na tabela personas
-- (apenas persona_code, empresa_id e full_name são obrigatórios)

-- Adicionar campos se não existirem
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS genero VARCHAR(20);

ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS biografia_resumida TEXT;

ALTER TABLE personas 
ALTER COLUMN email DROP NOT NULL;

ALTER TABLE personas 
ALTER COLUMN whatsapp DROP NOT NULL;

ALTER TABLE personas 
ALTER COLUMN biografia_completa DROP NOT NULL;

-- Verificar as alterações
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'personas' 
AND column_name IN ('genero', 'biografia_resumida', 'email', 'whatsapp', 'biografia_completa')
ORDER BY column_name;
