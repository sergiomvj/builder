// Teste rápido para verificar se consegue salvar na tabela personas_avatares
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DE INSERÇÃO - personas_avatares');
console.log('======================================');

async function testPersonasAvatares() {
  try {
    // 1. Buscar uma persona da ARVA Tech
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
      .limit(1);

    if (personasError || !personas.length) {
      console.error('❌ Erro ao buscar personas:', personasError?.message);
      return;
    }

    const persona = personas[0];
    console.log(`🤖 Testando com: ${persona.full_name}`);

    // 2. Dados de teste (estrutura correta)
    const avatarRecord = {
      persona_id: persona.id,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      avatar_thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      prompt_usado: 'Homem profissional, 30-35 anos, cabelo escuro, barba aparada, terno azul marinho',
      estilo: 'Profissional Corporativo',
      background_tipo: 'escritório',
      servico_usado: 'teste_manual',
      versao: 'v1.0',
      ativo: true,
      biometrics: {
        genero: 'masculino',
        idade_aparente: 32,
        etnia: 'caucasiano',
        cor_cabelo: 'castanho_escuro',
        cor_olhos: 'castanhos',
        estatura: 'média',
        biotipo: 'atlético'
      },
      history: {
        formacao_academica: ['Engenharia de Software'],
        experiencia_anos: 8,
        empresas_anteriores: ['TechCorp', 'SoftwarePlus'],
        certificacoes: ['AWS Certified', 'Scrum Master'],
        idiomas: ['português', 'inglês']
      },
      metadados: {
        generated_at: new Date().toISOString(),
        script_version: '03_test',
        confidence_score: 95
      }
    };

    // 3. Tentar inserir
    console.log('💾 Inserindo registro de teste...');
    const { data: insertResult, error: insertError } = await supabase
      .from('personas_avatares')
      .insert(avatarRecord)
      .select('*');

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError.message);
      return;
    }

    console.log('✅ Registro inserido com sucesso!');
    console.log('📋 ID:', insertResult[0].id);
    
    // 4. Verificar contagem
    const { data: count, error: countError } = await supabase
      .from('personas_avatares')
      .select('*', { count: 'exact' });

    if (!countError) {
      console.log('📊 Total de avatares na tabela:', count.length);
      console.log('🎯 TABELA personas_avatares FUNCIONANDO PERFEITAMENTE!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testPersonasAvatares();