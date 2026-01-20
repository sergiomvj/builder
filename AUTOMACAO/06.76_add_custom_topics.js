#!/usr/bin/env node
// ============================================================================
// SCRIPT 06.76 - ADICIONAR TÓPICOS CUSTOMIZADOS ÀS RECOMENDAÇÕES RAG
// ============================================================================
// OBJETIVO: Permitir inserção manual de tópicos especializados que não foram
// gerados automaticamente pelo Script 06.5, mantendo integração com personas.
//
// Casos de uso:
// - Adicionar conhecimento específico do setor (ex: veterinária, jurídico)
// - Incluir processos internos da empresa (fluxos, políticas)
// - Complementar áreas não cobertas pela automação
//
// Uso:
//   node 06.76_add_custom_topics.js --empresaId=UUID --personaId=UUID --topicos="Tópico 1,Tópico 2"
//   node 06.76_add_custom_topics.js --empresaId=UUID --cargo="Veterinário" --topicos="Nutrição animal,Legislação"
//   node 06.76_add_custom_topics.js --empresaId=UUID --file=topicos_custom.json
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configurar encoding do console
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('➕ SCRIPT 06.76 - ADICIONAR TÓPICOS CUSTOMIZADOS');
console.log('===================================================');
console.log('🎯 Ampliando recomendações RAG com conhecimento especializado');
console.log('===================================================\n');

// ============================================================================
// PARSE ARGUMENTOS
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  let empresaId = null;
  let personaId = null;
  let cargo = null;
  let department = null;
  let topicos = null;
  let areas = null;
  let file = null;

  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) empresaId = arg.split('=')[1];
    else if (arg.startsWith('--personaId=')) personaId = arg.split('=')[1];
    else if (arg.startsWith('--cargo=')) cargo = arg.split('=')[1];
    else if (arg.startsWith('--department=')) department = arg.split('=')[1];
    else if (arg.startsWith('--topicos=')) topicos = arg.split('=')[1];
    else if (arg.startsWith('--areas=')) areas = arg.split('=')[1];
    else if (arg.startsWith('--file=')) file = arg.split('=')[1];
  }

  return { empresaId, personaId, cargo, department, topicos, areas, file };
}

// ============================================================================
// BUSCAR PERSONAS
// ============================================================================

