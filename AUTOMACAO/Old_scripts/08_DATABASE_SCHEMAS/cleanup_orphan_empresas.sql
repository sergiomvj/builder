-- 🧹 Script SQL para limpar empresas órfãs do banco de dados
-- Execute este script diretamente no Supabase SQL Editor

-- 1. Mostrar resumo antes da limpeza
SELECT 
  'Total de empresas' as tipo,
  COUNT(*) as quantidade
FROM empresas
UNION ALL
SELECT 
  'Empresas com personas' as tipo,
  COUNT(DISTINCT e.id) as quantidade
FROM empresas e
INNER JOIN personas p ON e.id = p.empresa_id
UNION ALL
SELECT 
  'Empresas órfãs (sem personas)' as tipo,
  COUNT(*) as quantidade
FROM empresas e
LEFT JOIN personas p ON e.id = p.empresa_id
WHERE p.id IS NULL;

-- 2. Mostrar detalhes das empresas órfãs
SELECT 
  e.id,
  e.nome,
  e.created_at,
  COUNT(p.id) as personas_count
FROM empresas e
LEFT JOIN personas p ON e.id = p.empresa_id
GROUP BY e.id, e.nome, e.created_at
HAVING COUNT(p.id) = 0
ORDER BY e.created_at DESC;

-- 3. CUIDADO! Esta query DELETA as empresas órfãs
-- Primeiro, deletar audit_logs relacionados
DELETE FROM audit_logs
WHERE empresa_id IN (
  SELECT e.id
  FROM empresas e
  LEFT JOIN personas p ON e.id = p.empresa_id
  GROUP BY e.id
  HAVING COUNT(p.id) = 0
);

-- Depois, deletar as empresas órfãs
DELETE FROM empresas
WHERE id IN (
  SELECT e.id
  FROM empresas e
  LEFT JOIN personas p ON e.id = p.empresa_id
  GROUP BY e.id
  HAVING COUNT(p.id) = 0
);

-- 4. Verificar resultado
SELECT 
  'Após limpeza - Total de empresas' as tipo,
  COUNT(*) as quantidade
FROM empresas;
