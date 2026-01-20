#!/usr/bin/env node
/**
 * Script para testar inserção na tabela personas_tarefas
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testPersonasTarefas() {
    console.log('🧪 TESTANDO INSERÇÃO EM personas_tarefas');
    console.log('========================================');
    
    // Primeiro, vamos buscar uma persona para teste
    const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
        .limit(1);
    
    if (personasError || !personas?.length) {
        console.error('❌ Erro ao buscar personas:', personasError?.message);
        return;
    }
    
    const persona = personas[0];
    console.log(`👤 Testando com persona: ${persona.full_name} (${persona.role})`);
    
    // Tentar inserir um registro de teste
    const testRecord = {
        persona_id: persona.id,
        empresa_id: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
        nome: 'Teste de Tarefa',
        descricao: 'Teste de inserção na tabela personas_tarefas',
        tipo: 'teste',
        prioridade: 'baixa',
        tempo_estimado: '1h',
        frequencia: 'teste apenas',
        recursos_necessarios: ['Teste'],
        entregaveis: ['Resultado do teste'],
        categoria: 'Teste',
        status: 'ativa',
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    console.log('📝 Tentando inserir registro de teste...');
    
    const { data: inserted, error: insertError } = await supabase
        .from('personas_tarefas')
        .insert(testRecord)
        .select();
    
    if (insertError) {
        console.error('❌ Erro ao inserir:', insertError.message);
        console.error('💾 Detalhes do erro:', insertError);
    } else {
        console.log('✅ Inserção bem-sucedida!');
        console.log('📋 Dados inseridos:', inserted);
        
        // Limpar teste
        await supabase
            .from('personas_tarefas')
            .delete()
            .eq('id', inserted[0].id);
        
        console.log('🧹 Registro de teste removido');
    }
}

await testPersonasTarefas();