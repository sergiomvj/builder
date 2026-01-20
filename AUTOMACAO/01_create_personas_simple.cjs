// ============================================================================
// SCRIPT 01 SIMPLE - CRIAÇÃO DE PERSONAS A PARTIR DE cargos_necessarios
// ============================================================================
// Usa: node 01_create_personas_simple.cjs --empresaId=UUID
// ============================================================================

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🏗️  SCRIPT 01 SIMPLE - CRIAÇÃO DE PERSONAS');
console.log('==========================================\n');

// Mapear cargo para departamento
function inferDepartment(cargo) {
  cargo = cargo.toLowerCase();
  if (cargo.includes('ceo') || cargo.includes('diretor geral')) return 'Executivo';
  if (cargo.includes('cto') || cargo.includes('tecnologia')) return 'Tecnologia';
  if (cargo.includes('cfo') || cargo.includes('financ')) return 'Financeiro';
  if (cargo.includes('cmo') || cargo.includes('marketing')) return 'Marketing';
  if (cargo.includes('coo') || cargo.includes('opera')) return 'Operações';
  if (cargo.includes('desenvolv') || cargo.includes('dev')) return 'Engenharia';
  if (cargo.includes('design')) return 'Design';
  if (cargo.includes('produto')) return 'Produto';
  if (cargo.includes('vendas') || cargo.includes('comercial')) return 'Vendas';
  if (cargo.includes('suporte') || cargo.includes('atend')) return 'Atendimento';
  if (cargo.includes('rh') || cargo.includes('recursos humanos')) return 'RH';
  if (cargo.includes('jurídico') || cargo.includes('legal')) return 'Jurídico';
  if (cargo.includes('qualidade') || cargo.includes('qa')) return 'Qualidade';
  if (cargo.includes('dados') || cargo.includes('data') || cargo.includes('analist')) return 'Dados';
  if (cargo.includes('segurança') || cargo.includes('security')) return 'Segurança';
  return 'Geral';
}

async function main() {
  const args = process.argv.slice(2);
  const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
  
  if (!empresaIdArg) {
    console.error('❌ Uso: node 01_create_personas_simple.cjs --empresaId=UUID');
    process.exit(1);
  }
  
  const empresaId = empresaIdArg.split('=')[1];
  
  // 1. Buscar empresa
  console.log(`🔍 Buscando empresa ${empresaId}...\n`);
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  if (empresaError || !empresa) {
    console.error('❌ Empresa não encontrada:', empresaError?.message);
    process.exit(1);
  }
  
  console.log(`✅ Empresa: ${empresa.nome}`);
  console.log(`   Código: ${empresa.codigo}`);
  console.log(`   Indústria: ${empresa.industria}\n`);
  
  // 2. Verificar cargos_necessarios
  if (!empresa.cargos_necessarios || typeof empresa.cargos_necessarios !== 'object') {
    console.error('❌ Campo cargos_necessarios não encontrado ou inválido');
    process.exit(1);
  }
  
  const cargosObj = empresa.cargos_necessarios;
  const totalCargos = Object.values(cargosObj).reduce((acc, val) => acc + val, 0);
  
  console.log(`📋 Total de cargos: ${totalCargos}`);
  console.log(`   Tipos de cargo: ${Object.keys(cargosObj).length}\n`);
  
  // 3. Criar personas
  const personas = [];
  let index = 1;
  
  for (const [cargo, quantidade] of Object.entries(cargosObj)) {
    console.log(`👤 Criando ${quantidade}x ${cargo}...`);
    
    for (let i = 0; i < quantidade; i++) {
      const personaCode = `${empresa.codigo}-P${String(index).padStart(3, '0')}`;
      const department = inferDepartment(cargo);
      
      personas.push({
        persona_code: personaCode,
        empresa_id: empresaId,
        role: cargo,
        department: department,
        specialty: cargo,
        status: 'active',
        full_name: `[${cargo} ${i + 1}]`,
        nacionalidade: 'brasileiros'
      });
      
      index++;
    }
  }
  
  console.log(`\n💾 Inserindo ${personas.length} personas no banco...\n`);
  
  // 4. Inserir em lote
  const { data: inserted, error: insertError } = await supabase
    .from('personas')
    .insert(personas)
    .select();
  
  if (insertError) {
    console.error('❌ Erro ao inserir personas:', insertError.message);
    process.exit(1);
  }
  
  console.log(`✅ ${inserted.length} personas criadas com sucesso!\n`);
  
  // 5. Atualizar empresa
  const { error: updateError } = await supabase
    .from('empresas')
    .update({
      equipe_gerada: false,
      scripts_status: {
        ...empresa.scripts_status,
        '01_create_personas': 'success'
      }
    })
    .eq('id', empresaId);
  
  if (updateError) {
    console.warn('⚠️  Aviso: Não foi possível atualizar scripts_status:', updateError.message);
  }
  
  // 6. Salvar JSON
  const outputDir = path.join(__dirname, 'personas_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, `${empresaId}_personas_criadas.json`);
  fs.writeFileSync(outputFile, JSON.stringify({
    empresa_id: empresaId,
    empresa_nome: empresa.nome,
    total_personas: inserted.length,
    timestamp: new Date().toISOString(),
    personas: inserted.map(p => ({
      id: p.id,
      persona_code: p.persona_code,
      role: p.role,
      department: p.department
    }))
  }, null, 2));
  
  console.log(`📄 JSON salvo em: ${outputFile}\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SCRIPT 01 CONCLUÍDO COM SUCESSO!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎯 Próximo passo: node 02_generate_biografias_COMPLETO.js --empresaId=' + empresaId);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
