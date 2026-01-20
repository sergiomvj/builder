// @ts-nocheck
// SCRIPT 0 - GERAÇÃO DE AVATARES COM LLM PARA TABELA personas_avatares
// Usa dados biográficos da persona para gerar perfil visual detalhado via LLM

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getNomeAleatorio, getPrimeiroNomeParaEmail, getSobrenomeParaEmail } from './lib/nomes_nacionalidades.js';

// Configuração
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GOOGLE_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

// Arquivo de controle para parar execução
const STOP_FILE = path.join(process.cwd(), 'AUTOMACAO', '.stop_avatares');
const PROGRESS_FILE = path.join(process.cwd(), 'AUTOMACAO', 'script-progress.json');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    status,
    current,
    total,
    currentPersona,
    errors,
    startedAt: status === 'running' && current === 0 ? new Date().toISOString() : null,
    completedAt: status === 'completed' ? new Date().toISOString() : null
  };
  
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.error('⚠️  Erro ao atualizar progresso:', err.message);
  }
}

function checkStopSignal() {
  if (fs.existsSync(STOP_FILE)) {
    console.log('\n🛑 SINAL DE PARADA DETECTADO!');
    fs.unlinkSync(STOP_FILE);
    updateProgress('stopped', 0, 0);
    return true;
  }
  return false;
}

console.log('🎭 SCRIPT 0 - GERAÇÃO DE AVATARES VIA LLM');
console.log('==========================================');
console.log('⚠️  LIMITES DO GOOGLE AI STUDIO (Imagens):');
console.log('    - Delay obrigatório: 120s entre requisições');
console.log('    - Este script levará ~30 minutos para 15 personas');
console.log('    - CRÍTICO: Não interrompa ou excederá limite diário');
console.log('==========================================\n');

