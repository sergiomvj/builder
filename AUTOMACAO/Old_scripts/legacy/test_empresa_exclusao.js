// =====================================================
// TESTE: O que acontece quando uma empresa é excluída?
// =====================================================

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analisarComportamentoExclusao() {
  console.log('🔍 ANALISANDO COMPORTAMENTO DE EXCLUSÃO DE EMPRESAS');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar se existe alguma empresa de teste
    console.log('\n1️⃣ Verificando empresas existentes...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, codigo, total_personas')
      .limit(3);

    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return;
    }

    if (empresas.length === 0) {
      console.log('⚠️ Nenhuma empresa encontrada no banco');
      return;
    }

    console.log(`✅ Encontradas ${empresas.length} empresas:`);
    empresas.forEach(emp => {
      console.log(`   - ${emp.nome} (${emp.codigo}) - ${emp.total_personas || 0} personas`);
    });

    // 2. Verificar constraints de foreign key no banco atual
    console.log('\n2️⃣ Verificando constraints de foreign key...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_foreign_key_constraints');

    if (constraintsError) {
      console.log('⚠️ Não foi possível verificar constraints automaticamente');
      console.log('Verificando manualmente...');
    }

    // 3. Para cada empresa, verificar quantas personas e dados relacionados existem
    console.log('\n3️⃣ Analisando dados relacionados por empresa...');
    
    for (const empresa of empresas) {
      console.log(`\n📊 EMPRESA: ${empresa.nome} (ID: ${empresa.id})`);
      
      // Personas
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('id, full_name, role')
        .eq('empresa_id', empresa.id);

      console.log(`   👤 Personas: ${personas?.length || 0}`);
      
      if (personas && personas.length > 0) {
        // Biografias
        const { data: biografias, error: biografiasError } = await supabase
          .from('personas_biografias')
          .select('id')
          .in('persona_id', personas.map(p => p.id));
        
        console.log(`   📝 Biografias: ${biografias?.length || 0}`);
        
        // Competências
        const { data: competencias, error: competenciasError } = await supabase
          .from('competencias')
          .select('id')
          .in('persona_id', personas.map(p => p.id));
        
        console.log(`   🎯 Competências: ${competencias?.length || 0}`);
        
        // Tech Specs (se existir)
        const { data: techSpecs, error: techError } = await supabase
          .from('personas_tech_specs')
          .select('id')
          .in('persona_id', personas.map(p => p.id));
        
        console.log(`   💻 Tech Specs: ${techSpecs?.length || 0}`);
      }
    }

    // 4. Explicar o comportamento esperado
    console.log('\n4️⃣ ANÁLISE DO COMPORTAMENTO DE EXCLUSÃO:');
    console.log('=' .repeat(50));
    
    console.log('\n🔄 ESTRUTURA DE RELACIONAMENTOS:');
    console.log('empresas (1) -----> (N) personas');
    console.log('personas (1) -----> (N) personas_biografias');  
    console.log('personas (1) -----> (N) competencias');
    console.log('personas (1) -----> (N) personas_tech_specs');
    console.log('personas (1) -----> (N) avatares_personas');
    console.log('personas (1) -----> (N) rag_knowledge');
    console.log('personas (1) -----> (N) workflows');

    console.log('\n⚠️ COMPORTAMENTO ATUAL:');
    console.log('📌 Com base no schema analisado:');
    console.log('   • empresas -> personas: SEM CASCADE definido');
    console.log('   • personas -> personas_biografias: SEM CASCADE definido');
    console.log('   • personas -> competencias: SEM CASCADE definido');
    
    console.log('\n❗ CONSEQUÊNCIAS DA EXCLUSÃO:');
    console.log('🚨 Se uma empresa for excluída:');
    console.log('   ❌ As personas NÃO serão excluídas automaticamente');
    console.log('   ❌ Os dados relacionados (biografias, competências) ficarão órfãos');
    console.log('   ❌ Podem ocorrer inconsistências no banco de dados');
    
    console.log('\n✅ RECOMENDAÇÃO:');
    console.log('🔧 Implementar CASCADE ou exclusão manual antes de excluir empresa');
    console.log('📝 Usar transações para garantir consistência');

    console.log('\n5️⃣ ESTRATÉGIAS RECOMENDADAS:');
    console.log('=' .repeat(40));
    
    console.log('\n🎯 OPÇÃO 1: Exclusão Soft (Recomendada)');
    console.log('   • Marcar empresa como "inactive" ao invés de excluir');
    console.log('   • Manter dados para auditoria/histórico');
    console.log('   • Permite restauração se necessário');
    
    console.log('\n🎯 OPÇÃO 2: Exclusão com Limpeza Manual');
    console.log('   • 1. Excluir biografias das personas');
    console.log('   • 2. Excluir competências das personas');  
    console.log('   • 3. Excluir outros dados relacionados');
    console.log('   • 4. Excluir personas');
    console.log('   • 5. Excluir empresa');
    
    console.log('\n🎯 OPÇÃO 3: Implementar CASCADE (Perigosa)');
    console.log('   • Adicionar ON DELETE CASCADE nas foreign keys');
    console.log('   • CUIDADO: Exclusão irreversível de todos os dados');

  } catch (error) {
    console.error('❌ Erro durante análise:', error);
  }
}

