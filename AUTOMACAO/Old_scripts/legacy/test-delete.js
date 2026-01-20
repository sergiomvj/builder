// SCRIPT MELHORADO PARA TESTE DE EXCLUSÃO DE EMPRESAS
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Argumentos do script
const args = process.argv.slice(2);
const command = args[0] || 'list'; // list, delete-soft, delete-hard, restore
const empresaId = args[1]; // ID da empresa para operações específicas

async function listEmpresas() {
  console.log('📊 EMPRESAS NO DATABASE\n');
  
  try {
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ ERRO:', error.message);
      return;
    }

    if (empresas && empresas.length > 0) {
      console.log(`Total: ${empresas.length} empresas\n`);
      
      empresas.forEach((e, i) => {
        const status = e.status === 'ativa' ? '✅' : '⏸️';
        console.log(`${i + 1}. ${status} ${e.nome}`);
        console.log(`   ID: ${e.id}`);
        console.log(`   Status: ${e.status}`);
        console.log(`   Personas: ${e.total_personas || 0}`);
        console.log(`   Criada: ${new Date(e.created_at).toLocaleDateString()}`);
        console.log('');
      });

      // Mostrar contagem de personas por empresa
      console.log('📋 CONTAGEM DE PERSONAS POR EMPRESA:\n');
      for (const empresa of empresas) {
        const { count } = await supabase
          .from('personas')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id);
        
        console.log(`${empresa.nome}: ${count || 0} personas`);
      }

    } else {
      console.log('ℹ️ Nenhuma empresa encontrada');
    }

  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message);
  }
}

