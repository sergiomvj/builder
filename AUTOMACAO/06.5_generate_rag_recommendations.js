// ============================================================================
// SCRIPT 06.5 - GERAÇÃO DE RECOMENDAÇÕES RAG PARA CAPACITAÇÃO DE PERSONAS
// ============================================================================
// ORDEM: Executar APÓS Script 06 (automação) e ANTES do Script 07 (workflows)
//
// DESCRIÇÃO:
// - Para cada persona, gera recomendações de tópicos/assuntos RAG para capacitação
// - Usa LLM para sugerir áreas de conhecimento, temas e formatos de conteúdo
// - Salva recomendações em formato JSON na tabela rag_knowledge do Supabase
//
// Uso:
//   node 06.5_generate_rag_recommendations.js --empresaId=UUID [--personaId=UUID]

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import { ExecutionTracker } from './lib/execution-tracker.js';

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

console.log('📚 SCRIPT 06.5 - GERAÇÃO DE RAG PARA CAPACITAÇÃO');
console.log('🔄 Usando LLM com fallback: Grok → GLM → Kimi-K2 (FREE) → GPT-3.5 → Qwen → Claude');

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
  // Estrutura correta da tabela rag_knowledge:
  // tipo (politica|procedimento|documento|faq), titulo, conteudo, categoria, tags
  
  // Criar múltiplos registros a partir das recomendações
  const records = [];
  
  // Adicionar tópicos como documentos
  if (recommendations.topicos && recommendations.topicos.length > 0) {
    records.push({
      persona_id: personaId,
      tipo: 'documento',
      titulo: 'Tópicos de Capacitação Recomendados',
      conteudo: recommendations.topicos.join('\n'),
      categoria: 'capacitacao',
      tags: ['topicos', 'treinamento'],
      relevancia: 1.0,
      ativo: true
    });
  }
  
  // Adicionar áreas de conhecimento como procedimentos
  if (recommendations.areas_conhecimento && recommendations.areas_conhecimento.length > 0) {
    records.push({
      persona_id: personaId,
      tipo: 'procedimento',
      titulo: 'Áreas de Conhecimento para Desenvolvimento',
      conteudo: recommendations.areas_conhecimento.join('\n'),
      categoria: 'desenvolvimento',
      tags: ['areas_conhecimento', 'skills'],
      relevancia: 1.0,
      ativo: true
    });
  }
  
  // Adicionar formatos recomendados como FAQ
  if (recommendations.formatos_recomendados && recommendations.formatos_recomendados.length > 0) {
    records.push({
      persona_id: personaId,
      tipo: 'faq',
      titulo: 'Formatos de Conteúdo Recomendados',
      conteudo: `Formatos ideais para aprendizado:\n${recommendations.formatos_recomendados.join(', ')}`,
      categoria: 'metodologia',
      tags: ['formatos', 'aprendizado'],
      relevancia: 0.8,
      ativo: true
    });
  }
  
  // Adicionar exemplos de conteúdo
  if (recommendations.exemplos_conteudo && recommendations.exemplos_conteudo.length > 0) {
    const exemplosTexto = recommendations.exemplos_conteudo
      .map(ex => `${ex.titulo || 'Sem título'} (${ex.tipo || 'texto'})`)
      .join('\n');
    
    records.push({
      persona_id: personaId,
      tipo: 'documento',
      titulo: 'Exemplos de Conteúdo para Estudo',
      conteudo: exemplosTexto,
      categoria: 'exemplos',
      tags: ['exemplos', 'referencias'],
      relevancia: 0.9,
      ativo: true
    });
  }
  
  if (records.length === 0) {
    throw new Error('Nenhuma recomendação válida para salvar');
  }
  
  const { error } = await supabase
    .from('rag_knowledge')
    .insert(records);
    
  if (error) throw new Error(error.message);
  
  return records.length;
}

