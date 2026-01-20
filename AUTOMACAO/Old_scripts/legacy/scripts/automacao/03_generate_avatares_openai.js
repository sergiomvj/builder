// SCRIPT 03 - GERAÇÃO DE AVATARES COM OPENAI (FALLBACK)
// Versão que usa OpenAI quando Gemini não está disponível

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎭 SCRIPT 03 - GERAÇÃO DE AVATARES VIA OPENAI (ETAPA 3/6)');
console.log('======================================================');

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

async function generateAvatarWithOpenAI(persona, empresaInfo) {
  try {
    console.log(`  🤖 Gerando avatar via OpenAI para ${persona.full_name}...`);

    // Dados base da persona
    const personaData = {
      id: persona.id,
      nome: persona.full_name,
      cargo: persona.cargo,
      departamento: persona.departamento,
      biografia: persona.biografia || 'Biografia não disponível'
    };

    // Prompt para OpenAI
    const prompt = `
Crie um perfil visual detalhado para esta persona profissional:

DADOS DA PERSONA:
- Nome: ${persona.full_name}
- Cargo: ${persona.cargo}
- Departamento: ${persona.departamento}
- Empresa: ${empresaInfo.nome} (${empresaInfo.setor})
- Biografia: ${persona.biografia}

TAREFA: Gere um perfil de avatar profissional em JSON com esta estrutura exata:

{
  "avatar_url": "https://images.unsplash.com/photo-[ID]?w=400&h=400&fit=crop&crop=face",
  "avatar_thumbnail_url": "https://images.unsplash.com/photo-[ID]?w=100&h=100&fit=crop&crop=face",
  "prompt_usado": "[descrição detalhada para gerador de imagem]",
  "estilo": "[estilo profissional]",
  "background_tipo": "[tipo de fundo]",
  "servico_usado": "openai_gpt4",
  "versao": "v1.0",
  "ativo": true,
  "biometrics": {
    "genero": "[masculino/feminino]",
    "idade_aparente": [número],
    "etnia": "[etnia]",
    "cor_cabelo": "[cor]",
    "cor_olhos": "[cor]",
    "estatura": "[baixa/média/alta]",
    "biotipo": "[tipo físico]"
  },
  "history": {
    "formacao_academica": ["[área de formação]"],
    "experiencia_anos": [número],
    "empresas_anteriores": ["[empresa1]", "[empresa2]"],
    "certificacoes": ["[certificação1]"],
    "idiomas": ["português", "inglês"]
  },
  "metadados": {
    "industria": "[indústria]",
    "senioridade": "[nível hierárquico]"
  }
}

REGRAS:
1. Base a aparência na biografia e cargo
2. Use URLs do Unsplash apropriadas (formato: photo-[ID]?w=400&h=400&fit=crop&crop=face)
3. Seja específico e realista
4. Mantenha coerência profissional
5. Responda APENAS com JSON válido
`;

    // Chamada para OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',  // Modelo mais barato e eficiente
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em criar perfis visuais para personas profissionais. Responda sempre em JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;

    // Parse do JSON retornado
    let avatarData;
    try {
      // Limpar qualquer texto antes/depois do JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      avatarData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('    ❌ Erro ao parsear JSON da OpenAI:', parseError.message);
      console.error('    📝 Resposta original:', text.substring(0, 200) + '...');
      return false;
    }

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
    const outputDir = path.join(process.cwd(), 'output', 'avatares_openai', empresaInfo.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `avatar_${persona.full_name.replace(/\s+/g, '_').toLowerCase()}.json`;
    fs.writeFileSync(
      path.join(outputDir, filename),
      JSON.stringify({
        persona: personaData,
        avatar: avatarData,
        generated_at: new Date().toISOString()
      }, null, 2),
      'utf8'
    );

    console.log(`    ✅ Avatar OpenAI gerado: ${avatarData.estilo} - ${avatarData.biometrics.genero}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao gerar avatar OpenAI para ${persona.full_name}:`, error.message);
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

    console.log(`\n🤖 Gerando avatares OpenAI para ${personasSemAvatar.length} personas...`);

    // 4. Gerar avatares via OpenAI
    let sucessos = 0;
    let erros = 0;

    for (const persona of personasSemAvatar) {
      const sucesso = await generateAvatarWithOpenAI(persona, empresa);
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
      }
      
      // Pausa entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    console.log('\n📊 RELATÓRIO DE AVATARES OPENAI');
    console.log('==============================');
    console.log(`✅ Avatares gerados com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na geração: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasSemAvatar.length) * 100).toFixed(1)}%`);
    console.log(`🗃️ Dados salvos na tabela: personas_avatares`);

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