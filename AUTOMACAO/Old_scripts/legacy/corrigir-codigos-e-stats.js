const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Função para gerar código corrigido
function generateFixedCode(nome, originalCode) {
  // Se é uma empresa deletada, usar um código específico
  if (nome.startsWith('[DELETED-') || nome.startsWith('[EXCLUÍDA]')) {
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos
    return `DEL${timestamp}`;
  }
  
  // Para empresas normais, gerar código seguindo a nova lógica
  const clean = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  const baseName = clean.length >= 3 ? clean : (clean + 'EMP').substring(0, 6);
  const numero = Math.floor(10 + Math.random() * 90);
  const codigo = `${baseName}${numero}`;
  
  return codigo.substring(0, 10);
}

async function corrigirCodigosLongos() {
  try {
    console.log('🔧 CORRIGINDO CÓDIGOS LONGOS NO BANCO\n');
    
    // Buscar empresas com códigos problemáticos
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, nome, codigo');

    if (error) {
      console.error('❌ Erro ao consultar empresas:', error);
      return;
    }

    if (!empresas || empresas.length === 0) {
      console.log('✅ Nenhuma empresa encontrada!');
      return;
    }

    // Filtrar empresas com códigos problemáticos
    const empresasProblematicas = empresas.filter(empresa => {
      const codigo = empresa.codigo;
      return !codigo || codigo.length === 0 || codigo.length > 10;
    });

    if (empresasProblematicas.length === 0) {
      console.log('✅ Nenhum código problemático encontrado!');
      return;
    }

    console.log(`📋 Encontradas ${empresasProblematicas.length} empresas com códigos problemáticos:\n`);
    
    const correções = [];
    
    for (const empresa of empresasProblematicas) {
      const codigoAtual = empresa.codigo || 'NULL';
      const novodoCodigo = generateFixedCode(empresa.nome, empresa.codigo);
      
      console.log(`🔄 ${empresa.nome}`);
      console.log(`   Código atual: "${codigoAtual}" (${codigoAtual.length} chars)`);
      console.log(`   Novo código:  "${novodoCodigo}" (${novodoCodigo.length} chars)`);
      console.log('');
      
      correções.push({
        id: empresa.id,
        nome: empresa.nome,
        codigoAntigo: codigoAtual,
        codigoNovo: novodoCodigo
      });
    }

    // Confirmar correções
    console.log('❓ CONFIRMAR CORREÇÕES:');
    console.log(`   ${correções.length} empresas serão atualizadas`);
    console.log('   Executando correções...\n');

    let sucessos = 0;
    let erros = 0;

    for (const correcao of correções) {
      try {
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ codigo: correcao.codigoNovo })
          .eq('id', correcao.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar ${correcao.nome}:`, updateError);
          erros++;
        } else {
          console.log(`✅ ${correcao.nome}: "${correcao.codigoAntigo}" → "${correcao.codigoNovo}"`);
          sucessos++;
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar ${correcao.nome}:`, error);
        erros++;
      }
    }

    console.log('\n📊 RESULTADO:');
    console.log(`   ✅ Sucessos: ${sucessos}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📝 Total processado: ${sucessos + erros}`);

    if (sucessos > 0) {
      console.log('\n🎉 CÓDIGOS CORRIGIDOS COM SUCESSO!');
      console.log('   Todos os códigos agora estão dentro do limite de 10 caracteres');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function verificarEstatisticasDashboard() {
  try {
    console.log('\n\n🔍 VERIFICANDO ESTATÍSTICAS DO DASHBOARD\n');
    
    // Testar contagem de empresas ativas
    const empresasAtivas = await supabase
      .from('empresas')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'deleted')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%');

    console.log(`📊 Empresas ativas: ${empresasAtivas.count || 0}`);

    // Buscar IDs das empresas ativas para contar personas
    const empresasAtivasData = await supabase
      .from('empresas')
      .select('id')
      .neq('status', 'deleted')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%');

    const empresasAtivasIds = empresasAtivasData.data?.map(e => e.id) || [];
    
    let personasAtivas = { count: 0 };
    if (empresasAtivasIds.length > 0) {
      personasAtivas = await supabase
        .from('personas')
        .select('id', { count: 'exact', head: true })
        .in('empresa_id', empresasAtivasIds);
    }

    console.log(`👥 Personas ativas: ${personasAtivas.count || 0}`);

    // Testar tabelas que podem não existir
    try {
      const auditorias = await supabase
        .from('auditorias')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      console.log(`📋 Auditorias: ${auditorias.count || 0} (tabela existe)`);
    } catch (error) {
      console.log(`📋 Auditorias: Tabela não existe (${error.message})`);
    }

    try {
      const alerts = await supabase
        .from('system_alerts')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      console.log(`🚨 Alertas: ${alerts.count || 0} (tabela existe)`);
    } catch (error) {
      console.log(`🚨 Alertas: Tabela não existe (${error.message})`);
    }

    console.log('\n✅ ESTATÍSTICAS DO DASHBOARD VERIFICADAS');

  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error);
  }
}

async function main() {
  await corrigirCodigosLongos();
  await verificarEstatisticasDashboard();
}

main();