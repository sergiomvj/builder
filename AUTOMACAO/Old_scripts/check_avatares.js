#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAvatares() {
  console.log('🔍 Verificando avatares no banco...\n');

  // 1. Verificar total de avatares
  const { data: all, error: allError } = await supabase
    .from('avatares_multimedia')
    .select('id, empresa_id, title, status, created_at');

  if (allError) {
    console.error('❌ Erro:', allError.message);
    return;
  }

  console.log(`📊 Total de avatares: ${all.length}\n`);

  if (all.length > 0) {
    console.log('Primeiros 5 avatares:');
    all.slice(0, 5).forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
      console.log(`   ID: ${a.id}`);
      console.log(`   Empresa ID: ${a.empresa_id}`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Criado em: ${a.created_at}\n`);
    });
  }

  // 2. Verificar empresa ativa
  const { data: empresa, error: empError } = await supabase
    .from('empresas')
    .select('id, nome, status')
    .eq('status', 'ativa')
    .limit(1)
    .single();

  if (empError) {
    console.error('❌ Erro ao buscar empresa:', empError.message);
    return;
  }

  console.log(`\n🏢 Empresa ativa: ${empresa.nome} (${empresa.id})\n`);

  // 3. Verificar avatares da empresa ativa
  const { data: avatares, error: avatError } = await supabase
    .from('avatares_multimedia')
    .select('*')
    .eq('empresa_id', empresa.id);

  if (avatError) {
    console.error('❌ Erro ao buscar avatares da empresa:', avatError.message);
    return;
  }

  console.log(`📸 Avatares da empresa ativa: ${avatares.length}\n`);

  if (avatares.length > 0) {
    avatares.forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
      console.log(`   Status: ${a.status}`);
      console.log(`   Personas: ${a.personas_ids.length}`);
      console.log(`   URL: ${a.file_url.substring(0, 60)}...\n`);
    });
  } else {
    console.log('⚠️ Nenhum avatar encontrado para a empresa ativa!');
    console.log('Empresa ID esperada:', empresa.id);
    console.log('Empresa IDs nos avatares:', [...new Set(all.map(a => a.empresa_id))]);
  }
}

checkAvatares().catch(console.error);
