// ============================================================================
// SCRIPT 05.5 - GERAÇÃO DE RECOMENDAÇÕES RAG PARA CAPACITAÇÃO DE PERSONAS
// ============================================================================
// ORDEM: Executar após atribuições/tarefas e antes de automação/ML
//
// DESCRIÇÃO:
// - Para cada persona, gera recomendações de tópicos/assuntos RAG para capacitação
// - Usa LLM para sugerir áreas de conhecimento, temas e formatos de conteúdo
// - Permite ingestão manual de documentos pelo usuário (a ser implementado via UI/API)
// - Salva recomendações em formato JSON na tabela vetorial do Supabase (rag_knowledge)
//
// Uso:
//   node 05.5_generate_rag_recommendations.js --empresaId=UUID [--personaId=UUID]

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const { generateWithFallback } = require('./llm_health_checker.cjs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('📚 SCRIPT 05.5 - GERAÇÃO DE RAG PARA CAPACITAÇÃO');

async function getPersonas(empresaId, personaId = null) {
  let query = supabase
    .from('personas')
    .select('id, full_name, role, department, specialty')
    .eq('empresa_id', empresaId);
  if (personaId) query = query.eq('id', personaId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

async function getAtribuicoesETarefas(personaId) {
  const { data: atribuicoes } = await supabase
    .from('personas_atribuicoes')
    .select('atribuicao')
    .eq('persona_id', personaId);
  const { data: tarefas } = await supabase
    .from('personas_tasks')
    .select('descricao, tipo, frequencia')
    .eq('persona_id', personaId);
  return { atribuicoes: atribuicoes?.map(a => a.atribuicao) || [], tarefas: tarefas || [] };
}

async function saveRagKnowledge(personaId, recommendations) {
  const { error } = await supabase
    .from('rag_knowledge')
    .insert({
      persona_id: personaId,
      knowledge_base: 'capacitação',
      categoria: 'recomendacao_llm',
      conteudo: recommendations,
      created_at: new Date().toISOString()
    });
  if (error) throw new Error(error.message);
}

async function main() {
  const args = process.argv.slice(2);
  let empresaId = null;
  let personaId = null;
  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) empresaId = arg.split('=')[1];
    if (arg.startsWith('--personaId=')) personaId = arg.split('=')[1];
  }
  if (!empresaId) {
    console.error('❌ --empresaId é obrigatório');
    process.exit(1);
  }

  const personas = await getPersonas(empresaId, personaId);
  if (!personas.length) {
    console.log('Nenhuma persona encontrada.');
    return;
  }

  for (const persona of personas) {
    console.log(`\n👤 ${persona.full_name} (${persona.role})`);
    const { atribuicoes, tarefas } = await getAtribuicoesETarefas(persona.id);
    if (!atribuicoes.length && !tarefas.length) {
      console.log('  ⚠️  Nenhuma atribuição ou tarefa encontrada. Pulando.');
      continue;
    }
    const prompt = `Você é um especialista em treinamento corporativo.\n\nCargo: ${persona.role}\nDepartamento: ${persona.department}\nEspecialidade: ${persona.specialty}\n\nAtribuições principais:\n${atribuicoes.map((a,i)=>`${i+1}. ${a}`).join('\n')}\n\nTarefas diárias/semanais/mensais:\n${tarefas.map((t,i)=>`${i+1}. [${t.tipo}/${t.frequencia}] ${t.descricao}`).join('\n')}\n\nCom base nessas informações, gere uma lista estruturada de tópicos, áreas de conhecimento e tipos de conteúdo (ex: artigos, vídeos, cursos, simuladores) que devem compor a base RAG de capacitação para este cargo.\n\nRetorne APENAS JSON válido, exemplo:\n{\n  "topicos": ["Gestão de tempo", "Ferramentas CRM", ...],\n  "areas_conhecimento": ["Vendas consultivas", "Comunicação"],\n  "formatos_recomendados": ["artigos", "vídeos", "cursos"],\n  "exemplos_conteudo": [\n    {"titulo": "Como usar CRM X", "tipo": "vídeo"},\n    ...\n  ]\n}`;
    let recommendations = null;
    try {
      const response = await generateWithFallback('z-ai/glm-4.6', prompt, { temperature: 0.3, maxTokens: 1200 });
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Resposta da LLM não contém JSON válido');
      recommendations = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error('  ❌ Erro ao gerar recomendações RAG:', err.message);
      continue;
    }
    try {
      await saveRagKnowledge(persona.id, recommendations);
      console.log('  ✅ Recomendações RAG salvas no banco.');
    } catch (err) {
      console.error('  ❌ Erro ao salvar no banco:', err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log('\n🎉 Geração de recomendações RAG concluída!');
}

main();
