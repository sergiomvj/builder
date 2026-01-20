/**
 * Script de Reset Completo do Sistema VCM
 * Remove TODOS os dados do Supabase e limpa arquivos locais
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseServiceKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando configurações...');
console.log(`URL: ${supabaseUrl ? '✅ Configurada' : '❌ Não encontrada'}`);
console.log(`Service Key: ${supabaseServiceKey ? '✅ Configurada' : '❌ Não encontrada'}`);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
  console.log('📋 Variáveis esperadas no .env:');
  console.log('   - VCM_SUPABASE_URL');
  console.log('   - VCM_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Limpa todas as tabelas do banco de dados na ordem correta
 */
async function resetDatabase() {
  console.log('🔄 INICIANDO RESET COMPLETO DO BANCO DE DADOS...\n');
  
  const tables = [
    // Ordem de limpeza - das dependentes para as principais
    'audit_logs',
    'sync_logs',
    'metas_personas',
    'metas_globais',
    'workflows',
    'rag_knowledge',
    'avatares_personas',
    'personas_tech_specs',
    'competencias',
    'personas_biografias',
    'auditorias_compatibilidade',
    'personas',
    'empresas'
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Limpando tabela: ${table}`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos os registros
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`  ⚠️ Tabela ${table} não existe - pulando...`);
        } else {
          console.error(`  ❌ Erro ao limpar ${table}:`, error.message);
        }
      } else {
        console.log(`  ✅ Tabela ${table} limpa com sucesso`);
      }
    } catch (err) {
      console.error(`  ❌ Erro inesperado ao limpar ${table}:`, err);
    }
  }
  
  console.log('\n✅ BANCO DE DADOS COMPLETAMENTE RESETADO!\n');
}

/**
 * Remove arquivos de configuração local
 */
function resetLocalFiles() {
  console.log('🗂️ LIMPANDO ARQUIVOS LOCAIS...\n');
  
  const filesToClean = [
    'AUTOMACAO/personas_config.json',
    'AUTOMACAO/competencias_analysis.json',
    'AUTOMACAO/tech_specifications.json',
    'AUTOMACAO/rag_knowledge_base.json',
    'AUTOMACAO/fluxos_analise_completa.json',
    'AUTOMACAO/n8n_workflows_completo.json'
  ];
  
  for (const filePath of filesToClean) {
    try {
      if (fs.existsSync(filePath)) {
        // Criar backup antes de deletar
        const backupPath = filePath + '.backup.' + Date.now();
        fs.copyFileSync(filePath, backupPath);
        console.log(`  📦 Backup criado: ${backupPath}`);
        
        // Resetar arquivo para configuração limpa
        if (filePath.includes('personas_config.json')) {
          fs.writeFileSync(filePath, JSON.stringify({
            "empresa": {
              "nome": "",
              "setor": "",
              "descricao": ""
            },
            "personas": {}
          }, null, 2));
          console.log(`  ♻️ ${filePath} resetado para configuração limpa`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`  🗑️ ${filePath} removido`);
        }
      } else {
        console.log(`  ℹ️ ${filePath} não existe - pulando...`);
      }
    } catch (err) {
      console.error(`  ❌ Erro ao processar ${filePath}:`, err.message);
    }
  }
  
  // Limpar diretórios de output
  const dirsToClean = [
    'AUTOMACAO/04_BIOS_PERSONAS',
    'AUTOMACAO/04_BIOS_PERSONAS_REAL'
  ];
  
  for (const dirPath of dirsToClean) {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const fullPath = path.join(dirPath, file);
          if (fs.statSync(fullPath).isFile()) {
            fs.unlinkSync(fullPath);
          }
        }
        console.log(`  🧹 Diretório ${dirPath} limpo`);
      }
    } catch (err) {
      console.error(`  ❌ Erro ao limpar diretório ${dirPath}:`, err.message);
    }
  }
  
  console.log('\n✅ ARQUIVOS LOCAIS LIMPOS!\n');
}

/**
 * Função principal
 */
async function resetCompleteSystem() {
  console.log('🚀 RESET COMPLETO DO SISTEMA VCM\n');
  console.log('⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!');
  console.log('📋 Será executado:');
  console.log('   - Limpeza completa do banco de dados Supabase');
  console.log('   - Reset dos arquivos de configuração local');
  console.log('   - Backup dos arquivos importantes\n');
  
  try {
    // 1. Reset do banco de dados
    await resetDatabase();
    
    // 2. Limpeza de arquivos locais
    resetLocalFiles();
    
    console.log('🎉 SISTEMA COMPLETAMENTE RESETADO!');
    console.log('✨ Agora você pode começar do zero configurando uma nova empresa.\n');
    
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Acesse o dashboard VCM');
    console.log('2. Vá para "Empresas" → "Criar Nova Empresa"');
    console.log('3. Configure os dados da empresa');
    console.log('4. Execute o processo de geração de personas');
    console.log('5. Execute a cascata de processamento (Scripts 1-5)\n');
    
  } catch (error) {
    console.error('❌ ERRO DURANTE O RESET:', error);
    process.exit(1);
  }
}

// Executar o reset
resetCompleteSystem();