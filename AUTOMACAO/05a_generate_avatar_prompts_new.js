// ============================================================================
// SCRIPT 05a - GERAÇÃO DE PROMPTS FÍSICOS PARA AVATARES (LLM)
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 04 (competências criadas)
//
// O QUE FAZ:
// - Busca biografia, atribuições e competências de cada persona
// - Gera descrição física detalhada via LLM (OpenAI/OpenRouter)
// - Cria prompt otimizado para Fal.ai Flux-Pro
// - Salva system_prompt na tabela personas
// - Salva metadados biométricos em personas_avatares (SEM imagens ainda)
//
// PRÓXIMO PASSO: Executar Script 05b para gerar imagens via Fal.ai
//
// FORMATOS DISPONÍVEIS:
// --format=text : Prompt em formato texto estruturado (padrão)
// --format=json  : Prompt em formato JSON estruturado (experimental)
// ============================================================================import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configurar encoding do console
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

console.log('🎭 SCRIPT 05a - GERAÇÃO DE PROMPTS FÍSICOS (LLM)');
console.log('🔄 Usando LLM com fallback: Grok → GLM → Kimi-K2 (FREE) → GPT-3.5 → Qwen → Claude');
console.log('================================================');
console.log('📝 Gera descrições físicas detalhadas via LLM');
console.log(`🎨 Formato do prompt: ${format.toUpperCase()}`);
console.log('💾 Salva prompts otimizados para Fal.ai');
console.log('⚡ Rápido: ~15 personas em 3 minutos');
console.log('================================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '05a_generate_avatar_prompts',
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

/**
 * Gera descrição física detalhada via OpenAI - VERSÃO JSON
 */
async function gerarDescricaoFisicaLLM_JSON(persona, empresaInfo, biografia, atribuicoes, competencias, format = 'text') {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentativa ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Preparar contexto rico
      const biografiaTexto = biografia?.biografia_estruturada
        ? `${biografia.biografia_estruturada.formacao || ''}\n${biografia.biografia_estruturada.experiencia_detalhada || ''}`
        : biografia?.biografia_resumida || 'Profissional experiente';

      const atribuicoesTexto = atribuicoes
        ?.map(a => a.atribuicao)
        .slice(0, 3)
        .join('; ') || 'Responsabilidades técnicas';

      const competenciasTexto = competencias?.competencias_tecnicas
        ?.slice(0, 5)
        .join(', ') || 'Habilidades técnicas';

      // ESTRUTURA JSON PARA MELHOR PROCESSAMENTO DO LLM
      const promptData = {
        role: "Especialista em criação de personas realistas para ambientes corporativos",
        task: "Gerar descrição física detalhada e única para avatar profissional",
        persona: {
          nome: persona.full_name,
          genero: persona.genero || 'não especificado',
          nacionalidade: persona.nacionalidade,
          idade_estimada: persona.experiencia_anos ? `${parseInt(persona.experiencia_anos) + 22}-${parseInt(persona.experiencia_anos) + 27}` : '28-35',
          cargo: persona.role,
          departamento: persona.department
        },
        empresa: {
          nome: empresaInfo.nome,
          industria: empresaInfo.industria || empresaInfo.setor
        },
        contexto_profissional: {
          biografia: biografiaTexto.substring(0, 300),
          atribuicoes_principais: atribuicoesTexto,
          competencias: competenciasTexto
        },
        instrucoes_criticas: [
          "Esta pessoa DEVE ser completamente DIFERENTE de outras personas",
          "VARIE SIGNIFICATIVAMENTE as características físicas",
          persona.nacionalidade === 'Brasil' ? "Considere diversidade étnica brasileira (caucasiano, pardo, afrodescendente, asiático)" : "Considere diversidade étnica apropriada para a nacionalidade",
          persona.genero === 'M' ? "Varie: barba/bigode/sem pelos faciais, calvície/cabelo cheio, óculos/lentes" : "Varie: cabelo curto/médio/longo, maquiagem sutil/natural, óculos/lentes",
          `Idade visual: ${persona.experiencia_anos ? `${parseInt(persona.experiencia_anos) + 22}-${parseInt(persona.experiencia_anos) + 30}` : '28-38'} anos`,
          "Tom de pele: varie entre muito claro, claro, médio, moreno, escuro",
          "Estrutura facial: angular, redonda, oval, quadrada"
        ],
        diferenciacao_por_cargo: {
          desenvolvedor: persona.role.includes('Desenvolvedor') ? "jovem asiático com óculos, senior caucasiano maduro, mulher latina energética" : null,
          lideranca: (persona.role.includes('Gerente') || persona.role.includes('Diretor')) ? "homem negro com barba, mulher loira executiva, asiático minimalista" : null
        },
        output_format: {
          required_fields: ["idade_aparente", "etnia", "pele_tom", "olhos_cor", "cabelo_cor", "cabelo_comprimento", "cabelo_estilo", "tipo_fisico", "altura_estimada", "expressao_facial", "estilo_vestimenta", "acessorios", "caracteristicas_distintivas", "prompt_fal_ai"],
          example: {
            idade_aparente: "30-35",
            etnia: "caucasiano",
            pele_tom: "morena clara",
            olhos_cor: "castanhos escuros",
            cabelo_cor: "castanho escuro",
            cabelo_comprimento: "curto",
            cabelo_estilo: "bem penteado",
            tipo_fisico: "atlético",
            altura_estimada: "1.75m",
            expressao_facial: "confiante e amigável",
            estilo_vestimenta: "business casual",
            acessorios: "óculos discretos",
            caracteristicas_distintivas: "barba bem aparada",
            prompt_fal_ai: "Professional portrait of a 30-35 year old caucasian male with warm brown skin tone, dark brown eyes, short dark brown hair neatly styled, athletic build, 1.75m tall, confident friendly expression, business casual attire, subtle glasses, well-groomed beard, studio lighting, corporate headshot style, high quality, photorealistic"
          }
        }
      };

      const prompt = `INSTRUÇÃO: Você é um especialista em criação de personas realistas. Analise os dados JSON abaixo e gere uma descrição física COMPLETAMENTE ÚNICA.

DADOS JSON:
${JSON.stringify(promptData, null, 2)}

RESPONDA APENAS COM JSON VÁLIDO contendo todos os campos obrigatórios.`;

      console.log('  📤 Gerando descrição física com LLM (formato JSON)...');

      const descricao = await generateJSONWithFallback(prompt, {
        temperature: 0.9, // ALTA temperatura para máxima variação
        maxTokens: 1000,
        timeout: 60000
      });

      console.log(`  📥 Descrição gerada com sucesso (JSON)`);

      // Validar campos obrigatórios
      if (!descricao.prompt_fal_ai || !descricao.etnia) {
        throw new Error('Resposta LLM incompleta');
      }

      console.log(`  ✅ Descrição física gerada: ${descricao.etnia}, ${descricao.idade_aparente} anos`);
      return descricao;

    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        console.error(`    ❌ Erro após ${maxRetries} tentativas:`, error.message);
        return null;
      }
    }
  }

  return null;
}

