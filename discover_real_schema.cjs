/**
 * 🔍 DESCOBRIR SCHEMA REAL - Supabase
 * 
 * Este script consulta diretamente o schema do PostgreSQL
 * para saber EXATAMENTE quais colunas existem e seus tipos
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverSchema(tableName) {
  console.log(`\n🔍 Descobrindo schema da tabela: ${tableName}\n`);
  console.log('=' .repeat(80));
  
  // Query PostgreSQL information_schema
  const { data, error } = await supabase.rpc('get_table_schema', {
    table_name: tableName
  });
  
  if (error) {
    console.log('⚠️  RPC não disponível, tentando método alternativo...\n');
    
    // Método alternativo: tentar inserir e ver erro
    const testData = {};
    const { error: insertError } = await supabase
      .from(tableName)
      .insert([testData])
      .select();
    
    if (insertError) {
      console.log('📋 Informações do erro:');
      console.log(`   Código: ${insertError.code}`);
      console.log(`   Mensagem: ${insertError.message}`);
      console.log(`   Detalhes: ${insertError.details || 'N/A'}`);
      console.log(`   Hint: ${insertError.hint || 'N/A'}`);
      
      // Extrair campo obrigatório do erro
      const match = insertError.message.match(/column "([^"]+)"/);
      if (match) {
        console.log(`\n✅ Campo obrigatório identificado: "${match[1]}"`);
        console.log('\n💡 Vou tentar criar com este campo...');
        
        // Tentar com campo obrigatório
        const testData2 = { [match[1]]: 'TEST_' + Date.now() };
        const { error: insertError2 } = await supabase
          .from(tableName)
          .insert([testData2])
          .select();
        
        if (insertError2) {
          console.log(`\n❌ Ainda falta: ${insertError2.message}`);
          
          const match2 = insertError2.message.match(/column "([^"]+)"/);
          if (match2) {
            console.log(`✅ Outro campo obrigatório: "${match2[1]}"`);
          }
        } else {
          console.log('\n✅ Registro teste criado! Buscando para ver campos...');
          
          const { data: records } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (records && records.length > 0) {
            console.log('\n📊 CAMPOS DISPONÍVEIS NA TABELA:\n');
            Object.entries(records[0]).forEach(([key, value]) => {
              const tipo = typeof value;
              const valorExemplo = value === null ? 'NULL' : JSON.stringify(value).substring(0, 50);
              console.log(`   ✓ ${key.padEnd(30)} [${tipo}]  = ${valorExemplo}`);
            });
            
            // Deletar registro teste
            const { error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .like(match[1], 'TEST_%');
            
            if (!deleteError) {
              console.log('\n🗑️  Registro teste removido');
            }
          }
        }
      }
    }
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

async function main() {
  console.log('\n🚀 DESCOBRINDO SCHEMAS DO BANCO DE DADOS\n');
  
  await discoverSchema('empresas');
  await discoverSchema('personas');
  
  console.log('✅ Descoberta concluída!\n');
}

main().catch(console.error);
