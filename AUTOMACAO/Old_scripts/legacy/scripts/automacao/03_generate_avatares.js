// SCRIPT 03 - GERAÇÃO DE AVATARES COM LLM (TERCEIRA ETAPA)
// Usa dados biográficos e competências para gerar perfil visual detalhado via LLM
// REQUER: Script 01 (Biografias) + Script 02 (Competências) executados

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GOOGLE_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

console.log('🎭 SCRIPT 03 - GERAÇÃO DE AVATARES VIA LLM (ETAPA 3/6)');
console.log('==================================================');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (targetEmpresaId) {
  console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
} else {
  console.log('⚠️ Nenhuma empresa específica - processará primeira empresa ativa');
}

async function generateAvatarWithLLM(persona, empresaInfo) {
  try {
    console.log(`  🤖 Gerando avatar baseado no perfil completo para ${persona.full_name}...`);

    // Preparar dados da persona para LLM (biografia + competências)
    const personaData = {
      nome: persona.full_name,
      cargo: persona.role,
      departamento: persona.department,
      especialidade: persona.specialty,
      biografia: persona.biografia_completa,
      personalidade: persona.personalidade,
      experiencia_anos: persona.experiencia_anos,
      soft_skills: persona.soft_skills ? JSON.parse(persona.soft_skills) : {},
      hard_skills: persona.hard_skills ? JSON.parse(persona.hard_skills) : {},
      empresa: empresaInfo.nome,
      industria: empresaInfo.industria || empresaInfo.industry
    };

    // Prompt para LLM gerar dados do avatar
    const prompt = `
Analise os dados da persona abaixo e gere um perfil visual detalhado para criação de avatar AI consistente:

DADOS DA PERSONA:
${JSON.stringify(personaData, null, 2)}

RESPONDA SOMENTE COM JSON VÁLIDO no seguinte formato:

{
  "avatar_url": "https://images.unsplash.com/[URL_APROPRIADA]",
  "avatar_thumbnail_url": "https://images.unsplash.com/[URL_APROPRIADA_THUMB]",
  "prompt_usado": "[prompt detalhado para geração de avatar AI]",
  "estilo": "[formal/casual/business/criativo]",
  "background_tipo": "[office/studio/outdoor/neutral]",
  "servico_usado": "gemini_ai",
  "versao": 1,
  "ativo": true,
  "biometrics": {
    "idade_aparente": "[faixa etária]",
    "genero": "[masculino/feminino/neutro]",
    "etnia": "[caucasiano/negro/asiatico/latino/misto]",
    "tipo_fisico": "[descrição do biotipo]",
    "altura_estimada": "[faixa de altura]",
    "cabelo_cor": "[cor do cabelo]",
    "cabelo_estilo": "[estilo do cabelo]",
    "olhos_cor": "[cor dos olhos]",
    "pele_tom": "[tom da pele]",
    "caracteristicas_distintivas": "[características marcantes]",
    "estilo_vestimenta": "[descrição do estilo de roupa]",
    "acessorios": "[acessórios típicos]",
    "postura": "[descrição da postura corporal]",
    "expressao_facial": "[expressão típica]"
  },
  "history": {
    "background_educacional": "[formação que justifica aparência profissional]",
    "experiencia_internacional": "[experiências que influenciam estilo]",
    "contexto_cultural": "[influências culturais na aparência]",
    "estilo_vida": "[estilo de vida que reflete na aparência]",
    "marcos_carreira": "[momentos que moldaram apresentação profissional]",
    "valores_pessoais": "[valores refletidos na aparência]",
    "ambiente_trabalho": "[como ambiente de trabalho influencia vestimenta]",
    "redes_sociais": "[presença digital e imagem]"
  },
  "metadados": {
    "resolucao": "1024x1024",
    "formato": "webp",
    "qualidade": "ultra_high",
    "parametros_geracao": {
      "prompt_negativo": "blurry, low quality, distorted, cartoonish",
      "steps": 30,
      "cfg_scale": 8.5
    },
    "contexto_profissional": {
      "cargo": "[cargo da persona]",
      "industria": "[indústria]",
      "senioridade": "[nível hierárquico]"
    }
  }
}

REGRAS IMPORTANTES:
1. Base a aparência física na biografia e personalidade fornecida
2. Considere o cargo e indústria para definir estilo profissional
3. Seja específico e detalhado nas descrições físicas
4. Use URLs do Unsplash apropriadas para o perfil (formato: photo-[ID]?w=400&h=400&fit=crop&crop=face)
5. O prompt_usado deve ser detalhado para geração consistente de avatares AI
6. Mantenha coerência entre biometrics e history
7. Responda APENAS com JSON válido, sem texto adicional
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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
      console.error('    ❌ Erro ao parsear JSON da LLM:', parseError.message);
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
      biometrics: JSON.stringify(avatarData.biometrics),
      history: JSON.stringify(avatarData.history),
      metadados: JSON.stringify(avatarData.metadados),
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
    const outputDir = path.join(process.cwd(), 'output', 'avatares', empresaInfo.nome);
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

    console.log(`    ✅ Avatar LLM gerado: ${avatarData.estilo} - ${avatarData.biometrics.genero}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao gerar avatar LLM para ${persona.full_name}:`, error.message);
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
      return;
    }

    console.log(`\n🤖 Gerando avatares LLM para ${personasSemAvatar.length} personas...`);

    // 4. Gerar avatares via LLM
    let sucessos = 0;
    let erros = 0;

    for (const persona of personasSemAvatar) {
      const sucesso = await generateAvatarWithLLM(persona, empresa);
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
    console.log('\n📊 RELATÓRIO DE AVATARES LLM');
    console.log('============================');
    console.log(`✅ Avatares gerados com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na geração: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasSemAvatar.length) * 100).toFixed(1)}%`);
    console.log(`🗃️ Dados salvos na tabela: personas_avatares`);

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 00 - AVATARES LLM CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 0:', error);
    process.exit(1);
  }
}

generateAvatares();