// Script de teste para verificar se consegue salvar dados na tabela avatares_personas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DE INSERÇÃO NA TABELA avatares_personas');
console.log('===============================================');

async function testAvatarInsert() {
  try {
    // 1. Buscar a primeira persona da ARVA Tech
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
    console.log(`🤖 Testando com persona: ${persona.full_name}`);

    // 2. Dados mock de avatar
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
      biometrics: JSON.stringify({
        genero: 'masculino',
        idade_aparente: 32,
        etnia: 'caucasiano',
        cor_cabelo: 'castanho_escuro',
        cor_olhos: 'castanhos',
        estatura: 'média',
        biotipo: 'atlético'
      }),
      history: JSON.stringify({
        formacao_academica: ['Engenharia de Software'],
        experiencia_anos: 8,
        empresas_anteriores: ['TechCorp', 'SoftwarePlus'],
        certificacoes: ['AWS Certified', 'Scrum Master'],
        idiomas: ['português', 'inglês']
      }),
      metadados: JSON.stringify({
        generated_at: new Date().toISOString(),
        script_version: '03_test',
        confidence_score: 95
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 3. Tentar inserir
    console.log('💾 Tentando inserir registro...');
    const { data: insertResult, error: insertError } = await supabase
      .from('avatares_personas')
      .insert(avatarRecord)
      .select('*');

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError.message);
      console.error('📋 Detalhes:', insertError);
      return;
    }

    console.log('✅ Registro inserido com sucesso!');
    console.log('📋 ID do registro:', insertResult[0].id);
    
    // 4. Verificar se foi salvo
    const { data: verificacao, error: verifyError } = await supabase
      .from('avatares_personas')
      .select('*')
      .eq('persona_id', persona.id);

    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError.message);
      return;
    }

    console.log('🔍 Verificação - Registros encontrados:', verificacao.length);
    if (verificacao.length > 0) {
      console.log('✅ TESTE BEM-SUCEDIDO - Dados foram salvos corretamente!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testAvatarInsert();