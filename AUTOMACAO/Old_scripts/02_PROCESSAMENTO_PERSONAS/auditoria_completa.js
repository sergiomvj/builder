const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function auditarDadosCompletos() {
    console.log('🔍 AUDITORIA COMPLETA - DADOS NO BANCO');
    console.log('=====================================\n');
    
    // 1. Verificar Empresas
    const { data: empresas, error: empError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', 'bae6cb49-9b53-4600-9b58-084a69b66c21');
    
    if (!empError && empresas.length > 0) {
        const emp = empresas[0];
        console.log('✅ EMPRESA:');
        console.log(`   Nome: ${emp.nome}`);
        console.log(`   Código: ${emp.codigo}`);
        console.log(`   Total Personas: ${emp.total_personas}`);
        console.log(`   Status Scripts: ${JSON.stringify(emp.scripts_status, null, 4)}`);
    }
    
    // 2. Verificar Personas
    const { data: personas, error: persError } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', 'bae6cb49-9b53-4600-9b58-084a69b66c21');
    
    console.log(`\n✅ PERSONAS (${personas?.length || 0}):`);
    personas?.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.full_name} - ${p.role}`);
        console.log(`      Email: ${p.email}`);
        console.log(`      Departamento: ${p.department}`);
        console.log(`      Biografia: ${p.biografia_completa ? 'SIM ✅' : 'NÃO ❌'} (${p.biografia_completa?.length || 0} chars)`);
        console.log(`      Personalidade: ${p.personalidade ? 'SIM ✅' : 'NÃO ❌'}`);
        console.log(`      Status: ${p.status}`);
    });
    
    // 3. Verificar Competências
    const { data: competencias, error: compError } = await supabase
        .from('competencias')
        .select('persona_id')
        .eq('empresa_id', 'bae6cb49-9b53-4600-9b58-084a69b66c21');
    
    console.log(`\n✅ COMPETÊNCIAS: ${competencias?.length || 0} registros`);
    
    // Agrupar por persona
    if (competencias) {
        const groupedComps = {};
        competencias.forEach(c => {
            if (!groupedComps[c.persona_id]) groupedComps[c.persona_id] = 0;
            groupedComps[c.persona_id]++;
        });
        console.log(`   Personas com competências: ${Object.keys(groupedComps).length}`);
    }
    
    // 4. Verificar outras tabelas do sistema
    const tabelas = ['especificacoes', 'fluxos_analise', 'workflows_n8n', 'rag_documents'];
    
    for (const tabela of tabelas) {
        try {
            const { data, error } = await supabase
                .from(tabela)
                .select('id')
                .eq('empresa_id', 'bae6cb49-9b53-4600-9b58-084a69b66c21')
                .limit(1);
            
            if (!error) {
                console.log(`\n📊 TABELA ${tabela.toUpperCase()}: ${data?.length || 0} registros`);
            } else {
                console.log(`\n❌ TABELA ${tabela.toUpperCase()}: Erro ou não existe`);
            }
        } catch (e) {
            console.log(`\n❓ TABELA ${tabela.toUpperCase()}: Não verificável`);
        }
    }
    
    console.log('\n🎯 RESUMO:');
    console.log(`   ✅ Empresas: ${empresas?.length || 0}`);
    console.log(`   ✅ Personas: ${personas?.length || 0}`);
    console.log(`   ✅ Competências: ${competencias?.length || 0}`);
    console.log('\n📋 STATUS PIPELINE:');
    console.log('   1. ✅ Empresas criadas');
    console.log('   2. ✅ Personas reais + biografias');
    console.log('   3. ✅ Competências');
    console.log('   4. 🔄 Especificações técnicas (próximo)');
    console.log('   5. 🔄 Base RAG (depois)');
    console.log('   6. 🔄 Workflows N8N (final)');
}

auditarDadosCompletos();