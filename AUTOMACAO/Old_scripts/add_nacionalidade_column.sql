```sql
-- Adicionar coluna nacionalidade à tabela personas se não existir
ALTER TABLE personas 
ADD COLUMN IF NOT EXISTS nacionalidade TEXT;

-- Comentário
COMMENT ON COLUMN personas.nacionalidade IS 'Nacionalidade da persona (americanos, brasileiros, europeus, asiaticos)';
```

Execute este SQL no Supabase Dashboard → SQL Editor
