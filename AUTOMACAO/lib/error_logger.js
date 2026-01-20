/**
 * 📝 ERROR LOGGER - Sistema de Logging Detalhado de Erros
 * ========================================================
 * Sistema centralizado para logging de erros dos scripts VCM
 * 
 * Features:
 * - Logs estruturados em JSON
 * - Arquivo por script por execução
 * - Agregação de relatórios
 * - Métricas de taxa de sucesso
 * 
 * Uso:
 * import { ErrorLogger } from './lib/error_logger.js';
 * 
 * const logger = new ErrorLogger('02_generate_biografias', empresaId);
 * logger.logError(persona, error, context);
 * logger.logSuccess(persona, llmUsed, duration);
 * await logger.generateReport();
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGS_DIR = path.join(__dirname, '..', 'logs');
const REPORTS_DIR = path.join(__dirname, '..', 'reports');

// Criar diretórios se não existirem
[LOGS_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export class ErrorLogger {
  constructor(scriptName, empresaId = null) {
    this.scriptName = scriptName;
    this.empresaId = empresaId;
    this.startTime = Date.now();
    this.timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Contadores
    this.errors = [];
    this.successes = [];
    this.warnings = [];
    
    // Arquivo de log desta execução
    const filename = empresaId 
      ? `${scriptName}_${empresaId}_${this.timestamp}.json`
      : `${scriptName}_${this.timestamp}.json`;
    
    this.logFile = path.join(LOGS_DIR, filename);
    this.reportFile = path.join(REPORTS_DIR, `${scriptName}_report_${this.timestamp}.md`);
    
    console.log(`📝 Logger iniciado: ${filename}`);
  }

  /**
   * Registra erro detalhado
   */
  logError(item, error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      item_id: item?.id || 'unknown',
      item_name: item?.full_name || item?.role || 'Unknown',
      error_type: error.name || 'Error',
      error_message: error.message || String(error),
      error_stack: error.stack?.split('\n').slice(0, 3), // Primeiras 3 linhas
      context: {
        ...context,
        script: this.scriptName,
        empresa_id: this.empresaId
      }
    };
    
    this.errors.push(errorEntry);
    
    // Log imediato no console
    console.error(`  ❌ ERRO: ${errorEntry.item_name}`);
    console.error(`     ${errorEntry.error_message}`);
    
    // Salvar incrementalmente
    this._saveIncremental();
  }

  /**
   * Registra sucesso
   */
  logSuccess(item, metadata = {}) {
    const successEntry = {
      timestamp: new Date().toISOString(),
      item_id: item?.id || 'unknown',
      item_name: item?.full_name || item?.role || 'Success',
      metadata: {
        ...metadata,
        script: this.scriptName,
        empresa_id: this.empresaId
      }
    };
    
    this.successes.push(successEntry);
    
    // Salvar incrementalmente (a cada 5 sucessos)
    if (this.successes.length % 5 === 0) {
      this._saveIncremental();
    }
  }

  /**
   * Registra warning
   */
  logWarning(item, message, context = {}) {
    const warningEntry = {
      timestamp: new Date().toISOString(),
      item_id: item?.id || 'unknown',
      item_name: item?.full_name || item?.role || 'Warning',
      message,
      context: {
        ...context,
        script: this.scriptName,
        empresa_id: this.empresaId
      }
    };
    
    this.warnings.push(warningEntry);
    console.warn(`  ⚠️  WARNING: ${message}`);
  }

  /**
   * Salva log incremental (a cada erro/sucesso)
   */
  _saveIncremental() {
    const data = {
      script: this.scriptName,
      empresa_id: this.empresaId,
      start_time: new Date(this.startTime).toISOString(),
      last_update: new Date().toISOString(),
      summary: {
        total_processed: this.successes.length + this.errors.length,
        successes: this.successes.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        success_rate: this._calculateSuccessRate()
      },
      errors: this.errors,
      successes: this.successes.slice(-10), // Últimos 10 sucessos
      warnings: this.warnings
    };
    
    try {
      fs.writeFileSync(this.logFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('❌ Erro ao salvar log:', err.message);
    }
  }

  /**
   * Calcula taxa de sucesso
   */
  _calculateSuccessRate() {
    const total = this.successes.length + this.errors.length;
    if (total === 0) return 0;
    return ((this.successes.length / total) * 100).toFixed(2);
  }

  /**
   * Gera relatório final em Markdown
   */
  async generateReport() {
    const endTime = Date.now();
    const duration = ((endTime - this.startTime) / 1000 / 60).toFixed(2); // minutos
    
    const total = this.successes.length + this.errors.length;
    const successRate = this._calculateSuccessRate();
    
    // Agrupar erros por tipo
    const errorsByType = this.errors.reduce((acc, err) => {
      const type = err.error_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(err);
      return acc;
    }, {});
    
    // Agrupar sucessos por metadata (ex: LLM usado)
    const successesByLLM = this.successes.reduce((acc, succ) => {
      const llm = succ.metadata?.llm_used || 'Unknown';
      if (!acc[llm]) acc[llm] = 0;
      acc[llm]++;
      return acc;
    }, {});

    let report = `# 📊 Relatório de Execução: ${this.scriptName}\n\n`;
    report += `**Data:** ${new Date().toLocaleString('pt-BR')}\n`;
    report += `**Empresa ID:** ${this.empresaId || 'N/A'}\n`;
    report += `**Duração:** ${duration} minutos\n\n`;
    
    report += `## 📈 Resumo Geral\n\n`;
    report += `| Métrica | Valor |\n`;
    report += `|---------|-------|\n`;
    report += `| **Total Processado** | ${total} |\n`;
    report += `| **✅ Sucessos** | ${this.successes.length} |\n`;
    report += `| **❌ Erros** | ${this.errors.length} |\n`;
    report += `| **⚠️ Warnings** | ${this.warnings.length} |\n`;
    report += `| **Taxa de Sucesso** | ${successRate}% |\n\n`;
    
    if (Object.keys(successesByLLM).length > 0) {
      report += `## 🤖 Sucessos por LLM\n\n`;
      report += `| LLM | Quantidade |\n`;
      report += `|-----|------------|\n`;
      Object.entries(successesByLLM)
        .sort((a, b) => b[1] - a[1])
        .forEach(([llm, count]) => {
          report += `| ${llm} | ${count} |\n`;
        });
      report += `\n`;
    }
    
    if (this.errors.length > 0) {
      report += `## ❌ Erros Detalhados\n\n`;
      
      Object.entries(errorsByType).forEach(([type, errors]) => {
        report += `### ${type} (${errors.length} ocorrências)\n\n`;
        errors.forEach((err, idx) => {
          report += `**${idx + 1}. ${err.item_name}**\n`;
          report += `- **Mensagem:** ${err.error_message}\n`;
          report += `- **Timestamp:** ${new Date(err.timestamp).toLocaleTimeString('pt-BR')}\n`;
          if (err.context && Object.keys(err.context).length > 1) {
            report += `- **Contexto:** ${JSON.stringify(err.context, null, 2)}\n`;
          }
          report += `\n`;
        });
      });
    }
    
    if (this.warnings.length > 0) {
      report += `## ⚠️ Warnings\n\n`;
      this.warnings.forEach((warn, idx) => {
        report += `${idx + 1}. **${warn.item_name}**: ${warn.message}\n`;
      });
      report += `\n`;
    }
    
    report += `---\n`;
    report += `📄 Log completo salvo em: \`${path.basename(this.logFile)}\`\n`;
    
    // Salvar relatório
    try {
      fs.writeFileSync(this.reportFile, report, 'utf8');
      console.log(`\n📊 Relatório gerado: ${this.reportFile}`);
    } catch (err) {
      console.error('❌ Erro ao salvar relatório:', err.message);
    }
    
    // Salvar log final completo
    this._saveIncremental();
    
    return {
      logFile: this.logFile,
      reportFile: this.reportFile,
      summary: {
        total,
        successes: this.successes.length,
        errors: this.errors.length,
        warnings: this.warnings.length,
        successRate,
        duration
      }
    };
  }

  /**
   * Obtém todos os logs de um script específico
   */
  static getScriptLogs(scriptName) {
    const files = fs.readdirSync(LOGS_DIR)
      .filter(f => f.startsWith(scriptName) && f.endsWith('.json'))
      .sort()
      .reverse(); // Mais recentes primeiro
    
    return files.map(f => {
      const filePath = path.join(LOGS_DIR, f);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { file: f, data: JSON.parse(content) };
      } catch (err) {
        return { file: f, error: err.message };
      }
    });
  }

  /**
   * Obtém estatísticas globais de todos os scripts
   */
  static getGlobalStats() {
    const files = fs.readdirSync(LOGS_DIR).filter(f => f.endsWith('.json'));
    
    const stats = {
      total_executions: files.length,
      total_successes: 0,
      total_errors: 0,
      total_warnings: 0,
      by_script: {},
      recent_errors: []
    };
    
    files.forEach(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(LOGS_DIR, f), 'utf8'));
        
        stats.total_successes += data.summary?.successes || 0;
        stats.total_errors += data.summary?.errors || 0;
        stats.total_warnings += data.summary?.warnings || 0;
        
        const scriptName = data.script;
        if (!stats.by_script[scriptName]) {
          stats.by_script[scriptName] = { executions: 0, successes: 0, errors: 0 };
        }
        stats.by_script[scriptName].executions++;
        stats.by_script[scriptName].successes += data.summary?.successes || 0;
        stats.by_script[scriptName].errors += data.summary?.errors || 0;
        
        // Adicionar erros recentes
        if (data.errors && data.errors.length > 0) {
          stats.recent_errors.push(...data.errors.slice(0, 3));
        }
      } catch (err) {
        // Skip arquivos corrompidos
      }
    });
    
    // Ordenar erros recentes por timestamp
    stats.recent_errors.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    ).splice(10); // Manter apenas os 10 mais recentes
    
    return stats;
  }
}

export default ErrorLogger;
