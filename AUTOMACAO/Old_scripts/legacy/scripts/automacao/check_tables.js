import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

console.log('🔍 VERIFICANDO TABELAS DO SUPABASE');
console.log('=================================');

async function checkTables() {
  try {
    // Verificar tabelas relacionadas a personas e RAG
    const personasTables = [
      'empresas',
      'personas',
      'personas_avatares', 
      'personas_competencias',
      'personas_atribuicoes',
      'personas_rag',
      'personas_tarefas', 
      'personas_fluxos',
      'rag_documents',
      'rag_embeddings',
      'rag_knowledge_base',
      'knowledge_base',
      'embeddings'
    ];
    
    for (const tableName of personasTables) {
      try {
        const { data, count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`✅ Tabela ${tableName} EXISTS (${count || 0} records)`);
        }
      } catch (e) {
        console.log(`❌ Tabela ${tableName} NÃO EXISTE ou erro:`, e.message);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkTables();