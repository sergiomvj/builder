// Script rápido para verificar se Script 00 foi executado
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = process.argv[2] || '27470d32-9cce-4975-9a62-1d76f3ab77a4';

console.log('\n🔍 VERIFICANDO DADOS DO SCRIPT 00\n');
console.log(`Empresa ID: ${empresaId}\n`);

async function verificar() {
  // 1. Missão
  const { data: missao } = await supabase
    .from('empresas_missao')
    .select('*')
    .eq('empresa_id', empresaId)
    .maybeSingle();
  
  console.log(`✅ Missão Operacional: ${missao ? 'SIM' : '❌ NÃO'}`);
  if (missao) {
    console.log(`   "${missao.missao_operacional?.substring(0, 80)}..."`);
  }
  
  // 2. Objetivos
  const { data: objetivos } = await supabase
    .from('empresas_objetivos_estrategicos')
    .select('count')
    .eq('empresa_id', empresaId);
  
  console.log(`\n✅ Objetivos Estratégicos: ${objetivos?.[0]?.count || 0}`);
  
  // 3. OKRs
  const { data: okrs } = await supabase
    .from('empresas_okrs')
    .select('count')
    .eq('empresa_id', empresaId);
  
  console.log(`✅ OKRs: ${okrs?.[0]?.count || 0}`);
  
  // 4. Blocos Funcionais
  const { data: blocos } = await supabase
    .from('empresas_blocos_funcionais')
    .select('*')
    .eq('empresa_id', empresaId);
  
  console.log(`✅ Blocos Funcionais: ${blocos?.length || 0}`);
  if (blocos && blocos.length > 0) {
    blocos.forEach((b, i) => {
      console.log(`   ${i+1}. ${b.nome}`);
    });
  }
  
  // 5. Value Stream
  const { data: vs } = await supabase
    .from('empresas_value_stream')
    .select('count')
    .eq('empresa_id', empresaId);
  
  console.log(`\n✅ Cadeia de Valor: ${vs?.[0]?.count || 0} estágios`);
  
  // 6. Governança
  const { data: gov } = await supabase
    .from('empresas_governanca')
    .select('count')
    .eq('empresa_id', empresaId);
  
  console.log(`✅ Governança: ${gov?.[0]?.count || 0} regras\n`);
  
  // Conclusão
  const temDados = missao && blocos && blocos.length > 0;
  
  if (temDados) {
    console.log('🎉 Script 00 foi executado com sucesso!');
    console.log('✅ Pode executar o Script 01 V5.0\n');
  } else {
    console.log('⚠️  Script 00 NÃO foi executado ou dados não foram salvos.');
    console.log('📝 Execute: node 00_generate_company_foundation.js\n');
  }
}

verificar().catch(console.error);
