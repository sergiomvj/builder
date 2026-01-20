// ============================================================================
// SCRIPT 07.5 - GERAÇÃO DE CADEIAS DE SUPERVISÃO
// ============================================================================
// OBJETIVO: Criar regras de supervisão hierárquica baseadas em:
// - Níveis hierárquicos (execution < operational < tactical < strategic)
// - Blocos funcionais e departamentos
// - Tipos de tarefas e limites de valor
// - Escalação automática
//
// PARADIGMA V5.0: Supervisão inteligente e contextual
// - Analisa hierarquia real da organização
// - Define thresholds por tipo de tarefa
// - Cria cadeias de escalação
// - Configura SLAs por nível
//
// Uso: node 07.5_generate_supervision_chains.js --empresaId=UUID
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configurar encoding do console
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('👔 SCRIPT 07.5 - GERAÇÃO DE CADEIAS DE SUPERVISÃO');
console.log('===================================================');
console.log('🏗️ Criando hierarquia de aprovações');
console.log('===================================================\n');

// Parse arguments
const args = process.argv.slice(2);
let targetEmpresaId = null;

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
  }
}

if (!targetEmpresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('📝 Uso: node 07.5_generate_supervision_chains.js --empresaId=UUID');
  process.exit(1);
}

// Output directory
const OUTPUT_DIR = join(__dirname, 'supervision_chains_output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// MAPEAMENTO DE HIERARQUIA
// ============================================================================

const HIERARCHY_MAP = {
  'operacional': 'execution',
  'especialista': 'operational',
  'gerencial': 'tactical',
  'diretoria': 'strategic',
  'execution': 'execution',
  'operational': 'operational',
  'tactical': 'tactical',
  'strategic': 'strategic'
};

function mapHierarchyLevel(nivel) {
  const normalizado = (nivel || 'operational').toLowerCase();
  return HIERARCHY_MAP[normalizado] || 'operational';
}

// ============================================================================
// TEMPLATES DE TAREFAS POR ÁREA
// ============================================================================

const TASK_TEMPLATES = {
  'Marketing': [
    { code: 'MKT_CAMPAIGN', name: 'Criar Campanha', min: 1000, max: 10000 },
    { code: 'MKT_CONTENT', name: 'Produzir Conteúdo', min: 100, max: 2000 },
    { code: 'MKT_LEADS', name: 'Gerar Leads', min: 500, max: 5000 },
    { code: 'MKT_SEO', name: 'Otimizar SEO', min: 200, max: 3000 }
  ],
  'Vendas': [
    { code: 'VEN_LEAD', name: 'Qualificar Lead', min: 0, max: 1000 },
    { code: 'VEN_PROPOSAL', name: 'Enviar Proposta', min: 5000, max: 50000 },
    { code: 'VEN_CONTRACT', name: 'Fechar Contrato', min: 10000, max: 100000 },
    { code: 'VEN_FOLLOWUP', name: 'Follow-up Cliente', min: 0, max: 500 }
  ],
  'Financeiro': [
    { code: 'FIN_PAYMENT', name: 'Processar Pagamento', min: 100, max: 10000 },
    { code: 'FIN_INVOICE', name: 'Emitir Fatura', min: 100, max: 50000 },
    { code: 'FIN_BUDGET', name: 'Aprovar Orçamento', min: 1000, max: 100000 },
    { code: 'FIN_REPORT', name: 'Gerar Relatório', min: 0, max: 1000 }
  ],
  'Operações': [
    { code: 'OPS_ORDER', name: 'Processar Pedido', min: 100, max: 10000 },
    { code: 'OPS_DELIVERY', name: 'Coordenar Entrega', min: 50, max: 5000 },
    { code: 'OPS_SUPPORT', name: 'Atender Suporte', min: 0, max: 500 },
    { code: 'OPS_PROCESS', name: 'Automatizar Processo', min: 1000, max: 20000 }
  ],
  'Produto': [
    { code: 'PRD_FEATURE', name: 'Desenvolver Feature', min: 5000, max: 50000 },
    { code: 'PRD_BUGFIX', name: 'Corrigir Bug', min: 100, max: 2000 },
    { code: 'PRD_RELEASE', name: 'Lançar Versão', min: 10000, max: 100000 },
    { code: 'PRD_TEST', name: 'Executar Testes', min: 500, max: 5000 }
  ],
  'Qualidade': [
    { code: 'QUA_AUDIT', name: 'Executar Auditoria', min: 1000, max: 10000 },
    { code: 'QUA_REVIEW', name: 'Revisar Processo', min: 500, max: 5000 },
    { code: 'QUA_COMPLIANCE', name: 'Verificar Conformidade', min: 1000, max: 20000 },
    { code: 'QUA_REPORT', name: 'Relatório de Qualidade', min: 200, max: 2000 }
  ]
};

// ============================================================================
// CRIAR CADEIA DE SUPERVISÃO
// ============================================================================

async function criarCadeiaSupervision(empresaId, executor, supervisor, taskTemplate) {
  const executorLevel = mapHierarchyLevel(executor.nivel_hierarquico);
  const supervisorLevel = mapHierarchyLevel(supervisor.nivel_hierarquico);

  // Validar que supervisor está acima do executor
  const levels = ['execution', 'operational', 'tactical', 'strategic'];
  if (levels.indexOf(supervisorLevel) <= levels.indexOf(executorLevel)) {
    return null; // Não criar cadeia se não houver hierarquia válida
  }

  // Determinar próximo nível de escalação
  const supervisorIndex = levels.indexOf(supervisorLevel);
  const escalationLevel = supervisorIndex < levels.length - 1 ? levels[supervisorIndex + 1] : null;

  const { data, error } = await supabase
    .from('task_supervision_chains')
    .insert({
      task_template_code: taskTemplate.code,
      functional_area: executor.departamento || 'General',
      executor_role: executor.role,
      supervisor_role: supervisor.role,
      executor_level: executorLevel,
      supervisor_level: supervisorLevel,
      supervision_type: 'approval',
      trigger_criteria: 'value_threshold',
      trigger_rules: {
        auto_approve_below: taskTemplate.min * 0.5,
        requires_approval_above: taskTemplate.min,
        high_priority_above: taskTemplate.max * 0.7
      },
      value_threshold_min: taskTemplate.min,
      value_threshold_max: taskTemplate.max,
      response_time_hours: supervisorLevel === 'tactical' ? 24 : 48,
      escalation_enabled: true,
      escalation_to_level: escalationLevel,
      is_active: true,
      priority: supervisorLevel === 'strategic' ? 3 : supervisorLevel === 'tactical' ? 2 : 1
    })
    .select()
    .single();

  if (error) {
    console.error(`   ❌ Erro ao criar cadeia:`, error.message);
    return null;
  }

  return data;
}

// ============================================================================
// IDENTIFICAR SUPERVISOR PARA EXECUTOR
// ============================================================================

function encontrarSupervisor(executor, todasPersonas) {
  const executorLevel = mapHierarchyLevel(executor.nivel_hierarquico);
  const levels = ['execution', 'operational', 'tactical', 'strategic'];
  const executorIndex = levels.indexOf(executorLevel);

  // Buscar personas do mesmo departamento com nível superior
  const candidatos = todasPersonas.filter(p => {
    if (p.id === executor.id) return false;
    
    const pLevel = mapHierarchyLevel(p.nivel_hierarquico);
    const pIndex = levels.indexOf(pLevel);
    
    // Mesmo departamento E nível superior
    const mesmoDept = (p.departamento === executor.departamento) || 
                      (!p.departamento && !executor.departamento);
    const nivelSuperior = pIndex > executorIndex;
    
    return mesmoDept && nivelSuperior;
  });

  // Retornar o supervisor de nível imediatamente superior
  if (candidatos.length > 0) {
    candidatos.sort((a, b) => {
      const aIndex = levels.indexOf(mapHierarchyLevel(a.nivel_hierarquico));
      const bIndex = levels.indexOf(mapHierarchyLevel(b.nivel_hierarquico));
      return aIndex - bIndex; // Menor índice = mais próximo
    });
    return candidatos[0];
  }

  // Se não encontrou no mesmo departamento, buscar em qualquer departamento
  const candidatosGerais = todasPersonas.filter(p => {
    if (p.id === executor.id) return false;
    const pLevel = mapHierarchyLevel(p.nivel_hierarquico);
    const pIndex = levels.indexOf(pLevel);
    return pIndex > executorIndex;
  });

  if (candidatosGerais.length > 0) {
    candidatosGerais.sort((a, b) => {
      const aIndex = levels.indexOf(mapHierarchyLevel(a.nivel_hierarquico));
      const bIndex = levels.indexOf(mapHierarchyLevel(b.nivel_hierarquico));
      return aIndex - bIndex;
    });
    return candidatosGerais[0];
  }

  return null;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  try {
    // 1. Buscar empresa
    console.log('1️⃣ Buscando empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();

    if (empresaError) {
      console.error('❌ Empresa não encontrada:', empresaError.message);
      process.exit(1);
    }

    console.log(`✅ Empresa: ${empresa.nome}\n`);

    // 2. Buscar personas
    console.log('2️⃣ Buscando personas...\n');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('persona_code');

    if (personasError || !personas || personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada');
      process.exit(1);
    }

    console.log(`✅ ${personas.length} personas encontradas\n`);

    // 3. Criar cadeias de supervisão
    console.log('3️⃣ Criando cadeias de supervisão...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let cadeiasCreated = 0;
    const cadeias = [];

    // Para cada persona que não é strategic
    for (const executor of personas) {
      const executorLevel = mapHierarchyLevel(executor.nivel_hierarquico);
      if (executorLevel === 'strategic') {
        console.log(`⏭️  ${executor.persona_code} - Nível estratégico, sem supervisor\n`);
        continue;
      }

      console.log(`👤 ${executor.persona_code} - ${executor.role}`);
      console.log(`   Nível: ${executorLevel}`);

      // Encontrar supervisor
      const supervisor = encontrarSupervisor(executor, personas);
      if (!supervisor) {
        console.log(`   ⚠️ Sem supervisor identificado\n`);
        continue;
      }

      console.log(`   👔 Supervisor: ${supervisor.persona_code} - ${supervisor.role}`);

      // Determinar área funcional
      const area = executor.departamento || 'Operações';
      const templates = TASK_TEMPLATES[area] || TASK_TEMPLATES['Operações'];

      console.log(`   📋 Criando ${templates.length} cadeias para área: ${area}`);

      // Criar uma cadeia para cada template de tarefa
      for (const template of templates) {
        const cadeia = await criarCadeiaSupervision(empresa.id, executor, supervisor, template);
        if (cadeia) {
          cadeiasCreated++;
          cadeias.push({
            executor: executor.persona_code,
            supervisor: supervisor.persona_code,
            task_template: template.code,
            value_range: `R$ ${template.min} - R$ ${template.max}`
          });
        }
      }

      console.log(`   ✅ ${templates.length} cadeias criadas\n`);
    }

    // 4. Salvar relatório JSON
    const jsonPath = join(OUTPUT_DIR, `${empresa.codigo}_supervision_chains.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(cadeias, null, 2), 'utf-8');
    console.log(`📄 Relatório salvo em: ${jsonPath}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 07.5 CONCLUÍDO!\n');
    console.log(`✅ Cadeias de supervisão criadas: ${cadeiasCreated}`);
    console.log(`✅ Personas com supervisão: ${cadeias.length > 0 ? new Set(cadeias.map(c => c.executor)).size : 0}\n`);

    console.log('📋 PRÓXIMO PASSO:');
    console.log('   Sistema de supervisão está pronto!');
    console.log('   Agora você pode criar tarefas que serão automaticamente roteadas para aprovação.\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
