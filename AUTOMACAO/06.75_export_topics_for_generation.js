#!/usr/bin/env node
// ============================================================================
// SCRIPT AUXILIAR - EXPORTAR TÓPICOS RAG PARA GERAÇÃO EXTERNA
// ============================================================================
// OBJETIVO: Consolidar todos os tópicos gerados pelo Script 06.5 em um arquivo
// de texto estruturado, pronto para ser usado em outra interface LLM (ChatGPT,
// Claude, etc.) para gerar documentos completos que serão ingeridos no Script 10.
//
// Uso: node 06.5_export_topics_for_generation.js --empresaId=UUID [--output=arquivo.txt]
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

console.log('📤 EXPORTAÇÃO DE TÓPICOS RAG PARA GERAÇÃO EXTERNA');
console.log('===================================================');
console.log('📝 Consolidando recomendações do Script 06.5');
console.log('===================================================\n');

// Parse arguments
const args = process.argv.slice(2);
let empresaId = null;
let outputFile = null;

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    empresaId = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    outputFile = arg.split('=')[1];
  }
}

if (!empresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('💡 Uso: node 06.5_export_topics_for_generation.js --empresaId=UUID [--output=arquivo.txt]');
  process.exit(1);
}

// Definir arquivo de saída padrão
if (!outputFile) {
  const { data: empresa } = await supabase
    .from('empresas')
    .select('codigo')
    .eq('id', empresaId)
    .single();
  
  const codigo = empresa?.codigo || 'EMPRESA';
  outputFile = join(__dirname, `RAG_TOPICS_${codigo}_${Date.now()}.txt`);
}

