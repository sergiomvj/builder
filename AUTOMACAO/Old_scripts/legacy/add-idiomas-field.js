const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addIdiomasColumn() {
  try {
    console.log('=== ADICIONANDO CAMPO IDIOMAS NA TABELA PERSONAS ===');
    
    // Primeiro, verificar se o campo já existe
    const { data: existingData, error: checkError } = await supabase
      .from('personas')
      .select('idiomas')
      .limit(1);

    if (!checkError && existingData) {
      console.log('Campo idiomas já existe na tabela!');
      return;
    }

    // Executar o SQL para adicionar a coluna
    // Nota: Para Supabase, precisamos usar a função rpc ou fazer isso pelo painel admin
    console.log('⚠️  ATENÇÃO: Para adicionar a coluna, execute o seguinte SQL no painel do Supabase:');
    console.log('');
    console.log('ALTER TABLE personas ADD COLUMN idiomas JSONB DEFAULT \'["Português"]\'::jsonb;');
    console.log('');
    console.log('COMMENT ON COLUMN personas.idiomas IS \'Array de idiomas que a persona fala para realizar seu trabalho\';');
    console.log('');
    console.log('CREATE INDEX IF NOT EXISTS idx_personas_idiomas ON personas USING GIN (idiomas);');
    console.log('');
    console.log('📋 Instruções:');
    console.log('1. Acesse: https://fzyokrvdyeczhfqlwxzb.supabase.co/project/fzyokrvdyeczhfqlwxzb/sql/new');
    console.log('2. Cole e execute o SQL acima');
    console.log('3. Execute novamente este script para verificar');

  } catch (error) {
    console.error('Erro:', error);
  }
}

// Função para verificar se a alteração foi aplicada
async function verificarCampo() {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('idiomas')
      .limit(1);

    if (error) {
      console.log('❌ Campo idiomas ainda não existe');
      return false;
    }

    console.log('✅ Campo idiomas criado com sucesso!');
    console.log('Exemplo de valor:', data[0]?.idiomas || 'null');
    return true;
  } catch (error) {
    console.log('❌ Campo idiomas ainda não existe');
    return false;
  }
}

async function main() {
  const existe = await verificarCampo();
  if (!existe) {
    await addIdiomasColumn();
  }
}

main();