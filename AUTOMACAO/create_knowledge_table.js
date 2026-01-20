#!/usr/bin/env node
/**
 * Script para criar tabela knowledge_chunks no Supabase
 * Executa o SQL de criação da tabela com pgvector
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('📊 Criando tabela knowledge_chunks...\n');

  try {
    // Ler arquivo SQL
    const sqlPath = join(__dirname, '..', 'src', 'sql', 'create_knowledge_chunks_table.sql');
    const sqlContent = readFileSync(sqlPath, 'utf-8');

    console.log('📄 SQL carregado:', sqlPath);
    console.log('📏 Tamanho:', sqlContent.length, 'caracteres\n');

    // Executar SQL via RPC (assumindo que existe uma função para executar SQL raw)
    // Como Supabase não permite SQL direto via client, vamos tentar criar a tabela via API
    
    // Alternativa: executar statements individuais
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📝 Encontrados', statements.length, 'statements SQL\n');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.toLowerCase().includes('create') || 
          stmt.toLowerCase().includes('comment') ||
          stmt.toLowerCase().includes('drop')) {
        console.log(`⏳ Executando statement ${i + 1}/${statements.length}...`);
        
        // Usar rpc se disponível, ou tentar via query
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          console.error(`❌ Erro no statement ${i + 1}:`, error.message);
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log('\n⚠️  A função exec_sql não existe no Supabase.');
            console.log('📋 Por favor, execute o SQL manualmente no Supabase Dashboard:');
            console.log('   1. Acesse https://supabase.com/dashboard');
            console.log('   2. Vá em SQL Editor');
            console.log('   3. Cole o conteúdo de src/sql/create_knowledge_chunks_table.sql');
            console.log('   4. Execute o SQL\n');
            process.exit(1);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executado com sucesso`);
        }
      }
    }

    console.log('\n✅ Tabela knowledge_chunks criada com sucesso!');
    console.log('📊 Verificando estrutura...\n');

    // Verificar se a tabela foi criada
    const { data: tables, error: tableError } = await supabase
      .from('knowledge_chunks')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError.message);
    } else {
      console.log('✅ Tabela knowledge_chunks está acessível!');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
