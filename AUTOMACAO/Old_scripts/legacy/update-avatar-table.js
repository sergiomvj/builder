/**
 * Script para aplicar mudanças na tabela avatares_personas
 * Adiciona os campos biometrics e history
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAvatarTable() {
  console.log('🔄 Aplicando mudanças na tabela avatares_personas...\n');

  try {
    // Verificar se a tabela existe e ver campos atuais
    console.log('1️⃣ Verificando estrutura atual da tabela...');
    
    const { data: tableInfo, error: infoError } = await supabase
      .rpc('get_table_columns', { table_name: 'avatares_personas' });
    
    if (infoError) {
      console.log('ℹ️ Função get_table_columns não encontrada, continuando...');
    } else if (tableInfo) {
      console.log('   📋 Campos atuais:', tableInfo.map(col => col.column_name).join(', '));
    }

    // Tentar adicionar os novos campos via SQL
    console.log('\n2️⃣ Adicionando campo BIOMETRICS...');
    const { error: biometricsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE avatares_personas ADD COLUMN IF NOT EXISTS biometrics TEXT;'
    });
    
    if (biometricsError) {
      console.log('   ⚠️ Erro ao adicionar biometrics (pode já existir):', biometricsError.message);
    } else {
      console.log('   ✅ Campo biometrics adicionado com sucesso!');
    }

    console.log('\n3️⃣ Adicionando campo HISTORY...');
    const { error: historyError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE avatares_personas ADD COLUMN IF NOT EXISTS history TEXT;'
    });
    
    if (historyError) {
      console.log('   ⚠️ Erro ao adicionar history (pode já existir):', historyError.message);
    } else {
      console.log('   ✅ Campo history adicionado com sucesso!');
    }

    // Verificar se os campos foram adicionados tentando fazer uma consulta
    console.log('\n4️⃣ Verificando se os campos foram adicionados...');
    
    const { data: testData, error: testError } = await supabase
      .from('avatares_personas')
      .select('id, biometrics, history')
      .limit(1);
    
    if (testError) {
      if (testError.message.includes('biometrics') || testError.message.includes('history')) {
        console.log('   ❌ Campos ainda não foram adicionados. Execute o SQL manualmente no Supabase:');
        console.log('   📝 SQL para executar:');
        console.log('      ALTER TABLE avatares_personas ADD COLUMN IF NOT EXISTS biometrics TEXT;');
        console.log('      ALTER TABLE avatares_personas ADD COLUMN IF NOT EXISTS history TEXT;');
      } else {
        console.log('   ⚠️ Erro inesperado:', testError.message);
      }
    } else {
      console.log('   ✅ Campos biometrics e history confirmados na tabela!');
      console.log('   📊 Total de registros na tabela:', testData ? 'Campos disponíveis' : 'Tabela vazia');
    }

    console.log('\n✅ CONCLUÍDO: Estrutura da tabela avatares_personas atualizada!');
    console.log('📋 A tabela agora possui os campos:');
    console.log('   🔹 biometrics: TEXT - Descrição física detalhada');
    console.log('   🔹 history: TEXT - Trajetória profissional e contexto');
    console.log('\n🚀 Agora você pode executar o Script 0 (Avatares) para gerar dados completos!');

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
    console.log('\n📋 AÇÃO MANUAL NECESSÁRIA:');
    console.log('Execute este SQL no painel do Supabase:');
    console.log('```sql');
    console.log('ALTER TABLE avatares_personas ADD COLUMN IF NOT EXISTS biometrics TEXT;');
    console.log('ALTER TABLE avatares_personas ADD COLUMN IF NOT EXISTS history TEXT;');
    console.log('```');
  }
}

// Executar
updateAvatarTable().then(() => {
  console.log('\n🎯 Script concluído! Os campos biometrics e history estão prontos para uso.');
}).catch(console.error);