async function findPersonas(empresaId, personaId, cargo, department) {
  let query = supabase
    .from('personas')
    .select('id, full_name, role, department, specialty')
    .eq('empresa_id', empresaId);

  if (personaId) {
    query = query.eq('id', personaId);
  } else if (cargo) {
    query = query.ilike('role', `%${cargo}%`);
  } else if (department) {
    query = query.ilike('department', `%${department}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar personas: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// ADICIONAR TÓPICOS CUSTOMIZADOS
// ============================================================================

async function addCustomTopics(personaId, topicos, areas, categoria = 'custom') {
  const records = [];

  // Verificar se já existe registro custom para esta persona
  const { data: existing } = await supabase
    .from('rag_knowledge')
    .select('id, conteudo')
    .eq('persona_id', personaId)
    .eq('categoria', categoria)
    .eq('tipo', 'documento')
    .eq('titulo', 'Tópicos Customizados')
    .maybeSingle();

  if (existing) {
    // UPDATE: Adicionar aos tópicos existentes
    const existingTopics = existing.conteudo.split('\n').filter(t => t.trim());
    const newTopics = [...new Set([...existingTopics, ...topicos])]; // Remove duplicatas

    const { error } = await supabase
      .from('rag_knowledge')
      .update({
        conteudo: newTopics.join('\n'),
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (error) throw new Error(error.message);

    return { updated: true, count: newTopics.length - existingTopics.length };
  } else {
    // INSERT: Criar novo registro
    if (topicos && topicos.length > 0) {
      records.push({
        persona_id: personaId,
        tipo: 'documento',
        titulo: 'Tópicos Customizados',
        conteudo: topicos.join('\n'),
        categoria: categoria,
        tags: ['custom', 'manual'],
        relevancia: 1.0,
        ativo: true
      });
    }

    if (areas && areas.length > 0) {
      records.push({
        persona_id: personaId,
        tipo: 'procedimento',
        titulo: 'Áreas de Conhecimento Customizadas',
        conteudo: areas.join('\n'),
        categoria: categoria,
        tags: ['custom', 'manual', 'areas'],
        relevancia: 1.0,
        ativo: true
      });
    }

    if (records.length === 0) {
      throw new Error('Nenhum tópico ou área fornecido');
    }

    const { error } = await supabase
      .from('rag_knowledge')
      .insert(records);

    if (error) throw new Error(error.message);

    return { updated: false, count: records.length };
  }
}

// ============================================================================
// CARREGAR DE ARQUIVO JSON
// ============================================================================

async function loadFromFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Validar estrutura esperada
    if (!Array.isArray(data)) {
      throw new Error('Arquivo deve conter um array de objetos');
    }

    for (const item of data) {
      if (!item.personaId && !item.cargo && !item.department) {
        throw new Error('Cada item deve ter personaId, cargo ou department');
      }
      if (!item.topicos && !item.areas) {
        throw new Error('Cada item deve ter topicos ou areas');
      }
    }

    return data;
  } catch (error) {
    throw new Error(`Erro ao ler arquivo: ${error.message}`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = parseArgs();

  if (!args.empresaId) {
    console.error('❌ Erro: --empresaId é obrigatório\n');
    console.log('💡 EXEMPLOS DE USO:\n');
    console.log('1. Adicionar tópicos para persona específica:');
    console.log('   node 06.76_add_custom_topics.js --empresaId=UUID --personaId=UUID --topicos="Tópico 1,Tópico 2"\n');
    console.log('2. Adicionar para todas as personas de um cargo:');
    console.log('   node 06.76_add_custom_topics.js --empresaId=UUID --cargo="Veterinário" --topicos="Nutrição,Legislação"\n');
    console.log('3. Adicionar para um departamento:');
    console.log('   node 06.76_add_custom_topics.js --empresaId=UUID --department="Jurídico" --topicos="Lei X,Regulamento Y"\n');
    console.log('4. Usar arquivo JSON:');
    console.log('   node 06.76_add_custom_topics.js --empresaId=UUID --file=topicos_custom.json\n');
    console.log('📄 FORMATO DO ARQUIVO JSON:');
    console.log('[');
    console.log('  {');
    console.log('    "personaId": "UUID" // ou "cargo": "Veterinário" ou "department": "Jurídico"');
    console.log('    "topicos": ["Nutrição animal", "Legislação veterinária"],');
    console.log('    "areas": ["Medicina veterinária", "Regulamentação"]');
    console.log('  }');
    console.log(']\n');
    process.exit(1);
  }

  try {
    // 1. Buscar empresa
    console.log('1️⃣ Verificando empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('nome, codigo')
      .eq('id', args.empresaId)
      .single();

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada');
      process.exit(1);
    }

    console.log(`🏢 Empresa: ${empresa.nome} (${empresa.codigo})\n`);

    // 2. Processar baseado em arquivo ou argumentos
    let operations = [];

    if (args.file) {
      console.log(`2️⃣ Carregando tópicos de arquivo: ${args.file}\n`);
      const fileData = await loadFromFile(args.file);
      operations = fileData;
    } else {
      // Validar argumentos
      if (!args.topicos && !args.areas) {
        console.error('❌ Erro: --topicos ou --areas é obrigatório');
        process.exit(1);
      }

      operations = [{
        personaId: args.personaId,
        cargo: args.cargo,
        department: args.department,
        topicos: args.topicos,
        areas: args.areas
      }];
    }

    // 3. Processar cada operação
    console.log('3️⃣ Processando tópicos customizados...\n');

    let totalPersonas = 0;
    let totalTopicos = 0;
    let errors = 0;

    for (const op of operations) {
      try {
        // Buscar personas alvo
        const personas = await findPersonas(
          args.empresaId,
          op.personaId,
          op.cargo,
          op.department
        );

        if (personas.length === 0) {
          console.log(`⚠️  Nenhuma persona encontrada para: ${op.cargo || op.department || op.personaId}`);
          continue;
        }

        console.log(`👥 Encontradas ${personas.length} persona(s):`);
        personas.forEach(p => console.log(`   • ${p.full_name} (${p.role})`));
        console.log();

        // Preparar tópicos e áreas
        const topicos = op.topicos ? op.topicos.split(',').map(t => t.trim()).filter(t => t) : [];
        const areas = op.areas ? op.areas.split(',').map(a => a.trim()).filter(a => a) : [];

        // Adicionar para cada persona
        for (const persona of personas) {
          try {
            const result = await addCustomTopics(persona.id, topicos, areas, op.categoria || 'custom');
            
            if (result.updated) {
              console.log(`   ✅ ${persona.full_name}: ${result.count} novo(s) tópico(s) adicionado(s) (atualizado)`);
            } else {
              console.log(`   ✅ ${persona.full_name}: ${result.count} registro(s) criado(s)`);
            }

            totalPersonas++;
            totalTopicos += result.count;
          } catch (err) {
            console.error(`   ❌ ${persona.full_name}: ${err.message}`);
            errors++;
          }
        }

        console.log();
      } catch (err) {
        console.error(`❌ Erro ao processar operação: ${err.message}\n`);
        errors++;
      }
    }

    // 4. Relatório final
    console.log('📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Personas atualizadas: ${totalPersonas}`);
    console.log(`📝 Tópicos/áreas adicionados: ${totalTopicos}`);
    console.log(`❌ Erros: ${errors}`);
    console.log();

    if (totalTopicos > 0) {
      console.log('🚀 PRÓXIMOS PASSOS:');
      console.log('   1. Execute o Script 06.75 para exportar TODOS os tópicos (incluindo customizados):');
      console.log(`      node 06.75_export_topics_for_generation.js --empresaId=${args.empresaId}`);
      console.log();
      console.log('   2. Gere documentos completos para os novos tópicos (ChatGPT/Claude)');
      console.log();
      console.log('   3. Salve os documentos como .txt em knowledge_docs/');
      console.log();
      console.log('   4. Execute o Script 10 para ingestão:');
      console.log(`      node 10_generate_knowledge_base.js --empresaId=${args.empresaId} --source=knowledge_docs/`);
      console.log();
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

main();
