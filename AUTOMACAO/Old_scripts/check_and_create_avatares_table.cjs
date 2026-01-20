// Script para verificar e criar a tabela avatares_personas se não existir
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTable() {
  console.log('🔍 Verificando estrutura do banco de dados...\n');
  
  // Tentar buscar da tabela
  const { data, error } = await supabase
    .from('avatares_personas')
    .select('*')
    .limit(1);
  
  if (error) {
    if (error.message.includes('does not exist') || error.message.includes('not find')) {
      console.log('❌ Tabela avatares_personas NÃO existe');
      console.log('\n📋 SQL para criar a tabela:');
      console.log(`
-- Criar tabela avatares_personas
CREATE TABLE IF NOT EXISTS public.avatares_personas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  avatar_url TEXT,
  avatar_thumbnail_url TEXT,
  prompt_usado TEXT,
  estilo VARCHAR(50),
  background_tipo VARCHAR(50),
  servico_usado VARCHAR(100),
  versao INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  biometrics JSONB,
  history JSONB,
  metadados JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por persona
CREATE INDEX IF NOT EXISTS idx_avatares_personas_persona_id ON public.avatares_personas(persona_id);

-- Índice para busca de avatares ativos
CREATE INDEX IF NOT EXISTS idx_avatares_personas_ativo ON public.avatares_personas(ativo);

-- Enable RLS
ALTER TABLE public.avatares_personas ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública
CREATE POLICY "Enable read access for all users" ON public.avatares_personas
  FOR SELECT USING (true);

-- Política para insert/update (autenticado)
CREATE POLICY "Enable insert for authenticated users" ON public.avatares_personas
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.avatares_personas
  FOR UPDATE USING (true);
      `);
      console.log('\n💡 Execute este SQL no Supabase SQL Editor (https://supabase.com/dashboard)');
      console.log('💡 Depois execute novamente o script de geração de imagens');
      
    } else {
      console.log('❌ Erro ao acessar tabela:', error.message);
    }
  } else {
    console.log('✅ Tabela avatares_personas existe!');
    console.log(`📊 Registros encontrados: ${data?.length || 0}`);
    
    // Verificar personas
    const { data: personas } = await supabase
      .from('personas')
      .select('id, full_name')
      .limit(5);
    
    console.log(`\n✅ Tabela personas existe com ${personas?.length || 0} registros`);
    
    if (personas && personas.length > 0) {
      console.log('\n📋 Primeiras personas:');
      personas.forEach(p => console.log(`  - ${p.full_name} (${p.id})`));
    }
  }
}

checkAndCreateTable();
