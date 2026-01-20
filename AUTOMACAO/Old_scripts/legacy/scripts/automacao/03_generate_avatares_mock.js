// SCRIPT 03 - VERSÃO DE TESTE com dados mock para verificar funcionamento
// Gera avatares usando dados simulados para testar salvamento na base

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 SCRIPT 03 - TESTE COM DADOS MOCK (ETAPA 3/6)');
console.log('================================================');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
  }
}

// Dados mock para avatares (simulando resposta da LLM)
const avataresMock = [
  {
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    avatar_thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    prompt_usado: 'Homem profissional, 30-35 anos, cabelo escuro, barba aparada, terno azul marinho',
    estilo: 'Profissional Corporativo',
    background_tipo: 'escritório',
    biometrics: {
      genero: 'masculino',
      idade_aparente: 32,
      etnia: 'caucasiano',
      cor_cabelo: 'castanho_escuro',
      cor_olhos: 'castanhos',
      estatura: 'média',
      biotipo: 'atlético'
    }
  },
  {
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b1-5c?w=400&h=400&fit=crop&crop=face',
    avatar_thumbnail_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b1-5c?w=100&h=100&fit=crop&crop=face',
    prompt_usado: 'Mulher profissional, 28-32 anos, cabelo loiro, sorriso confiante, blazer escuro',
    estilo: 'Executiva Moderna',
    background_tipo: 'escritório',
    biometrics: {
      genero: 'feminino',
      idade_aparente: 30,
      etnia: 'caucasiano',
      cor_cabelo: 'loiro',
      cor_olhos: 'azuis',
      estatura: 'média',
      biotipo: 'atlético'
    }
  }
];

async function generateAvatarWithMock(persona, empresaInfo, index) {
  try {
    console.log(`  🤖 Gerando avatar MOCK para ${persona.full_name}...`);

    // Dados base da persona
    const personaData = {
      id: persona.id,
      nome: persona.full_name,
      cargo: persona.cargo,
      departamento: persona.departamento,
      biografia: persona.biografia || 'Biografia não disponível'
    };

    // Selecionar avatar mock baseado no índice
    const mockBase = avataresMock[index % avataresMock.length];
    
    // Criar avatar customizado
    const avatarData = {
      ...mockBase,
      servico_usado: 'mock_data_v1',
      versao: 'test_1.0',
      ativo: true,
      history: {
        formacao_academica: [persona.cargo?.includes('Engineer') ? 'Engenharia' : 'Administração'],
        experiencia_anos: Math.floor(Math.random() * 10) + 5,
        empresas_anteriores: ['TechCorp', 'SoftwarePlus'],
        certificacoes: ['Professional Certification'],
        idiomas: ['português', 'inglês']
      },
      metadados: {
        generated_at: new Date().toISOString(),
        script_version: '03_mock',
        confidence_score: 95,
        mock_data: true
      }
    };

    // Salvar na tabela personas_avatares
    const avatarRecord = {
      persona_id: persona.id,
      avatar_url: avatarData.avatar_url,
      avatar_thumbnail_url: avatarData.avatar_thumbnail_url,
      prompt_usado: avatarData.prompt_usado,
      estilo: avatarData.estilo,
      background_tipo: avatarData.background_tipo,
      servico_usado: avatarData.servico_usado,
      versao: avatarData.versao,
      ativo: avatarData.ativo,
      biometrics: avatarData.biometrics,
      history: avatarData.history,
      metadados: avatarData.metadados,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('personas_avatares')
      .insert(avatarRecord);

    if (insertError) {
      console.error('    ❌ Erro ao salvar avatar:', insertError.message);
      return false;
    }

    // Salvar backup local
    const outputDir = path.join(process.cwd(), 'output', 'avatares_mock', empresaInfo.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `avatar_mock_${persona.full_name.replace(/\s+/g, '_').toLowerCase()}.json`;
    fs.writeFileSync(
      path.join(outputDir, filename),
      JSON.stringify({
        persona: personaData,
        avatar: avatarData,
        generated_at: new Date().toISOString()
      }, null, 2),
      'utf8'
    );

    console.log(`    ✅ Avatar MOCK gerado: ${avatarData.estilo} - ${avatarData.biometrics.genero}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao gerar avatar MOCK para ${persona.full_name}:`, error.message);
    return false;
  }
}

async function generateAvatares() {
  try {
    // 1. Buscar empresa
    let empresa;
    
    if (targetEmpresaId) {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', targetEmpresaId)
        .single();
      
      if (error) throw new Error(`Empresa não encontrada: ${error.message}`);
      empresa = data;
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data.length) throw new Error('Nenhuma empresa ativa encontrada');
      empresa = data[0];
    }

    console.log(`\n🏢 Processando empresa: ${empresa.nome}`);
    
    // 2. Marcar script como em execução
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          avatares: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Buscar personas sem avatar na tabela personas_avatares
    const { data: personasComAvatar } = await supabase
      .from('personas_avatares')
      .select('persona_id')
      .eq('ativo', true);

    const personasComAvatarIds = personasComAvatar?.map(a => a.persona_id) || [];

    const { data: todasPersonas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!todasPersonas.length) {
      console.log('\n⚠️ Nenhuma persona encontrada para esta empresa!');
      return;
    }

    // Filtrar personas que ainda não têm avatar ativo
    const personasSemAvatar = todasPersonas.filter(p => 
      !personasComAvatarIds.includes(p.id)
    );

    if (!personasSemAvatar.length) {
      console.log('\n✅ Todas as personas já possuem avatares ativos!');
      
      // Atualizar status como sucesso
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            avatares: {
              running: false,
              last_result: 'success',
              last_run: new Date().toISOString(),
              total_generated: 0,
              message: 'Todas as personas já possuem avatares'
            }
          }
        })
        .eq('id', empresa.id);
        
      return;
    }

    console.log(`\n🤖 Gerando avatares MOCK para ${personasSemAvatar.length} personas...`);

    // 4. Gerar avatares usando dados mock
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < personasSemAvatar.length; i++) {
      const persona = personasSemAvatar[i];
      const sucesso = await generateAvatarWithMock(persona, empresa, i);
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
      }
      
      // Pausa entre processos
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 5. Atualizar status da empresa
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          avatares: {
            running: false,
            last_result: erros > 0 ? 'partial_success' : 'success',
            last_run: new Date().toISOString(),
            total_generated: sucessos
          }
        }
      })
      .eq('id', empresa.id);

    // 6. Relatório final
    console.log('\n📊 RELATÓRIO DE AVATARES MOCK');
    console.log('============================');
    console.log(`✅ Avatares gerados com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na geração: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasSemAvatar.length) * 100).toFixed(1)}%`);
    console.log(`🗃️ Dados salvos na tabela: personas_avatares`);

    if (sucessos > 0) {
      console.log('\n🎯 TESTE BEM-SUCEDIDO! A estrutura do script está funcionando.');
      console.log('💡 Próximo passo: Corrigir a API do Google Gemini no script original.');
    }

  } catch (error) {
    console.error('❌ Erro durante execução:', error.message);
    
    // Atualizar status como erro
    if (targetEmpresaId) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            avatares: {
              running: false,
              last_result: 'error',
              last_run: new Date().toISOString(),
              error_message: error.message
            }
          }
        })
        .eq('id', targetEmpresaId);
    }
  }
}

generateAvatares();