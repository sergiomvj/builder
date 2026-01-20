/**
 * ✅ CRIAR EMPRESA ARVA - VERSÃO MÍNIMA QUE FUNCIONA
 * 
 * Usa apenas os campos que SABEMOS que existem
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ID FIXO para ARVA Tech Solutions
const ARVA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';

async function createArvaMinimal() {
  console.log('\n✅ Criando ARVA Tech Solutions - Versão Mínima\n');
  
  // Primeiro, tentar inserir com MÍNIMO necessário
  const minimalData = {
    id: ARVA_ID,
    codigo: 'ARVA-001',
    nome: 'ARVA Tech Solutions'
  };
  
  console.log('📋 Dados mínimos:');
  console.log(JSON.stringify(minimalData, null, 2));
  console.log('');
  
  const { data, error } = await supabase
    .from('empresas')
    .insert([minimalData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
  
  console.log('✅ SUCESSO! Empresa criada!');
  console.log('\n📊 Dados retornados:');
  console.log(JSON.stringify(data, null, 2));
  
  console.log(`\n✅ ID da empresa: ${data.id}`);
  console.log(`✅ Use este ID em todos os scripts!\n`);
  
  return data;
}

createArvaMinimal().catch(console.error);