async function exportTopics() {
  try {
    // 1. Buscar empresa
    console.log('1️⃣ Buscando informações da empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada');
      process.exit(1);
    }

    console.log(`🏢 Empresa: ${empresa.nome} (${empresa.codigo})\n`);

    // 2. Buscar todas as personas
    console.log('2️⃣ Buscando personas da empresa...\n');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, role, department, specialty')
      .eq('empresa_id', empresaId)
      .order('department', { ascending: true })
      .order('role', { ascending: true });

    if (personasError || !personas || personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada');
      process.exit(1);
    }

    console.log(`👥 Total de personas: ${personas.length}\n`);

    // 3. Buscar recomendações RAG de todas as personas
    console.log('3️⃣ Buscando recomendações RAG...\n');
    const { data: ragRecords, error: ragError } = await supabase
      .from('rag_knowledge')
      .select('persona_id, tipo, titulo, conteudo, categoria, tags')
      .in('persona_id', personas.map(p => p.id))
      .eq('ativo', true)
      .order('persona_id', { ascending: true });

    if (ragError) {
      console.error('❌ Erro ao buscar recomendações:', ragError.message);
      process.exit(1);
    }

    if (!ragRecords || ragRecords.length === 0) {
      console.error('⚠️  Nenhuma recomendação RAG encontrada');
      console.log('💡 Execute primeiro: node 06.5_generate_rag_recommendations.js --empresaId=' + empresaId);
      process.exit(1);
    }

    console.log(`📚 Total de registros RAG: ${ragRecords.length}\n`);

    // 4. Consolidar dados por persona
    const personaMap = new Map();
    personas.forEach(p => {
      personaMap.set(p.id, {
        ...p,
        topicos: [],
        areas_conhecimento: [],
        formatos: [],
        exemplos: []
      });
    });

    ragRecords.forEach(record => {
      const persona = personaMap.get(record.persona_id);
      if (!persona) return;

      const lines = record.conteudo.split('\n').filter(line => line.trim());

      if (record.categoria === 'capacitacao' && record.tags.includes('topicos')) {
        persona.topicos.push(...lines);
      } else if (record.categoria === 'desenvolvimento' && record.tags.includes('areas_conhecimento')) {
        persona.areas_conhecimento.push(...lines);
      } else if (record.categoria === 'metodologia' && record.tags.includes('formatos')) {
        persona.formatos.push(...lines);
      } else if (record.categoria === 'exemplos') {
        persona.exemplos.push(...lines);
      }
    });

    // 5. Gerar arquivo de texto estruturado
    console.log('4️⃣ Gerando arquivo de texto estruturado...\n');

    let output = '';
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += `    TÓPICOS RAG PARA GERAÇÃO DE DOCUMENTOS\n`;
    output += `    Empresa: ${empresa.nome} (${empresa.codigo})\n`;
    output += `    Data: ${new Date().toISOString().split('T')[0]}\n`;
    output += `    Total de Personas: ${personas.length}\n`;
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    output += '📋 INSTRUÇÕES PARA GERAÇÃO DE DOCUMENTOS:\n';
    output += '─────────────────────────────────────────────────────────────────\n';
    output += '1. Para cada tópico listado abaixo, gere um documento completo\n';
    output += '2. Use o formato: [Departamento] - [Cargo] - [Tópico]\n';
    output += '3. Inclua: Introdução, Conceitos, Práticas, Exemplos, Conclusão\n';
    output += '4. Tamanho recomendado: 500-1500 palavras por tópico\n';
    output += '5. Salve cada documento como arquivo .txt separado\n';
    output += '6. Use o Script 10 para ingerir: node 10_generate_knowledge_base.js --empresaId=UUID --source=PASTA_DOCS\n\n';

    // Organizar por departamento
    const byDepartment = new Map();
    personaMap.forEach(persona => {
      if (!byDepartment.has(persona.department)) {
        byDepartment.set(persona.department, []);
      }
      byDepartment.get(persona.department).push(persona);
    });

    let topicoCount = 0;

    byDepartment.forEach((personasList, department) => {
      output += `\n${'═'.repeat(70)}\n`;
      output += `DEPARTAMENTO: ${department.toUpperCase()}\n`;
      output += `${'═'.repeat(70)}\n\n`;

      personasList.forEach(persona => {
        output += `┌─────────────────────────────────────────────────────────────────┐\n`;
        output += `│ PERSONA: ${persona.full_name.padEnd(52)}│\n`;
        output += `│ Cargo: ${persona.role.padEnd(54)}│\n`;
        output += `│ Especialidade: ${(persona.specialty || 'N/A').padEnd(47)}│\n`;
        output += `└─────────────────────────────────────────────────────────────────┘\n\n`;

        if (persona.topicos.length > 0) {
          output += `📚 TÓPICOS DE CAPACITAÇÃO (${persona.topicos.length}):\n`;
          output += `${'─'.repeat(70)}\n`;
          persona.topicos.forEach((topico, idx) => {
            output += `${idx + 1}. ${topico}\n`;
            topicoCount++;
          });
          output += '\n';
        }

        if (persona.areas_conhecimento.length > 0) {
          output += `🎯 ÁREAS DE CONHECIMENTO (${persona.areas_conhecimento.length}):\n`;
          output += `${'─'.repeat(70)}\n`;
          persona.areas_conhecimento.forEach((area, idx) => {
            output += `${idx + 1}. ${area}\n`;
          });
          output += '\n';
        }

        if (persona.formatos.length > 0) {
          output += `📝 FORMATOS RECOMENDADOS:\n`;
          output += `${'─'.repeat(70)}\n`;
          output += persona.formatos.join('\n') + '\n\n';
        }

        if (persona.exemplos.length > 0) {
          output += `💡 EXEMPLOS DE CONTEÚDO:\n`;
          output += `${'─'.repeat(70)}\n`;
          persona.exemplos.forEach((exemplo, idx) => {
            output += `${idx + 1}. ${exemplo}\n`;
          });
          output += '\n';
        }

        output += '\n';
      });
    });

    // 6. Adicionar resumo consolidado
    output += '\n';
    output += '═══════════════════════════════════════════════════════════════════\n';
    output += '    RESUMO CONSOLIDADO - TODOS OS TÓPICOS ÚNICOS\n';
    output += '═══════════════════════════════════════════════════════════════════\n\n';

    const allTopics = new Set();
    const allAreas = new Set();

    personaMap.forEach(persona => {
      persona.topicos.forEach(t => allTopics.add(t));
      persona.areas_conhecimento.forEach(a => allAreas.add(a));
    });

    output += `📋 TOTAL DE TÓPICOS ÚNICOS: ${allTopics.size}\n`;
    output += `${'─'.repeat(70)}\n`;
    Array.from(allTopics).sort().forEach((topico, idx) => {
      output += `${idx + 1}. ${topico}\n`;
    });

    output += `\n🎯 TOTAL DE ÁREAS ÚNICAS: ${allAreas.size}\n`;
    output += `${'─'.repeat(70)}\n`;
    Array.from(allAreas).sort().forEach((area, idx) => {
      output += `${idx + 1}. ${area}\n`;
    });

    // 7. Salvar arquivo
    await fs.writeFile(outputFile, output, 'utf-8');

    console.log('✅ EXPORTAÇÃO CONCLUÍDA!\n');
    console.log('📊 ESTATÍSTICAS:');
    console.log(`   • Personas processadas: ${personas.length}`);
    console.log(`   • Total de tópicos: ${topicoCount}`);
    console.log(`   • Tópicos únicos: ${allTopics.size}`);
    console.log(`   • Áreas de conhecimento únicas: ${allAreas.size}`);
    console.log(`   • Registros RAG: ${ragRecords.length}\n`);
    console.log('📄 ARQUIVO GERADO:');
    console.log(`   ${outputFile}\n`);
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Abra o arquivo gerado em um editor de texto');
    console.log('   2. Use os tópicos para gerar documentos completos (ChatGPT, Claude, etc.)');
    console.log('   3. Salve cada documento como .txt em uma pasta');
    console.log('   4. Execute: node 10_generate_knowledge_base.js --empresaId=' + empresaId + ' --source=PASTA_DOCS');
    console.log('   5. Os documentos serão processados, divididos em chunks e armazenados com embeddings\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

exportTopics();
