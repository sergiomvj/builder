#!/usr/bin/env node
/**
 * 🔄 RETRY SCRIPT - Reprocessamento Inteligente de Falhas
 * ========================================================
 * Reprocessa APENAS os registros que falharam em qualquer script
 * 
 * Uso:
 *   node retry_failed.js --script=02_generate_biografias --empresaId=UUID
 *   node retry_failed.js --script=03_generate_atribuicoes --empresaId=UUID --maxRetries=5
 *   node retry_failed.js --script=ALL --empresaId=UUID
 * 
 * Opções:
 *   --script         Nome do script (ou ALL para todos)
 *   --empresaId      UUID da empresa
 *   --maxRetries     Número máximo de tentativas (padrão: 3)
 *   --delay          Delay entre tentativas em ms (padrão: 2000)
 *   --backoff        Usar backoff exponencial (padrão: true)
 *   --report         Apenas gerar relatório, sem reprocessar
 */

import { RetryManager } from './lib/retry_manager.js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Parse argumentos
const args = process.argv.slice(2);
const config = {
  script: null,
  empresaId: null,
  maxRetries: 3,
  delay: 2000,
  backoff: true,
  reportOnly: false
};

args.forEach(arg => {
  if (arg.startsWith('--script=')) config.script = arg.split('=')[1];
  if (arg.startsWith('--empresaId=')) config.empresaId = arg.split('=')[1];
  if (arg.startsWith('--maxRetries=')) config.maxRetries = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--delay=')) config.delay = parseInt(arg.split('=')[1]);
  if (arg.startsWith('--backoff=')) config.backoff = arg.split('=')[1] === 'true';
  if (arg === '--report') config.reportOnly = true;
});

if (!config.script || !config.empresaId) {
  console.error('\n❌ Uso: node retry_failed.js --script=SCRIPT_NAME --empresaId=UUID\n');
  console.log('Scripts disponíveis:');
  console.log('  01_create_personas');
  console.log('  02_generate_biografias');
  console.log('  03_generate_atribuicoes');
  console.log('  04_generate_competencias');
  console.log('  05_generate_avatares');
  console.log('  06_analyze_automation');
  console.log('  06.5_generate_communications');
  console.log('  07_generate_workflows');
  console.log('  07.5_generate_supervision');
  console.log('  08_generate_ml');
  console.log('  09_generate_auditoria');
  console.log('  ALL (reprocessa todos os scripts)\n');
  process.exit(1);
}

console.log('\n🔄 RETRY MANAGER - Reprocessamento Inteligente');
console.log('==============================================');
console.log(`📋 Script: ${config.script}`);
console.log(`🏢 Empresa: ${config.empresaId}`);
console.log(`🔁 Max Retries: ${config.maxRetries}`);
console.log(`⏱️  Delay: ${config.delay}ms (backoff: ${config.backoff})`);
console.log(`📊 Modo: ${config.reportOnly ? 'RELATÓRIO APENAS' : 'REPROCESSAMENTO'}\n`);

/**
 * Funções de processamento específicas para cada script
 */
