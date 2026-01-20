#!/usr/bin/env node
/**
 * 🎯 DESCOBRIR E POPULAR PERSONAS_ATRIBUICOES CORRETAMENTE
 * =======================================================
 * 
 * Vamos descobrir o schema exato da tabela e popular com dados corretos
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 DESCOBRIR SCHEMA E POPULAR ATRIBUIÇÕES');
console.log('=========================================');

async function popularAtribuicoes() {
  try {
    const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
    
    console.log('\n1. Buscando todas as personas...');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId);

    if (personasError) {
      throw new Error(`Erro ao buscar personas: ${personasError.message}`);
    }

    console.log(`✅ ${personas.length} personas encontradas`);

    console.log('\n2. Testando inserção com campos básicos + departamento...');
    
    const primeiraPersona = personas[0];
    console.log(`🧪 Testando com: ${primeiraPersona.full_name}`);

    // Tentar inserção básica com departamento
    const { error: testError } = await supabase
      .from('personas_atribuicoes')
      .insert({
        persona_id: primeiraPersona.id,
        empresa_id: empresaId,
        departamento: primeiraPersona.department || primeiraPersona.role,
        cargo: primeiraPersona.role,
        responsabilidades: ['Teste de responsabilidade'],
        created_at: new Date().toISOString()
      });

    if (testError) {
      console.log('❌ Erro no teste:', testError.message);
      
      // Tentar ainda mais básico
      const { error: testError2 } = await supabase
        .from('personas_atribuicoes')
        .insert({
          persona_id: primeiraPersona.id,
          empresa_id: empresaId,
          departamento: primeiraPersona.department || 'Geral'
        });

      if (testError2) {
        console.log('❌ Erro até no básico:', testError2.message);
        return;
      } else {
        console.log('✅ Inserção básica funcionou!');
      }
    } else {
      console.log('✅ Inserção com responsabilidades funcionou!');
    }

    console.log('\n3. Criando atribuições para todas as personas...');
    
    // Limpar teste anterior
    await supabase
      .from('personas_atribuicoes')
      .delete()
      .eq('persona_id', primeiraPersona.id);

    let sucessos = 0;

    for (const persona of personas) {
      const { error } = await supabase
        .from('personas_atribuicoes')
        .insert({
          persona_id: persona.id,
          empresa_id: empresaId,
          departamento: persona.department || 'Geral',
          cargo: persona.role,
          responsabilidades: [
            `Executar funções de ${persona.role}`,
            `Colaborar com equipe de ${persona.department || 'Geral'}`,
            `Participar de projetos da empresa`,
            `Reportar progresso regularmente`,
            `Manter qualidade e prazos`
          ]
        });

      if (error) {
        console.log(`    ❌ ${persona.full_name}: ${error.message}`);
      } else {
        console.log(`    ✅ ${persona.full_name} (${persona.role})`);
        sucessos++;
      }
    }

    console.log(`\n🎉 RESULTADO: ${sucessos}/${personas.length} atribuições criadas`);

    // Verificar resultado
    const { data: final } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .eq('empresa_id', empresaId);

    console.log(`📊 Total de registros na tabela: ${final?.length || 0}`);
    
    if (final && final.length > 0) {
      console.log('\n📋 Exemplo de atribuição criada:');
      console.log(JSON.stringify(final[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

popularAtribuicoes();