// Parâmetros do script
let targetEmpresaId = null;
let forceClean = false;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
  } else if (arg === '--force') {
    forceClean = true;
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
    // Se persona ainda não tem nome, gerar baseado na nacionalidade
    let nomeCompleto = persona.full_name;
    let email = persona.email;
    let genero = persona.genero;
    
    if (!nomeCompleto && persona.nacionalidade) {
      // Gerar gênero aleatório (50/50)
      genero = Math.random() > 0.5 ? 'masculino' : 'feminino';
      
      // Gerar nome apropriado à nacionalidade
      nomeCompleto = getNomeAleatorio(persona.nacionalidade, genero);
      
      // Gerar email baseado no nome
      const primeiroNome = getPrimeiroNomeParaEmail(nomeCompleto);
      const sobrenome = getSobrenomeParaEmail(nomeCompleto);
      const dominio = empresaInfo.dominio || `${empresaInfo.codigo.toLowerCase()}.com`;
      email = `${primeiroNome}.${sobrenome}@${dominio}`;
      
      console.log(`  ✨ Nome gerado: ${nomeCompleto} (${persona.nacionalidade}, ${genero})`);
      
      // Atualizar persona no banco com nome e email
      await supabase
        .from('personas')
        .update({ 
          full_name: nomeCompleto, 
          email: email,
          genero: genero
        })
        .eq('id', persona.id);
    }
    
    console.log(`  🤖 Gerando avatar via LLM para ${nomeCompleto}...`);

    // Preparar dados COMPLETOS da persona para LLM
    const personaData = {
      nome: nomeCompleto,
      nacionalidade: persona.nacionalidade,
      genero: genero,
      cargo: persona.role,
      departamento: persona.department,
      especialidade: persona.specialty,
      atribuicoes: persona.atribuicoes || 'Em definição',
      competencias: persona.competencias || 'Em definição',
      biografia: persona.biografia_completa || 'Profissional experiente',
      personalidade: persona.personalidade || 'Profissional e dedicado',
      experiencia_anos: persona.experiencia_anos || '5+',
      empresa: empresaInfo.nome,
      industria: empresaInfo.industria || empresaInfo.industry
    };

    // Prompt CONTEXTUALIZADO para LLM
    const prompt = `
Você é um especialista em criação de personas profissionais realistas.

Analise os dados COMPLETOS abaixo e gere um perfil visual EXTREMAMENTE DETALHADO e CONTEXTUALIZADO:

DADOS DA PERSONA:
${JSON.stringify(personaData, null, 2)}

INSTRUÇÕES CRÍTICAS:
1. O NOME já foi gerado apropriadamente para a NACIONALIDADE (${persona.nacionalidade})
2. O GÊNERO é ${genero}
3. Use características físicas TÍPICAS da nacionalidade ${persona.nacionalidade}:
   - Americanos: diversidade étnica, tons de pele variados
   - Brasileiros: mistura étnica (europeia/africana/indígena), tons morenos
   - Europeus: características caucasianas diversas (nórdicos, mediterrâneos)
   - Asiáticos: características asiáticas (leste asiático, sul asiático)
4. Considere o CARGO (${persona.role}) e INDÚSTRIA (${empresaInfo.industria}) para:
   - Estilo de vestimenta apropriado
   - Idade estimada (CEO = 40-55 anos, Junior = 22-28 anos, etc.)
   - Acessórios profissionais
5. Seja EXTREMAMENTE ESPECÍFICO nas descrições físicas

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
    "cabelo_cor": "[cor exata do cabelo - ex: castanho escuro, ruivo cobre, loiro areia]",
    "cabelo_comprimento": "[curto/médio/longo]",
    "cabelo_estilo": "[liso/ondulado/cacheado/raspado/coque/franja]",
    "cabelo_volume": "[volumoso/fino/denso]",
    "olhos_cor": "[cor exata - castanhos escuros/mel/verdes/azuis]",
    "olhos_formato": "[amendoados/grandes/pequenos/caídos/expressivos]",
    "rosto_formato": "[oval/redondo/quadrado/angular]",
    "pele_tom": "[pálida/bronzeada/morena clara/negra profunda/oliva]",
    "pele_textura": "[lisa/com sardas/com rugas leves/poros aparentes]",
    "sobrancelhas": "[grossas/finas/arqueadas/retas/cheias]",
    "nariz": "[fino/largo/arrebitado/romano]",
    "boca_labios": "[finos/grossos/médios/arqueados/retos]",
    "expressao_facial_padrao": "[neutra/sorriso leve/confiante/séria]",
    "marcas_unicas": "[cicatrizes/sinais/tatuagens/sardas específicas]",
    "acessorios_permanentes": "[óculos cor/formato, brincos, piercings, relógios, colares]",
    "postura": "[ereta/relaxada/confiante]",
    "caracteristicas_distintivas": "[características marcantes adicionais]",
    "estilo_vestimenta_padrao": "[formal/casual/techwear/elegante/executivo/esportivo]",
    "paleta_cores_vestuario": "[azul frio/cinza neutro/paleta quente/tons terrosos]"
  },
  "physical_description_detailed": {
    "rosto": {
      "formato": "[descrição detalhada]",
      "tom_pele": "[descrição exata]",
      "textura_pele": "[descrição]",
      "olhos": {
        "cor": "[cor exata]",
        "formato": "[descrição]"
      },
      "sobrancelhas": "[descrição]",
      "nariz": "[descrição]",
      "boca": "[descrição]",
      "expressao_tipica": "[descrição]"
    },
    "cabelo": {
      "cor_exata": "[cor específica]",
      "comprimento": "[medida]",
      "estilo": "[descrição detalhada]",
      "volume": "[descrição]"
    },
    "corpo": {
      "altura_aproximada": "[medida]",
      "tipo_fisico": "[descrição]",
      "proporcao": "[descrição]",
      "postura_tipica": "[descrição]"
    }
  },
  "consistency_parameters": {
    "rendering_style": "realista/foto 4K/retrato editorial/cinematic lighting/DSLR look",
    "lens_focus": "50mm/85mm/close-up/half-body shot/full-body shot",
    "lighting": "soft studio light/natural window light/dramatic cinematic lighting",
    "aspect_ratio": "1:1 (avatar)/3:4 (retrato)/16:9 (full body)"
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

REGRAS CRÍTICAS PARA CONSISTÊNCIA:
1. SEMPRE use os MESMOS TERMOS para características físicas em todas as gerações
2. Seja EXTREMAMENTE ESPECÍFICO nas descrições (ex: "castanho escuro" não apenas "castanho")
3. Inclua TODOS os 15 parâmetros essenciais de consistência
4. Base a aparência na biografia, personalidade e cargo fornecidos
5. Considere indústria e senioridade para estilo profissional
6. O prompt_usado deve conter TODOS os parâmetros físicos na mesma ordem sempre
7. Responda APENAS com JSON válido, sem texto adicional
8. Use URLs do Unsplash apropriadas (formato: photo-[ID]?w=400&h=400&fit=crop&crop=face)
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    let result;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        result = await model.generateContent(prompt);
        break; // Sucesso, sair do loop
      } catch (error) {
        if (error.message?.includes('429') || error.message?.includes('Resource Exhausted') || error.message?.includes('quota')) {
          retries++;
          console.error(`    ⚠️  Erro 429 (Rate Limit Google AI Free) - Tentativa ${retries}/${MAX_RETRIES}`);
          
          if (retries < MAX_RETRIES) {
            const backoffTime = 60000 * retries; // 1min, 2min, 3min
            console.log(`    ⏳ Aguardando ${backoffTime/1000}s antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          } else {
            console.error(`    ❌ LIMITE DIÁRIO DO GOOGLE AI STUDIO FREE ATINGIDO!`);
            console.error(`    💡 Você já atingiu o limite de ~10-15 imagens por dia.`);
            console.error(`    💡 Solução: Execute novamente amanhã (reset à meia-noite PT) ou migre para API Key paga.`);
            return false;
          }
        } else {
          throw error; // Outro tipo de erro
        }
      }
    }
    
    if (!result) return false;
    
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

    // CRÍTICO: Gerar System Prompt detalhado e salvar na tabela personas
    const systemPrompt = {
      descricao_fisica_completa: {
        // 15 Parâmetros Essenciais para Consistência
        tom_pele: avatarData.biometrics.pele_tom,
        formato_rosto: avatarData.biometrics.rosto_formato,
        olhos: {
          cor: avatarData.biometrics.olhos_cor,
          formato: avatarData.biometrics.olhos_formato
        },
        nariz: avatarData.biometrics.nariz,
        boca_labios: avatarData.biometrics.boca_labios,
        expressao_tipica: avatarData.biometrics.expressao_facial_padrao,
        cabelo: {
          cor: avatarData.biometrics.cabelo_cor,
          comprimento: avatarData.biometrics.cabelo_comprimento,
          textura: avatarData.biometrics.cabelo_estilo,
          volume: avatarData.biometrics.cabelo_volume
        },
        tipo_fisico: avatarData.biometrics.tipo_fisico,
        altura_aproximada: avatarData.biometrics.altura_estimada,
        postura_tipica: avatarData.biometrics.postura,
        marcas_unicas: avatarData.biometrics.marcas_unicas,
        acessorios_permanentes: avatarData.biometrics.acessorios_permanentes,
        estilo_roupa_padrao: avatarData.biometrics.estilo_vestimenta_padrao,
        estilo_renderizacao: avatarData.consistency_parameters?.rendering_style || 'realista'
      },
      parametros_detalhados: avatarData.physical_description_detailed || {},
      parametros_consistencia: avatarData.consistency_parameters || {},
      prompt_completo_geracao: avatarData.prompt_usado,
      metadata_geracao: {
        generated_at: new Date().toISOString(),
        service: 'gemini_ai',
        version: avatarData.versao,
        reference_doc: 'Descricao_Fisica_Personagens.md'
      }
    };

    // Atualizar tabela personas com system_prompt
    const { error: updateError } = await supabase
      .from('personas')
      .update({
        system_prompt: JSON.stringify(systemPrompt, null, 2)
      })
      .eq('id', persona.id);

    if (updateError) {
      console.error('    ⚠️  Erro ao atualizar system_prompt:', updateError.message);
      // Não retorna false aqui pois o avatar foi salvo com sucesso
    } else {
      console.log('    ✅ System Prompt (descrição física) salvo na tabela personas');
    }

    // Salvar backup local
    const outputDir = path.join(process.cwd(), '04_BIOS_PERSONAS_REAL', empresaInfo.nome);
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

