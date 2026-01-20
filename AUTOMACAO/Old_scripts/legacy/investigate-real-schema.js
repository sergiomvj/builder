/**
 * 🔍 INVESTIGAR SCHEMA REAL DO BANCO
 * Verificar quais campos têm limitação character varying(10)
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateRealSchema() {
  console.log('🔍 INVESTIGANDO SCHEMA REAL DO BANCO')
  console.log('=' .repeat(60))
  
  try {
    // Verificar schema das tabelas usando query SQL
    console.log('📊 VERIFICANDO SCHEMA DAS TABELAS...')
    
    // Query para verificar todas as colunas com character varying(10)
    const { data: columns, error } = await supabase
      .rpc('get_table_columns_info')
      .select('*')
    
    if (error) {
      console.log('❌ Erro ao usar RPC, tentando query direta...')
      
      // Query SQL direta para ver informações das colunas
      const query = `
        SELECT 
          table_name,
          column_name,
          data_type,
          character_maximum_length,
          is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND (table_name = 'empresas' OR table_name = 'personas')
        AND data_type = 'character varying'
        ORDER BY table_name, column_name;
      `
      
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns')
        .select('*')
        
      if (schemaError) {
        console.log('❌ Erro na query schema:', schemaError.message)
        
        // Método alternativo: criar empresa primeiro e então testar persona
        console.log('🧪 TESTANDO INSERÇÃO PARA IDENTIFICAR CAMPO PROBLEMÁTICO...')
        
        // 1. Criar empresa de teste primeiro
        const testEmpresa = {
          nome: 'Empresa Teste Schema',
          industry: 'tecnologia',
          pais: 'Brasil',
          codigo: 'TESTSCHM',
          descricao: 'Teste para identificar schema'
        }
        
        console.log('📝 Criando empresa de teste...')
        const { data: empresaData, error: empresaError } = await supabase
          .from('empresas')
          .insert(testEmpresa)
          .select()
        
        if (empresaError) {
          console.log('❌ Erro ao criar empresa teste:', empresaError.message)
          return
        }
        
        const empresaId = empresaData[0].id
        console.log('✅ Empresa teste criada:', empresaId)
        
        // 2. Agora testar persona com campos longos
        const testPersona = {
          empresa_id: empresaId,
          persona_code: 'test_persona_muito_longo_para_testar_limite',
          full_name: 'Nome Completo Teste',
          role: 'Role Muito Longo Para Testar',
          specialty: 'Specialty Muito Longa Para Testar',
          department: 'Department Muito Longo Para Testar',
          email: 'teste@teste.com',
          whatsapp: '+5511999999999',
          biografia_completa: 'Biografia teste',
          experiencia_anos: 5
        }
        
        console.log('🔬 Testando campos que podem exceder 10 caracteres:')
        console.log('   persona_code:', testPersona.persona_code.length, 'chars')
        console.log('   role:', testPersona.role.length, 'chars')
        console.log('   specialty:', testPersona.specialty.length, 'chars')
        console.log('   department:', testPersona.department.length, 'chars')
        
        const { data: insertData, error: insertError } = await supabase
          .from('personas')
          .insert(testPersona)
          .select()
        
        if (insertError) {
          console.log('🎯 ERRO CAPTURADO:', insertError.message)
          console.log('📋 CÓDIGO:', insertError.code)
          console.log('📋 DETALHES:', insertError.details)
          
          // Analisar a mensagem de erro para identificar o campo
          if (insertError.message.includes('character varying(10)')) {
            console.log('\n🔍 ANALISANDO MENSAGEM DE ERRO:')
            const errorMessage = insertError.message
            console.log('Erro completo:', errorMessage)
            
            // Tentar extrair qual campo está causando o problema
            const fieldMatches = errorMessage.match(/column "([^"]+)"/)
            if (fieldMatches) {
              console.log('🎯 CAMPO PROBLEMÁTICO IDENTIFICADO:', fieldMatches[1])
            }
          }
        } else {
          console.log('✅ Inserção funcionou:', insertData)
          // Limpar dado de teste
          if (insertData && insertData[0]) {
            await supabase.from('personas').delete().eq('id', insertData[0].id)
            console.log('🧹 Dado de teste removido')
          }
        }
        
        // 3. Limpar empresa de teste
        await supabase.from('empresas').delete().eq('id', empresaId)
        console.log('🧹 Empresa de teste removida')
        
      } else {
        console.log('✅ Schema encontrado:', schemaData)
      }
    } else {
      console.log('✅ Colunas encontradas:', columns)
    }
    
  } catch (error) {
    console.error('💥 Erro na investigação:', error.message)
  }
}

investigateRealSchema().catch(console.error)