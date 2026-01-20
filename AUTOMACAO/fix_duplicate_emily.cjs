require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicate() {
  console.log('🔧 Corrigindo nome duplicado Emily Carter...\n');
  
  // Persona duplicada: ARVA01-POS015 (Analista de QA)
  const personaId = 'ARVA01-POS015';
  const newName = 'Emma Watson';
  const newEmail = 'emma.watson@arvabot.com';
  
  console.log(`📝 Renomeando ${personaId}:`);
  console.log(`   De: Emily Carter (emily.carter1@arvabot.com)`);
  console.log(`   Para: ${newName} (${newEmail})`);
  
  // Atualizar na tabela personas
  const { data: persona, error: errorPersona } = await supabase
    .from('personas')
    .update({
      full_name: newName,
      email: newEmail
    })
    .eq('persona_code', personaId)
    .select()
    .single();

  if (errorPersona) {
    console.error('❌ Erro ao atualizar personas:', errorPersona);
    process.exit(1);
  }

  console.log('✅ Tabela personas atualizada!');

  // Atualizar na tabela personas_biografias (se existir)
  const { data: bio, error: errorBio } = await supabase
    .from('personas_biografias')
    .update({
      nome_completo: newName,
      email: newEmail
    })
    .eq('persona_code', personaId)
    .select();

  if (errorBio && errorBio.code !== 'PGRST116') { // Ignora erro se não existir registro
    console.error('⚠️  Aviso ao atualizar biografias:', errorBio);
  } else if (bio && bio.length > 0) {
    console.log('✅ Tabela personas_biografias atualizada!');
  } else {
    console.log('ℹ️  Nenhum registro em personas_biografias para atualizar');
  }

  console.log('\n✅ Correção concluída com sucesso!');
  console.log(`\n📊 Resultado final:`);
  console.log(`   ARVA01-POS005: Emily Carter (Gerente de Produto)`);
  console.log(`   ARVA01-POS015: ${newName} (Analista de QA)`);
  
  process.exit(0);
}

fixDuplicate();
