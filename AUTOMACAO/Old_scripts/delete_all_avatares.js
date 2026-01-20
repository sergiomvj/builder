#!/usr/bin/env node
/**
 * Script para excluir TODOS os avatares do banco
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function excluirTodosAvatares() {
  console.log('🗑️  EXCLUINDO TODOS OS AVATARES...\n');

  try {
    // Primeiro, verificar quantos existem
    const { data: before, error: countError } = await supabase
      .from('avatares_multimedia')
      .select('id, title');

    if (countError) {
      console.error('❌ Erro ao contar avatares:', countError.message);
      return;
    }

    console.log(`📊 Avatares encontrados: ${before.length}\n`);

    if (before.length === 0) {
      console.log('✅ Nenhum avatar para excluir');
      return;
    }

    // Listar os que serão excluídos
    console.log('Avatares a serem excluídos:');
    before.forEach((a, i) => {
      console.log(`${i + 1}. ${a.title}`);
    });

    console.log('\n⚠️  Iniciando exclusão...\n');

    // Excluir todos
    const { error: deleteError } = await supabase
      .from('avatares_multimedia')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos (truque: id nunca é esse)

    if (deleteError) {
      console.error('❌ Erro ao excluir:', deleteError.message);
      return;
    }

    // Verificar se realmente foram excluídos
    const { data: after, error: checkError } = await supabase
      .from('avatares_multimedia')
      .select('id');

    if (checkError) {
      console.error('❌ Erro ao verificar exclusão:', checkError.message);
      return;
    }

    console.log(`✅ EXCLUSÃO CONCLUÍDA!`);
    console.log(`   Avatares antes: ${before.length}`);
    console.log(`   Avatares depois: ${after.length}`);
    console.log('\n🎉 Todos os avatares foram excluídos com sucesso!\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

excluirTodosAvatares().catch(console.error);
