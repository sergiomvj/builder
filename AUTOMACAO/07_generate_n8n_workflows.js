#!/usr/bin/env node
/**
 * 🎯 SCRIPT 07 - GERAÇÃO DE WORKFLOWS N8N
 * =========================================================================
 * ORDEM CORRETA: Executar APÓS Script 06 (análise de automação)
 * 
 * Gera workflows N8N executáveis a partir das análises de personas_automation_opportunities.
 * Converte workflow_steps em nós N8N conectados automaticamente.
 * 
 * DEPENDE DE:
 * - Script 06: personas_automation_opportunities (análises de tarefas)
 * 
 * Funcionalidades:
 * - Lê personas_automation_opportunities com score >= 60
 * - Converte workflow_steps em nós N8N
 * - Conecta nós automaticamente em sequência
 * - Adiciona error handling
 * - Configura credenciais por empresa
 * - Gera JSON 100% importável no N8N
 * - Salva em arquivos JSON
 * - Registra em personas_workflows no Supabase
 * 
 * Uso:
 * node 07_generate_n8n_workflows.js --empresaId=UUID_DA_EMPRESA
 * node 07_generate_n8n_workflows.js --empresaId=UUID --minScore=70
 * node 07_generate_n8n_workflows.js --empresaId=UUID --personaId=UUID
 * 
 * Requisitos:
 * - NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Tabelas: personas_automation_opportunities, personas_workflows
 * - Script 06 já executado (análises salvas em personas_automation_opportunities)
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

// Carregar .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
const personaIdArg = args.find(arg => arg.startsWith('--personaId='))?.split('=')[1];
const minScoreArg = parseInt(args.find(arg => arg.startsWith('--minScore='))?.split('=')[1] || '60');

// Se personaId fornecido, buscar empresaId da persona
let finalEmpresaId = empresaIdArg;

if (!empresaIdArg && !personaIdArg) {
  console.error('❌ Erro: --empresaId ou --personaId é obrigatório');
  console.log('\nUso:');
  console.log('  node 07_generate_n8n_workflows.js --empresaId=UUID_DA_EMPRESA');
  console.log('  node 07_generate_n8n_workflows.js --empresaId=UUID --minScore=70');
  console.log('  node 07_generate_n8n_workflows.js --personaId=UUID');
  process.exit(1);
}

// Se apenas personaId, buscar empresaId
if (!empresaIdArg && personaIdArg) {
  const { data: persona } = await supabase
    .from('personas')
    .select('empresa_id')
    .eq('id', personaIdArg)
    .single();
  
  if (!persona) {
    console.error('❌ Persona não encontrada');
    process.exit(1);
  }
  
  finalEmpresaId = persona.empresa_id;
  console.log(`ℹ️  EmpresaId obtido da persona: ${finalEmpresaId}`);
}

const OUTPUT_DIR = path.join(__dirname, '06_N8N_WORKFLOWS');

// ============================================================================
// MAPEAMENTO DE TIPOS DE NÓS N8N
// ============================================================================

const NODE_TYPE_MAPPING = {
  // Triggers
  'cron': 'n8n-nodes-base.cron',
  'webhook': 'n8n-nodes-base.webhook',
  'manual': 'n8n-nodes-base.manualTrigger',
  'schedule': 'n8n-nodes-base.scheduleTrigger',
  
  // Data Sources
  'supabase': 'n8n-nodes-base.supabase',
  'postgres': 'n8n-nodes-base.postgres',
  'mysql': 'n8n-nodes-base.mySql',
  'http': 'n8n-nodes-base.httpRequest',
  'api': 'n8n-nodes-base.httpRequest',
  
  // Google
  'google-sheets': 'n8n-nodes-base.googleSheets',
  'gmail': 'n8n-nodes-base.gmail',
  'google-drive': 'n8n-nodes-base.googleDrive',
  'google-calendar': 'n8n-nodes-base.googleCalendar',
  
  // Communication
  'slack': 'n8n-nodes-base.slack',
  'discord': 'n8n-nodes-base.discord',
  'telegram': 'n8n-nodes-base.telegram',
  'twilio': 'n8n-nodes-base.twilio',
  
  // CRM & Marketing
  'hubspot': 'n8n-nodes-base.hubspot',
  'salesforce': 'n8n-nodes-base.salesforce',
  'mailchimp': 'n8n-nodes-base.mailchimp',
  'sendgrid': 'n8n-nodes-base.sendgrid',
  
  // Logic & Transform
  'function': 'n8n-nodes-base.function',
  'code': 'n8n-nodes-base.code',
  'if': 'n8n-nodes-base.if',
  'switch': 'n8n-nodes-base.switch',
  'set': 'n8n-nodes-base.set',
  'merge': 'n8n-nodes-base.merge',
  
  // Utility
  'wait': 'n8n-nodes-base.wait',
  'split-in-batches': 'n8n-nodes-base.splitInBatches',
  'item-lists': 'n8n-nodes-base.itemLists',
  'http-request': 'n8n-nodes-base.httpRequest'
};

// ============================================================================
// CLASSE PRINCIPAL: N8N WORKFLOW GENERATOR
// ============================================================================

class N8NWorkflowGenerator {
  constructor(empresa, persona, opportunity, task) {
    this.empresa = empresa;
    this.persona = persona;
    this.opportunity = opportunity;
    this.task = task;
    this.nodeIdCounter = 1;
    this.position = { x: 240, y: 300 };
    this.xSpacing = 220;
  }

  /**
   * Gerar workflow N8N completo
   */
  generate() {
    const workflow = {
      name: this.generateWorkflowName(),
      nodes: [],
      connections: {},
      active: false,
      settings: {
        executionOrder: "v1",
        saveManualExecutions: true,
        callerPolicy: "workflowsFromSameOwner",
        timezone: "America/Sao_Paulo"
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versionId: "1",
      meta: {
        empresa_id: this.empresa.id,
        empresa_codigo: this.empresa.codigo,
        persona_id: this.persona.id,
        persona_nome: this.persona.full_name,
        task_id: this.task.id,
        task_title: this.task.title,
        opportunity_id: this.opportunity.id,
        automation_score: this.opportunity.automation_score,
        generated_by: "VCM Task-Driven Generator",
        generated_at: new Date().toISOString()
      }
    };

    // Gerar nós a partir de workflow_steps
    const nodes = [];
    const connections = {};

    this.opportunity.workflow_steps.forEach((step, index) => {
      const nodeId = this.nodeIdCounter.toString();
      const node = this.createNode(step, nodeId);
      nodes.push(node);

      // Conectar ao nó anterior (exceto o primeiro)
      if (index > 0) {
        const previousNodeId = (this.nodeIdCounter - 1).toString();
        if (!connections[previousNodeId]) {
          connections[previousNodeId] = { main: [[]] };
        }
        connections[previousNodeId].main[0].push({
          node: nodeId,
          type: "main",
          index: 0
        });
      }

      this.nodeIdCounter++;
      this.position.x += this.xSpacing;
    });

    // Adicionar nó de error handling
    const errorNode = this.createErrorHandlerNode();
    nodes.push(errorNode);

    workflow.nodes = nodes;
    workflow.connections = connections;
    workflow.settings.errorWorkflow = errorNode.id;

    return workflow;
  }

  /**
   * Criar nó N8N individual
   */
  createNode(step, nodeId) {
    const n8nType = this.mapNodeType(step.type);
    
    const node = {
      id: nodeId,
      name: step.action || `Step ${step.step}`,
      type: n8nType,
      position: [this.position.x, this.position.y],
      parameters: this.generateNodeParameters(step),
      typeVersion: 1,
      notes: step.description || `Gerado automaticamente - ${this.task.title}`
    };

    // Configurações específicas por tipo
    if (step.type === 'webhook') {
      node.webhookId = `${this.empresa.codigo}_${step.config.path || 'trigger'}`;
    }

    if (step.type === 'function' || step.type === 'code') {
      node.parameters.functionCode = step.config.code || 'return items;';
    }

    // Adicionar credenciais se necessário
    const credentials = this.generateCredentials(step.type);
    if (credentials) {
      node.credentials = credentials;
    }

    return node;
  }

  /**
   * Mapear tipo de step para tipo N8N
   */
  mapNodeType(type) {
    const normalizedType = type.toLowerCase().replace(/_/g, '-');
    return NODE_TYPE_MAPPING[normalizedType] || 'n8n-nodes-base.function';
  }

  /**
   * Gerar parâmetros do nó baseados no config
   */
  generateNodeParameters(step) {
    const params = {};
    const config = step.config || {};

    switch(step.type) {
      case 'cron':
        params.rule = {
          interval: [{
            field: 'cronExpression',
            value: config.cron || config.cronExpression || '0 9 * * *'
          }]
        };
        params.timezone = config.timezone || 'America/Sao_Paulo';
        break;

      case 'webhook':
        params.path = config.path || 'trigger';
        params.httpMethod = config.httpMethod || config.method || 'POST';
        params.responseMode = config.responseMode || 'onReceived';
        break;

      case 'supabase':
        params.operation = config.operation || 'select';
        if (config.table) params.table = config.table;
        if (config.filters) params.filters = config.filters;
        if (config.set) params.data = config.set;
        break;

      case 'http':
      case 'api':
        params.url = config.url || '';
        params.method = config.method || 'GET';
        params.responseFormat = config.responseFormat || 'json';
        if (config.headers) params.headers = config.headers;
        if (config.body) params.body = config.body;
        break;

      case 'gmail':
        params.resource = 'message';
        params.operation = config.operation || 'send';
        params.to = config.to || '{{ $json.email }}';
        params.subject = config.subject || 'Notification';
        params.message = config.message || config.body || 'Automated message';
        break;

      case 'slack':
        params.resource = 'message';
        params.operation = 'post';
        params.channel = config.channel || '#general';
        params.text = config.message || config.text || 'Automated notification';
        break;

      case 'function':
      case 'code':
        params.functionCode = config.code || 'return items;';
        break;

      case 'if':
        params.conditions = config.conditions || {
          string: [{
            value1: config.condition || '{{ $json.value }}',
            operation: 'equal',
            value2: 'true'
          }]
        };
        break;

      case 'set':
        params.values = config.values || { string: [] };
        break;

      case 'wait':
        params.amount = config.amount || 1;
        params.unit = config.unit || 'minutes';
        break;

      case 'google-sheets':
        params.operation = config.operation || 'read';
        if (config.spreadsheetId) params.spreadsheetId = config.spreadsheetId;
        if (config.range) params.range = config.range;
        break;

      default:
        // Copiar config diretamente como parameters
        Object.assign(params, config);
    }

    return params;
  }

  /**
   * Gerar credenciais para nós que precisam
   */
  generateCredentials(type) {
    const empresaCodigo = this.empresa.codigo;
    
    const credentialMapping = {
      'slack': {
        slackApi: {
          id: `slack_${empresaCodigo}`,
          name: `Slack ${empresaCodigo.toUpperCase()}`
        }
      },
      'gmail': {
        gmailOAuth2: {
          id: `gmail_${empresaCodigo}`,
          name: `Gmail ${empresaCodigo.toUpperCase()}`
        }
      },
      'google-sheets': {
        googleSheetsOAuth2: {
          id: `gsheets_${empresaCodigo}`,
          name: `Google Sheets ${empresaCodigo.toUpperCase()}`
        }
      },
      'hubspot': {
        hubspotApi: {
          id: `hubspot_${empresaCodigo}`,
          name: `HubSpot ${empresaCodigo.toUpperCase()}`
        }
      },
      'supabase': {
        supabaseApi: {
          id: `supabase_${empresaCodigo}`,
          name: `Supabase ${empresaCodigo.toUpperCase()}`
        }
      }
    };

    return credentialMapping[type] || null;
  }

  /**
   * Criar nó de error handler
   */
  createErrorHandlerNode() {
    const errorNodeId = this.nodeIdCounter.toString();
    
    return {
      id: errorNodeId,
      name: "Error Handler",
      type: "n8n-nodes-base.slack",
      position: [this.position.x, this.position.y + 150],
      parameters: {
        resource: "message",
        operation: "post",
        channel: "#vcm-errors",
        text: `❌ Erro no workflow: ${this.generateWorkflowName()}\nEmpresa: ${this.empresa.nome}\nPersona: ${this.persona.full_name}\nTarefa: ${this.task.title}\n\nErro: {{ $json.error }}`
      },
      typeVersion: 1,
      notes: "Error handler - notifica falhas no Slack",
      credentials: {
        slackApi: {
          id: `slack_${this.empresa.codigo}`,
          name: `Slack ${this.empresa.codigo.toUpperCase()}`
        }
      }
    };
  }

  /**
   * Gerar nome do workflow
   */
  generateWorkflowName() {
    const personaFirstName = this.persona.full_name.split(' ')[0];
    const taskTitleShort = this.task.title.length > 40 
      ? this.task.title.substring(0, 40) + '...'
      : this.task.title;
    
    return `${personaFirstName} (${this.persona.role}) - ${taskTitleShort}`;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Buscar empresa
 */
async function fetchEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar empresa:', error.message);
    return null;
  }

  return data;
}