// Função para criar script de exclusão segura
async function gerarScriptExclusaoSegura(empresaId) {
  console.log('\n🛡️ GERANDO SCRIPT DE EXCLUSÃO SEGURA');
  console.log('=' .repeat(50));
  
  console.log(`\n-- SCRIPT PARA EXCLUSÃO SEGURA DA EMPRESA: ${empresaId}`);
  console.log('-- Execute em ordem para evitar problemas de integridade\n');
  
  console.log('BEGIN;');
  console.log('-- 1. Backup dos dados (opcional)');
  console.log(`-- Criar tabelas de backup se necessário\n`);
  
  console.log('-- 2. Excluir dados relacionados das personas');
  console.log(`DELETE FROM personas_biografias WHERE persona_id IN (`);
  console.log(`  SELECT id FROM personas WHERE empresa_id = '${empresaId}'`);
  console.log(`);\n`);
  
  console.log(`DELETE FROM competencias WHERE persona_id IN (`);
  console.log(`  SELECT id FROM personas WHERE empresa_id = '${empresaId}'`);
  console.log(`);\n`);
  
  console.log(`DELETE FROM personas_tech_specs WHERE persona_id IN (`);
  console.log(`  SELECT id FROM personas WHERE empresa_id = '${empresaId}'`);
  console.log(`);\n`);
  
  console.log(`DELETE FROM avatares_personas WHERE persona_id IN (`);
  console.log(`  SELECT id FROM personas WHERE empresa_id = '${empresaId}'`);
  console.log(`);\n`);
  
  console.log(`DELETE FROM rag_knowledge WHERE persona_id IN (`);
  console.log(`  SELECT id FROM personas WHERE empresa_id = '${empresaId}'`);
  console.log(`);\n`);
  
  console.log(`DELETE FROM workflows WHERE persona_id IN (`);
  console.log(`  SELECT id FROM personas WHERE empresa_id = '${empresaId}'`);
  console.log(`);\n`);
  
  console.log('-- 3. Excluir personas');
  console.log(`DELETE FROM personas WHERE empresa_id = '${empresaId}';\n`);
  
  console.log('-- 4. Excluir empresa');
  console.log(`DELETE FROM empresas WHERE id = '${empresaId}';\n`);
  
  console.log('COMMIT;');
  console.log('-- ROLLBACK; -- Use em caso de erro');
}

// Executar análise
if (require.main === module) {
  analisarComportamentoExclusao()
    .then(() => {
      console.log('\n🎯 CONCLUSÃO:');
      console.log('A exclusão de empresas requer cuidado especial para manter a integridade dos dados.');
      console.log('Recomenda-se implementar exclusão soft ou scripts de limpeza manual.\n');
    })
    .catch(console.error);
}

module.exports = {
  analisarComportamentoExclusao,
  gerarScriptExclusaoSegura
};