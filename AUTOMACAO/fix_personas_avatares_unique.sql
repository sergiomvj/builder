-- ============================================================================
-- FIX: Adicionar UNIQUE constraint em personas_avatares.persona_id
-- ============================================================================
-- PROBLEMA: Script 05a falha ao fazer upsert porque não há constraint UNIQUE
-- SOLUÇÃO: Adicionar constraint para permitir upsert seguro
-- ============================================================================

-- 1. Remover duplicatas existentes (manter apenas o mais recente)
DELETE FROM personas_avatares a
USING personas_avatares b
WHERE a.persona_id = b.persona_id
  AND a.created_at < b.created_at;

-- 2. Adicionar UNIQUE constraint
ALTER TABLE personas_avatares
ADD CONSTRAINT personas_avatares_persona_id_unique UNIQUE (persona_id);

-- 3. Verificar constraint criada
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'personas_avatares'::regclass
  AND conname = 'personas_avatares_persona_id_unique';

-- 4. Testar upsert
-- INSERT INTO personas_avatares (persona_id, prompt_usado, ativo)
-- VALUES ('test-uuid', 'test prompt', false)
-- ON CONFLICT (persona_id) DO UPDATE SET
--   prompt_usado = EXCLUDED.prompt_usado,
--   updated_at = NOW();

-- ✅ Depois de executar, rode:
-- node 05a_generate_avatar_prompts.js --empresaId=YOUR_ID --force
