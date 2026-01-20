const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debug500Error() {
  try {
    console.log('🔍 DEBUGANDO ERRO 500 - ARVA Tech Solutions\n');
    
    // Simular a criação que está falhando
    const testData = {
      nome: 'ARVA Tech Solutions',
      industria: 'tecnologia',
      pais: 'Brasil',
      descricao: 'Empresa de teste ARVA Tech Solutions com análise estratégica completa'
    };
    
    console.log('📋 Testando geração de código para:', testData.nome);
    
    // Testar geração de código
    function generateCompanyCode(nome) {
      const clean = nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      
      const baseName = clean.length >= 3 ? clean : (clean + 'EMP').substring(0, 6);
      const numero = Math.floor(10 + Math.random() * 90);
      const codigo = `${baseName}${numero}`;
      
      return codigo.substring(0, 10);
    }
    
    const codigo = generateCompanyCode(testData.nome);
    console.log(`✅ Código gerado: "${codigo}" (${codigo.length} chars)`);
    
    // Verificar todos os campos
    const empresaData = {
      nome: testData.nome.substring(0, 255),
      industry: testData.industria.substring(0, 100), 
      pais: testData.pais.substring(0, 100),
      descricao: testData.descricao.substring(0, 500),
      codigo: codigo,
      total_personas: 15,
      status: 'ativa'
    };
    
    console.log('\n📊 Dados da empresa a serem inseridos:');
    Object.keys(empresaData).forEach(key => {
      const valor = empresaData[key];
      const tamanho = typeof valor === 'string' ? valor.length : 'N/A';
      console.log(`   ${key}: "${valor}" (${tamanho} chars)`);
    });
    
    // Testar inserção no banco
    console.log('\n🧪 TESTANDO INSERÇÃO NO BANCO...');
    
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresaData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ ERRO NA INSERÇÃO:', error);
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      console.error('   Detalhes:', error.details);
      
      // Verificar schema da tabela
      console.log('\n🔍 INVESTIGANDO SCHEMA DA TABELA...');
      
      try {
        const schemaQuery = `
          SELECT column_name, data_type, character_maximum_length, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'empresas' 
          ORDER BY ordinal_position;
        `;
        
        const { data: schema, error: schemaError } = await supabase.rpc('execute_sql', {
          sql: schemaQuery
        });
        
        if (schema) {
          console.log('📋 SCHEMA DA TABELA EMPRESAS:');
          schema.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
          });
        }
      } catch (schemaError) {
        console.log('❌ Não foi possível obter schema:', schemaError);
      }
      
    } else {
      console.log('✅ INSERÇÃO REALIZADA COM SUCESSO!');
      console.log('   ID:', data.id);
      console.log('   Código:', data.codigo);
      
      // Cleanup
      await supabase.from('empresas').delete().eq('id', data.id);
      console.log('🧹 Dados de teste removidos');
    }
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

debug500Error();