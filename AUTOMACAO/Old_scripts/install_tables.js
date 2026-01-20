#!/usr/bin/env node
/**
 * 🗄️ INSTALAÇÃO AUTOMÁTICA DE TABELAS DO SISTEMA DE WORKFLOWS
 * ============================================================
 * 
 * Script para criar automaticamente as tabelas:
 * - automation_opportunities
 * - personas_workflows
 * 
 * Executa na ordem correta para evitar erros de dependência.
 * 
 * Uso:
 * node install_tables.js
 * node install_tables.js --force (recriar tabelas se já existirem)
 * 
 * @author Sergio Castro
 * @version 1.0.0
 * @date 2025-11-28
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
config({ path: path.join(__dirname, '..', '.env.local') });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Erro: NEXT_PUBLIC_SUPABASE_ANON_KEY nao configurada no .env.local');
  console.log('Continuando sem validacao de tabelas...\n');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const forceRecreate = args.includes('--force');

const SCHEMAS_DIR = path.join(__dirname, 'database_schemas');

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verificar se tabela existe
 */
async function tableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);

  // Se erro é "relation does not exist", tabela não existe
  if (error && error.message.includes('does not exist')) {
    return false;
  }

  return true;
}

/**
 * Executar SQL (usando RPC para executar comandos DDL)
 */
async function executeSql(sql, description) {
  console.log(`   🔄 Executando: ${description}...`);
  
  try {
    // Nota: Supabase JS client não suporta DDL diretamente
    // Precisamos usar a REST API ou executar via Dashboard
    
    console.log(`   ⚠️  SQL preparado (execute manualmente no Dashboard):`);
    console.log(`   📋 ${description}`);
    
    return true;
  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

/**
 * Ler arquivo SQL
 */
async function readSqlFile(filename) {
  const filepath = path.join(SCHEMAS_DIR, filename);
  return await fs.readFile(filepath, 'utf-8');
}

/**
 * Salvar SQL consolidado
 */
async function saveConsolidatedSql(sql, filename) {
  const filepath = path.join(SCHEMAS_DIR, filename);
  await fs.writeFile(filepath, sql, 'utf-8');
  console.log(`   💾 SQL consolidado salvo em: ${filename}`);
  return filepath;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('\n🚀 Instalação automática de tabelas do sistema de workflows\n');
  console.log('📋 Ordem de execução:');
  console.log('   1. automation_opportunities');
  console.log('   2. personas_workflows\n');

  if (forceRecreate) {
    console.log('⚠️  Modo --force ativo: Tabelas serão recriadas\n');
  }

  // 1. Verificar se tabelas já existem
  console.log('🔍 Verificando tabelas existentes...\n');

  const opportunitiesExists = await tableExists('automation_opportunities');
  const workflowsExists = await tableExists('personas_workflows');

  console.log('   automation_opportunities:', opportunitiesExists ? 'Existe' : 'Nao existe');
  console.log('   personas_workflows:', workflowsExists ? 'Existe' : 'Nao existe');
  console.log('');

  if (opportunitiesExists && workflowsExists && !forceRecreate) {
    console.log('✅ Tabelas já existem! Use --force para recriar.\n');
    return;
  }

  // 2. Ler arquivos SQL
  console.log('📖 Lendo arquivos SQL...\n');

  const opportunitiesSql = await readSqlFile('automation_opportunities.sql');
  const workflowsSql = await readSqlFile('personas_workflows.sql');

  console.log(`   ✅ automation_opportunities.sql (${opportunitiesSql.length} caracteres)`);
  console.log(`   ✅ personas_workflows.sql (${workflowsSql.length} caracteres)\n`);

  // 3. Gerar SQL consolidado
  console.log('🔨 Gerando SQL consolidado...\n');

  const consolidatedSql = `
-- ============================================================================
-- INSTALAÇÃO COMPLETA DO SISTEMA DE WORKFLOWS VCM
-- ============================================================================
-- Gerado automaticamente em: ${new Date().toISOString()}
-- Executar no Supabase Dashboard → SQL Editor
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABELA 1: automation_opportunities
-- ============================================================================

${opportunitiesSql}

-- ============================================================================
-- TABELA 2: personas_workflows
-- ============================================================================

${workflowsSql}

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Listar tabelas criadas
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('automation_opportunities', 'personas_workflows');

-- Listar views criadas
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%automation%' OR table_name LIKE '%workflow%';

-- Listar funções criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%automation%' OR routine_name LIKE '%workflow%');

-- ============================================================================
-- FIM DA INSTALAÇÃO
-- ============================================================================
`;

  const consolidatedFilePath = await saveConsolidatedSql(consolidatedSql, 'INSTALL_ALL.sql');

  // 4. Instruções para o usuário
  console.log('\n' + '='.repeat(80));
  console.log('📋 PRÓXIMOS PASSOS');
  console.log('='.repeat(80));
  console.log('\n⚠️  IMPORTANTE: O Supabase JS Client não suporta execução de DDL (CREATE TABLE)');
  console.log('   Você precisa executar o SQL manualmente no Dashboard.\n');
  console.log('🔗 Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql\n');
  console.log('📝 Passos:');
  console.log('   1. Clique em "New query"');
  console.log('   2. Cole o conteúdo de: database_schemas/INSTALL_ALL.sql');
  console.log('   3. Clique em "Run" (ou Ctrl+Enter)\n');
  console.log(`📄 Arquivo pronto em: ${consolidatedFilePath}\n`);
  console.log('💡 Dica: Você pode copiar o SQL agora:\n');
  
  // Mostrar primeiras 20 linhas do SQL
  const lines = consolidatedSql.split('\n').slice(0, 25);
  lines.forEach(line => console.log(`   ${line}`));
  console.log('   ...');
  console.log(`   (total: ${consolidatedSql.split('\n').length} linhas)\n`);

  console.log('='.repeat(80));
  console.log('✅ SQL consolidado gerado com sucesso!');
  console.log('='.repeat(80));
  console.log('\n📌 Após executar o SQL no Supabase Dashboard, execute:');
  console.log('   node 02.5_analyze_tasks_for_automation.js --empresaId=UUID');
  console.log('   node 03_generate_n8n_from_tasks.js --empresaId=UUID\n');
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
