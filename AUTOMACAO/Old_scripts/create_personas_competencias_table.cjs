// HACK: Criar personas_competencias via insert/select
// Como Supabase JS não permite DDL, vamos forçar a criação via RPC

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTableViaRPC() {
  console.log('🔧 Tentando criar personas_competencias via RPC...\n');
  
  const sql = `
-- Criar tabela personas_competencias
CREATE TABLE IF NOT EXISTS personas_competencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  
  competencias_tecnicas TEXT[] DEFAULT '{}',
  competencias_comportamentais TEXT[] DEFAULT '{}',
  ferramentas TEXT[] DEFAULT '{}',
  
  tarefas_diarias TEXT[] DEFAULT '{}',
  tarefas_semanais TEXT[] DEFAULT '{}',
  tarefas_mensais TEXT[] DEFAULT '{}',
  
  kpis TEXT[] DEFAULT '{}',
  objetivos_desenvolvimento TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(persona_id)
);

CREATE INDEX IF NOT EXISTS idx_personas_competencias_persona_id ON personas_competencias(persona_id);
CREATE INDEX IF NOT EXISTS idx_personas_competencias_empresa_id ON personas_competencias(empresa_id);
`;

  console.log('📋 SQL gerado (copie e execute no Supabase Dashboard):');
  console.log('='.repeat(80));
  console.log(sql);
  console.log('='.repeat(80));
  console.log('\n🔗 Link direto: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor\n');
  
  // Verificar se já existe
  const { error } = await supabase
    .from('personas_competencias')
    .select('id')
    .limit(1);
  
  if (!error) {
    console.log('✅ Tabela personas_competencias já existe!');
  } else {
    console.log('❌ Tabela ainda não existe. Execute o SQL acima.');
    console.log(`   Erro: ${error.message}`);
  }
}

createTableViaRPC();
