// Verificação completa: avatares gerados e salvos corretamente
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarAvatares() {
  console.log('🔍 VERIFICAÇÃO COMPLETA DOS AVATARES');
  console.log('=====================================\n');
  
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  // 1. Contar personas
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name, persona_code')
    .eq('empresa_id', empresaId);
  
  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError.message);
    return;
  }
  
  console.log(`📊 Total de personas: ${personas.length}\n`);
  
  // 2. Contar avatares
  const personaIds = personas.map(p => p.id);
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('*')
    .in('persona_id', personaIds);
  
  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }
  
  console.log(`📊 Total de avatares na tabela: ${avatares?.length || 0}\n`);
  
  // 3. Verificar cada persona
  let comAvatar = 0;
  let semAvatar = 0;
  const detalhes = [];
  
  personas.forEach(persona => {
    const avatar = avatares?.find(a => a.persona_id === persona.id);
    
    if (avatar) {
      comAvatar++;
      detalhes.push({
        nome: persona.full_name,
        status: '✅',
        avatar_url: avatar.avatar_url || 'N/A',
        servico: avatar.servico_usado || 'N/A',
        estilo: avatar.estilo || 'N/A',
        ativo: avatar.ativo ? 'Sim' : 'Não'
      });
    } else {
      semAvatar++;
      detalhes.push({
        nome: persona.full_name,
        status: '❌',
        avatar_url: 'SEM AVATAR',
        servico: '-',
        estilo: '-',
        ativo: '-'
      });
    }
  });
  
  // 4. Resumo
  console.log('📈 RESUMO:');
  console.log('==========');
  console.log(`✅ Com avatar: ${comAvatar}`);
  console.log(`❌ Sem avatar: ${semAvatar}`);
  console.log(`📊 Percentual: ${((comAvatar / personas.length) * 100).toFixed(1)}%\n`);
  
  // 5. Listar primeiras 5 personas
  console.log('📋 PRIMEIRAS 5 PERSONAS:');
  console.log('========================');
  detalhes.slice(0, 5).forEach(d => {
    console.log(`\n${d.status} ${d.nome}`);
    console.log(`   URL: ${d.avatar_url}`);
    console.log(`   Serviço: ${d.servico}`);
    console.log(`   Estilo: ${d.estilo}`);
    console.log(`   Ativo: ${d.ativo}`);
  });
  
  // 6. Listar personas SEM avatar (se houver)
  if (semAvatar > 0) {
    console.log('\n\n⚠️  PERSONAS SEM AVATAR:');
    console.log('========================');
    detalhes.filter(d => d.status === '❌').forEach(d => {
      console.log(`   - ${d.nome}`);
    });
  }
  
  // 7. Verificar campos importantes do primeiro avatar
  if (avatares && avatares.length > 0) {
    const primeiroAvatar = avatares[0];
    console.log('\n\n🔬 DETALHES DO PRIMEIRO AVATAR:');
    console.log('================================');
    console.log(`ID: ${primeiroAvatar.id}`);
    console.log(`Persona ID: ${primeiroAvatar.persona_id}`);
    console.log(`Avatar URL: ${primeiroAvatar.avatar_url || 'NULL'}`);
    console.log(`Thumbnail URL: ${primeiroAvatar.avatar_thumbnail_url || 'NULL'}`);
    console.log(`Estilo: ${primeiroAvatar.estilo || 'NULL'}`);
    console.log(`Background: ${primeiroAvatar.background_tipo || 'NULL'}`);
    console.log(`Serviço: ${primeiroAvatar.servico_usado || 'NULL'}`);
    console.log(`Ativo: ${primeiroAvatar.ativo}`);
    console.log(`Versão: ${primeiroAvatar.versao || 'NULL'}`);
    
    // Biometrics (primeiras linhas)
    if (primeiroAvatar.biometrics) {
      const bio = typeof primeiroAvatar.biometrics === 'string' 
        ? JSON.parse(primeiroAvatar.biometrics) 
        : primeiroAvatar.biometrics;
      console.log(`\nBiometrics (primeiros campos):`);
      Object.entries(bio).slice(0, 5).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  if (comAvatar === personas.length) {
    console.log('🎉 PERFEITO! Todos os avatares foram gerados com sucesso!');
  } else if (comAvatar > 0) {
    console.log(`⚠️  PARCIAL: ${comAvatar}/${personas.length} avatares gerados`);
  } else {
    console.log('❌ ERRO: Nenhum avatar foi gerado!');
  }
  console.log('='.repeat(60));
}

verificarAvatares();
