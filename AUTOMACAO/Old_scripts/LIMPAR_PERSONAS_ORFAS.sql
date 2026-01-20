-- ============================================================================
-- LIMPAR PERSONAS ÓRFÃS (sem empresa válida)
-- ============================================================================
-- Execute AGORA no Supabase SQL Editor
-- ============================================================================

-- Ver quantas personas órfãs existem
SELECT COUNT(*) as total_orfas
FROM personas p
WHERE NOT EXISTS (
  SELECT 1 FROM empresas e WHERE e.id = p.empresa_id
);

-- DELETAR TODAS as personas órfãs
DELETE FROM personas
WHERE id IN (
  SELECT p.id
  FROM personas p
  WHERE NOT EXISTS (
    SELECT 1 FROM empresas e WHERE e.id = p.empresa_id
  )
);

-- Verificar se ainda existem órfãs
SELECT COUNT(*) as total_orfas_restantes
FROM personas p
WHERE NOT EXISTS (
  SELECT 1 FROM empresas e WHERE e.id = p.empresa_id
);

SELECT 'Personas órfãs deletadas!' as message;
