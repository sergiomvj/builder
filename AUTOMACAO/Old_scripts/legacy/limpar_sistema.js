const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function limparTodosOsDados() {
    console.log('🗑️ LIMPEZA COMPLETA - RESETANDO SISTEMA');
    console.log('======================================\n');
    
    const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);
    const empresaId = 'bae6cb49-9b53-4600-9b58-084a69b66c21';
    
    try {
        // 1. Limpar competências
        console.log('1️⃣ Limpando COMPETÊNCIAS...');
        const { error: compError } = await supabase
            .from('competencias')
            .delete()
            .eq('empresa_id', empresaId);
        
        if (compError) {
            console.log('   ⚠️ Erro ao limpar competências:', compError.message);
        } else {
            console.log('   ✅ Competências limpas');
        }
        
        // 2. Limpar personas
        console.log('2️⃣ Limpando PERSONAS...');
        const { error: persError } = await supabase
            .from('personas')
            .delete()
            .eq('empresa_id', empresaId);
        
        if (persError) {
            console.log('   ⚠️ Erro ao limpar personas:', persError.message);
        } else {
            console.log('   ✅ Personas limpas');
        }
        
        // 3. Limpar outras tabelas do sistema se existirem
        const tabelas = ['especificacoes', 'fluxos_analise', 'workflows_n8n', 'rag_documents'];
        
        for (const tabela of tabelas) {
            console.log(`3️⃣ Limpando ${tabela.toUpperCase()}...`);
            try {
                const { error } = await supabase
                    .from(tabela)
                    .delete()
                    .eq('empresa_id', empresaId);
                
                if (error) {
                    console.log(`   ⚠️ Erro ou tabela não existe: ${error.message}`);
                } else {
                    console.log(`   ✅ ${tabela} limpa`);
                }
            } catch (e) {
                console.log(`   ⚠️ Tabela ${tabela} não existe ou erro: ${e.message}`);
            }
        }
        
        // 4. Resetar status dos scripts na empresa
        console.log('4️⃣ Resetando STATUS DOS SCRIPTS...');
        const { error: updateError } = await supabase
            .from('empresas')
            .update({
                scripts_status: {
                    rag: false,
                    fluxos: false,
                    workflows: false,
                    biografias: false,
                    tech_specs: false,
                    competencias: false
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', empresaId);
        
        if (updateError) {
            console.log('   ⚠️ Erro ao resetar status:', updateError.message);
        } else {
            console.log('   ✅ Status resetado');
        }
        
        console.log('\n🎯 LIMPEZA CONCLUÍDA!');
        console.log('✅ Sistema pronto para gerar tudo do zero');
        console.log('🔄 Agora você pode executar o fluxo completo:');
        console.log('   1. Personas reais');
        console.log('   2. Competências');
        console.log('   3. Tech specs');
        console.log('   4. RAG');
        console.log('   5. Workflows');
        
    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
    }
}

limparTodosOsDados();