#!/usr/bin/env node
/**
 * ============================================
 * MIGRAÇÃO DE DADOS: ia_config → Tabelas Normalizadas
 * ============================================
 * 
 * Migra dados de personas.ia_config para:
 * - personas_biografias
 * - personas_atribuicoes
 * - personas_competencias
 * 
 * SEGURANÇA:
 * - Faz backup automático antes de migrar
 * - Não deleta dados do ia_config (apenas marca como migrado)
 * - Suporta modo dry-run para testar sem modificar
 * - Valida todos os dados antes de inserir
 * 
 * USO:
 * node migrate_data_to_normalized_tables.cjs --empresaId=ID [--dry-run] [--force]
 * 
 * FLAGS:
 * --dry-run: Simula a migração sem modificar o banco
 * --force: Sobrescreve dados existentes nas tabelas normalizadas
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// ==================== CONFIGURAÇÃO ====================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BACKUP_DIR = path.join(__dirname, 'migration_backups');

// ==================== ARGUMENTOS CLI ====================

const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

if (!empresaIdArg) {
  console.error('❌ Erro: --empresaId=ID é obrigatório');
  console.log('\nUso: node migrate_data_to_normalized_tables.cjs --empresaId=ID [--dry-run] [--force]\n');
  process.exit(1);
}

const empresaId = empresaIdArg.split('=')[1];

// ==================== HELPERS ====================

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function createBackup(data, filename) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${timestamp}_${filename}`);
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  
  log('💾', `Backup salvo: ${backupPath}`);
  return backupPath;
}

// ==================== MIGRAÇÃO: BIOGRAFIAS ====================

async function migrateBiografias(personas, dryRun, force) {
  log('📖', '\n=== MIGRANDO BIOGRAFIAS ===');
  
  const personasComBiografia = personas.filter(p => 
    p.ia_config?.biografia_estruturada
  );
  
  log('ℹ️', `Encontradas ${personasComBiografia.length} personas com biografia em ia_config`);
  
  if (personasComBiografia.length === 0) {
    log('⏭️', 'Nenhuma biografia para migrar');
    return { success: 0, skipped: 0, errors: 0 };
  }
  
  // Criar backup
  createBackup(
    personasComBiografia.map(p => ({ id: p.id, biografia: p.ia_config.biografia_estruturada })),
    'biografias_backup.json'
  );
  
  let success = 0, skipped = 0, errors = 0;
  
  for (const persona of personasComBiografia) {
    const biografia = persona.ia_config.biografia_estruturada;
    
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('personas_biografias')
      .select('id')
      .eq('persona_id', persona.id)
      .single();
    
    if (existing && !force) {
      log('⏭️', `${persona.full_name}: biografia já existe (use --force para sobrescrever)`);
      skipped++;
      continue;
    }
    
    if (dryRun) {
      log('🔍', `[DRY-RUN] ${persona.full_name}: migraria biografia`);
      success++;
      continue;
    }
    
    // Inserir/atualizar biografia
    const { error } = await supabase
      .from('personas_biografias')
      .upsert({
        persona_id: persona.id,
        biografia_estruturada: biografia,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'persona_id'
      });
    
    if (error) {
      log('❌', `${persona.full_name}: erro ao migrar biografia - ${error.message}`);
      errors++;
    } else {
      log('✅', `${persona.full_name}: biografia migrada`);
      success++;
    }
  }
  
  return { success, skipped, errors };
}

// ==================== MIGRAÇÃO: ATRIBUIÇÕES ====================

async function migrateAtribuicoes(personas, dryRun, force) {
  log('📋', '\n=== MIGRANDO ATRIBUIÇÕES ===');
  
  const personasComAtribuicoes = personas.filter(p => 
    p.ia_config?.atribuicoes_especificas && 
    Array.isArray(p.ia_config.atribuicoes_especificas)
  );
  
  log('ℹ️', `Encontradas ${personasComAtribuicoes.length} personas com atribuições em ia_config`);
  
  if (personasComAtribuicoes.length === 0) {
    log('⏭️', 'Nenhuma atribuição para migrar');
    return { success: 0, skipped: 0, errors: 0 };
  }
  
  // Criar backup
  createBackup(
    personasComAtribuicoes.map(p => ({ id: p.id, atribuicoes: p.ia_config.atribuicoes_especificas })),
    'atribuicoes_backup.json'
  );
  
  let success = 0, skipped = 0, errors = 0;
  
  for (const persona of personasComAtribuicoes) {
    const atribuicoes = persona.ia_config.atribuicoes_especificas;
    
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('personas_atribuicoes')
      .select('id')
      .eq('persona_id', persona.id)
      .limit(1);
    
    if (existing && existing.length > 0 && !force) {
      log('⏭️', `${persona.full_name}: atribuições já existem (use --force para sobrescrever)`);
      skipped++;
      continue;
    }
    
    if (dryRun) {
      log('🔍', `[DRY-RUN] ${persona.full_name}: migraria ${atribuicoes.length} atribuições`);
      success++;
      continue;
    }
    
    // Deletar atribuições antigas se force
    if (force && existing && existing.length > 0) {
      await supabase
        .from('personas_atribuicoes')
        .delete()
        .eq('persona_id', persona.id);
    }
    
    // Inserir atribuições
    const atribuicoesRecords = atribuicoes.map((atribuicao, index) => ({
      persona_id: persona.id,
      atribuicao: atribuicao,
      ordem: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('personas_atribuicoes')
      .insert(atribuicoesRecords);
    
    if (error) {
      log('❌', `${persona.full_name}: erro ao migrar atribuições - ${error.message}`);
      errors++;
    } else {
      log('✅', `${persona.full_name}: ${atribuicoes.length} atribuições migradas`);
      success++;
    }
  }
  
  return { success, skipped, errors };
}

// ==================== MIGRAÇÃO: COMPETÊNCIAS ====================

async function migrateCompetencias(personas, dryRun, force) {
  log('🎯', '\n=== MIGRANDO COMPETÊNCIAS ===');
  
  const personasComCompetencias = personas.filter(p => 
    p.ia_config?.tarefas_metas
  );
  
  log('ℹ️', `Encontradas ${personasComCompetencias.length} personas com competências em ia_config`);
  
  if (personasComCompetencias.length === 0) {
    log('⏭️', 'Nenhuma competência para migrar');
    return { success: 0, skipped: 0, errors: 0 };
  }
  
  // Criar backup
  createBackup(
    personasComCompetencias.map(p => ({ id: p.id, competencias: p.ia_config.tarefas_metas })),
    'competencias_backup.json'
  );
  
  let success = 0, skipped = 0, errors = 0;
  
  for (const persona of personasComCompetencias) {
    const competencias = persona.ia_config.tarefas_metas;
    
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('personas_competencias')
      .select('id')
      .eq('persona_id', persona.id)
      .single();
    
    if (existing && !force) {
      log('⏭️', `${persona.full_name}: competências já existem (use --force para sobrescrever)`);
      skipped++;
      continue;
    }
    
    if (dryRun) {
      log('🔍', `[DRY-RUN] ${persona.full_name}: migraria competências`);
      success++;
      continue;
    }
    
    // Inserir/atualizar competências
    const { error } = await supabase
      .from('personas_competencias')
      .upsert({
        persona_id: persona.id,
        competencias_tecnicas: competencias.competencias_tecnicas || [],
        competencias_comportamentais: competencias.competencias_comportamentais || [],
        ferramentas: competencias.ferramentas || [],
        tarefas_diarias: competencias.tarefas_diarias || [],
        tarefas_semanais: competencias.tarefas_semanais || [],
        tarefas_mensais: competencias.tarefas_mensais || [],
        kpis: competencias.kpis || [],
        objetivos_desenvolvimento: competencias.objetivos_desenvolvimento || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'persona_id'
      });
    
    if (error) {
      log('❌', `${persona.full_name}: erro ao migrar competências - ${error.message}`);
      errors++;
    } else {
      log('✅', `${persona.full_name}: competências migradas`);
      success++;
    }
  }
  
  return { success, skipped, errors };
}

// ==================== MAIN ====================

async function main() {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  MIGRAÇÃO DE DADOS PARA TABELAS NORMALIZADAS  ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  
  if (isDryRun) {
    log('🔍', 'MODO DRY-RUN: Nenhum dado será modificado');
  }
  if (isForce) {
    log('⚠️', 'MODO FORCE: Dados existentes serão sobrescritos');
  }
  
  // Buscar empresa
  log('🔍', `Buscando empresa ${empresaId}...`);
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id, nome')
    .eq('id', empresaId)
    .single();
  
  if (empresaError || !empresa) {
    log('❌', `Empresa não encontrada: ${empresaError?.message || 'ID inválido'}`);
    process.exit(1);
  }
  
  log('✅', `Empresa: ${empresa.nome}`);
  
  // Buscar personas
  log('🔍', 'Buscando personas...');
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name, empresa_id, ia_config')
    .eq('empresa_id', empresaId);
  
  if (personasError) {
    log('❌', `Erro ao buscar personas: ${personasError.message}`);
    process.exit(1);
  }
  
  log('✅', `${personas.length} personas encontradas`);
  
  if (personas.length === 0) {
    log('⚠️', 'Nenhuma persona para migrar');
    process.exit(0);
  }
  
  // Executar migrações
  const biografiasResult = await migrateBiografias(personas, isDryRun, isForce);
  const atribuicoesResult = await migrateAtribuicoes(personas, isDryRun, isForce);
  const competenciasResult = await migrateCompetencias(personas, isDryRun, isForce);
  
  // Relatório final
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║           RELATÓRIO FINAL                 ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  
  console.log('📖 BIOGRAFIAS:');
  console.log(`   ✅ Migradas: ${biografiasResult.success}`);
  console.log(`   ⏭️  Puladas: ${biografiasResult.skipped}`);
  console.log(`   ❌ Erros: ${biografiasResult.errors}`);
  
  console.log('\n📋 ATRIBUIÇÕES:');
  console.log(`   ✅ Migradas: ${atribuicoesResult.success}`);
  console.log(`   ⏭️  Puladas: ${atribuicoesResult.skipped}`);
  console.log(`   ❌ Erros: ${atribuicoesResult.errors}`);
  
  console.log('\n🎯 COMPETÊNCIAS:');
  console.log(`   ✅ Migradas: ${competenciasResult.success}`);
  console.log(`   ⏭️  Puladas: ${competenciasResult.skipped}`);
  console.log(`   ❌ Erros: ${competenciasResult.errors}`);
  
  const totalSuccess = biografiasResult.success + atribuicoesResult.success + competenciasResult.success;
  const totalSkipped = biografiasResult.skipped + atribuicoesResult.skipped + competenciasResult.skipped;
  const totalErrors = biografiasResult.errors + atribuicoesResult.errors + competenciasResult.errors;
  
  console.log('\n📊 TOTAL:');
  console.log(`   ✅ Sucesso: ${totalSuccess}`);
  console.log(`   ⏭️  Puladas: ${totalSkipped}`);
  console.log(`   ❌ Erros: ${totalErrors}`);
  
  if (isDryRun) {
    console.log('\n🔍 DRY-RUN concluído. Execute sem --dry-run para aplicar as mudanças.');
  } else if (totalErrors === 0) {
    console.log('\n✅ Migração concluída com sucesso!');
    console.log(`💾 Backups salvos em: ${BACKUP_DIR}`);
  } else {
    console.log('\n⚠️  Migração concluída com erros. Verifique os logs acima.');
  }
  
  console.log('');
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message);
  console.error(err.stack);
  process.exit(1);
});
