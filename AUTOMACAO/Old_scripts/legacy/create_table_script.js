// Script para criar a tabela personas_avatares no Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

// Configuração
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para DDL

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🏗️ CRIANDO TABELA personas_avatares');
console.log('====================================');

async function createPersonasAvatarTable() {
  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('create_personas_avatares_table.sql', 'utf8');
    
    console.log('📝 Executando SQL...');
    
    // Executar SQL usando rpc (para DDL)
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error.message);
      
      // Tentar método alternativo - executar comando por comando
      console.log('🔄 Tentando método alternativo...');
      
      // Primeiro, criar a tabela básica
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.personas_avatares (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          persona_id UUID NOT NULL,
          avatar_url TEXT,
          avatar_thumbnail_url TEXT,
          prompt_usado TEXT,
          estilo VARCHAR(100),
          background_tipo VARCHAR(50),
          servico_usado VARCHAR(50) DEFAULT 'gemini_ai',
          versao VARCHAR(20) DEFAULT 'v1.0',
          ativo BOOLEAN DEFAULT true,
          biometrics JSONB,
          history JSONB,
          metadados JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
      
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError.message);
        console.log('💡 Você pode executar o SQL manualmente no Supabase Dashboard:');
        console.log('   1. Acesse https://supabase.com/dashboard');
        console.log('   2. Vá em SQL Editor');
        console.log('   3. Execute o conteúdo do arquivo create_personas_avatares_table.sql');
      } else {
        console.log('✅ Tabela personas_avatares criada com sucesso!');
      }
    } else {
      console.log('✅ SQL executado com sucesso!');
    }
    
    // Verificar se a tabela foi criada
    const { data: testData, error: testError } = await supabase
      .from('personas_avatares')
      .select('*')
      .limit(1);
      
    if (testError) {
      console.log('⚠️ Tabela ainda não está acessível via API:', testError.message);
    } else {
      console.log('🎯 Tabela personas_avatares está funcionando perfeitamente!');
      console.log('📊 Pronta para receber dados dos avatares');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createPersonasAvatarTable();