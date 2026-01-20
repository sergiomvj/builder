// ============================================================================
// SCRIPT 04 V5.0 - GERAÇÃO DE COMPETÊNCIAS COM CONTEXTO ESTRATÉGICO
// ============================================================================
// PARADIGMA V5.0: Competências alinhadas com OKRs e Atribuições
// 
// Gera:
// 1. Competências técnicas alinhadas ao bloco funcional
// 2. Competências comportamentais para atingir OKRs
// 3. Ferramentas/tecnologias dos subsistemas usados
// 4. KPIs baseados nas métricas de responsabilidade
// 5. Objetivos de desenvolvimento focados em OKRs
// 
// Uso: node 04_generate_competencias_v5.js --empresaId=UUID
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🎯 SCRIPT 04 V5.0 - COMPETÊNCIAS ESTRATÉGICAS');
console.log('===================================================');
console.log('🔧 Alinhado com: OKRs + Atribuições + Subsistemas');
console.log('🌡️  TEMPERATURA LLM: 0.75 (padrão)');
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
  console.log('📝 Uso: node 04_generate_competencias_v5.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// BUSCAR CONTEXTO DA PERSONA
// ============================================================================

async function buscarContextoCompleto(personaId) {
  // 1. Persona + Biografia
  const { data: persona } = await supabase
    .from('personas')
    .select(`
      *,
      personas_biografias (biografia_estruturada)
    `)
    .eq('id', personaId)
    .single();
  
  if (!persona) return null;
  
  // 2. Atribuições com subsistemas
  const { data: atribuicoes } = await supabase
    .from('personas_atribuicoes')
    .select('*')
    .eq('persona_id', personaId)
    .order('ordem');
  
  // 3. OKRs owned
  let okrs = [];
  if (persona.okr_owner_ids && persona.okr_owner_ids.length > 0) {
    const { data: okrsData } = await supabase
      .from('empresas_okrs')
      .select(`
        id,
        titulo,
        key_result_1,
        key_result_2,
        key_result_3,
        empresas_objetivos_estrategicos (titulo)
      `)
      .in('id', persona.okr_owner_ids);
    
    okrs = okrsData || [];
  }
  
  // 4. Subsistemas usados
  const subsistemasCodigos = [...new Set(
    (atribuicoes || [])
      .filter(a => a.use_subsystem && a.which_subsystem)
      .map(a => a.which_subsystem)
  )];
  
  let subsistemas = [];
  if (subsistemasCodigos.length > 0) {
    const { data: subsData } = await supabase
      .from('subsistemas')
      .select('*')
      .in('codigo', subsistemasCodigos);
    
    subsistemas = subsData || [];
  }
  
  return {
    persona,
    atribuicoes: atribuicoes || [],
    okrs,
    subsistemas
  };
}

// ============================================================================
// GERAR COMPETÊNCIAS (LLM)
// ============================================================================

async function gerarCompetencias(contexto, empresa) {
  const { persona, atribuicoes, okrs, subsistemas } = contexto;
  
  console.log(`   🤖 Gerando competências para ${persona.persona_code}...`);
  
  const biografia = persona.personas_biografias?.[0]?.biografia_estruturada?.biografia_texto || '';
  const atribuicoesTexto = atribuicoes.slice(0, 5).map(a => `• ${a.atribuicao}`).join('\n');
  const okrsTexto = okrs.length > 0
    ? okrs.map(okr => `• ${okr.titulo}: ${okr.key_result_1}`).join('\n')
    : 'Sem OKRs atribuídos';
  const subsisteMasTexto = subsistemas.length > 0
    ? subsistemas.map(s => `• ${s.nome}: ${s.funcionalidades.slice(0, 3).join(', ')}`).join('\n')
    : 'Nenhum subsistema usado';
  
  const prompt = `Você é um especialista em desenvolvimento de competências profissionais.

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}

PERSONA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Código: ${persona.persona_code}
Nome: ${persona.full_name}
Cargo: ${persona.role}
Nível: ${persona.nivel_hierarquico}
Bloco Funcional: ${persona.bloco_funcional_nome}

BIOGRAFIA (resumida):
${biografia.substring(0, 300)}

RESPONSABILIDADE:
${persona.responsabilidade_resultado}

MÉTRICAS DE RESPONSABILIDADE:
${(persona.metricas_responsabilidade || []).join(', ')}

ATRIBUIÇÕES PRINCIPAIS (5):
${atribuicoesTexto}

OKRs OWNED:
${okrsTexto}

SUBSISTEMAS USADOS:
${subsisteMasTexto}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GERE COMPETÊNCIAS PROFISSIONAIS ALINHADAS AO CONTEXTO ESTRATÉGICO:

1. COMPETÊNCIAS TÉCNICAS (5): Hard skills essenciais para atingir os OKRs e executar as atribuições
2. COMPETÊNCIAS COMPORTAMENTAIS (5): Soft skills necessárias para o nível hierárquico e bloco funcional
3. FERRAMENTAS (4-6): Tecnologias/sistemas dos subsistemas + ferramentas comuns ao cargo
4. TAREFAS DIÁRIAS (5): Atividades executadas todo dia
5. TAREFAS SEMANAIS (3): Atividades executadas toda semana
6. TAREFAS MENSAIS (3): Atividades executadas todo mês
7. KPIs (3-5): Baseados nas métricas de responsabilidade (formato: "Nome do KPI: Baseline → Meta")
8. OBJETIVOS DE DESENVOLVIMENTO (3): Focados em melhorar entrega dos OKRs

Retorne APENAS JSON VÁLIDO:
{
  "competencias_tecnicas": ["Competência 1", "Competência 2", ...],
  "competencias_comportamentais": ["Soft skill 1", "Soft skill 2", ...],
  "ferramentas": ["Ferramenta 1", "Ferramenta 2", ...],
  "tarefas_diarias": ["Tarefa 1", "Tarefa 2", ...],
  "tarefas_semanais": ["Tarefa 1", "Tarefa 2", ...],
  "tarefas_mensais": ["Tarefa 1", "Tarefa 2", ...],
  "kpis": ["KPI 1: Nome - Baseline → Meta", "KPI 2: ...", ...],
  "objetivos_desenvolvimento": ["Objetivo 1", "Objetivo 2", ...]
}`;

  try {
    const response = await generateJSONWithFallback(prompt, 0.75);
    
    let cleanResponse = typeof response === 'string' ? response.trim() : JSON.stringify(response);
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const competencias = JSON.parse(cleanResponse);
    
    // Validação
    if (!competencias.competencias_tecnicas || competencias.competencias_tecnicas.length < 3) {
      throw new Error('Competências técnicas insuficientes');
    }
    
    return competencias;
    
  } catch (error) {
    console.error(`   ❌ Erro ao gerar competências:`, error.message);
    
    // Fallback
    return {
      competencias_tecnicas: ['Gestão', 'Análise de Dados', 'Planejamento Estratégico', 'Comunicação', 'Liderança'],
      competencias_comportamentais: ['Trabalho em equipe', 'Proatividade', 'Resiliência', 'Foco em resultados', 'Adaptabilidade'],
      ferramentas: ['Excel', 'PowerPoint', 'Google Workspace', 'CRM'],
      tarefas_diarias: ['Revisar indicadores', 'Atender reuniões', 'Responder e-mails', 'Atualizar status', 'Colaborar com equipe'],
      tarefas_semanais: ['Consolidar relatórios', 'Planejar próxima semana', 'Revisar metas'],
      tarefas_mensais: ['Análise de resultados', 'Planejamento estratégico', 'Apresentar para liderança'],
      kpis: persona.metricas_responsabilidade?.slice(0, 3).map(m => `${m}: Baseline → Meta`) || ['Produtividade: 80% → 95%'],
      objetivos_desenvolvimento: ['Melhorar gestão de tempo', 'Desenvolver habilidades técnicas', 'Expandir network profissional']
    };
  }
}

// ============================================================================
// SALVAR COMPETÊNCIAS
// ============================================================================

async function salvarCompetencias(personaId, competencias) {
  const { error } = await supabase
    .from('personas_competencias')
    .upsert({
      persona_id: personaId,
      competencias_tecnicas: competencias.competencias_tecnicas,
      competencias_comportamentais: competencias.competencias_comportamentais,
      ferramentas: competencias.ferramentas,
      tarefas_diarias: competencias.tarefas_diarias,
      tarefas_semanais: competencias.tarefas_semanais,
      tarefas_mensais: competencias.tarefas_mensais,
      kpis: competencias.kpis,
      objetivos_desenvolvimento: competencias.objetivos_desenvolvimento,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'persona_id'
    });
  
  if (error) throw error;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
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
    
    console.log(`✅ Empresa: ${empresa.nome}\n`);
    
    // 2. Buscar personas
    console.log('2️⃣ Buscando personas...\n');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, persona_code, role')
      .eq('empresa_id', empresa.id)
      .order('persona_code');
    
    if (personasError || !personas || personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada');
      process.exit(1);
    }
    
    console.log(`✅ ${personas.length} personas encontradas\n`);
    
    // 3. Processar cada persona
    console.log('3️⃣ Gerando competências...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let sucessos = 0;
    let falhas = 0;
    
    for (const p of personas) {
      try {
        console.log(`📝 ${p.persona_code} - ${p.role}`);
        
        // Buscar contexto completo
        const contexto = await buscarContextoCompleto(p.id);
        
        if (!contexto) {
          console.log(`   ⚠️  Contexto não encontrado, pulando...\n`);
          continue;
        }
        
        console.log(`   ✅ ${contexto.atribuicoes.length} atribuições`);
        console.log(`   ✅ ${contexto.okrs.length} OKRs`);
        console.log(`   ✅ ${contexto.subsistemas.length} subsistemas`);
        
        // Gerar competências
        const competencias = await gerarCompetencias(contexto, empresa);
        
        console.log(`   ✅ ${competencias.competencias_tecnicas.length} competências técnicas`);
        console.log(`   ✅ ${competencias.ferramentas.length} ferramentas`);
        console.log(`   ✅ ${competencias.kpis.length} KPIs`);
        
        // Salvar
        await salvarCompetencias(p.id, competencias);
        console.log(`   💾 Salvo em personas_competencias\n`);
        
        sucessos++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${p.persona_code}:`, error.message);
        falhas++;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 04 V5.0 CONCLUÍDO!\n');
    console.log(`✅ Sucessos: ${sucessos}/${personas.length}`);
    console.log(`❌ Falhas: ${falhas}/${personas.length}\n`);
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