/**
 * Buscar oportunidades de automação
 */
async function fetchAutomationOpportunities(empresaId, personaId = null, minScore = 60) {
  let query = supabase
    .from('personas_automation_opportunities')
    .select(`
      *,
      personas!inner(id, full_name, role)
    `)
    .eq('empresa_id', empresaId)
    .eq('status', 'analyzed')
    .gte('automation_score', minScore);

  if (personaId) {
    query = query.eq('persona_id', personaId);
  }

  const { data, error } = await query.order('automation_score', { ascending: false });

  if (error) {
    console.error('❌ Erro ao buscar oportunidades:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Salvar workflow no Supabase
 */
async function saveWorkflowToDatabase(workflow, empresaId, personaId, opportunityId) {
  const record = {
    empresa_id: empresaId,
    persona_id: personaId,
    workflow_name: workflow.name,
    workflow_description: workflow.meta.task_title || null,
    workflow_type: workflow.meta.workflow_type || 'manual',
    workflow_json: workflow,
    linked_tasks: [],  // Não há tabela separada de tasks
    opportunity_id: opportunityId,
    source_type: 'task-driven',
    status: 'draft',
    category: 'automation',
    priority: workflow.meta.automation_score >= 80 ? 1 : (workflow.meta.automation_score >= 60 ? 2 : 3),
    created_by: 'VCM Task-Driven Generator'
  };

  // Verificar se já existe workflow para essa oportunidade
  const { data: existing } = await supabase
    .from('personas_workflows')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .single();

  if (existing) {
    // Atualizar existente
    const { error } = await supabase
      .from('personas_workflows')
      .update(record)
      .eq('id', existing.id);

    if (error) {
      console.error(`   ❌ Erro ao atualizar workflow no banco:`, error.message);
      return false;
    }

    console.log(`   💾 Workflow atualizado no banco (ID: ${existing.id})`);
  } else {
    // Inserir novo
    const { error } = await supabase
      .from('personas_workflows')
      .insert([record]);

    if (error) {
      console.error(`   ❌ Erro ao salvar workflow no banco:`, error.message);
      return false;
    }

    console.log(`   💾 Workflow salvo no banco`);
  }

  return true;
}

/**
 * Salva workflow individual em arquivo JSON
 */
async function saveWorkflowToFile(workflow, outputDir, personaName) {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    // Nome seguro do arquivo
    const safeName = workflow.name
      .replace(/[^a-zA-Z0-9-]/g, '_')
      .substring(0, 100);
    
    const fileName = `${safeName}_${Date.now()}.json`;
    const filePath = path.join(outputDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2), 'utf-8');
    
    console.log(`   📄 Arquivo: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Erro ao salvar arquivo: ${error.message}`);
    return false;
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('\n🚀 Iniciando geração de workflows N8N...\n');
  console.log(`📋 Empresa ID: ${finalEmpresaId}`);
  if (personaIdArg) {
    console.log(`👤 Persona ID: ${personaIdArg}`);
  }
  console.log(`📊 Score mínimo: ${minScoreArg}\n`);

  // 1. Buscar empresa
  const empresa = await fetchEmpresa(finalEmpresaId);
  if (!empresa) {
    console.error('❌ Empresa não encontrada');
    process.exit(1);
  }

  console.log(`✅ Empresa: ${empresa.nome} (${empresa.codigo})\n`);

  // 2. Buscar oportunidades de automação
  const opportunities = await fetchAutomationOpportunities(finalEmpresaId, personaIdArg, minScoreArg);

  if (opportunities.length === 0) {
    console.log('⚠️  Nenhuma oportunidade de automação encontrada');
    console.log(`   Certifique-se de executar o script 02.5_analyze_tasks_for_automation.js primeiro\n`);
    process.exit(0);
  }

  console.log(`✅ ${opportunities.length} oportunidade(s) de automação encontrada(s)\n`);

  // 3. Gerar workflows
  const report = {
    empresa_id: finalEmpresaId,
    empresa_nome: empresa.nome,
    generated_at: new Date().toISOString(),
    opportunities_processed: opportunities.length,
    workflows_generated: 0,
    workflows_saved_to_file: 0,
    workflows_saved_to_db: 0,
    workflows: []
  };

  for (const opportunity of opportunities) {
    const persona = opportunity.personas;
    // Os dados da tarefa estão no próprio opportunity (task_title, task_description, etc)
    const task = {
      title: opportunity.task_title,
      description: opportunity.task_description,
      frequency: opportunity.task_frequency
    };

    console.log(`\n👤 ${persona.full_name} (${persona.role})`);
    console.log(`   📋 Tarefa: ${task.title}`);
    console.log(`   🎯 Score: ${opportunity.automation_score}/100`);
    console.log(`   🔧 Tipo: ${opportunity.workflow_type}`);
    console.log(`   🔗 Integrações: ${opportunity.required_integrations.join(', ')}`);
    console.log(`   📦 Steps: ${opportunity.workflow_steps.length} nós`);

    // Gerar workflow
    const generator = new N8NWorkflowGenerator(empresa, persona, opportunity, task);
    const workflow = generator.generate();

    report.workflows_generated++;

    console.log(`   ✅ Workflow gerado: ${workflow.nodes.length} nós + ${workflow.connections ? Object.keys(workflow.connections).length : 0} conexões`);

    // Salvar em arquivo JSON
    const savedToFile = await saveWorkflowToFile(workflow, OUTPUT_DIR, persona.full_name);
    if (savedToFile) {
      report.workflows_saved_to_file++;
    }

    // Salvar no banco
    const savedToDb = await saveWorkflowToDatabase(
      workflow,
      finalEmpresaId,
      persona.id,
      opportunity.id
    );

    if (savedToDb) {
      report.workflows_saved_to_db++;
    }

    report.workflows.push({
      workflow_name: workflow.name,
      persona_nome: persona.full_name,
      task_title: task.title,
      automation_score: opportunity.automation_score,
      nodes_count: workflow.nodes.length,
      integrations: opportunity.required_integrations
    });
  }

  // 4. Criar diretório se não existir e salvar relatório
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const reportPath = path.join(OUTPUT_DIR, `RELATORIO_${empresa.codigo}_${new Date().toISOString().split('T')[0]}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // 5. Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA GERAÇÃO');
  console.log('='.repeat(80));
  console.log(`Oportunidades processadas: ${report.opportunities_processed}`);
  console.log(`Workflows gerados: ${report.workflows_generated}`);
  console.log(`Salvos no banco: ${report.workflows_saved_to_db}`);
  console.log(`Salvos em arquivos JSON: ${report.workflows_saved_to_file}`);
  console.log('='.repeat(80));

  console.log('\n✅ Geração de workflows concluída com sucesso!');
  console.log('\n📌 Próximos passos:');
  console.log('   1. Importar workflows no N8N (Interface Web ou API)');
  console.log('   2. Configurar credenciais (Slack, Gmail, etc.)');
  console.log('   3. Ativar workflows e monitorar execuções\n');
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
