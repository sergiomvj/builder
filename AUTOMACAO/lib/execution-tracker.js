/**
 * Sistema de tracking de execução de scripts
 * Salva progresso em arquivo JSON para consulta em tempo real
 * E atualiza o status na tabela empresas.scripts_status
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

const PROGRESS_FILE = path.join(__dirname, '..', 'script-progress.json');

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

class ExecutionTracker {
  constructor(scriptName, empresaId, totalItems = 0) {
    this.scriptName = scriptName;
    this.empresaId = empresaId;
    this.totalItems = totalItems;
    this.currentItem = 0;
    this.status = 'starting';
    this.startTime = new Date().toISOString();
    this.errors = [];
    this.successes = 0;
  }

  async start() {
    await this.save({
      status: 'running',
      message: `Iniciando ${this.scriptName}...`,
      progress: 0
    });
    await this.updateDatabaseStatus('running');
  }

  async updateProgress(current, message, itemName = '') {
    this.currentItem = current;
    const progress = this.totalItems > 0 ? Math.round((current / this.totalItems) * 100) : 0;
    
    await this.save({
      status: 'running',
      message,
      itemName,
      progress,
      current,
      total: this.totalItems
    });
  }

  async success(message = '') {
    this.successes++;
    await this.save({
      status: 'running',
      lastSuccess: message,
      successes: this.successes
    });
  }

  async error(errorMessage) {
    this.errors.push({
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    await this.save({
      status: 'running',
      lastError: errorMessage,
      errors: this.errors
    });
  }

  async complete(finalMessage = '') {
    await this.save({
      status: 'completed',
      message: finalMessage || `${this.scriptName} concluído`,
      progress: 100,
      endTime: new Date().toISOString(),
      successes: this.successes,
      errors: this.errors
    });
    await this.updateDatabaseStatus('completed');
  }

  async fail(errorMessage) {
    await this.save({
      status: 'error',
      message: errorMessage,
      endTime: new Date().toISOString(),
      successes: this.successes,
      errors: this.errors
    });
    await this.updateDatabaseStatus('error');
  }

  /**
   * Atualiza o status do script na tabela empresas.scripts_status
   */
  async updateDatabaseStatus(status) {
    try {
      // Buscar empresa atual
      const { data: empresa, error: fetchError } = await supabase
        .from('empresas')
        .select('scripts_status')
        .eq('id', this.empresaId)
        .single();

      if (fetchError) {
        console.error('⚠️  Erro ao buscar empresa:', fetchError.message);
        return;
      }

      // Extrair número do script (ex: "06.5_generate_rag" -> "6.5", "09_generate_auditoria" -> "9")
      const scriptNumber = this.scriptName.match(/^(\d+\.?\d*)/)?.[1] || this.scriptName;
      const scriptKey = `script_${scriptNumber.replace('.', '_')}`;

      // Atualizar scripts_status
      const currentStatus = empresa?.scripts_status || {};
      currentStatus[scriptKey] = {
        status,
        last_run: new Date().toISOString(),
        successes: this.successes,
        errors: this.errors.length
      };

      const { error: updateError } = await supabase
        .from('empresas')
        .update({ scripts_status: currentStatus })
        .eq('id', this.empresaId);

      if (updateError) {
        console.error('⚠️  Erro ao atualizar scripts_status:', updateError.message);
      } else {
        console.log(`✅ Status do script ${scriptNumber} atualizado para: ${status}`);
      }
    } catch (err) {
      console.error('⚠️  Erro ao atualizar database status:', err.message);
    }
  }

  async save(updates = {}) {
    const data = {
      scriptName: this.scriptName,
      empresaId: this.empresaId,
      startTime: this.startTime,
      current: this.currentItem,
      total: this.totalItems,
      successes: this.successes,
      errors: this.errors,
      ...updates
    };

    try {
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('⚠️  Erro ao salvar progresso:', err.message);
    }
  }

  static async getProgress() {
    try {
      const content = await fs.readFile(PROGRESS_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      return {
        status: 'idle',
        message: 'Nenhum script em execução'
      };
    }
  }

  static async clear() {
    try {
      await fs.unlink(PROGRESS_FILE);
    } catch (err) {
      // Arquivo não existe, ok
    }
  }
}

export { ExecutionTracker };
export default ExecutionTracker;
