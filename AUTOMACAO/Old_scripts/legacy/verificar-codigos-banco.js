const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verificarCodigosExistentes() {
  try {
    console.log('🔍 VERIFICANDO CÓDIGOS EXISTENTES NO BANCO\n');
    
    // Verificar códigos das empresas
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, codigo')
      .order('created_at', { ascending: false });

    if (empresasError) {
      console.error('❌ Erro ao consultar empresas:', empresasError);
      return;
    }

    console.log('📊 CÓDIGOS DAS EMPRESAS:');
    empresas?.forEach((empresa, index) => {
      const codigoLength = empresa.codigo ? empresa.codigo.length : 0;
      const status = codigoLength > 10 ? '❌ MUITO LONGO' : '✅ OK';
      
      console.log(`${index + 1}. ${empresa.nome}`);
      console.log(`   Código: "${empresa.codigo}" (${codigoLength} chars) ${status}`);
      console.log(`   ID: ${empresa.id}`);
      console.log('');
    });

    // Verificar se há códigos problemáticos
    const codigosLongos = empresas?.filter(e => e.codigo && e.codigo.length > 10) || [];
    const codigosDuplicados = {};
    empresas?.forEach(e => {
      if (e.codigo) {
        if (codigosDuplicados[e.codigo]) {
          codigosDuplicados[e.codigo].push(e);
        } else {
          codigosDuplicados[e.codigo] = [e];
        }
      }
    });

    const duplicados = Object.values(codigosDuplicados).filter(arr => arr.length > 1);

    console.log('🔍 ANÁLISE DOS CÓDIGOS:');
    console.log(`   Total de empresas: ${empresas?.length || 0}`);
    console.log(`   Códigos muito longos (>10 chars): ${codigosLongos.length}`);
    console.log(`   Códigos duplicados: ${duplicados.length}`);

    if (codigosLongos.length > 0) {
      console.log('\n❌ CÓDIGOS PROBLEMÁTICOS (>10 chars):');
      codigosLongos.forEach(empresa => {
        console.log(`   "${empresa.codigo}" - ${empresa.nome}`);
      });
      console.log('\n💡 AÇÃO NECESSÁRIA: Corrigir códigos longos');
    }

    if (duplicados.length > 0) {
      console.log('\n❌ CÓDIGOS DUPLICADOS:');
      duplicados.forEach(grupo => {
        console.log(`   Código "${grupo[0].codigo}" usado por:`);
        grupo.forEach(empresa => {
          console.log(`     - ${empresa.nome} (${empresa.id})`);
        });
      });
    }

    if (codigosLongos.length === 0 && duplicados.length === 0) {
      console.log('\n✅ TODOS OS CÓDIGOS ESTÃO OK!');
    }

    return { codigosLongos, duplicados };

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function verificarPersonaCodes() {
  try {
    console.log('\n🔍 VERIFICANDO PERSONA_CODES...\n');
    
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, persona_code, full_name, empresa_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao consultar personas:', error);
      return;
    }

    // Verificar duplicatas
    const codigosDuplicados = {};
    personas?.forEach(p => {
      if (p.persona_code) {
        if (codigosDuplicados[p.persona_code]) {
          codigosDuplicados[p.persona_code].push(p);
        } else {
          codigosDuplicados[p.persona_code] = [p];
        }
      }
    });

    const duplicados = Object.values(codigosDuplicados).filter(arr => arr.length > 1);

    console.log('📊 ANÁLISE PERSONA_CODES:');
    console.log(`   Total de personas: ${personas?.length || 0}`);
    console.log(`   Códigos duplicados: ${duplicados.length}`);

    if (duplicados.length > 0) {
      console.log('\n❌ PERSONA_CODES DUPLICADOS:');
      duplicados.slice(0, 5).forEach(grupo => { // Mostrar apenas 5 primeiros
        console.log(`   Código "${grupo[0].persona_code}" usado por:`);
        grupo.forEach(persona => {
          console.log(`     - ${persona.full_name} (empresa: ${persona.empresa_id.substring(0, 8)}...)`);
        });
      });
      
      if (duplicados.length > 5) {
        console.log(`   ... e mais ${duplicados.length - 5} grupos de duplicatas`);
      }
      console.log('\n💡 AÇÃO NECESSÁRIA: Implementar persona_codes únicos');
    } else {
      console.log('\n✅ TODOS OS PERSONA_CODES ESTÃO ÚNICOS!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function main() {
  await verificarCodigosExistentes();
  await verificarPersonaCodes();
}

main();