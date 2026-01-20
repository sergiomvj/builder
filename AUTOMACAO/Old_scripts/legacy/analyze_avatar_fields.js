require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeAvatarData() {
  try {
    console.log('🔍 ANÁLISE DA TABELA AVATARES_PERSONAS\n');
    
    // 1. Verificar estrutura da tabela
    console.log('📋 CAMPOS DA TABELA avatares_personas:');
    console.log('=====================================');
    console.log('✅ id (uuid) - Chave primária');
    console.log('✅ persona_id (uuid) - FK para personas');
    console.log('✅ avatar_url (varchar) - URL da imagem principal');
    console.log('✅ avatar_thumbnail_url (varchar) - URL da miniatura');
    console.log('✅ prompt_usado (text) - Prompt enviado para a IA');
    console.log('✅ estilo (varchar) - corporate|casual|creative|formal');
    console.log('✅ background_tipo (varchar) - office|home_office|neutral|custom');
    console.log('✅ servico_usado (varchar) - nano_banana|dall_e|midjourney|custom');
    console.log('✅ versao (integer) - Número da versão do avatar');
    console.log('✅ ativo (boolean) - Avatar ativo atual');
    console.log('✅ metadados (jsonb) - Dados técnicos da geração');
    console.log('✅ created_at (timestamp) - Data de criação');

    // 2. Buscar dados reais
    const { data: avatares, error } = await supabase
      .from('avatares_personas')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar avatares:', error);
      return;
    }

    console.log(`\n📊 DADOS ENCONTRADOS: ${avatares?.length || 0} avatares`);

    if (avatares && avatares.length > 0) {
      console.log('\n🎨 EXEMPLO DE AVATAR:');
      console.log('=====================');
      const avatar = avatares[0];
      Object.entries(avatar).forEach(([key, value]) => {
        if (key === 'metadados') {
          console.log(`${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`${key}: ${value}`);
        }
      });

      // Analisar metadados
      console.log('\n🔧 METADADOS GERADOS PELA LLM:');
      console.log('==============================');
      
      const metadados = avatar.metadados;
      if (metadados) {
        console.log('📐 Resolução:', metadados.resolucao || 'N/A');
        console.log('📄 Formato:', metadados.formato || 'N/A');
        console.log('📦 Tamanho:', metadados.tamanho_arquivo ? `${(metadados.tamanho_arquivo / 1024).toFixed(1)} KB` : 'N/A');
        console.log('🎲 Seed:', metadados.seed_usado || 'N/A');
        console.log('⏱️ Tempo de geração:', metadados.tempo_geracao ? `${metadados.tempo_geracao.toFixed(2)}s` : 'N/A');
        console.log('💰 Custo estimado:', metadados.custo_estimado ? `$${metadados.custo_estimado.toFixed(3)}` : 'N/A');
        
        if (metadados.parametros_geracao) {
          console.log('\n🤖 PARÂMETROS DA IA:');
          console.log('Steps:', metadados.parametros_geracao.steps);
          console.log('CFG Scale:', metadados.parametros_geracao.cfg_scale);
          console.log('Sampler:', metadados.parametros_geracao.sampler);
          console.log('Prompt:', metadados.parametros_geracao.prompt?.substring(0, 100) + '...');
        }
      }

      // Análise de características extraídas
      console.log('\n🧬 CARACTERÍSTICAS EXTRAÍDAS:');
      console.log('============================');
      console.log('🎭 Estilo:', avatar.estilo);
      console.log('🏢 Background:', avatar.background_tipo);
      console.log('🔧 Serviço:', avatar.servico_usado);
      console.log('📅 Versão:', avatar.versao);
      console.log('✅ Ativo:', avatar.ativo ? 'Sim' : 'Não');

    } else {
      console.log('\n❌ NENHUM AVATAR ENCONTRADO!');
      console.log('💡 Execute o Script 0 para gerar avatares');
    }

    // 3. Dados necessários para o card
    console.log('\n📱 DADOS PARA EXIBIR NO CARD:');
    console.log('=============================');
    console.log('🖼️  Avatar principal: avatar_url ou avatar_thumbnail_url');
    console.log('🎨  Estilo visual: estilo (corporate/casual/creative/formal)');
    console.log('📅  Versão: versao (número)');
    console.log('🔧  Serviço: servico_usado (nano_banana/dall_e/midjourney)');
    console.log('⭐  Status: ativo (avatar atual)');
    console.log('🎲  Seed: metadados.seed_usado (para reproduzir)');
    console.log('💰  Custo: metadados.custo_estimado (transparência)');
    console.log('🤖  Prompt: prompt_usado (para editar/melhorar)');
    console.log('🏢  Background: background_tipo (contexto)');

  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

analyzeAvatarData();