/**
 * Gera descrição física detalhada via OpenAI - VERSÃO TEXTO (ORIGINAL)
 */
async function gerarDescricaoFisicaLLM(persona, empresaInfo, biografia, atribuicoes, competencias) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentativa ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Preparar contexto rico
      const biografiaTexto = biografia?.biografia_estruturada
        ? `${biografia.biografia_estruturada.formacao || ''}\n${biografia.biografia_estruturada.experiencia_detalhada || ''}`
        : biografia?.biografia_resumida || 'Profissional experiente';

      const atribuicoesTexto = atribuicoes
        ?.map(a => a.atribuicao)
        .slice(0, 3)
        .join('; ') || 'Responsabilidades técnicas';

      const competenciasTexto = competencias?.competencias_tecnicas
        ?.slice(0, 5)
        .join(', ') || 'Habilidades técnicas';

      const prompt = `Você é um especialista em criação de personas realistas para ambientes corporativos.

DADOS DA PERSONA:
Nome: ${persona.full_name}
Gênero: ${persona.genero || 'não especificado'}
Nacionalidade: ${persona.nacionalidade}
Idade: ${persona.experiencia_anos ? `${parseInt(persona.experiencia_anos) + 22}-${parseInt(persona.experiencia_anos) + 27}` : '28-35'} anos
Cargo: ${persona.role}
Departamento: ${persona.department}
Empresa: ${empresaInfo.nome}
Indústria: ${empresaInfo.industria || empresaInfo.setor}

CONTEXTO PROFISSIONAL:
Biografia: ${biografiaTexto.substring(0, 300)}
Principais atribuições: ${atribuicoesTexto}
Competências: ${competenciasTexto}

INSTRUÇÕES CRÍTICAS:
1. Esta pessoa DEVE ser completamente DIFERENTE de outras personas
2. VARIE SIGNIFICATIVAMENTE as características físicas:
   - ${persona.nacionalidade === 'Brasil' ? 'Considere diversidade étnica brasileira (caucasiano, pardo, afrodescendente, asiático)' : ''}
   - ${persona.genero === 'M' ? 'Varie: barba/bigode/sem pelos faciais, calvície/cabelo cheio, óculos/lentes' : 'Varie: cabelo curto/médio/longo, maquiagem sutil/natural, óculos/lentes'}
   - Idade visual: ${persona.experiencia_anos ? `${parseInt(persona.experiencia_anos) + 22}-${parseInt(persona.experiencia_anos) + 30}` : '28-38'} anos
   - Tom de pele: varie entre muito claro, claro, médio, moreno, escuro
   - Estrutura facial: angular, redonda, oval, quadrada

3. IMPORTANTE: Para cargos similares, DIFERENCIE pela aparência física:
   ${persona.role.includes('Desenvolvedor') ? '- Desenvolvedor pode ser: jovem asiático com óculos, senior caucasiano maduro, mulher latina energética, etc.' : ''}
   ${persona.role.includes('Gerente') || persona.role.includes('Diretor') ? '- Liderança pode ser: homem negro com barba, mulher loira executiva, asiático minimalista, etc.' : ''}

4. Gere prompt Fal.ai com MÁXIMO DETALHE para garantir pessoa ÚNICA

RESPONDA APENAS COM JSON VÁLIDO:

{
  "idade_aparente": "30-35",
  "etnia": "caucasiano",
  "pele_tom": "morena clara",
  "olhos_cor": "castanhos escuros",
  "cabelo_cor": "castanho escuro",
  "cabelo_comprimento": "curto",
  "cabelo_estilo": "bem penteado",
  "tipo_fisico": "atlético",
  "altura_estimada": "1.75m",
  "expressao_facial": "confiante e amigável",
  "estilo_vestimenta": "business casual",
  "acessorios": "óculos discretos",
  "caracteristicas_distintivas": "barba bem aparada",
  "prompt_fal_ai": "Professional portrait of a 30-35 year old caucasian male with warm brown skin tone, dark brown eyes, short dark brown hair neatly styled, athletic build, 1.75m tall, confident friendly expression, business casual attire, subtle glasses, well-groomed beard, studio lighting, corporate headshot style, high quality, photorealistic"
}`;

      console.log('  📤 Gerando descrição física com LLM (formato TEXTO)...');

      const descricao = await generateJSONWithFallback(prompt, {
        temperature: 0.9, // ALTA temperatura para máxima variação
        maxTokens: 1000,
        timeout: 60000
      });

      console.log(`  📥 Descrição gerada com sucesso`);

      // Validar campos obrigatórios
      if (!descricao.prompt_fal_ai || !descricao.etnia) {
        throw new Error('Resposta LLM incompleta');
      }

      console.log(`  ✅ Descrição física gerada: ${descricao.etnia}, ${descricao.idade_aparente} anos`);
      return descricao;

    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        console.error(`    ❌ Erro após ${maxRetries} tentativas:`, error.message);
        return null;
      }
    }
  }

  return null;
}


