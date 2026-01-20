// ============================================================================
// SCRIPT 02 V5.0 - GERAÇÃO DE BIOGRAFIAS COM CONTEXTO DE OKRs
// ============================================================================
// PARADIGMA V5.0: Top-down (Missão → Objetivos → OKRs → Personas)
// 
// Este script:
// 1. Gera NOMES REAIS baseados na nacionalidade
// 2. Gera EMAILS com domínio da empresa
// 3. Calcula EXPERIÊNCIA (anos) baseada no cargo + nível hierárquico
// 4. Busca OKRs que a persona é OWNER (okr_owner_ids)
// 5. Gera BIOGRAFIA demonstrando experiência com OKRs e resultados mensuráveis
// 6. Salva em personas + personas_biografias
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import dotenv from 'dotenv';
import { getNomeAleatorio, getPrimeiroNomeParaEmail, getSobrenomeParaEmail } from './lib/nomes_nacionalidades.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tenta carregar .env.local se existir (dev), caso contrário usa variáveis de sistema (prod)
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🏗️  SCRIPT 02 V5.0 - BIOGRAFIAS COM CONTEXTO OKR');
console.log('===================================================');
console.log('📊 Biografias demonstram experiência com:');
console.log('   - OKRs que a persona é owner');
console.log('   - Resultados mensuráveis similares');
console.log('   - Métricas e KPIs do bloco funcional');
console.log('🔧 TEMPERATURA LLM: 0.85 (variação controlada)');
console.log('===================================================\n');

// Parse arguments
const args = process.argv.slice(2);
let targetEmpresaId = null;

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
  }
}

if (!targetEmpresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('📝 Uso: node 02_generate_biografias_COMPLETO_v5.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function calcularExperiencia(nivelHierarquico, cargo) {
  // V5.0: Experiência baseada no nível hierárquico
  if (nivelHierarquico === 'gerencial') {
    if (cargo.toLowerCase().includes('diretor')) return Math.floor(Math.random() * 5) + 10; // 10-14 anos
    if (cargo.toLowerCase().includes('gerente')) return Math.floor(Math.random() * 4) + 7; // 7-10 anos
    return Math.floor(Math.random() * 3) + 6; // 6-8 anos
  }
  
  if (nivelHierarquico === 'especialista') {
    if (cargo.toLowerCase().includes('sênior') || cargo.toLowerCase().includes('senior')) {
      return Math.floor(Math.random() * 3) + 5; // 5-7 anos
    }
    return Math.floor(Math.random() * 3) + 3; // 3-5 anos
  }
  
  // operacional
  return Math.floor(Math.random() * 3) + 1; // 1-3 anos
}

async function verificarNomeUnico(nomeCompleto, empresaId, personaIdAtual) {
  const { data } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId)
    .eq('full_name', nomeCompleto)
    .neq('id', personaIdAtual);
  
  return !data || data.length === 0;
}

async function verificarEmailUnico(email, personaIdAtual) {
  const { data } = await supabase
    .from('personas')
    .select('id')
    .eq('email', email)
    .neq('id', personaIdAtual);
  
  return !data || data.length === 0;
}

// ============================================================================
// BUSCAR OKRs DA PERSONA
// ============================================================================

async function buscarOKRsDaPersona(persona) {
  if (!persona.okr_owner_ids || persona.okr_owner_ids.length === 0) {
    return [];
  }
  
  const { data: okrs, error } = await supabase
    .from('empresas_okrs')
    .select(`
      id,
      titulo,
      key_result_1,
      key_result_2,
      key_result_3,
      progresso_percentual,
      objetivo_estrategico_id,
      empresas_objetivos_estrategicos (
        titulo,
        descricao
      )
    `)
    .in('id', persona.okr_owner_ids);
  
  if (error) {
    console.error(`   ⚠️  Erro ao buscar OKRs:`, error.message);
    return [];
  }
  
  return okrs || [];
}

// ============================================================================
// GERAR BIOGRAFIA COM CONTEXTO OKR (LLM)
// ============================================================================

