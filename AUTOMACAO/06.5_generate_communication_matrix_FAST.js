// ============================================================================
// SCRIPT 06.5 FAST - MATRIZ DE COMUNICAÇÃO (SEM LLM)
// ============================================================================
// Versão otimizada que usa regras determinísticas para criar comunicações
// entre personas baseado em departamentos e hierarquia.
//
// Uso: node 06.5_generate_communication_matrix_FAST.js --empresaId=UUID
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

console.log('🔗 SCRIPT 06.5 FAST - MATRIZ DE COMUNICAÇÃO');
console.log('===================================================');
console.log('⚡ Versão otimizada (sem LLM)');
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
  process.exit(1);
}

const OUTPUT_DIR = join(__dirname, 'communication_matrix_output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// REGRAS DE COMUNICAÇÃO DETERMINÍSTICAS
// ============================================================================

function deveComunicar(personaA, personaB) {
  // Regra 1: Mesma área funcional → comunicação frequente
  if (personaA.departamento && personaB.departamento && 
      personaA.departamento === personaB.departamento) {
    return {
      precisa: true,
      tipos: ['handoff', 'notification'],
      razao: `Trabalham na mesma área: ${personaA.departamento}`,
      prioridade: 'normal',
      frequencia: 'diaria'
    };
  }

  // Regra 2: Hierarquia direta → aprovações
  if (personaA.nivel_hierarquico === 'operacional' && 
      personaB.nivel_hierarquico === 'gerencial') {
    return {
      precisa: true,
      tipos: ['approval_request', 'notification'],
      razao: 'Relação hierárquica: operacional → gerencial',
      prioridade: 'high',
      frequencia: 'semanal'
    };
  }

  // Regra 3: Especialista → Gerente (mesma área)
  if (personaA.nivel_hierarquico === 'especialista' && 
      personaB.nivel_hierarquico === 'gerencial') {
    return {
      precisa: true,
      tipos: ['notification', 'question'],
      razao: 'Especialista reporta ao gerente',
      prioridade: 'normal',
      frequencia: 'semanal'
    };
  }

  // Regra 4: Áreas interdependentes
  const interdependencias = {
    'Marketing': ['Vendas', 'Produto'],
    'Vendas': ['Marketing', 'Financeiro', 'Customer Success'],
    'Financeiro': ['Vendas', 'Operações'],
    'Operações': ['Produto', 'Financeiro'],
    'Produto': ['Marketing', 'Operações', 'Qualidade'],
    'Qualidade': ['Produto', 'Operações']
  };

  if (personaA.departamento && personaB.departamento) {
    const deps = interdependencias[personaA.departamento] || [];
    if (deps.includes(personaB.departamento)) {
      return {
        precisa: true,
        tipos: ['handoff', 'question'],
        razao: `Áreas interdependentes: ${personaA.departamento} ↔ ${personaB.departamento}`,
        prioridade: 'normal',
        frequencia: 'semanal'
      };
    }
  }

  // Regra 5: Estratégia → todos os gerentes
  if (personaA.role?.toLowerCase().includes('diretor') && 
      personaB.role?.toLowerCase().includes('gerente')) {
    return {
      precisa: true,
      tipos: ['notification'],
      razao: 'Diretor comunica estratégia aos gerentes',
      prioridade: 'high',
      frequencia: 'mensal'
    };
  }

  return null;
}

async function criarComunicacao(personaA, personaB, regra) {
  const comunicacoes = [];

  for (const tipo of regra.tipos) {
    const subject = `${tipo}: ${personaA.role} → ${personaB.role}`;
    const message = regra.razao;

    const { data, error } = await supabase
      .from('personas_communications')
      .insert({
        sender_persona_id: personaA.id,
        receiver_persona_id: personaB.id,
        communication_type: tipo,
        priority: regra.prioridade || 'normal',
        subject: subject,
        message: message,
        context_data: {
          razao: regra.razao,
          frequencia: regra.frequencia,
          generated_by: 'script_06.5_fast',
          generated_at: new Date().toISOString()
        },
        status: 'pending',
        requires_action: ['approval_request', 'question'].includes(tipo)
      })
      .select()
      .single();

    if (!error) {
      comunicacoes.push(data);
    }
  }

  return comunicacoes;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  try {
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

    console.log('3️⃣ Criando comunicações (regras determinísticas)...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let comunicacoesCriadas = 0;
    let paresAnalisados = 0;
    const matriz = [];

    // Analisar cada par
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const personaA = personas[i];
        const personaB = personas[j];
        paresAnalisados++;

        const regra = deveComunicar(personaA, personaB);

        if (regra && regra.precisa) {
          console.log(`✅ ${personaA.persona_code} ↔ ${personaB.persona_code}`);
          console.log(`   ${regra.razao}`);
          console.log(`   Tipos: ${regra.tipos.join(', ')}`);

          const comuns = await criarComunicacao(personaA, personaB, regra);
          comunicacoesCriadas += comuns.length;

          matriz.push({
            persona_a: personaA.persona_code,
            persona_b: personaB.persona_code,
            regra: regra,
            comunicacoes: comuns.length
          });

          console.log(`   💾 ${comuns.length} comunicação(ões) criada(s)\n`);
        }
      }
    }

    // Salvar matriz
    const jsonPath = join(OUTPUT_DIR, `${empresa.codigo}_communication_matrix_fast.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(matriz, null, 2), 'utf-8');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 06.5 FAST CONCLUÍDO!\n');
    console.log(`✅ Pares analisados: ${paresAnalisados}`);
    console.log(`✅ Comunicações criadas: ${comunicacoesCriadas}`);
    console.log(`📄 Relatório: ${jsonPath}\n`);

    console.log('📋 PRÓXIMO PASSO:');
    console.log(`   node 07.5_generate_supervision_chains.js --empresaId=${targetEmpresaId}\n`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