async function main() {
  const args = process.argv.slice(2);
  let empresaIdArg = null;
  let personaIdArg = null;
  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) empresaIdArg = arg.split('=')[1];
    if (arg.startsWith('--personaId=')) personaIdArg = arg.split('=')[1];
  }
  
  // Resolver empresa_id: se apenas personaId foi fornecido, buscar empresa_id
  let finalEmpresaId = empresaIdArg;
  
  if (!empresaIdArg && personaIdArg) {
    console.log('🔍 Buscando empresa_id da persona...');
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('empresa_id')
      .eq('id', personaIdArg)
      .single();
    
    if (personaError || !persona) {
      console.error('❌ Persona não encontrada');
      process.exit(1);
    }
    
    finalEmpresaId = persona.empresa_id;
    console.log(`✅ Empresa ID encontrado: ${finalEmpresaId}\n`);
  }
  
  if (!finalEmpresaId) {
    console.error('❌ --empresaId ou --personaId deve ser fornecido');
    console.log('💡 Uso: node 06.5_generate_rag_recommendations.js --empresaId=ID [--personaId=ID]');
    console.log('💡 Ou:  node 06.5_generate_rag_recommendations.js --personaId=ID');
    process.exit(1);
  }

  const personas = await getPersonas(finalEmpresaId, personaIdArg);
  if (!personas.length) {
    console.log('Nenhuma persona encontrada.');
    return;
  }

  // Inicializar tracker de progresso
  const tracker = new ExecutionTracker('06.5_generate_rag_recommendations', finalEmpresaId, personas.length);
  await tracker.start();

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    await tracker.updateProgress(i + 1, `Processando ${persona.full_name}`, persona.full_name);
    
    console.log(`\n👤 ${persona.full_name} (${persona.role})`);
    const { atribuicoes, tarefas } = await getAtribuicoesETarefas(persona.id);
    if (!atribuicoes.length && !tarefas.length) {
      console.log('  ⚠️  Nenhuma atribuição ou tarefa encontrada. Pulando.');
      continue;
    }
    
    const prompt = `Você é um especialista em treinamento corporativo.

Cargo: ${persona.role}
Departamento: ${persona.department}
Especialidade: ${persona.specialty}

Atribuições principais:
${atribuicoes.slice(0, 5).map((a,i)=>`${i+1}. ${a}`).join('\n')}

Tarefas:
${tarefas.slice(0, 5).map((t,i)=>`${i+1}. [${t.tipo}/${t.frequencia}] ${t.descricao}`).join('\n')}

Gere uma lista estruturada de tópicos, áreas de conhecimento e tipos de conteúdo para capacitação.

Retorne APENAS JSON válido:
{
  "topicos": ["Gestão de tempo", "Ferramentas CRM"],
  "areas_conhecimento": ["Vendas consultivas", "Comunicação"],
  "formatos_recomendados": ["artigos", "vídeos", "cursos"],
  "exemplos_conteudo": [
    {"titulo": "Como usar CRM X", "tipo": "vídeo"}
  ]
}`;

    let recommendations = null;
    try {
      recommendations = await generateJSONWithFallback(prompt, {
        temperature: 0.3,
        maxTokens: 1200,
        timeout: 60000
      });
      
      console.log(`  ✅ Recomendações geradas com sucesso`);
      await tracker.success(`${persona.full_name}: OK`);
    } catch (err) {
      console.error('  ❌ Erro ao gerar recomendações RAG:', err.message);
      await tracker.error(`${persona.full_name}: ${err.message}`);
      erros++;
      continue;
    }
    
    try {
      const savedCount = await saveRagKnowledge(persona.id, recommendations);
      console.log(`  ✅ ${savedCount} registros salvos em rag_knowledge`);
      sucessos++;
    } catch (err) {
      console.error('  ❌ Erro ao salvar no banco:', err.message);
      await tracker.error(`${persona.full_name}: DB error - ${err.message}`);
      erros++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  await tracker.complete(`Concluído: ${sucessos} sucessos, ${erros} erros`);
  
  console.log('\n📊 RELATÓRIO');
  console.log('=============');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log('🎉 SCRIPT 06.5 CONCLUÍDO!');
}

main();