async function gerarBiografiaComOKR(persona, empresa, okrs) {
  console.log(`   🤖 Gerando biografia para ${persona.persona_code}...`);
  
  // Construir contexto de OKRs
  const okrsTexto = okrs.length > 0
    ? okrs.map(okr => `
      • OKR: ${okr.titulo}
        Objetivo Estratégico: ${okr.empresas_objetivos_estrategicos?.titulo || 'N/A'}
        - KR1: ${okr.key_result_1}
        - KR2: ${okr.key_result_2}
        - KR3: ${okr.key_result_3}
        Progresso: ${okr.progresso_percentual}%
    `).join('\n')
    : 'Sem OKRs atribuídos (execução de tarefas operacionais)';
  
  const prompt = `Você é um especialista em criar biografias profissionais realistas.

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}

PERSONA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Código: ${persona.persona_code}
Cargo: ${persona.role}
Cargo: ${persona.role}
Nível Hierárquico: ${persona.nivel_hierarquico}
Departamento: ${persona.departamento}
Nacionalidade: ${persona.nacionalidade}
Experiência: ${persona.experiencia_anos} anos

Bloco Funcional: ${persona.bloco_funcional_nome || 'N/A'}

Responsabilidade por Resultado:
${persona.responsabilidade_resultado || 'Executar tarefas conforme atribuições'}

Métricas de Responsabilidade:
${persona.metricas_responsabilidade?.join(', ') || 'N/A'}

OKRs QUE ESTA PERSONA É OWNER:
${okrsTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES OBRIGATÓRIAS:
1. Crie uma biografia que DEMONSTRE experiência com resultados mensuráveis similares aos OKRs
2. Se a persona é owner de OKRs, mencione cases de sucesso com métricas reais
3. A biografia deve ter 3-5 parágrafos (150-250 palavras)
4. Inclua experiências anteriores relevantes (empresas, posições)
5. Mencione formação acadêmica alinhada ao cargo
6. Tom profissional, objetivo, sem exageros

ESTRUTURA DA BIOGRAFIA:
- Parágrafo 1: Visão geral da carreira + anos de experiência
- Parágrafo 2-3: Cases de sucesso com métricas (ex: "aumentou receita em 30%", "reduziu custos em 25%")
- Parágrafo 4: Formação acadêmica + certificações relevantes
- Parágrafo 5: Paixões/interesses profissionais alinhados ao cargo

Retorne APENAS JSON VÁLIDO:
{
  "biografia_texto": "Biografia completa em português (150-250 palavras)",
  "formacao_academica": "Graduação/Pós-graduação específica",
  "areas_de_expertise": ["Área 1", "Área 2", "Área 3", "Área 4"],
  "casos_de_sucesso": [
    "Case 1 com métrica específica",
    "Case 2 com métrica específica",
    "Case 3 com métrica específica"
  ]
}`;

  try {
    const response = await generateJSONWithFallback(prompt, 0.85);
    
    // Parse e validação (response pode ser string ou objeto)
    let cleanResponse = typeof response === 'string' ? response.trim() : JSON.stringify(response);
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const biografia = JSON.parse(cleanResponse);
    
    // Validação
    if (!biografia.biografia_texto || biografia.biografia_texto.length < 100) {
      throw new Error('Biografia muito curta');
    }
    
    return biografia;
    
  } catch (error) {
    console.error(`   ❌ Erro ao gerar biografia:`, error.message);
    
    // Fallback
    return {
      biografia_texto: `${persona.full_name || 'Profissional'} é um(a) ${persona.role} com ${persona.experiencia_anos} anos de experiência na indústria de ${empresa.industria}. Possui histórico comprovado em ${persona.responsabilidade_resultado || 'gestão e execução de projetos'}. Formação acadêmica sólida e certificações relevantes na área.`,
      formacao_academica: 'Graduação em Administração ou área relacionada',
      areas_de_expertise: persona.metricas_responsabilidade?.slice(0, 4) || ['Gestão', 'Análise', 'Estratégia', 'Operações'],
      casos_de_sucesso: [
        'Implementou melhorias operacionais significativas',
        'Contribuiu para crescimento sustentável da organização',
        'Desenvolveu processos otimizados'
      ]
    };
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function generateBiografiasCompletas() {
  try {
    // 1. Buscar empresa
    console.log('1️⃣ Buscando empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();
    
    if (empresaError) {
      console.error('❌ Empresa não encontrada:', empresaError.message);
      process.exit(1);
    }
    
    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`   Indústria: ${empresa.industria}`);
    console.log(`   Domínio: ${empresa.dominio || empresa.codigo + '.com'}\n`);
    
    const dominioEmail = empresa.dominio || `${empresa.codigo.toLowerCase()}.com`;
    
    // 2. Buscar personas (todas, para atualizar dados básicos)
    console.log('2️⃣ Buscando personas...\n');
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('persona_code');
    
    if (personasError || !personas || personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada. Execute o Script 01 primeiro.');
      process.exit(1);
    }
    
    console.log(`✅ ${personas.length} personas encontradas\n`);
    
    // 3. Processar cada persona
    console.log('3️⃣ Gerando biografias...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let sucessos = 0;
    let falhas = 0;
    
    for (const persona of personas) {
      try {
        console.log(`📝 ${persona.persona_code} - ${persona.role}`);
        
        // 3.1. Gerar nome único (ou usar fallback)
        let nomeCompleto = null;
        let primeiroNome = null;
        let sobrenome = null;
        let tentativas = 0;
        const maxTentativas = 10;
        
        // Se já tem nome, manter
        if (persona.full_name) {
          nomeCompleto = persona.full_name;
          const partes = nomeCompleto.split(' ');
          primeiroNome = partes[0];
          sobrenome = partes.slice(1).join(' ') || partes[0];
        } else {
          // Tentar gerar nome aleatório
          while (!nomeCompleto && tentativas < maxTentativas) {
            const nomeGerado = getNomeAleatorio(persona.nacionalidade, persona.genero);
            const isUnico = await verificarNomeUnico(nomeGerado.nomeCompleto, empresa.id, persona.id);
            
            if (isUnico) {
              nomeCompleto = nomeGerado.nomeCompleto;
              primeiroNome = nomeGerado.primeiroNome;
              sobrenome = nomeGerado.sobrenome;
            }
            tentativas++;
          }
          
          // Fallback: usar persona_code como base
          if (!nomeCompleto) {
            const codigo = persona.persona_code.replace('ARVA01-', '');
            nomeCompleto = `${persona.role} ${codigo}`;
            primeiroNome = persona.role.split(' ')[0];
            sobrenome = codigo;
            console.log(`   ⚠️  Usando nome fallback: ${nomeCompleto}`);
          }
        }
        
        // 3.2. Gerar email único
        const primeiroNomeEmail = getPrimeiroNomeParaEmail(primeiroNome);
        const sobrenomeEmail = getSobrenomeParaEmail(sobrenome);
        let email = `${primeiroNomeEmail}.${sobrenomeEmail}@${dominioEmail}`.toLowerCase();
        
        // Verificar se email já existe
        const emailUnico = await verificarEmailUnico(email, persona.id);
        if (!emailUnico) {
          // Adicionar timestamp para garantir unicidade
          const timestamp = Date.now().toString().slice(-4);
          email = `${primeiroNomeEmail}.${sobrenomeEmail}${timestamp}@${dominioEmail}`.toLowerCase();
          console.log(`   ⚠️  Email duplicado, usando: ${email}`);
        }
        
        // 3.3. Calcular experiência
        const experiencia = calcularExperiencia(persona.nivel_hierarquico, persona.role);
        
        console.log(`   ✅ Nome: ${nomeCompleto}`);
        console.log(`   ✅ Email: ${email}`);
        console.log(`   ✅ Experiência: ${experiencia} anos`);
        
        // 3.4. Buscar OKRs
        const okrs = await buscarOKRsDaPersona(persona);
        if (okrs.length > 0) {
          console.log(`   ✅ Owner de ${okrs.length} OKR(s):`);
          okrs.forEach(okr => console.log(`      • ${okr.titulo}`));
        } else {
          console.log(`   ℹ️  Sem OKRs atribuídos (nível operacional)`);
        }
        
        // 3.5. Gerar biografia com LLM
        const biografiaData = await gerarBiografiaComOKR(persona, empresa, okrs);
        
        // 3.6. Atualizar persona (dados básicos)
        const { error: updatePersonaError } = await supabase
          .from('personas')
          .update({
            full_name: nomeCompleto,
            email: email,
            experiencia_anos: experiencia
          })
          .eq('id', persona.id);
        
        if (updatePersonaError) {
          throw new Error(`Erro ao atualizar persona: ${updatePersonaError.message}`);
        }
        
        // 3.7. Salvar biografia estruturada
        const biografiaEstruturada = {
          biografia_texto: biografiaData.biografia_texto,
          formacao_academica: biografiaData.formacao_academica,
          areas_de_expertise: biografiaData.areas_de_expertise,
          casos_de_sucesso: biografiaData.casos_de_sucesso,
          okrs_owned: okrs.map(okr => ({
            id: okr.id,
            titulo: okr.titulo,
            objetivo: okr.empresas_objetivos_estrategicos?.titulo
          }))
        };
        
        // Upsert em personas_biografias
        const { error: upsertBioError } = await supabase
          .from('personas_biografias')
          .upsert({
            persona_id: persona.id,
            biografia_estruturada: biografiaEstruturada,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'persona_id'
          });
        
        if (upsertBioError) {
          throw new Error(`Erro ao salvar biografia: ${upsertBioError.message}`);
        }
        
        console.log(`   ✅ Biografia gerada e salva com sucesso!\n`);
        sucessos++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${persona.persona_code}:`, error.message);
        falhas++;
        console.log('');
      }
    }
    
    // 4. Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 02 V5.0 CONCLUÍDO!\n');
    console.log(`✅ Sucessos: ${sucessos}/${personas.length}`);
    console.log(`❌ Falhas: ${falhas}/${personas.length}\n`);
    
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1️⃣ Execute: node 03_generate_atribuicoes_contextualizadas_v5.js --empresaId=' + targetEmpresaId);
    console.log('   2️⃣ Continue com Scripts 04-11\n');
    
  } catch (error) {
    console.error('\n❌ ERRO INESPERADO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTAR
// ============================================================================

generateBiografiasCompletas();
