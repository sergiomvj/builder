#!/usr/bin/env node
/**
 * 🛠️ SCRIPT DE CORREÇÃO - CONSOLIDAR PERSONAS DUPLICADAS
 * =======================================================
 *
 * CORREÇÃO DO BUG: Múltiplas personas com mesmo nome
 *
 * PROBLEMA:
 * - Emily Carter aparece 3x (Designer, RH, Marketing)
 * - Ethan Carter aparece 2x (TI, Dev Junior)
 * - Sistema trata cada combinação nome+cargo como persona separada
 *
 * SOLUÇÃO:
 * - Consolidar personas duplicadas em registros únicos
 * - Migrar atribuições para tabela separada
 * - Preservar biometria e dados existentes
 *
 * RESULTADO ESPERADO:
 * - 9 personas únicas (não 12)
 * - Cada persona com múltiplas atribuições
 * - Dados preservados e consistentes
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const empresaId = 'a2845f62-59e2-48b2-8f89-8bfc6c33193f';

async function analisarDuplicatas() {
  console.log('🔍 ANALISANDO DUPLICATAS...\n');

  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  if (error) {
    throw new Error(`Erro ao buscar personas: ${error.message}`);
  }

  // Agrupar por nome
  const groupedByName = personas.reduce((acc, p) => {
    if (!acc[p.full_name]) acc[p.full_name] = [];
    acc[p.full_name].push(p);
    return acc;
  }, {});

  // Identificar duplicatas
  const duplicates = Object.entries(groupedByName)
    .filter(([name, pers]) => pers.length > 1);

  console.log(`📊 Encontradas ${duplicates.length} personas duplicadas:`);
  duplicates.forEach(([name, pers]) => {
    console.log(`\n🔴 ${name} (${pers.length} duplicatas):`);
    pers.forEach(p => {
      console.log(`  - ${p.role} (ID: ${p.id.substring(0, 8)}...)`);
    });
  });

  return { personas, groupedByName, duplicates };
}

async function criarPersonaUnica(personaGroup) {
  // Usar a primeira persona como base (geralmente a mais completa)
  const basePersona = personaGroup[0];
  const todasAtribuicoes = personaGroup.map(p => p.role);

  console.log(`\n🔄 Consolidando ${personaGroup.length} registros de "${basePersona.full_name}"...`);

  // Criar nova persona única com NOVO ID
  const novaPersona = {
    ...basePersona,
    id: undefined, // Deixar o Supabase gerar novo ID
    persona_code: `ARVA01-POS_CONSOLIDATED_${Date.now()}`, // Novo código único
    email: basePersona.email.replace('@', `_consolidated_${Date.now()}@`), // Email único
    role: todasAtribuicoes.join(', '), // Combinar todos os cargos
    ia_config: {
      ...basePersona.ia_config,
      atribuicoes_multiplas: todasAtribuicoes
    },
    updated_at: new Date().toISOString()
  };

  // Remover campos que podem causar conflito
  delete novaPersona.id;
  delete novaPersona.created_at;

  // Inserir nova persona única
  const { data: insertedPersona, error: insertError } = await supabase
    .from('personas')
    .insert(novaPersona)
    .select()
    .single();

  if (insertError) {
    throw new Error(`Erro ao inserir persona única: ${insertError.message}`);
  }

  console.log(`✅ Criada persona única: ${insertedPersona.full_name} (ID: ${insertedPersona.id.substring(0, 8)}...)`);

  // Migrar atribuições para tabela personas_atribuicoes
  for (const atribuicao of todasAtribuicoes) {
    const { error: attrError } = await supabase
      .from('personas_atribuicoes')
      .insert({
        persona_id: insertedPersona.id,
        atribuicao: atribuicao,
        ordem: todasAtribuicoes.indexOf(atribuicao) + 1,
        created_at: new Date().toISOString()
      });

    if (attrError) {
      console.warn(`⚠️ Erro ao migrar atribuição "${atribuicao}": ${attrError.message}`);
    }
  }

  // Migrar biometria (usar da primeira persona que tiver)
  const personaComBiometria = personaGroup.find(p => p.avatar_image_url);
  if (personaComBiometria) {
    const { error: bioError } = await supabase
      .from('personas_avatares')
      .insert({
        persona_id: insertedPersona.id,
        biometrics: personaComBiometria.system_prompt, // biometria está no system_prompt
        estilo: 'professional',
        ativo: true,
        created_at: new Date().toISOString()
      });

    if (bioError) {
      console.warn(`⚠️ Erro ao migrar biometria: ${bioError.message}`);
    } else {
      console.log(`✅ Biometria migrada`);
    }
  }

  // Coletar IDs das personas antigas para deletar
  const idsParaDeletar = personaGroup.map(p => p.id);

  return { insertedPersona, idsParaDeletar };
}

async function limparDuplicatas(idsParaDeletar) {
  console.log(`\n🗑️ Removendo ${idsParaDeletar.length} registros duplicados...`);

  for (const id of idsParaDeletar) {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`⚠️ Erro ao deletar persona ${id}: ${error.message}`);
    } else {
      console.log(`✅ Removido: ${id.substring(0, 8)}...`);
    }
  }
}

async function main() {
  console.log('🛠️ CORREÇÃO DE PERSONAS DUPLICADAS');
  console.log('='.repeat(50));

  try {
    // 1. Analisar duplicatas
    const { personas, groupedByName, duplicates } = await analisarDuplicatas();

    if (duplicates.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada!');
      return;
    }

    // 2. Processar cada grupo de duplicatas
    const todasIdsParaDeletar = [];

    for (const [nome, personaGroup] of duplicates) {
      const { insertedPersona, idsParaDeletar } = await criarPersonaUnica(personaGroup);
      todasIdsParaDeletar.push(...idsParaDeletar);
    }

    // 3. Limpar registros antigos
    await limparDuplicatas(todasIdsParaDeletar);

    // 4. Verificar resultado
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    const { data: personasFinais, error: finalError } = await supabase
      .from('personas')
      .select('id, full_name, role')
      .eq('empresa_id', empresaId);

    if (finalError) {
      throw new Error(`Erro na verificação final: ${finalError.message}`);
    }

    console.log(`📊 Total de personas após correção: ${personasFinais.length}`);

    // Verificar se ainda há duplicatas
    const nomesFinais = personasFinais.map(p => p.full_name);
    const nomesUnicos = [...new Set(nomesFinais)];

    if (nomesUnicos.length === personasFinais.length) {
      console.log('✅ SUCESSO: Todas as personas agora são únicas!');
    } else {
      console.log('⚠️ Ainda há duplicatas restantes');
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('1. Executar scripts 03-06 novamente para gerar atribuições e avatares');
    console.log('2. Verificar se as imagens são geradas corretamente');
    console.log('3. Testar interface com as novas personas únicas');

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();