/**
 * Limpa avatares existentes de uma empresa
 * Usado quando flag --force é ativada
 */
async function cleanupAvatares(empresaId) {
  console.log('\n🧹 Limpando avatares anteriores...');
  
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);
  
  if (!personas || personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada');
    return;
  }
  
  const personaIds = personas.map(p => p.id);
  
  // Deletar avatares existentes
  const { error: deleteError } = await supabase
    .from('personas_avatares')
    .delete()
    .in('persona_id', personaIds);
  
  if (deleteError) {
    console.error('❌ Erro ao limpar avatares:', deleteError.message);
    throw deleteError;
  }
  
  // Limpar system_prompt das personas
  const { error: updateError } = await supabase
    .from('personas')
    .update({ system_prompt: null })
    .in('id', personaIds);
  
  if (updateError) {
    console.error('⚠️  Aviso: Erro ao limpar system_prompt:', updateError.message);
    // Não lança erro, system_prompt será sobrescrito de qualquer forma
  }
  
  console.log(`✅ Avatares anteriores removidos (${personaIds.length} personas)`);
  console.log(`✅ System Prompts limpos (serão regerados)`);
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
    
    // 1.5. Verificar flag --force e limpar dados anteriores
    if (forceClean) {
      console.log('\n⚠️  FLAG --force DETECTADA: Limpando dados anteriores...');
      await cleanupAvatares(empresa.id);
    } else {
      console.log('\nℹ️  Modo incremental: apenas personas sem avatar serão processadas');
      console.log('   Use --force para regenerar todos os avatares');
    }
    
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
    const DELAY_BETWEEN_REQUESTS = 120000; // 120 segundos (2 minutos) - OBRIGATÓRIO para Google AI
    const MAX_DAILY_LIMIT = 15; // Limite seguro para conta Free

    console.log(`\n⏱️  Processando ${personasSemAvatar.length} personas com delay de ${DELAY_BETWEEN_REQUESTS/1000}s entre cada`);
    console.log(`⏰ Tempo estimado total: ${Math.ceil((personasSemAvatar.length * DELAY_BETWEEN_REQUESTS) / 60000)} minutos\n`);

    // Processar todas as personas (sem limite)
    const personasToProcess = personasSemAvatar;
    
    // Inicializar progresso
    updateProgress('running', 0, personasToProcess.length);

    for (let i = 0; i < personasToProcess.length; i++) {
      const persona = personasToProcess[i];
      
      // Atualizar progresso
      updateProgress('running', i, personasToProcess.length, persona.full_name);
      
      // Verificar sinal de parada
      if (checkStopSignal()) {
        console.log('⚠️  Execução interrompida pelo usuário');
        console.log(`📊 Processadas: ${i} de ${personasToProcess.length} personas`);
        break;
      }
      
      console.log(`\n[${i + 1}/${personasToProcess.length}] Processando ${persona.full_name}...`);
      
      const sucesso = await generateAvatarWithLLM(persona, empresa);
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
      }
      
      // Pausa entre requests para respeitar limites do Google AI Studio Free
      if (i < personasSemAvatar.length - 1) {
        console.log(`  ⏳ Aguardando ${DELAY_BETWEEN_REQUESTS/1000}s antes da próxima requisição...`);
        
        // Verificar stop signal durante o delay (a cada 5 segundos)
        const checkInterval = 5000;
        for (let elapsed = 0; elapsed < DELAY_BETWEEN_REQUESTS; elapsed += checkInterval) {
          if (checkStopSignal()) {
            console.log('⚠️  Execução interrompida durante aguardo');
            break;
          }
          await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, DELAY_BETWEEN_REQUESTS - elapsed)));
        }
        
        if (checkStopSignal()) break;
      }
    }

    // 5. Finalizar progresso
    updateProgress('completed', personasToProcess.length, personasToProcess.length, '', 
      erros > 0 ? [`${erros} erros durante o processamento`] : []);
    
    // 6. Atualizar status da empresa
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
      console.log('\n🎉 SCRIPT 0 - AVATARES LLM CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 0:', error);
    process.exit(1);
  }
}

generateAvatares();