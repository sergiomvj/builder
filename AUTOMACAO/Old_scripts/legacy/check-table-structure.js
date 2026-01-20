const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  try {
    // Verificar estrutura da tabela personas
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao consultar tabela personas:', error);
      return;
    }

    console.log('=== ESTRUTURA ATUAL DA TABELA PERSONAS ===');
    if (data && data.length > 0) {
      const colunas = Object.keys(data[0]);
      console.log('Colunas existentes:');
      colunas.forEach((coluna, index) => {
        console.log(`${index + 1}. ${coluna}`);
      });
      
      console.log('\n=== EXEMPLO DE REGISTRO ===');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('Nenhum registro encontrado na tabela personas');
    }

    // Verificar se existe coluna idiomas
    if (data && data.length > 0) {
      const temColunaIdiomas = data[0].hasOwnProperty('idiomas');
      console.log(`\n=== VERIFICAÇÃO CAMPO IDIOMAS ===`);
      console.log(`Campo 'idiomas' existe: ${temColunaIdiomas}`);
      
      if (temColunaIdiomas) {
        console.log(`Valor atual do campo idiomas: ${JSON.stringify(data[0].idiomas)}`);
      }
    }

  } catch (error) {
    console.error('Erro ao verificar estrutura:', error);
  }
}

checkTableStructure();