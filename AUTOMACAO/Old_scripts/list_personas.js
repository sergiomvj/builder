#!/usr/bin/env node
/**
 * 📋 LISTAR PERSONAS DISPONÍVEIS
 * ============================
 * 
 * Script auxiliar para visualizar todas as personas e seus IDs,
 * facilitando a seleção para execução de pipelines específicos.
 * 
 * Uso:
 *   node list_personas.js [--empresaId=UUID]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DEFAULT_EMPRESA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17'; // ARVA

async function listPersonas() {
  // Parse argumentos
  const args = process.argv.slice(2);
  const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
  const empresaId = empresaIdArg ? empresaIdArg.split('=')[1] : DEFAULT_EMPRESA_ID;

  console.log('\n📋 LISTAGEM DE PERSONAS');
  console.log('='.repeat(80));

  // Buscar empresa
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('nome, codigo')
    .eq('id', empresaId)
    .single();

  if (empresaError || !empresa) {
    console.error('❌ Erro ao buscar empresa:', empresaError);
    return;
  }

  console.log(`🏢 Empresa: ${empresa.nome} (${empresa.codigo})`);
  console.log('='.repeat(80) + '\n');

  // Buscar personas
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, role, department, specialty')
    .eq('empresa_id', empresaId)
    .order('department', { ascending: true })
    .order('full_name', { ascending: true });

  if (error || !personas) {
    console.error('❌ Erro ao buscar personas:', error);
    return;
  }

  if (personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada para esta empresa');
    return;
  }

  // Agrupar por departamento
  const byDepartment = personas.reduce((acc, p) => {
    const dept = p.department || 'Outros';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(p);
    return acc;
  }, {});

  console.log(`Total: ${personas.length} personas\n`);

  // Exibir por departamento
  Object.entries(byDepartment).forEach(([dept, list]) => {
    console.log(`\n📁 ${dept.toUpperCase()} (${list.length})`);
    console.log('-'.repeat(80));
    
    list.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.full_name}`);
      console.log(`   Role: ${p.role} | Specialty: ${p.specialty}`);
      console.log(`   ID: ${p.id}`);
      if (idx < list.length - 1) console.log();
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log('💡 EXEMPLOS DE USO DO PIPELINE:');
  console.log('='.repeat(80));
  
  // Pegar 3 personas exemplo
  const examples = personas.slice(0, 3);
  
  console.log('\n1️⃣  Executar pipeline em 1 persona específica:');
  console.log(`   node run_full_pipeline_openai.js --personaIds=${examples[0].id}`);
  
  if (examples.length >= 2) {
    console.log('\n2️⃣  Executar pipeline em múltiplas personas:');
    console.log(`   node run_full_pipeline_openai.js --personaIds=${examples[0].id},${examples[1].id}`);
  }
  
  console.log('\n3️⃣  Executar pipeline por nome (match parcial):');
  console.log(`   node run_full_pipeline_openai.js --names="Sarah,Michael"`);
  
  console.log('\n4️⃣  Executar pipeline em TODAS as personas:');
  console.log(`   node run_full_pipeline_openai.js\n`);
}

listPersonas().catch(console.error);
