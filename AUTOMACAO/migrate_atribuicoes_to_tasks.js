import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔄 MIGRAÇÃO: personas_atribuicoes → personas_tasks\n');

const empresaId = '27470d32-9cce-4975-9a62-1d76f3ab77a4';

// 1. Buscar todas as atribuições
const { data: atribuicoes, error } = await supabase
  .from('personas_atribuicoes')
  .select('persona_id, atribuicao, ordem')
  .order('persona_id')
  .order('ordem');

if (error) {
  console.error('❌ Erro ao buscar atribuições:', error.message);
  process.exit(1);
}

console.log(`📋 Total de atribuições encontradas: ${atribuicoes.length}\n`);

// 2. Limpar personas_tasks (exceto o registro de teste)
const { error: deleteError } = await supabase
  .from('personas_tasks')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar tudo

if (deleteError) {
  console.log('⚠️  Aviso ao limpar:', deleteError.message);
}

console.log('🧹 Tabela personas_tasks limpa\n');

// 3. Converter atribuições para tarefas
const tasks = [];
let sucessos = 0;
let erros = 0;

for (const atrib of atribuicoes) {
  try {
    // Parse do JSON da atribuição
    let taskData;
    if (typeof atrib.atribuicao === 'string') {
      taskData = JSON.parse(atrib.atribuicao);
    } else {
      taskData = atrib.atribuicao; // Já é objeto
    }

    tasks.push({
      persona_id: atrib.persona_id,
      title: taskData.titulo || taskData.title || 'Tarefa sem título',
      description: taskData.descricao || taskData.description || ''
    });
    
    sucessos++;
  } catch (e) {
    console.error(`❌ Erro ao processar atribuição: ${e.message}`);
    erros++;
  }
}

console.log(`✅ ${sucessos} tarefas processadas`);
console.log(`❌ ${erros} erros\n`);

// 4. Inserir em lotes de 50
const BATCH_SIZE = 50;
let inserted = 0;

for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
  const batch = tasks.slice(i, i + BATCH_SIZE);
  
  const { error: insertError } = await supabase
    .from('personas_tasks')
    .insert(batch);

  if (insertError) {
    console.error(`❌ Erro ao inserir lote ${Math.floor(i/BATCH_SIZE) + 1}:`, insertError.message);
  } else {
    inserted += batch.length;
    console.log(`✅ Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} tarefas inseridas`);
  }
}

console.log(`\n📊 RESULTADO FINAL:`);
console.log(`   Tarefas inseridas: ${inserted}`);
console.log(`   Total esperado: ${tasks.length}`);

// 5. Verificar resultado
const { count } = await supabase
  .from('personas_tasks')
  .select('id', { count: 'exact', head: true });

console.log(`   Registros em personas_tasks: ${count}`);
console.log(`\n🎉 Migração concluída!`);
