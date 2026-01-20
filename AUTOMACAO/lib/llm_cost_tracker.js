/**
 * 💰 LLM COST TRACKER - Sistema de Rastreamento de Custos
 * ========================================================
 * Rastreia e calcula custos de uso de LLMs
 * 
 * Features:
 * - Rastreamento por LLM, data e empresa
 * - Cálculo de custos baseado em tokens
 * - Geração de gráficos e relatórios
 * - Persistência em Supabase
 * 
 * Uso:
 * import { LLMCostTracker } from './lib/llm_cost_tracker.js';
 * 
 * const tracker = new LLMCostTracker(empresaId);
 * await tracker.trackUsage(llmName, inputTokens, outputTokens, duration);
 * await tracker.generateReport();
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

// Tabela de preços por 1M tokens (USD)
// Fonte: Sites oficiais dos provedores (Dez 2025)
const LLM_PRICING = {
  'gpt-4': { input: 30.0, output: 60.0, provider: 'OpenAI' },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5, provider: 'OpenAI' },
  'openai/gpt-3.5-turbo-0613': { input: 0.5, output: 1.5, provider: 'OpenRouter' },
  'x-ai/grok-4.1-fast': { input: 0.0, output: 0.0, provider: 'OpenRouter (Free)' },
  'z-ai/glm-4.6': { input: 0.0, output: 0.0, provider: 'OpenRouter (Free)' },
  'moonshotai/kimi-k2:free': { input: 0.0, output: 0.0, provider: 'OpenRouter (Free)' },
  'qwen/qwen3-max': { input: 1.2, output: 1.2, provider: 'OpenRouter' },
  'qwen/qwen3-coder:free': { input: 0.0, output: 0.0, provider: 'OpenRouter (Free)' },
  'anthropic/claude-haiku-4.5': { input: 0.8, output: 4.0, provider: 'OpenRouter' },
  'google/gemini-pro': { input: 0.5, output: 1.5, provider: 'Google' },
  'google/gemini-pro-1.5': { input: 3.5, output: 10.5, provider: 'Google' }
};

const COST_REPORTS_DIR = path.join(__dirname, '..', 'cost_reports');
if (!fs.existsSync(COST_REPORTS_DIR)) {
  fs.mkdirSync(COST_REPORTS_DIR, { recursive: true });
}

export class LLMCostTracker {
  constructor(empresaId = null, scriptName = null) {
    this.empresaId = empresaId;
    this.scriptName = scriptName;
    this.sessionCosts = [];
    this.startTime = Date.now();
  }

  /**
   * Rastreia uma chamada de LLM
   */
  async trackUsage(llmName, inputTokens, outputTokens, durationMs, metadata = {}) {
    const pricing = LLM_PRICING[llmName] || { input: 0, output: 0, provider: 'Unknown' };
    
    // Calcular custo (preço por 1M tokens)
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;
    
    const usage = {
      timestamp: new Date().toISOString(),
      empresa_id: this.empresaId,
      script_name: this.scriptName,
      llm_name: llmName,
      provider: pricing.provider,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      input_cost_usd: parseFloat(inputCost.toFixed(6)),
      output_cost_usd: parseFloat(outputCost.toFixed(6)),
      total_cost_usd: parseFloat(totalCost.toFixed(6)),
      duration_ms: durationMs,
      metadata
    };
    
    this.sessionCosts.push(usage);
    
    // Salvar no Supabase
    try {
      const { error } = await supabase
        .from('llm_usage_logs')
        .insert(usage);
      
      if (error) {
        console.warn(`⚠️  Erro ao salvar custo no Supabase: ${error.message}`);
        // Salvar localmente como fallback
        this._saveLocalBackup(usage);
      }
    } catch (err) {
      console.warn(`⚠️  Erro ao rastrear custo: ${err.message}`);
      this._saveLocalBackup(usage);
    }
    
    return usage;
  }

  /**
   * Salva backup local em caso de falha no Supabase
   */
  _saveLocalBackup(usage) {
    const backupFile = path.join(COST_REPORTS_DIR, 'usage_backup.jsonl');
    try {
      fs.appendFileSync(backupFile, JSON.stringify(usage) + '\n', 'utf8');
    } catch (err) {
      console.error('❌ Erro ao salvar backup local:', err.message);
    }
  }

  /**
   * Obtém resumo da sessão atual
   */
  getSessionSummary() {
    if (this.sessionCosts.length === 0) {
      return { total_cost: 0, total_tokens: 0, calls: 0 };
    }
    
    const summary = {
      total_cost_usd: this.sessionCosts.reduce((sum, u) => sum + u.total_cost_usd, 0),
      total_tokens: this.sessionCosts.reduce((sum, u) => sum + u.total_tokens, 0),
      total_calls: this.sessionCosts.length,
      by_llm: {},
      duration_minutes: ((Date.now() - this.startTime) / 1000 / 60).toFixed(2)
    };
    
    // Agregar por LLM
    this.sessionCosts.forEach(usage => {
      const llm = usage.llm_name;
      if (!summary.by_llm[llm]) {
        summary.by_llm[llm] = { calls: 0, tokens: 0, cost: 0 };
      }
      summary.by_llm[llm].calls++;
      summary.by_llm[llm].tokens += usage.total_tokens;
      summary.by_llm[llm].cost += usage.total_cost_usd;
    });
    
    return summary;
  }

  /**
   * Gera relatório de custos da sessão
   */
  async generateSessionReport() {
    const summary = this.getSessionSummary();
    
    if (summary.total_calls === 0) {
      console.log('\n💰 Nenhum custo registrado nesta sessão');
      return null;
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💰 RESUMO DE CUSTOS DA SESSÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total de Chamadas: ${summary.total_calls}`);
    console.log(`🎯 Total de Tokens: ${summary.total_tokens.toLocaleString()}`);
    console.log(`💵 Custo Total: $${summary.total_cost_usd.toFixed(4)} USD`);
    console.log(`⏱️  Duração: ${summary.duration_minutes} minutos`);
    console.log('\n📈 Custos por LLM:');
    
    Object.entries(summary.by_llm)
      .sort((a, b) => b[1].cost - a[1].cost)
      .forEach(([llm, data]) => {
        const provider = LLM_PRICING[llm]?.provider || 'Unknown';
        console.log(`   ${llm} (${provider})`);
        console.log(`      Chamadas: ${data.calls} | Tokens: ${data.tokens.toLocaleString()} | Custo: $${data.cost.toFixed(4)}`);
      });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return summary;
  }

  /**
   * Obtém custos globais (todas as empresas)
   */
  static async getGlobalCosts(startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('llm_usage_logs')
        .select('*');
      
      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return LLMCostTracker._aggregateCosts(data);
    } catch (err) {
      console.error('❌ Erro ao obter custos globais:', err.message);
      return null;
    }
  }

  /**
   * Obtém custos por empresa
   */
  static async getCostsByEmpresa(empresaId, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('llm_usage_logs')
        .select('*')
        .eq('empresa_id', empresaId);
      
      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return LLMCostTracker._aggregateCosts(data);
    } catch (err) {
      console.error('❌ Erro ao obter custos por empresa:', err.message);
      return null;
    }
  }

  /**
   * Obtém custos por LLM
   */
  static async getCostsByLLM(llmName = null, startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('llm_usage_logs')
        .select('*');
      
      if (llmName) {
        query = query.eq('llm_name', llmName);
      }
      if (startDate) {
        query = query.gte('timestamp', startDate);
      }
      if (endDate) {
        query = query.lte('timestamp', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return LLMCostTracker._aggregateCosts(data);
    } catch (err) {
      console.error('❌ Erro ao obter custos por LLM:', err.message);
      return null;
    }
  }

  /**
   * Agrega custos de um conjunto de registros
   */
  static _aggregateCosts(records) {
    if (!records || records.length === 0) {
      return { total_cost: 0, total_tokens: 0, total_calls: 0 };
    }
    
    const aggregation = {
      total_cost_usd: records.reduce((sum, r) => sum + (r.total_cost_usd || 0), 0),
      total_tokens: records.reduce((sum, r) => sum + (r.total_tokens || 0), 0),
      total_calls: records.length,
      by_llm: {},
      by_date: {},
      by_empresa: {}
    };
    
    records.forEach(record => {
      // Por LLM
      const llm = record.llm_name;
      if (!aggregation.by_llm[llm]) {
        aggregation.by_llm[llm] = { calls: 0, tokens: 0, cost: 0 };
      }
      aggregation.by_llm[llm].calls++;
      aggregation.by_llm[llm].tokens += record.total_tokens;
      aggregation.by_llm[llm].cost += record.total_cost_usd;
      
      // Por Data
      const date = record.timestamp.split('T')[0];
      if (!aggregation.by_date[date]) {
        aggregation.by_date[date] = { calls: 0, tokens: 0, cost: 0 };
      }
      aggregation.by_date[date].calls++;
      aggregation.by_date[date].tokens += record.total_tokens;
      aggregation.by_date[date].cost += record.total_cost_usd;
      
      // Por Empresa
      if (record.empresa_id) {
        const empId = record.empresa_id;
        if (!aggregation.by_empresa[empId]) {
          aggregation.by_empresa[empId] = { calls: 0, tokens: 0, cost: 0 };
        }
        aggregation.by_empresa[empId].calls++;
        aggregation.by_empresa[empId].tokens += record.total_tokens;
        aggregation.by_empresa[empId].cost += record.total_cost_usd;
      }
    });
    
    return aggregation;
  }

  /**
   * Gera gráfico ASCII de custos por data
   */
  static generateCostChart(aggregation) {
    if (!aggregation || !aggregation.by_date) return '';
    
    const dates = Object.keys(aggregation.by_date).sort();
    const maxCost = Math.max(...dates.map(d => aggregation.by_date[d].cost));
    const barWidth = 50;
    
    let chart = '\n📊 CUSTOS POR DATA (USD)\n';
    chart += '═'.repeat(60) + '\n';
    
    dates.forEach(date => {
      const cost = aggregation.by_date[date].cost;
      const barLength = Math.round((cost / maxCost) * barWidth);
      const bar = '█'.repeat(barLength);
      chart += `${date}: ${bar} $${cost.toFixed(4)}\n`;
    });
    
    chart += '═'.repeat(60) + '\n';
    return chart;
  }

  /**
   * Gera relatório completo em Markdown
   */
  static async generateFullReport(startDate = null, endDate = null) {
    const global = await LLMCostTracker.getGlobalCosts(startDate, endDate);
    
    if (!global || global.total_calls === 0) {
      console.log('⚠️  Nenhum dado de custo disponível');
      return null;
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportFile = path.join(COST_REPORTS_DIR, `cost_report_${timestamp}.md`);
    
    let report = `# 💰 Relatório de Custos LLM\n\n`;
    report += `**Gerado em:** ${new Date().toLocaleString('pt-BR')}\n`;
    if (startDate) report += `**Período:** ${startDate} até ${endDate || 'agora'}\n`;
    report += `\n`;
    
    report += `## 📊 Resumo Global\n\n`;
    report += `| Métrica | Valor |\n`;
    report += `|---------|-------|\n`;
    report += `| **Total de Chamadas** | ${global.total_calls.toLocaleString()} |\n`;
    report += `| **Total de Tokens** | ${global.total_tokens.toLocaleString()} |\n`;
    report += `| **Custo Total (USD)** | $${global.total_cost_usd.toFixed(4)} |\n\n`;
    
    report += `## 🤖 Custos por LLM\n\n`;
    report += `| LLM | Chamadas | Tokens | Custo (USD) |\n`;
    report += `|-----|----------|--------|-------------|\n`;
    Object.entries(global.by_llm)
      .sort((a, b) => b[1].cost - a[1].cost)
      .forEach(([llm, data]) => {
        report += `| ${llm} | ${data.calls} | ${data.tokens.toLocaleString()} | $${data.cost.toFixed(4)} |\n`;
      });
    report += `\n`;
    
    report += `## 📅 Custos por Data\n\n`;
    report += `| Data | Chamadas | Tokens | Custo (USD) |\n`;
    report += `|------|----------|--------|-------------|\n`;
    Object.entries(global.by_date)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, data]) => {
        report += `| ${date} | ${data.calls} | ${data.tokens.toLocaleString()} | $${data.cost.toFixed(4)} |\n`;
      });
    report += `\n`;
    
    if (Object.keys(global.by_empresa).length > 0) {
      report += `## 🏢 Custos por Empresa\n\n`;
      report += `| Empresa ID | Chamadas | Tokens | Custo (USD) |\n`;
      report += `|------------|----------|--------|-------------|\n`;
      Object.entries(global.by_empresa)
        .sort((a, b) => b[1].cost - a[1].cost)
        .forEach(([empId, data]) => {
          report += `| ${empId.substring(0, 8)}... | ${data.calls} | ${data.tokens.toLocaleString()} | $${data.cost.toFixed(4)} |\n`;
        });
      report += `\n`;
    }
    
    report += LLMCostTracker.generateCostChart(global);
    
    fs.writeFileSync(reportFile, report, 'utf8');
    console.log(`\n💰 Relatório de custos salvo: ${reportFile}`);
    
    return { reportFile, data: global };
  }
}

export default LLMCostTracker;
