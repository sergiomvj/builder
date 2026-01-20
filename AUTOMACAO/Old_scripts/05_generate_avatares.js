// @ts-nocheck
// ============================================================================
// SCRIPT 05 - GERAÇÃO DE AVATARES COM LLM
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 04 (competências criadas)
//
// CORREÇÕES IMPLEMENTADAS:
// - Busca biografia estruturada de personas_biografias
// - Busca atribuições de personas_atribuicoes
// - Busca competências de personas_competencias
// - Contexto COMPLETO para aparência visual realista e contextualizada
// ============================================================================

require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { testLLMs, generateWithFallback } = require('./llm_health_checker.cjs');
const fs = require('fs');
const path = require('path');
const { getNomeAleatorio, getPrimeiroNomeParaEmail, getSobrenomeParaEmail } = require('./lib/nomes_nacionalidades.js');

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = process.env.GOOGLE_AI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);// Arquivo de controle para parar execução
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

async function generateAvatarWithLLM(persona, empresaInfo, activeLLM) {
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
      atribuicoes: persona.atribuicoes || 'Responsabilidades técnicas e desenvolvimento',
      competencias: persona.competencias || 'Habilidades técnicas avançadas',
      biografia: persona.biografia_completa || 'Profissional experiente com sólida formação técnica',
      personalidade: persona.personalidade || 'Profissional e dedicado',
      experiencia_anos: persona.experiencia_anos || '5+',
      empresa: empresaInfo.nome,
      industria: empresaInfo.industria || empresaInfo.industry
    };

    // Prompt SIMPLIFICADO para reduzir erros JSON
    const prompt = `Você é um especialista em criação de personas profissionais realistas.

DADOS DA PERSONA:
Nome: ${nomeCompleto}
Gênero: ${genero}
Nacionalidade: ${persona.nacionalidade}
Cargo: ${persona.role}
Empresa: ${empresaInfo.nome}
Indústria: ${empresaInfo.industria || empresaInfo.industry}

INSTRUÇÕES:
1. Gere uma descrição física REALISTA baseada na nacionalidade e cargo
2. Considere idade apropriada para o cargo (CEO=40-55, Junior=22-28, etc.)
3. Use características físicas típicas da nacionalidade

RESPONDA APENAS COM JSON VÁLIDO neste formato EXATO:

{
  "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
  "avatar_thumbnail_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "estilo": "business",
  "genero": "${genero}",
  "idade_aparente": "30-35",
  "etnia": "caucasiano",
  "pele_tom": "morena clara",
  "olhos_cor": "castanhos escuros",
  "cabelo_cor": "castanho escuro",
  "cabelo_comprimento": "curto",
  "tipo_fisico": "atlético",
  "altura_estimada": "1.78m",
  "expressao_facial": "confiante",
  "estilo_vestimenta": "business casual",
  "acessorios": "sem acessórios",
  "caracteristicas_distintivas": "barba bem aparada"
}

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional.`;

    // Use OpenRouter via generateWithFallback
    let result;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    while (retryCount < MAX_RETRIES) {
      try {
        result = await generateWithFallback(activeLLM, prompt, {
          temperature: 0.7,
          maxTokens: 800
        });
        
        if (!result) {
          console.error(`    ❌ OpenRouter falhou para ${persona.full_name}`);
          return false;
        }
        break; // Sucesso, sair do loop
      } catch (error) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          console.error(`    ❌ Erro ao gerar avatar para ${persona.full_name} após ${MAX_RETRIES} tentativas:`, error.message);
          return false;
        }
        console.log(`    ⚠️  Tentativa ${retryCount} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Pausa antes do retry
      }
    }

    // Parse do JSON com validação robusta
    let avatarData;
    try {
      // Limpar resposta da LLM (remover texto extra se houver)
      const cleanResult = result.trim();
      console.log(`    📝 Resposta OpenRouter (primeiros 500 chars): ${cleanResult.substring(0, 500)}...`);
      
      const jsonStart = cleanResult.indexOf('{');
      const jsonEnd = cleanResult.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('JSON não encontrado na resposta');
      }
      
      const jsonString = cleanResult.substring(jsonStart, jsonEnd + 1);
      console.log(`    🔧 JSON extraído: ${jsonString.substring(0, 200)}...`);
      
      avatarData = JSON.parse(jsonString);
      
      // Validar campos obrigatórios
      const requiredFields = ['avatar_url', 'avatar_thumbnail_url', 'estilo', 'genero'];
      for (const field of requiredFields) {
        if (!avatarData[field]) {
          throw new Error(`Campo obrigatório faltando: ${field}`);
        }
      }
      
      console.log(`    ✅ JSON parseado com sucesso: ${avatarData.genero}, ${avatarData.estilo}`);
      
    } catch (parseError) {
      console.error('    ❌ Erro ao parsear JSON da OpenRouter:', parseError.message);
      console.error('    📝 Resposta completa:', result);
      return false;
    }

    // VERIFICAÇÃO CRÍTICA: Garantir que avatarData foi definido
    if (!avatarData) {
      console.error('    ❌ avatarData não foi definido - erro crítico no parsing');
      return false;
    }

    // Salvar na tabela personas_avatares (formato simplificado)
    const avatarRecord = {
      persona_id: persona.id,
      avatar_url: avatarData.avatar_url,
      avatar_thumbnail_url: avatarData.avatar_thumbnail_url,
      prompt_usado: `Avatar profissional: ${avatarData.estilo}, ${avatarData.genero}, ${avatarData.idade_aparente} anos, ${avatarData.etnia}`,
      estilo: avatarData.estilo,
      background_tipo: 'studio',
      servico_usado: 'grok_ai',
      versao: 1,
      ativo: true,
      biometrics: JSON.stringify({
        idade_aparente: avatarData.idade_aparente,
        genero: avatarData.genero,
        etnia: avatarData.etnia,
        tipo_fisico: avatarData.tipo_fisico,
        altura_estimada: avatarData.altura_estimada,
        cabelo_cor: avatarData.cabelo_cor,
        cabelo_comprimento: avatarData.cabelo_comprimento,
        olhos_cor: avatarData.olhos_cor,
        pele_tom: avatarData.pele_tom,
        expressao_facial_padrao: avatarData.expressao_facial,
        estilo_vestimenta_padrao: avatarData.estilo_vestimenta,
        acessorios_permanentes: avatarData.acessorios,
        caracteristicas_distintivas: avatarData.caracteristicas_distintivas
      }),
      history: JSON.stringify({
        contexto_profissional: `${persona.role} na ${empresaInfo.nome}`,
        estilo_vida: 'Profissional dedicado'
      }),
      metadados: JSON.stringify({
        resolucao: '400x400',
        formato: 'jpg',
        qualidade: 'high',
        contexto_profissional: {
          cargo: persona.role,
          industria: empresaInfo.industria || empresaInfo.industry,
          senioridade: 'pleno'
        }
      }),
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
        tom_pele: avatarData.pele_tom,
        formato_rosto: 'oval',
        olhos: {
          cor: avatarData.olhos_cor,
          formato: 'expressivos'
        },
        nariz: 'fino',
        boca_labios: 'médios',
        expressao_tipica: avatarData.expressao_facial,
        cabelo: {
          cor: avatarData.cabelo_cor,
          comprimento: avatarData.cabelo_comprimento,
          textura: 'liso',
          volume: 'médio'
        },
        tipo_fisico: avatarData.tipo_fisico,
        altura_aproximada: avatarData.altura_estimada,
        postura_tipica: 'confiante',
        marcas_unicas: 'nenhuma',
        acessorios_permanentes: avatarData.acessorios,
        estilo_roupa_padrao: avatarData.estilo_vestimenta,
        estilo_renderizacao: 'realista'
      },
      parametros_detalhados: {
        rosto: {
          formato: 'oval',
          tom_pele: avatarData.pele_tom,
          textura_pele: 'lisa',
          olhos: {
            cor: avatarData.olhos_cor,
            formato: 'expressivos'
          },
          sobrancelhas: 'arqueadas',
          nariz: 'fino',
          boca: 'médios',
          expressao_tipica: avatarData.expressao_facial
        },
        cabelo: {
          cor_exata: avatarData.cabelo_cor,
          comprimento: avatarData.cabelo_comprimento,
          estilo: 'moderno',
          volume: 'médio'
        },
        corpo: {
          altura_aproximada: avatarData.altura_estimada,
          tipo_fisico: avatarData.tipo_fisico,
          proporcao: 'equilibrada',
          postura_tipica: 'confiante'
        }
      },
      parametros_consistencia: {
        rendering_style: 'realista',
        lens_focus: 'close-up',
        lighting: 'soft studio light',
        aspect_ratio: '1:1'
      },
      prompt_completo_geracao: `Profissional ${avatarData.genero}, ${avatarData.idade_aparente} anos, ${avatarData.etnia}, ${avatarData.pele_tom}, olhos ${avatarData.olhos_cor}, cabelo ${avatarData.cabelo_cor} ${avatarData.cabelo_comprimento}, ${avatarData.estilo_vestimenta}`,
      metadata_geracao: {
        generated_at: new Date().toISOString(),
        service: 'grok_ai',
        version: 1,
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

    // Salvar backup local com nome sanitizado
    const outputDir = path.join(process.cwd(), '04_BIOS_PERSONAS_REAL', empresaInfo.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Sanitizar nome do arquivo (remover caracteres especiais)
    const sanitizedName = persona.full_name
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_')     // Substitui espaços por underscore
      .toLowerCase();
    
    const filename = `avatar_${sanitizedName}.json`;
    
    try {
      fs.writeFileSync(
        path.join(outputDir, filename),
        JSON.stringify({
          persona: personaData,
          avatar: avatarData,
          generated_at: new Date().toISOString()
        }, null, 2),
        'utf8'
      );
    } catch (fileError) {
      console.warn(`    ⚠️  Erro ao salvar backup local: ${fileError.message}`);
      // Não retorna false pois o avatar foi salvo no banco com sucesso
    }

    console.log(`    ✅ Avatar LLM gerado: ${avatarData.estilo} - ${avatarData.genero}`);
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
    // ✅ TESTAR LLMs ANTES DE COMEÇAR (OpenAI primeiro, depois OpenRouter)
    console.log('🔍 Testando disponibilidade de LLMs (OpenAI → OpenRouter)...\n');
    const activeLLM = await testLLMs();
    if (!activeLLM) {
      console.error('❌ Nenhum LLM disponível. Script abortado.');
      process.exit(1);
    }

    console.log(`✅ LLM ativo: ${activeLLM.provider.toUpperCase()} (${activeLLM.model})\n`);

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
      
      const sucesso = await generateAvatarWithLLM(persona, empresa, activeLLM);
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