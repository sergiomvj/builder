/**
 * SCRIPT UTILITÁRIO: Atualizar empresas existentes com configuração global
 * 
 * Atualiza todas as empresas para:
 * - País: Estados Unidos
 * - Idiomas: Inglês, Português, Espanhol + 2 extras aleatórios
 * - Preparadas para equipe multinacional
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { gerarIdiomasEmpresa } from './lib/diversity_manager.js';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🌍 ATUALIZAR EMPRESAS PARA CONFIGURAÇÃO GLOBAL');
console.log('='.repeat(50));

async function main() {
  // 1. Buscar todas as empresas
  console.log('\n1️⃣ Buscando empresas...\n');
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('id, nome, pais, idiomas');
  
  if (error) {
    console.error('❌ Erro ao buscar empresas:', error.message);
    process.exit(1);
  }
  
  console.log(`✅ ${empresas.length} empresas encontradas\n`);
  
  // 2. Atualizar cada empresa
  let atualizadas = 0;
  
  for (const empresa of empresas) {
    console.log(`📝 Atualizando: ${empresa.nome}`);
    console.log(`   País atual: ${empresa.pais || 'Não definido'}`);
    console.log(`   Idiomas atuais: ${empresa.idiomas?.join(', ') || 'Não definidos'}`);
    
    // Gerar novos idiomas (sempre inclui Inglês, Português, Espanhol + 2 extras)
    const novosIdiomas = gerarIdiomasEmpresa();
    
    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('empresas')
      .update({
        pais: 'Estados Unidos',
        idiomas: novosIdiomas
      })
      .eq('id', empresa.id);
    
    if (updateError) {
      console.error(`   ❌ Erro ao atualizar: ${updateError.message}`);
      continue;
    }
    
    console.log(`   ✅ Atualizada!`);
    console.log(`   Novo país: Estados Unidos`);
    console.log(`   Novos idiomas: ${novosIdiomas.join(', ')}`);
    console.log('');
    
    atualizadas++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ ${atualizadas}/${empresas.length} empresas atualizadas`);
  console.log('='.repeat(50));
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. Rodar Script 02 com --force para regenerar biografias');
  console.log('   2. Verificar diversidade de nacionalidades');
  console.log('   3. Conferir idiomas obrigatórios presentes\n');
}

main().catch(console.error);
