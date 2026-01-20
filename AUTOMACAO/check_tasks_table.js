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

console.log('🔍 Verificando tabela personas_tasks\n');

const empresaId = '27470d32-9cce-4975-9a62-1d76f3ab77a4';

// 1. Verificar se tabela existe e tem registros
const { data: tasks, error: tasksError, count } = await supabase
  .from('personas_tasks')
  .select('*', { count: 'exact' })
  .limit(5);

if (tasksError) {
  console.error('❌ Erro ao acessar personas_tasks:', tasksError.message);
  console.log('\n💡 A tabela pode não existir. Vamos verificar personas_atribuicoes...\n');
} else {
  console.log(`📊 Total de registros em personas_tasks: ${count}`);
  if (tasks && tasks.length > 0) {
    console.log('\n✅ Primeiras 5 tarefas:');
    tasks.forEach(t => console.log(`   - ${t.title || t.descricao || 'Sem título'} (${t.persona_id?.substring(0, 8)}...)`));
  }
}

// 2. Verificar personas_atribuicoes (tabela antiga)
const { data: atribuicoes, error: atribError, count: atribCount } = await supabase
  .from('personas_atribuicoes')
  .select('*', { count: 'exact' })
  .limit(5);

if (atribError) {
  console.error('\n❌ Erro ao acessar personas_atribuicoes:', atribError.message);
} else {
  console.log(`\n📋 Total de registros em personas_atribuicoes: ${atribCount}`);
  if (atribuicoes && atribuicoes.length > 0) {
    console.log('\n✅ Primeiras 5 atribuições:');
    atribuicoes.forEach(a => console.log(`   - ${a.atribuicao?.substring(0, 60) || 'Sem descrição'}...`));
  }
}

console.log('\n📌 CONCLUSÃO:');
if (count === 0 && atribCount > 0) {
  console.log('⚠️  personas_tasks está vazia, mas personas_atribuicoes tem dados.');
  console.log('💡 Solução: Rodar Script 03 novamente OU criar migração para popular personas_tasks');
} else if (count > 0) {
  console.log('✅ personas_tasks está populada corretamente!');
}
