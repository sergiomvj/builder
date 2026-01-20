/**
 * Script 01.5: Geração Automática de Tarefas a partir de Atribuições
 * 
 * PROPÓSITO:
 * - Ler atribuições contextualizadas da tabela personas_atribuicoes
 * - Usar LLM (OpenAI GPT-4) para gerar tarefas diárias, semanais e mensais
 * - Inserir tarefas em personas_tasks com task_persona_assignments
 * 
 * EXECUÇÃO:
 * node 01.5_generate_tasks_from_atribuicoes.js --empresaId=UUID_EMPRESA
 * 
 * DEPENDÊNCIAS:
 * - openai
 * - @supabase/supabase-js
 * - Tabelas: personas_atribuicoes, personas, personas_tasks, task_persona_assignments
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_KEY || !OPENAI_KEY) {
  console.error('❌ Variáveis de ambiente faltando:');
  if (!SUPABASE_KEY) console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!OPENAI_KEY) console.error('   - OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

const OUTPUT_DIR = path.join(process.cwd(), 'AUTOMACAO', 'generated_tasks_output');

// ============================================================================
// PROMPT PARA LLM
// ============================================================================

const TASK_GENERATION_PROMPT = (persona, atribuicoes, empresa) => `
Você é um especialista em gestão de tarefas e produtividade empresarial.

**CONTEXTO DA EMPRESA:**
- Nome: ${empresa.nome || 'N/A'}
- Setor: ${empresa.setor || 'N/A'}
- Descrição: ${empresa.descricao || 'N/A'}

**CONTEXTO DA PERSONA:**
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Departamento: ${atribuicoes?.departamento || 'N/A'}
- Nível Hierárquico: ${atribuicoes?.nivel_hierarquico || 'N/A'}
- Reporta para: ${atribuicoes?.reporting_to_name || 'Direção'}
- Sistemas que acessa: ${atribuicoes?.sistemas_acesso?.join(', ') || 'N/A'}
- Permissões: ${atribuicoes?.permissoes?.join(', ') || 'N/A'}

**OBJETIVO:**
Gerar uma lista de tarefas **realistas e específicas** para esta persona, considerando seu cargo e responsabilidades.

**REGRAS IMPORTANTES:**
1. Gerar 3-5 tarefas DIÁRIAS (daily)
2. Gerar 2-3 tarefas SEMANAIS (weekly)
3. Gerar 1-2 tarefas MENSAIS (monthly)
4. Cada tarefa deve ter título curto e objetivo
5. Descrição deve ser clara e acionável
6. Prioridade deve ser realista (LOW, MEDIUM, HIGH, URGENT)
7. Duração estimada em minutos (realista)
8. Complexidade de 1-10
9. Critérios de sucesso mensuráveis

**FORMATO DE SAÍDA (JSON):**
Retorne um objeto JSON com a chave "tasks" contendo um array de tarefas:

{
  "tasks": [
    {
      "title": "Título conciso da tarefa",
      "description": "Descrição detalhada do que precisa ser feito",
      "task_type": "daily",
      "priority": "MEDIUM",
      "estimated_duration": 30,
      "complexity_score": 5,
      "success_criteria": "Como medir se a tarefa foi bem sucedida",
      "required_subsystems": ["CRM", "Email"],
      "inputs_from": ["Equipe de vendas"],
      "outputs_to": ["Gerência"]
    }
  ]
}

**IMPORTANTE:** Retorne APENAS o JSON no formato acima, garantindo que a chave "tasks" exista.
`;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function getEmpresaById(empresaId) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  if (error) throw new Error(`Erro ao buscar empresa: ${error.message}`);
  return data;
}

async function getPersonasComAtribuicoes(empresaId) {
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('status', 'active');
  
  if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);
  
  // Buscar atribuições para cada persona
  const personasComAtribuicoes = [];
  
  for (const persona of personas) {
    const { data: atribuicao, error: atribError } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .eq('persona_id', persona.id)
      .single();
    
    if (!atribError && atribuicao) {
      // Buscar nome do supervisor se existir
      if (atribuicao.reporting_to) {
        const { data: supervisor } = await supabase
          .from('personas')
          .select('full_name')
          .eq('id', atribuicao.reporting_to)
          .single();
        
        if (supervisor) {
          atribuicao.reporting_to_name = supervisor.full_name;
        }
      }
      
      personasComAtribuicoes.push({
        ...persona,
        atribuicoes: atribuicao
      });
    }
  }
  
  return personasComAtribuicoes;
}

async function generateTasksWithLLM(persona, empresa) {
  const prompt = TASK_GENERATION_PROMPT(persona, persona.atribuicoes, empresa);
  
  try {
    console.log(`   🤖 Consultando OpenAI GPT-4...`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em gestão de tarefas e produtividade empresarial. Sempre retorne apenas JSON válido, sem markdown ou texto adicional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });
    
    const responseText = completion.choices[0].message.content;
    
    // Log para debug
    console.log(`   📝 Debug: Primeiros 200 chars da resposta:`, responseText.substring(0, 200));
    
    // Parse JSON
    const responseObj = JSON.parse(responseText);
    
    // A resposta pode vir em diferentes formatos, normalizar
    let tasks = [];
    if (Array.isArray(responseObj)) {
      tasks = responseObj;
    } else if (responseObj.tasks && Array.isArray(responseObj.tasks)) {
      tasks = responseObj.tasks;
    } else if (responseObj.tarefas && Array.isArray(responseObj.tarefas)) {
      tasks = responseObj.tarefas;
    } else {
      // Tentar pegar qualquer array do objeto
      for (const key of Object.keys(responseObj)) {
        if (Array.isArray(responseObj[key]) && responseObj[key].length > 0) {
          tasks = responseObj[key];
          console.log(`   🔍 Encontrado array em: ${key}`);
          break;
        }
      }
    }
    
    if (tasks.length === 0) {
      console.log(`   ⚠️ Resposta não contém array de tarefas`);
      console.log(`   📄 Estrutura recebida:`, JSON.stringify(responseObj, null, 2).substring(0, 300));
      return [];
    }
    
    console.log(`   ✅ ${tasks.length} tarefas geradas`);
    return tasks;
    
  } catch (error) {
    console.error(`   ❌ Erro ao processar resposta LLM:`, error.message);
    return [];
  }
}

async function insertTasksToDatabase(empresaId, personaId, tasks) {
  const inserted = [];
  
  for (const task of tasks) {
    try {
      // 1. Inserir tarefa em personas_tasks
      const taskPayload = {
        empresa_id: empresaId,
        task_id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: task.title,
        description: task.description,
        task_type: task.task_type,
        priority: task.priority,
        status: 'pending',
        estimated_duration: task.estimated_duration || null,
        complexity_score: task.complexity_score || null,
        success_criteria: task.success_criteria || null,
        required_subsystems: task.required_subsystems || [],
        inputs_from: task.inputs_from || [],
        outputs_to: task.outputs_to || [],
        ai_generated: true,
        generation_context: {
          script: '01.5_generate_tasks_from_atribuicoes.js',
          timestamp: new Date().toISOString(),
          model: 'gpt-4-turbo-preview'
        }
      };
      
      const { data: insertedTask, error: taskError } = await supabase
        .from('personas_tasks')
        .insert(taskPayload)
        .select()
        .single();
      
      if (taskError) {
        console.error(`      ⚠️ Erro ao inserir tarefa "${task.title}":`, taskError.message);
        continue;
      }
      
      // 2. Criar assignment para a persona
      const assignmentPayload = {
        task_id: insertedTask.id,
        persona_id: personaId,
        status: 'pending'
      };
      
      const { error: assignError } = await supabase
        .from('task_persona_assignments')
        .insert(assignmentPayload);
      
      if (assignError) {
        console.error(`      ⚠️ Erro ao atribuir tarefa:`, assignError.message);
      } else {
        inserted.push(insertedTask);
      }
      
    } catch (error) {
      console.error(`      ⚠️ Erro geral:`, error.message);
    }
  }
  
  return inserted;
}

async function saveOutputJSON(empresaId, allResults) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const filename = `tasks_${empresaId}_${Date.now()}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  await fs.writeFile(
    filepath,
    JSON.stringify(allResults, null, 2),
    'utf-8'
  );
  
  console.log(`\n💾 Backup salvo: ${filename}`);
}

// ============================================================================
// FLUXO PRINCIPAL
// ============================================================================

async function main() {
  console.log('🚀 GERAÇÃO AUTOMÁTICA DE TAREFAS A PARTIR DE ATRIBUIÇÕES\n');
  console.log('='.repeat(70));
  
  // Parse argumentos
  const args = process.argv.slice(2);
  const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
  
  if (!empresaIdArg) {
    console.error('\n❌ Erro: --empresaId não fornecido');
    console.log('\nUso: node 01.5_generate_tasks_from_atribuicoes.js --empresaId=UUID_EMPRESA\n');
    process.exit(1);
  }
  
  const empresaId = empresaIdArg.split('=')[1];
  
  try {
    // 1. Buscar empresa
    console.log('\n1️⃣ Buscando empresa...');
    const empresa = await getEmpresaById(empresaId);
    console.log(`   ✅ Empresa: ${empresa.nome}`);
    
    // 2. Buscar personas com atribuições
    console.log('\n2️⃣ Buscando personas com atribuições...');
    const personas = await getPersonasComAtribuicoes(empresaId);
    console.log(`   ✅ ${personas.length} personas encontradas`);
    
    if (personas.length === 0) {
      console.log('\n⚠️ Nenhuma persona com atribuições encontrada.');
      console.log('   Execute o script de atribuições primeiro.\n');
      return;
    }
    
    // 3. Gerar tarefas para cada persona
    console.log('\n3️⃣ Gerando tarefas com LLM...\n');
    
    const allResults = [];
    
    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      console.log(`\n[${i + 1}/${personas.length}] ${persona.full_name} (${persona.role})`);
      
      // Gerar tarefas via LLM
      const generatedTasks = await generateTasksWithLLM(persona, empresa);
      
      if (generatedTasks.length === 0) {
        console.log(`   ⚠️ Nenhuma tarefa gerada`);
        continue;
      }
      
      // Inserir no banco
      console.log(`   💾 Inserindo no banco de dados...`);
      const insertedTasks = await insertTasksToDatabase(empresaId, persona.id, generatedTasks);
      
      console.log(`   ✅ ${insertedTasks.length}/${generatedTasks.length} tarefas inseridas`);
      
      allResults.push({
        persona_id: persona.id,
        persona_name: persona.full_name,
        role: persona.role,
        generated_tasks: generatedTasks,
        inserted_tasks: insertedTasks
      });
      
      // Rate limiting (respeitar API)
      if (i < personas.length - 1) {
        console.log(`   ⏳ Aguardando 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 4. Salvar backup JSON
    await saveOutputJSON(empresaId, allResults);
    
    // 5. Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO FINAL:\n');
    
    const totalGenerated = allResults.reduce((sum, r) => sum + r.generated_tasks.length, 0);
    const totalInserted = allResults.reduce((sum, r) => sum + r.inserted_tasks.length, 0);
    
    console.log(`✅ Personas processadas: ${allResults.length}`);
    console.log(`✅ Tarefas geradas: ${totalGenerated}`);
    console.log(`✅ Tarefas inseridas: ${totalInserted}`);
    
    if (totalInserted < totalGenerated) {
      console.log(`⚠️ Falhas: ${totalGenerated - totalInserted}`);
    }
    
    console.log('\n🎉 Processo concluído!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
