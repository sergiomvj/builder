#!/usr/bin/env node
/**
 * Script de diagnóstico para avatares_multimedia
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO - AVATARES MULTIMEDIA\n');
  console.log('='.repeat(60));

  // 1. Verificar empresa ativa
  console.log('\n1️⃣ Verificando empresa ativa...');
  const { data: empresas, error: empError } = await supabase
    .from('empresas')
    .select('id, nome, status')
    .eq('status', 'ativa');

  if (empError) {
    console.error('❌ Erro ao buscar empresas:', empError.message);
    return;
  }

  console.log(`✅ ${empresas.length} empresa(s) ativa(s):`);
  empresas.forEach(emp => {
    console.log(`   - ${emp.nome} (${emp.id})`);
  });

  if (empresas.length === 0) {
    console.log('⚠️ Nenhuma empresa ativa encontrada!');
    return;
  }

  // 2. Verificar avatares por empresa
  console.log('\n2️⃣ Verificando avatares...');
  for (const empresa of empresas) {
    const { data: avatares, error: avatError } = await supabase
      .from('avatares_multimedia')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (avatError) {
      console.error(`❌ Erro ao buscar avatares para ${empresa.nome}:`, avatError.message);
      continue;
    }

    console.log(`\n📊 ${empresa.nome}:`);
    console.log(`   Total: ${avatares.length} avatares`);
    
    if (avatares.length > 0) {
      const porStatus = avatares.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   Por status:`, porStatus);
      
      console.log('\n   Primeiros 5 avatares:');
      avatares.slice(0, 5).forEach((a, idx) => {
        console.log(`   ${idx + 1}. ${a.title}`);
        console.log(`      Status: ${a.status}`);
        console.log(`      URL: ${a.file_url.substring(0, 50)}...`);
        console.log(`      Personas: ${a.personas_ids.length}`);
      });
    } else {
      console.log('   ⚠️ Nenhum avatar encontrado');
    }
  }

  // 3. Verificar RLS policies
  console.log('\n3️⃣ Verificando políticas RLS...');
  const { data: policies, error: polError } = await supabase
    .rpc('pg_policies')
    .eq('tablename', 'avatares_multimedia');

  if (polError) {
    console.log('⚠️ Não foi possível verificar políticas (normal)');
  }

  // 4. Teste de query simples
  console.log('\n4️⃣ Teste de query simples (sem filtros)...');
  const { data: todosAvatares, error: testError } = await supabase
    .from('avatares_multimedia')
    .select('id, title, status, empresa_id');

  if (testError) {
    console.error('❌ Erro:', testError.message);
  } else {
    console.log(`✅ Query funcionou: ${todosAvatares.length} avatares encontrados`);
    if (todosAvatares.length > 0) {
      console.log('\n   Distribuição por empresa:');
      const porEmpresa = todosAvatares.reduce((acc, a) => {
        acc[a.empresa_id] = (acc[a.empresa_id] || 0) + 1;
        return acc;
      }, {});
      Object.entries(porEmpresa).forEach(([id, count]) => {
        console.log(`   - ${id}: ${count} avatares`);
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnóstico concluído!\n');
}

diagnosticar().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