async function deleteSoft(empresaId) {
  console.log(`🔄 EXCLUSÃO SOFT - DESATIVANDO EMPRESA ${empresaId}\n`);
  
  try {
    // Buscar dados da empresa
    const { data: empresa, error: fetchError } = await supabase
      .from('empresas')
      .select('nome, status')
      .eq('id', empresaId)
      .single();

    if (fetchError || !empresa) {
      console.log('❌ Empresa não encontrada');
      return;
    }

    console.log(`Empresa: ${empresa.nome}`);
    console.log(`Status atual: ${empresa.status}`);

    if (empresa.status === 'inativa') {
      console.log('⚠️ Empresa já está inativa');
      return;
    }

    // Desativar empresa
    const { error: updateError } = await supabase
      .from('empresas')
      .update({ 
        status: 'inativa',
        updated_at: new Date().toISOString()
      })
      .eq('id', empresaId);

    if (updateError) {
      console.log('❌ ERRO ao desativar:', updateError.message);
    } else {
      console.log('✅ Empresa desativada com sucesso');
      console.log('ℹ️ Dados mantidos para auditoria');
    }

  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

async function deleteHard(empresaId) {
  console.log(`🗑️ EXCLUSÃO HARD - REMOVENDO EMPRESA ${empresaId} PERMANENTEMENTE\n`);
  console.log('⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!\n');
  
  try {
    // Buscar dados da empresa
    const { data: empresa, error: fetchError } = await supabase
      .from('empresas')
      .select('nome')
      .eq('id', empresaId)
      .single();

    if (fetchError || !empresa) {
      console.log('❌ Empresa não encontrada');
      return;
    }

    console.log(`Empresa: ${empresa.nome}`);
    
    // Buscar personas relacionadas
    console.log('\n📋 Analisando dependências...');
    const { data: personas } = await supabase
      .from('personas')
      .select('id, full_name')
      .eq('empresa_id', empresaId);

    const personaIds = personas?.map(p => p.id) || [];
    console.log(`👤 Personas encontradas: ${personaIds.length}`);
    
    if (personas && personas.length > 0) {
      personas.forEach(p => console.log(`   - ${p.full_name}`));
    }

    // Confirmar exclusão
    console.log(`\n🚨 CONFIRMAÇÃO NECESSÁRIA:`);
    console.log(`Empresa: ${empresa.nome}`);
    console.log(`Personas: ${personaIds.length}`);
    console.log(`\nPara continuar, execute:`);
    console.log(`node ${process.argv[1]} confirm-hard ${empresaId}`);

  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

async function confirmHard(empresaId) {
  console.log(`🗑️ EXECUTANDO EXCLUSÃO HARD DA EMPRESA ${empresaId}\n`);
  
  try {
    // Buscar empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('nome')
      .eq('id', empresaId)
      .single();

    console.log(`Removendo: ${empresa?.nome || empresaId}`);

    // 1. Buscar personas
    const { data: personas } = await supabase
      .from('personas')
      .select('id')
      .eq('empresa_id', empresaId);

    const personaIds = personas?.map(p => p.id) || [];

    // 2. Limpar dependências
    const cleanupTables = [
      { table: 'audit_logs', field: 'empresa_id', value: empresaId },
      { table: 'sync_logs', field: 'empresa_id', value: empresaId },
      { table: 'metas_globais', field: 'empresa_id', value: empresaId },
      { table: 'auditorias_compatibilidade', field: 'empresa_id', value: empresaId },
    ];

    if (personaIds.length > 0) {
      cleanupTables.push(
        { table: 'metas_personas', field: 'persona_id', value: personaIds },
        { table: 'workflows', field: 'persona_id', value: personaIds },
        { table: 'rag_knowledge', field: 'persona_id', value: personaIds },
        { table: 'avatares_personas', field: 'persona_id', value: personaIds },
        { table: 'personas_tech_specs', field: 'persona_id', value: personaIds },
        { table: 'competencias', field: 'persona_id', value: personaIds },
        { table: 'personas_biografias', field: 'persona_id', value: personaIds }
      );
    }

    console.log('🧹 Limpando dependências...');
    for (const cleanup of cleanupTables) {
      try {
        let query = supabase.from(cleanup.table).delete();
        
        if (Array.isArray(cleanup.value)) {
          query = query.in(cleanup.field, cleanup.value);
        } else {
          query = query.eq(cleanup.field, cleanup.value);
        }
        
        const { error } = await query;
        
        if (error && !error.message.includes('does not exist')) {
          console.log(`  ⚠️ ${cleanup.table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${cleanup.table}: limpo`);
        }
      } catch (err) {
        console.log(`  ⚠️ ${cleanup.table}: ${err.message}`);
      }
    }

    // 3. Remover personas
    if (personaIds.length > 0) {
      console.log('👤 Removendo personas...');
      const { error: personasError } = await supabase
        .from('personas')
        .delete()
        .eq('empresa_id', empresaId);

      if (personasError) {
        console.log('  ⚠️ Erro:', personasError.message);
      } else {
        console.log('  ✅ Personas removidas');
      }
    }

    // 4. Remover empresa
    console.log('🏢 Removendo empresa...');
    const { error: empresaError } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresaId);

    if (empresaError) {
      console.log('❌ ERRO ao remover empresa:', empresaError.message);
    } else {
      console.log('🎉 EMPRESA REMOVIDA COMPLETAMENTE!');
    }

  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

async function restoreEmpresa(empresaId) {
  console.log(`🔄 RESTAURANDO EMPRESA ${empresaId}\n`);
  
  try {
    const { data: empresa, error: updateError } = await supabase
      .from('empresas')
      .update({ 
        status: 'ativa',
        updated_at: new Date().toISOString()
      })
      .eq('id', empresaId)
      .select('nome')
      .single();

    if (updateError) {
      console.log('❌ ERRO ao restaurar:', updateError.message);
    } else {
      console.log(`✅ Empresa "${empresa.nome}" restaurada com sucesso`);
    }

  } catch (error) {
    console.log('❌ ERRO:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🔧 GERENCIADOR DE EXCLUSÃO DE EMPRESAS VCM\n');
  
  switch (command) {
    case 'list':
      await listEmpresas();
      break;
      
    case 'delete-soft':
      if (!empresaId) {
        console.log('❌ ID da empresa é obrigatório');
        console.log('Uso: node test-delete.js delete-soft [EMPRESA_ID]');
        return;
      }
      await deleteSoft(empresaId);
      break;
      
    case 'delete-hard':
      if (!empresaId) {
        console.log('❌ ID da empresa é obrigatório');
        console.log('Uso: node test-delete.js delete-hard [EMPRESA_ID]');
        return;
      }
      await deleteHard(empresaId);
      break;
      
    case 'confirm-hard':
      if (!empresaId) {
        console.log('❌ ID da empresa é obrigatório');
        return;
      }
      await confirmHard(empresaId);
      break;
      
    case 'restore':
      if (!empresaId) {
        console.log('❌ ID da empresa é obrigatório');
        console.log('Uso: node test-delete.js restore [EMPRESA_ID]');
        return;
      }
      await restoreEmpresa(empresaId);
      break;
      
    default:
      console.log('📖 COMANDOS DISPONÍVEIS:\n');
      console.log('node test-delete.js list                    - Listar todas as empresas');
      console.log('node test-delete.js delete-soft [ID]        - Desativar empresa (soft delete)');
      console.log('node test-delete.js delete-hard [ID]        - Análise para exclusão permanente');
      console.log('node test-delete.js confirm-hard [ID]       - Confirmar exclusão permanente');
      console.log('node test-delete.js restore [ID]            - Restaurar empresa desativada');
      console.log('');
      console.log('Exemplos:');
      console.log('node test-delete.js list');
      console.log('node test-delete.js delete-soft abc123');
      console.log('node test-delete.js restore abc123');
  }
}

main().catch(console.error);