const PROCESSING_FUNCTIONS = {
  '02_generate_biografias': async (persona) => {
    // Importar funções auxiliares
    function slugify(str) {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    }
    
    // Buscar empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', persona.empresa_id)
      .single();
    
    if (!empresa) throw new Error('Empresa não encontrada');
    
    // Gerar domínio correto
    let dominio = empresa.dominio;
    if (!dominio) {
      const empresaSlug = slugify(empresa.nome).replace(/[0-9]/g, '');
      dominio = `${empresaSlug}.com`;
    }
    dominio = dominio.replace('https://', '').replace('http://', '').replace(/\/+$/, '');
    
    const nacionalidade = persona.nacionalidade || 'brasileiros';
    
    // Prompt completo (igual ao script original)
    const prompt = `INSTRUÇÕES IMPORTANTES:
Retorne APENAS JSON válido, sem markdown, sem comentários.
Comece diretamente com { e termine com }

Você é um especialista em criação de personas empresariais realistas.

Gere uma persona completa para:

CONTEXTO DA EMPRESA:
- Nome: ${empresa.nome}
- Indústria: ${empresa.industria}
- País: ${empresa.pais}
- Descrição: ${empresa.descricao || 'Empresa no setor de ' + empresa.industria}

DADOS DA POSIÇÃO:
- Cargo: ${persona.role}
- Departamento: ${persona.department}
- Especialidade: ${persona.specialty}
- Nacionalidade ESPECÍFICA: ${nacionalidade}

INSTRUÇÕES CRÍTICAS:
1. Gere um NOME REAL apropriado para a nacionalidade ${nacionalidade}
2. Defina o GÊNERO (masculino/feminino) baseado no nome
3. Calcule EXPERIÊNCIA (anos) apropriada para o cargo:
   - CEO/CTO/CFO: 10-15 anos
   - Diretor/VP: 7-12 anos
   - Manager/Senior: 5-10 anos
   - Pleno/Specialist: 3-7 anos
   - Junior/Assistant: 1-4 anos
4. A biografia deve refletir a cultura e contexto da nacionalidade ${nacionalidade}

RETORNE JSON VÁLIDO SEM MARKDOWN:
{
  "full_name": "Nome completo real apropriado para ${nacionalidade}",
  "genero": "masculino" ou "feminino",
  "experiencia_anos": número entre 1-15,
  "biografia_estruturada": {
    "biografia_completa": "Biografia narrativa de 2-3 parágrafos",
    "historia_profissional": "Trajetória de carreira detalhada",
    "motivacoes": {
      "intrinsecas": ["motivações internas"],
      "extrinsecas": ["motivações externas"]
    },
    "soft_skills": {
      "comunicacao": 1-10,
      "lideranca": 1-10,
      "trabalho_equipe": 1-10,
      "adaptabilidade": 1-10,
      "resolucao_problemas": 1-10,
      "pensamento_critico": 1-10
    },
    "hard_skills": {
      "tecnologicas": {"skill": 1-10},
      "ferramentas": ["lista de ferramentas"],
      "metodologias": ["metodologias usadas"],
      "areas_conhecimento": ["áreas de especialização"]
    },
    "educacao": {
      "formacao_superior": ["graduação"],
      "pos_graduacao": ["MBA/mestrado"],
      "cursos_complementares": ["cursos"],
      "instituicoes": ["universidades apropriadas"]
    },
    "certificacoes": ["certificações profissionais"],
    "idiomas_fluencia": {
      "nativo": ["idioma nativo"],
      "fluente": ["idiomas fluentes"],
      "intermediario": ["idiomas intermediários"],
      "basico": []
    },
    "experiencia_internacional": {
      "paises_trabalhou": ["países"],
      "projetos_globais": ["projetos"],
      "clientes_internacionais": true/false,
      "culturas_conhece": ["culturas"]
    },
    "redes_sociais": {
      "linkedin": "url",
      "twitter": "",
      "github": "",
      "website_pessoal": "",
      "outros": {}
    }
  }
}`;

    // Gerar via LLM
    const llmData = await generateJSONWithFallback(prompt, { temperature: 0.95, maxTokens: 2500 });
    
    // Validar
    if (!llmData || !llmData.full_name || !llmData.genero || !llmData.experiencia_anos) {
      throw new Error('Dados incompletos retornados pela LLM');
    }
    
    // Gerar email
    const nomes = llmData.full_name.split(' ');
    const primeiroNome = slugify(nomes[0]);
    const ultimoNome = slugify(nomes[nomes.length - 1]);
    let email = `${primeiroNome}.${ultimoNome}@${dominio}`;
    
    // Verificar unicidade do email
    let counter = 1;
    while (counter < 100) {
      const { data: existing } = await supabase
        .from('personas')
        .select('id')
        .eq('email', email)
        .neq('id', persona.id)
        .maybeSingle();
      
      if (!existing) break;
      
      email = `${primeiroNome}.${ultimoNome}${counter}@${dominio}`;
      counter++;
    }
    
    // Atualizar persona
    const { error: updateError } = await supabase
      .from('personas')
      .update({
        full_name: llmData.full_name,
        genero: llmData.genero,
        experiencia_anos: llmData.experiencia_anos,
        email: email
      })
      .eq('id', persona.id);
    
    if (updateError) throw updateError;
    
    // Inserir biografia
    const { error: bioError } = await supabase
      .from('personas_biografias')
      .insert({
        persona_id: persona.id,
        biografia_estruturada: llmData.biografia_estruturada
      });
    
    if (bioError) throw bioError;
  },
  
  '03_generate_atribuicoes': async (persona) => {
    // Implementar lógica de reprocessamento de atribuições
    console.log('   ⚠️  Função de reprocessamento não implementada ainda');
    throw new Error('Não implementado');
  },
  
  // ... adicionar outras funções conforme necessário
};

/**
 * Processa um script
 */
async function processScript(scriptName) {
  try {
    const retry = new RetryManager(scriptName, config.empresaId);
    
    if (config.reportOnly) {
      // Apenas gerar relatório
      const failed = await retry.identifyFailed();
      retry.generateFailureReport();
      return { script: scriptName, failed: failed.length, processed: 0 };
    }
    
    // Verificar se temos função de processamento
    const processingFn = PROCESSING_FUNCTIONS[scriptName];
    if (!processingFn) {
      console.warn(`⚠️  Função de reprocessamento não definida para ${scriptName}`);
      const failed = await retry.identifyFailed();
      return { script: scriptName, failed: failed.length, processed: 0, error: 'Não implementado' };
    }
    
    // Reprocessar
    const results = await retry.retryFailed(processingFn, {
      delayMs: config.delay,
      exponentialBackoff: config.backoff,
      maxRetries: config.maxRetries
    });
    
    return { 
      script: scriptName, 
      ...results 
    };
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${scriptName}:`, error.message);
    return { script: scriptName, error: error.message };
  }
}

/**
 * Main
 */
async function main() {
  const scriptsToProcess = config.script === 'ALL' 
    ? [
        '01_create_personas',
        '02_generate_biografias',
        '03_generate_atribuicoes',
        '04_generate_competencias',
        '05_generate_avatares',
        '06_analyze_automation',
        '06.5_generate_communications',
        '07_generate_workflows',
        '07.5_generate_supervision',
        '08_generate_ml',
        '09_generate_auditoria'
      ]
    : [config.script];
  
  const results = [];
  
  for (const scriptName of scriptsToProcess) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 Processando: ${scriptName}`);
    console.log('═'.repeat(60));
    
    const result = await processScript(scriptName);
    results.push(result);
    
    // Pequeno delay entre scripts
    if (scriptsToProcess.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Resumo final
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMO GERAL DO REPROCESSAMENTO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach(r => {
    if (r.error) {
      console.log(`❌ ${r.script}: ERRO - ${r.error}`);
    } else if (config.reportOnly) {
      console.log(`📋 ${r.script}: ${r.failed} falhas detectadas`);
    } else {
      console.log(`✅ ${r.script}: ${r.success} sucessos, ${r.failed} falhas, ${r.skipped} pulados`);
    }
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err);
  process.exit(1);
});
