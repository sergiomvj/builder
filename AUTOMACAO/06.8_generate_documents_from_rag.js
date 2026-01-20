#!/usr/bin/env node
/**
 * Script 06.8 - Gerador de Documentos RAG via LLM
 * 
 * Este script lê as recomendações RAG do banco de dados e usa LLM com fallback
 * para gerar documentos completos em formato FAQ (máx 1200 palavras) salvos em knowledge_docs/
 * 
 * Uso:
 *   node 06.8_generate_documents_from_rag.js --empresaId=UUID [--outputDir=caminho] [--maxWords=1200]
 * 
 * Características:
 *   - Lê tópicos de rag_knowledge (tipos: documento, procedimento, faq)
 *   - Usa generateWithFallback (6 modelos: Grok → GLM → Kimi → GPT-3.5 → Qwen → Claude)
 *   - Gera FAQs estruturados (perguntas + respostas detalhadas)
 *   - Limite de palavras configurável (padrão: 1200)
 *   - Salva em knowledge_docs/EMPRESA_TOPICO_timestamp.txt
 *   - Rate limiting (2s entre chamadas LLM)
 *   - Progress tracking por tópico
 */

import { createClient } from '@supabase/supabase-js';
import { generateWithFallback, setupConsoleEncoding } from '../lib/llm_fallback.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup Windows console UTF-8
setupConsoleEncoding();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const empresaId = args.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
  const outputDir = args.find(arg => arg.startsWith('--outputDir='))?.split('=')[1] || 'knowledge_docs';
  const maxWords = parseInt(args.find(arg => arg.startsWith('--maxWords='))?.split('=')[1] || '1200');
  
  return { empresaId, outputDir, maxWords };
}

// Get empresa info
async function getEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('empresas')
    .select('nome, sigla')
    .eq('id', empresaId)
    .single();
  
  if (error) throw new Error(`Erro ao buscar empresa: ${error.message}`);
  return data;
}

// Get RAG recommendations
async function getRAGRecommendations(empresaId) {
  const { data, error } = await supabase
    .from('rag_knowledge')
    .select(`
      id,
      persona_id,
      tipo,
      titulo,
      conteudo,
      categoria,
      personas!inner(nome, cargo, departamento)
    `)
    .eq('personas.empresa_id', empresaId)
    .eq('ativo', true)
    .in('tipo', ['documento', 'procedimento', 'faq'])
    .order('departamento', { foreignTable: 'personas' })
    .order('persona_id');
  
  if (error) throw new Error(`Erro ao buscar recomendações RAG: ${error.message}`);
  return data;
}

// Consolidate unique topics
function consolidateTopics(recommendations) {
  const topicsMap = new Map();
  
  recommendations.forEach(rec => {
    // Split content by lines (each line is a topic)
    const topics = rec.conteudo
      .split('\n')
      .map(t => t.trim())
      .filter(t => t && !t.startsWith('#') && !t.startsWith('-'));
    
    topics.forEach(topic => {
      if (!topicsMap.has(topic)) {
        topicsMap.set(topic, {
          topic,
          personas: [],
          tipo: rec.tipo,
          categoria: rec.categoria
        });
      }
      
      const entry = topicsMap.get(topic);
      const personaInfo = `${rec.personas.nome} (${rec.personas.cargo} - ${rec.personas.departamento})`;
      if (!entry.personas.includes(personaInfo)) {
        entry.personas.push(personaInfo);
      }
    });
  });
  
  return Array.from(topicsMap.values());
}

// Generate FAQ document with LLM
async function generateFAQDocument(topic, context, maxWords, empresa) {
  const prompt = `Você é um especialista em criar documentação técnica e materiais de treinamento.

CONTEXTO DA EMPRESA:
Empresa: ${empresa.nome} (${empresa.sigla})

PERSONAS QUE PRECISAM DESTE CONHECIMENTO:
${context.personas.join('\n')}

TAREFA:
Crie um documento completo no formato FAQ sobre o tópico abaixo. O documento deve ter:
- Máximo de ${maxWords} palavras
- 8-12 perguntas relevantes com respostas detalhadas
- Linguagem clara e profissional
- Exemplos práticos quando aplicável
- Estrutura hierárquica (perguntas mais gerais primeiro, depois específicas)

TÓPICO: ${topic}

FORMATO ESPERADO:
# ${topic}

## Visão Geral
[Introdução de 2-3 parágrafos explicando o conceito e sua importância]

## Perguntas Frequentes

### 1. [Pergunta fundamental sobre o conceito básico]
[Resposta detalhada de 100-150 palavras]

### 2. [Pergunta sobre aplicação prática]
[Resposta com exemplos concretos]

### 3. [Pergunta sobre desafios comuns]
[Resposta com soluções práticas]

[... continue até 8-12 perguntas ...]

## Boas Práticas
- [Lista de 3-5 recomendações importantes]

## Recursos Adicionais
[2-3 linhas sobre onde buscar mais informações]

---
IMPORTANTE:
- Use português brasileiro
- Seja objetivo mas completo
- Inclua termos técnicos com explicações
- Forneça exemplos do contexto empresarial quando possível
- Limite: ${maxWords} palavras`;

  try {
    const response = await generateWithFallback(prompt);
    return response;
  } catch (error) {
    console.error(`   ❌ Erro ao gerar documento para "${topic}":`, error.message);
    return null;
  }
}