async function gerarPromptsAvatares() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    let forceClean = false;
    let format = 'text'; // 'text' ou 'json'
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      } else if (arg === '--force') {
        forceClean = true;
      } else if (arg.startsWith('--format=')) {
        format = arg.split('=')[1];
      }
    }
    
    if (!empresaId) {
      console.error('❌ --empresaId não fornecido');
      console.log('💡 Uso: node 05a_generate_avatar_prompts.js --empresaId=ID [--format=text|json] [--force]');
      process.exit(1);
    }

    // 1. Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada: ${empresaError.message}`);

    console.log(`🏢 Empresa: ${empresa.nome}\n`);

    // 2. Buscar personas
    const { data: todasPersonas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!todasPersonas || todasPersonas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    // 3. Modo força: limpar prompts anteriores
    if (forceClean) {
      console.log('🧹 MODO FORÇA: Limpando prompts anteriores...\n');
      
      const personaIds = todasPersonas.map(p => p.id);
      
      await supabase
        .from('personas')
        .update({ system_prompt: null })
        .in('id', personaIds);

      await supabase
        .from('personas_avatares')
        .delete()
        .in('persona_id', personaIds);
    }

    // 4. Filtrar personas que já têm prompts
    const { data: avataresExistentes } = await supabase
      .from('personas_avatares')
      .select('persona_id');
    
    const idsComPrompts = new Set(avataresExistentes?.map(a => a.persona_id) || []);
    
    const personas = forceClean 
      ? todasPersonas 
      : todasPersonas.filter(p => !idsComPrompts.has(p.id));

    if (personas.length === 0) {
      console.log('✅ Todas as personas já têm prompts físicos!');
      console.log('💡 Use --force para regenerar tudo\n');
      return;
    }

    console.log(`📝 Gerando prompts para ${personas.length} personas...\n`);
    updateProgress('running', 0, personas.length);

    let sucessos = 0;
    let erros = 0;
    const errorList = [];

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      
      console.log(`\n[${i + 1}/${personas.length}] ${persona.full_name} (${persona.role})`);
      updateProgress('running', i, personas.length, persona.full_name, errorList);

      // Buscar dados relacionados
      const { data: biografia } = await supabase
        .from('personas_biografias')
        .select('*')
        .eq('persona_id', persona.id)
        .single();

      const { data: atribuicoes } = await supabase
        .from('personas_atribuicoes')
        .select('*')
        .eq('persona_id', persona.id);

      const { data: competencias } = await supabase
        .from('personas_competencias')
        .select('*')
        .eq('persona_id', persona.id)
        .single();

      const descricao = format === 'json'
        ? await gerarDescricaoFisicaLLM_JSON(persona, empresa, biografia, atribuicoes, competencias, format)
        : await gerarDescricaoFisicaLLM(persona, empresa, biografia, atribuicoes, competencias, format);
      
      if (!descricao) {
        erros++;
        errorList.push({
          persona: persona.full_name,
          error: 'Falha ao gerar descrição física'
        });
        continue;
      }

      // Salvar system_prompt na tabela personas
      const systemPrompt = {
        descricao_fisica_completa: {
          idade_aparente: descricao.idade_aparente,
          etnia: descricao.etnia,
          pele_tom: descricao.pele_tom,
          olhos: {
            cor: descricao.olhos_cor,
            formato: 'expressivos'
          },
          cabelo: {
            cor: descricao.cabelo_cor,
            comprimento: descricao.cabelo_comprimento,
            estilo: descricao.cabelo_estilo,
            textura: 'natural'
          },
          tipo_fisico: descricao.tipo_fisico,
          altura_aproximada: descricao.altura_estimada,
          expressao_tipica: descricao.expressao_facial,
          estilo_roupa_padrao: descricao.estilo_vestimenta,
          acessorios_permanentes: descricao.acessorios,
          caracteristicas_distintivas: descricao.caracteristicas_distintivas
        },
        parametros_consistencia: {
          rendering_style: 'photorealistic professional portrait',
          lighting: 'soft studio lighting',
          background: 'neutral corporate background',
          aspect_ratio: '1:1',
          quality: 'high'
        },
        metadata_geracao: {
          generated_at: new Date().toISOString(),
          llm_provider: 'openai',
          model: 'gpt-4o-mini',
          version: '1.0'
        }
      };

      const { error: updateError } = await supabase
        .from('personas')
        .update({ system_prompt: JSON.stringify(systemPrompt) })
        .eq('id', persona.id);

      if (updateError) {
        console.error('    ⚠️  Erro ao salvar system_prompt:', updateError.message);
      } else {
        console.log('    ✅ System Prompt salvo em personas');
      }

      // Salvar metadados em personas_avatares (sem imagem ainda)
      const avatarRecord = {
        persona_id: persona.id,
        prompt_usado: descricao.prompt_fal_ai,
        estilo: 'professional',
        background_tipo: 'studio',
        servico_usado: 'pending_fal_ai',
        versao: 1,
        ativo: false, // Será ativado quando imagem for gerada
        biometrics: {
          idade_aparente: descricao.idade_aparente,
          genero: persona.genero || 'não especificado',
          etnia: descricao.etnia,
          tipo_fisico: descricao.tipo_fisico,
          altura_estimada: descricao.altura_estimada,
          cabelo_cor: descricao.cabelo_cor,
          cabelo_comprimento: descricao.cabelo_comprimento,
          cabelo_estilo: descricao.cabelo_estilo,
          olhos_cor: descricao.olhos_cor,
          pele_tom: descricao.pele_tom,
          expressao_facial_padrao: descricao.expressao_facial,
          estilo_vestimenta_padrao: descricao.estilo_vestimenta,
          acessorios_permanentes: descricao.acessorios,
          caracteristicas_distintivas: descricao.caracteristicas_distintivas
        },
        metadados: {
          prompt_generation: {
            llm_provider: 'openai',
            model: 'gpt-4o-mini',
            generated_at: new Date().toISOString()
          },
          awaiting_image_generation: true,
          next_step: 'Run Script 05b to generate images via Fal.ai'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('personas_avatares')
        .upsert(avatarRecord, { onConflict: 'persona_id' });

      if (insertError) {
        console.error('    ❌ Erro ao salvar avatar record:', insertError.message);
        erros++;
        errorList.push({
          persona: persona.full_name,
          error: insertError.message
        });
      } else {
        console.log('    ✅ Metadados salvos em personas_avatares');
        sucessos++;
      }

      // Delay entre requisições
      if (i < personas.length - 1) {
        console.log('  ⏳ Aguardando 2s...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    updateProgress('completed', personas.length, personas.length, '', errorList);

    console.log('\n📊 RELATÓRIO');
    console.log('=============');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📝 Prompts salvos em: personas_avatares (campo prompt_usado)`);
    console.log(`💾 Descrições físicas em: personas (campo system_prompt)`);
    console.log('\n🎯 PRÓXIMO PASSO:');
    console.log(`   node 05b_generate_images_fal.js --empresaId=${empresaId}`);
    console.log('🎉 SCRIPT 05a CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    updateProgress('error', 0, 0, '', [{ error: error.message }]);
    process.exit(1);
  }
}

gerarPromptsAvatares();
