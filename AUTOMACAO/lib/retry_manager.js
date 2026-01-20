/**
 * 🔄 RETRY MANAGER - Sistema de Retry Inteligente
 * ================================================
 * Identifica e reprocessa apenas os registros que falharam
 * 
 * Estratégias:
 * 1. Detecta falhas baseado em campos NULL ou ausentes
 * 2. Mantém histórico de tentativas
 * 3. Backoff exponencial para evitar rate limits
 * 4. Limite de tentativas configurável
 * 
 * Uso:
 * import { RetryManager } from './lib/retry_manager.js';
 * 
 * const retry = new RetryManager('02_generate_biografias', empresaId);
 * const failed = await retry.identifyFailed();
 * await retry.retryFailed(processingFunction);
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const RETRY_LOGS_DIR = path.join(__dirname, '..', 'retry_logs');
if (!fs.existsSync(RETRY_LOGS_DIR)) {
  fs.mkdirSync(RETRY_LOGS_DIR, { recursive: true });
}

// Mapeamento de scripts para suas validações específicas
const SCRIPT_VALIDATIONS = {
  '01_create_personas': {
    table: 'personas',
    checkFields: ['persona_code', 'role', 'department'],
    description: 'Personas sem campos básicos'
  },
  
  '02_generate_biografias': {
    table: 'personas',
    checkFields: ['full_name', 'email', 'experiencia_anos'],
    joinTable: 'personas_biografias',
    joinCondition: 'persona_id',
    description: 'Personas sem biografia ou dados básicos'
  },
  
  '03_generate_atribuicoes': {
    table: 'personas',
    joinTable: 'personas_atribuicoes',
    joinCondition: 'persona_id',
    description: 'Personas sem atribuições'
  },
  
  '04_generate_competencias': {
    table: 'personas',
    joinTable: 'personas_competencias',
    joinCondition: 'persona_id',
    description: 'Personas sem competências'
  },
  
  '05_generate_avatares': {
    table: 'personas',
    joinTable: 'personas_avatares',
    joinCondition: 'persona_id',
    description: 'Personas sem avatares'
  },
  
  '06_analyze_automation': {
    table: 'personas',
    joinTable: 'automation_opportunities',
    joinCondition: 'persona_id',
    description: 'Personas sem análise de automação'
  },
  
  '06.5_generate_communications': {
    table: 'personas',
    customQuery: `
      SELECT p.* 
      FROM personas p 
      WHERE p.empresa_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM inter_persona_communications ipc 
        WHERE ipc.sender_id = p.id OR ipc.receiver_id = p.id
      )
    `,
    description: 'Personas sem comunicações geradas'
  },
  
  '07_generate_workflows': {
    table: 'personas',
    joinTable: 'personas_workflows',
    joinCondition: 'persona_id',
    description: 'Personas sem workflows'
  },
  
  '07.5_generate_supervision': {
    table: 'personas',
    customQuery: `
      SELECT p.* 
      FROM personas p 
      WHERE p.empresa_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM task_supervision_chains tsc 
        WHERE tsc.executor_persona_id = p.id OR tsc.approver_persona_id = p.id
      )
    `,
    description: 'Personas sem cadeias de supervisão'
  },
  
  '08_generate_ml': {
    table: 'personas',
    joinTable: 'personas_ml_models',
    joinCondition: 'persona_id',
    description: 'Personas sem modelos ML'
  },
  
  '09_generate_auditoria': {
    table: 'personas',
    joinTable: 'personas_audit_logs',
    joinCondition: 'persona_id',
    description: 'Personas sem auditoria'
  }
};

export class RetryManager {
  constructor(scriptName, empresaId) {
    this.scriptName = scriptName;
    this.empresaId = empresaId;
    this.config = SCRIPT_VALIDATIONS[scriptName];
    
    if (!this.config) {
      throw new Error(`Script '${scriptName}' não configurado no RetryManager`);
    }
    
    this.retryLogFile = path.join(
      RETRY_LOGS_DIR, 
      `${scriptName}_${empresaId}_retries.json`
    );
    
    this.retryHistory = this._loadRetryHistory();
  }

  /**
   * Carrega histórico de retries
   */
  _loadRetryHistory() {
    try {
      if (fs.existsSync(this.retryLogFile)) {
        const content = fs.readFileSync(this.retryLogFile, 'utf8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.warn('⚠️  Erro ao carregar histórico de retries:', err.message);
    }
    
    return {
      script: this.scriptName,
      empresa_id: this.empresaId,
      attempts: [],
      failed_items: {}
    };
  }

  /**
   * Salva histórico de retries
   */
  _saveRetryHistory() {
    try {
      fs.writeFileSync(
        this.retryLogFile, 
        JSON.stringify(this.retryHistory, null, 2), 
        'utf8'
      );
    } catch (err) {
      console.error('❌ Erro ao salvar histórico:', err.message);
    }
  }

  /**
   * Identifica registros que falharam
   */
  async identifyFailed() {
    console.log(`\n🔍 Identificando falhas em ${this.scriptName}...`);
    console.log(`📋 Critério: ${this.config.description}\n`);

    let failedRecords = [];

    try {
      if (this.config.customQuery) {
        // Query customizada
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_string: this.config.customQuery.replace('$1', `'${this.empresaId}'`)
        });
        
        if (error) {
          // Fallback: executar query diretamente (pode não funcionar em todos os casos)
          console.warn('⚠️  Query customizada via RPC falhou, tentando método alternativo...');
          failedRecords = await this._identifyWithCustomLogic();
        } else {
          failedRecords = data || [];
        }
        
      } else if (this.config.joinTable) {
        // Verificar ausência de registros em tabela relacionada
        const { data: allPersonas, error: personasError } = await supabase
          .from(this.config.table)
          .select('*')
          .eq('empresa_id', this.empresaId);
        
        if (personasError) throw personasError;
        
        const { data: existingJoins, error: joinsError } = await supabase
          .from(this.config.joinTable)
          .select(this.config.joinCondition)
          .in(this.config.joinCondition, allPersonas.map(p => p.id));
        
        if (joinsError) throw joinsError;
        
        const existingIds = new Set(existingJoins?.map(j => j[this.config.joinCondition]) || []);
        failedRecords = allPersonas.filter(p => !existingIds.has(p.id));
        
      } else if (this.config.checkFields) {
        // Verificar campos NULL ou vazios
        const { data, error } = await supabase
          .from(this.config.table)
          .select('*')
          .eq('empresa_id', this.empresaId);
        
        if (error) throw error;
        
        failedRecords = data.filter(record => {
          return this.config.checkFields.some(field => {
            const value = record[field];
            return value === null || value === undefined || value === '';
          });
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao identificar falhas:', error.message);
      return [];
    }

    // Filtrar por histórico de tentativas (não tentar mais de MAX_RETRIES vezes)
    const MAX_RETRIES = 3;
    const retriableRecords = failedRecords.filter(record => {
      const attempts = this.retryHistory.failed_items[record.id]?.attempts || 0;
      return attempts < MAX_RETRIES;
    });

    console.log(`📊 Resultados:`);
    console.log(`   Total de falhas: ${failedRecords.length}`);
    console.log(`   Falhas permanentes (>${MAX_RETRIES} tentativas): ${failedRecords.length - retriableRecords.length}`);
    console.log(`   Falhas retentáveis: ${retriableRecords.length}\n`);

    return retriableRecords;
  }

  /**
   * Método auxiliar para queries customizadas quando RPC falha
   */
  async _identifyWithCustomLogic() {
    // Implementação específica para cada script quando query customizada falha
    const { data: allPersonas } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', this.empresaId);
    
    return allPersonas || [];
  }

  /**
   * Reprocessa registros que falharam
   */
  async retryFailed(processingFunction, options = {}) {
    const {
      delayMs = 2000,
      exponentialBackoff = true,
      maxRetries = 3
    } = options;

    const failed = await this.identifyFailed();
    
    if (failed.length === 0) {
      console.log('✅ Nenhuma falha detectada! Todos os registros foram processados.\n');
      return { success: 0, failed: 0, skipped: 0 };
    }

    console.log(`🔄 Iniciando reprocessamento de ${failed.length} registros...\n`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0
    };

    const attemptTimestamp = new Date().toISOString();
    this.retryHistory.attempts.push({
      timestamp: attemptTimestamp,
      total_to_retry: failed.length
    });

    for (let i = 0; i < failed.length; i++) {
      const record = failed[i];
      const itemId = record.id;
      
      // Verificar tentativas anteriores
      if (!this.retryHistory.failed_items[itemId]) {
        this.retryHistory.failed_items[itemId] = {
          record_id: itemId,
          record_name: record.full_name || record.role || 'Unknown',
          attempts: 0,
          last_error: null,
          history: []
        };
      }

      const itemHistory = this.retryHistory.failed_items[itemId];
      
      if (itemHistory.attempts >= maxRetries) {
        console.log(`[${i + 1}/${failed.length}] ⏭️  PULANDO: ${itemHistory.record_name} (máximo de tentativas atingido)`);
        results.skipped++;
        continue;
      }

      console.log(`[${i + 1}/${failed.length}] 🔄 Reprocessando: ${itemHistory.record_name}...`);
      
      // Calcular delay com backoff exponencial
      const currentDelay = exponentialBackoff 
        ? delayMs * Math.pow(2, itemHistory.attempts)
        : delayMs;

      try {
        // Executar função de processamento
        await processingFunction(record);
        
        console.log(`   ✅ Sucesso no reprocessamento`);
        results.success++;
        
        // Atualizar histórico (sucesso)
        itemHistory.history.push({
          timestamp: new Date().toISOString(),
          attempt: itemHistory.attempts + 1,
          status: 'success'
        });
        
        // Remover dos failed_items
        delete this.retryHistory.failed_items[itemId];
        
      } catch (error) {
        console.error(`   ❌ Falha: ${error.message}`);
        results.failed++;
        
        // Atualizar histórico (falha)
        itemHistory.attempts++;
        itemHistory.last_error = error.message;
        itemHistory.history.push({
          timestamp: new Date().toISOString(),
          attempt: itemHistory.attempts,
          status: 'failed',
          error: error.message
        });
      }
      
      // Salvar histórico incrementalmente
      this._saveRetryHistory();
      
      // Delay antes do próximo
      if (i < failed.length - 1) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESULTADO DO REPROCESSAMENTO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Sucessos: ${results.success}`);
    console.log(`❌ Falhas: ${results.failed}`);
    console.log(`⏭️  Pulados: ${results.skipped}`);
    console.log(`📈 Taxa de sucesso: ${((results.success / (results.success + results.failed)) * 100).toFixed(1)}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    this._saveRetryHistory();
    return results;
  }

  /**
   * Obtém estatísticas de retry
   */
  getStats() {
    const failedCount = Object.keys(this.retryHistory.failed_items).length;
    const permanentFailures = Object.values(this.retryHistory.failed_items)
      .filter(item => item.attempts >= 3).length;
    
    return {
      total_attempts: this.retryHistory.attempts.length,
      current_failures: failedCount,
      permanent_failures: permanentFailures,
      retriable_failures: failedCount - permanentFailures,
      last_attempt: this.retryHistory.attempts[this.retryHistory.attempts.length - 1]?.timestamp
    };
  }

  /**
   * Gera relatório de falhas permanentes
   */
  generateFailureReport() {
    const permanentFailures = Object.values(this.retryHistory.failed_items)
      .filter(item => item.attempts >= 3);
    
    if (permanentFailures.length === 0) {
      console.log('✅ Nenhuma falha permanente registrada!\n');
      return;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  RELATÓRIO DE FALHAS PERMANENTES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Script: ${this.scriptName}`);
    console.log(`Empresa: ${this.empresaId}`);
    console.log(`Total: ${permanentFailures.length} registros\n`);

    permanentFailures.forEach((item, idx) => {
      console.log(`${idx + 1}. ${item.record_name} (ID: ${item.record_id.substring(0, 8)}...)`);
      console.log(`   Tentativas: ${item.attempts}`);
      console.log(`   Último erro: ${item.last_error}`);
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * Limpa histórico de um item específico (para forçar retry)
   */
  resetItem(recordId) {
    if (this.retryHistory.failed_items[recordId]) {
      delete this.retryHistory.failed_items[recordId];
      this._saveRetryHistory();
      console.log(`✅ Histórico resetado para item ${recordId}`);
    } else {
      console.log(`⚠️  Item ${recordId} não encontrado no histórico`);
    }
  }

  /**
   * Limpa todo o histórico de retries
   */
  resetAll() {
    this.retryHistory = {
      script: this.scriptName,
      empresa_id: this.empresaId,
      attempts: [],
      failed_items: {}
    };
    this._saveRetryHistory();
    console.log('✅ Todo o histórico de retries foi limpo');
  }
}

export default RetryManager;