// Sanitize filename
function sanitizeFilename(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 80); // Limit length
}

// Save document
async function saveDocument(content, topic, empresa, outputDir) {
  const timestamp = Date.now();
  const empresaSafe = sanitizeFilename(empresa.sigla || empresa.nome);
  const topicSafe = sanitizeFilename(topic);
  const filename = `${empresaSafe}_${topicSafe}_${timestamp}.txt`;
  const filepath = path.join(__dirname, outputDir, filename);
  
  // Create output directory if doesn't exist
  const dirPath = path.join(__dirname, outputDir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Add metadata header
  const header = `================================================================================
DOCUMENTO GERADO AUTOMATICAMENTE
Empresa: ${empresa.nome} (${empresa.sigla})
Tópico: ${topic}
Data: ${new Date().toISOString()}
Script: 06.8_generate_documents_from_rag.js
================================================================================

`;
  
  fs.writeFileSync(filepath, header + content, 'utf-8');
  return filename;
}

// Count words
function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// Main function
async function main() {
  console.log('\n📝 SCRIPT 06.8 - GERADOR DE DOCUMENTOS RAG VIA LLM');
  console.log('===================================================\n');
  
  const { empresaId, outputDir, maxWords } = parseArgs();
  
  if (!empresaId) {
    console.error('❌ Erro: --empresaId é obrigatório');
    console.log('\nUso: node 06.8_generate_documents_from_rag.js --empresaId=UUID [--outputDir=caminho] [--maxWords=1200]');
    process.exit(1);
  }
  
  console.log(`🏢 Empresa ID: ${empresaId}`);
  console.log(`📁 Diretório de saída: ${outputDir}`);
  console.log(`📏 Palavras máximas por documento: ${maxWords}`);
  console.log();
  
  try {
    // Step 1: Get empresa info
    console.log('1️⃣ Buscando informações da empresa...');
    const empresa = await getEmpresa(empresaId);
    console.log(`   ✅ Empresa: ${empresa.nome} (${empresa.sigla})\n`);
    
    // Step 2: Get RAG recommendations
    console.log('2️⃣ Buscando recomendações RAG...');
    const recommendations = await getRAGRecommendations(empresaId);
    console.log(`   ✅ ${recommendations.length} recomendações encontradas\n`);
    
    if (recommendations.length === 0) {
      console.log('⚠️  Nenhuma recomendação RAG encontrada. Execute o Script 06.5 primeiro.');
      process.exit(0);
    }
    
    // Step 3: Consolidate unique topics
    console.log('3️⃣ Consolidando tópicos únicos...');
    const topics = consolidateTopics(recommendations);
    console.log(`   ✅ ${topics.length} tópicos únicos identificados\n`);
    
    // Step 4: Generate documents
    console.log(`4️⃣ Gerando documentos com LLM (${topics.length} tópicos)...`);
    console.log('   ⏱️  Aguarde ~2s entre cada chamada (rate limiting)\n');
    
    const results = {
      success: 0,
      errors: 0,
      totalWords: 0,
      files: []
    };
    
    for (let i = 0; i < topics.length; i++) {
      const topicData = topics[i];
      const progress = `[${i + 1}/${topics.length}]`;
      
      console.log(`   ${progress} ${topicData.topic}`);
      console.log(`       👥 Personas: ${topicData.personas.length}`);
      
      try {
        // Generate document
        const content = await generateFAQDocument(
          topicData.topic,
          topicData,
          maxWords,
          empresa
        );
        
        if (!content) {
          results.errors++;
          console.log(`       ❌ Falha na geração\n`);
          continue;
        }
        
        // Save document
        const filename = await saveDocument(content, topicData.topic, empresa, outputDir);
        const wordCount = countWords(content);
        
        results.success++;
        results.totalWords += wordCount;
        results.files.push(filename);
        
        console.log(`       ✅ Salvo: ${filename} (${wordCount} palavras)\n`);
        
        // Rate limiting (2 seconds between calls)
        if (i < topics.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        results.errors++;
        console.error(`       ❌ Erro: ${error.message}\n`);
      }
    }
    
    // Step 5: Summary
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Documentos gerados: ${results.success}`);
    console.log(`❌ Erros: ${results.errors}`);
    console.log(`📝 Total de palavras: ${results.totalWords.toLocaleString()}`);
    console.log(`📄 Média de palavras: ${Math.round(results.totalWords / results.success)}`);
    console.log(`📁 Diretório: ${outputDir}/`);
    
    if (results.files.length > 0) {
      console.log('\n📂 Arquivos criados:');
      results.files.slice(0, 5).forEach(f => console.log(`   • ${f}`));
      if (results.files.length > 5) {
        console.log(`   ... e mais ${results.files.length - 5} arquivos`);
      }
    }
    
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Revise os documentos gerados em ' + outputDir + '/');
    console.log('   2. Execute o Script 10 para ingestão:');
    console.log(`      node 10_generate_knowledge_base.js --empresaId=${empresaId} --source=${outputDir}`);
    console.log('   3. Teste o RAG com Script 11:');
    console.log(`      node 11_test_rag_system.js --empresaId=${empresaId}`);
    console.log();
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
