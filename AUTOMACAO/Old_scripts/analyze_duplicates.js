// ANÁLISE DE DUPLICATAS - Personas com mesmo nome em empresas diferentes
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 ANÁLISE DE DUPLICATAS DE PERSONAS');
console.log('=====================================\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analisarDuplicatas() {
  try {
    // Buscar TODAS as personas com suas empresas
    console.log('📊 Carregando todas as personas...\n');
    
    const { data: personas, error } = await supabase
      .from('personas')
      .select(`
        id,
        full_name,
        role,
        email,
        empresa_id,
        created_at,
        empresas!inner(id, nome, status)
      `)
      .order('full_name', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar personas:', error);
      throw error;
    }

    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    console.log(`✅ Total de personas encontradas: ${personas.length}\n`);
    console.log('=' .repeat(120));
    console.log('NOME'.padEnd(30) + 'CARGO'.padEnd(30) + 'EMPRESA'.padEnd(40) + 'STATUS');
    console.log('=' .repeat(120));

    // Agrupar por nome para detectar duplicatas
    const personasPorNome = new Map();
    
    personas.forEach(persona => {
      const nome = persona.full_name;
      if (!personasPorNome.has(nome)) {
        personasPorNome.set(nome, []);
      }
      personasPorNome.get(nome).push(persona);
    });

    // Listar todas as personas
    let duplicatasEncontradas = 0;
    let totalDuplicatas = 0;
    
    personas.forEach(persona => {
      const empresaNome = persona.empresas?.nome || 'SEM EMPRESA';
      const status = persona.empresas?.status || 'N/A';
      
      // Verificar se é duplicata
      const ocorrencias = personasPorNome.get(persona.full_name);
      const isDuplicata = ocorrencias && ocorrencias.length > 1;
      
      const marcador = isDuplicata ? '🔴 DUPLICADO' : '';
      
      console.log(
        persona.full_name.padEnd(30) +
        persona.role.padEnd(30) +
        empresaNome.padEnd(40) +
        status.padEnd(10) +
        marcador
      );
    });

    console.log('=' .repeat(120));
    console.log('');

    // Relatório de duplicatas
    console.log('\n📋 RELATÓRIO DE DUPLICATAS');
    console.log('=' .repeat(120));
    
    const duplicatas = Array.from(personasPorNome.entries())
      .filter(([nome, lista]) => lista.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicatas.length === 0) {
      console.log('✅ Nenhuma duplicata encontrada! Todos os nomes são únicos.');
    } else {
      console.log(`🚨 ENCONTRADAS ${duplicatas.length} PERSONAS COM NOMES DUPLICADOS:\n`);
      
      duplicatas.forEach(([nome, lista]) => {
        totalDuplicatas += lista.length;
        console.log(`\n🔴 "${nome}" (${lista.length} ocorrências):`);
        lista.forEach((persona, index) => {
          const empresaNome = persona.empresas?.nome || 'SEM EMPRESA';
          console.log(`   ${index + 1}. ${persona.role.padEnd(30)} | ${empresaNome.padEnd(35)} | ID: ${persona.id.substring(0, 8)}...`);
        });
      });
    }

    console.log('\n' + '=' .repeat(120));
    console.log('📊 ESTATÍSTICAS FINAIS');
    console.log('=' .repeat(120));
    console.log(`Total de personas:           ${personas.length}`);
    console.log(`Nomes únicos:                ${personasPorNome.size}`);
    console.log(`Nomes duplicados:            ${duplicatas.length}`);
    console.log(`Total de duplicatas:         ${totalDuplicatas - duplicatas.length} (personas extras)`);
    console.log(`Taxa de duplicação:          ${((totalDuplicatas / personas.length) * 100).toFixed(1)}%`);
    console.log('=' .repeat(120));

    // Análise por empresa
    console.log('\n📊 ANÁLISE POR EMPRESA');
    console.log('=' .repeat(120));
    
    const empresasMap = new Map();
    personas.forEach(persona => {
      const empresaId = persona.empresa_id;
      const empresaNome = persona.empresas?.nome || 'SEM EMPRESA';
      
      if (!empresasMap.has(empresaId)) {
        empresasMap.set(empresaId, {
          nome: empresaNome,
          personas: [],
          duplicatasInternas: 0
        });
      }
      empresasMap.get(empresaId).personas.push(persona);
    });

    // Verificar duplicatas internas em cada empresa
    empresasMap.forEach((info, empresaId) => {
      const nomes = new Set();
      info.personas.forEach(p => {
        if (nomes.has(p.full_name)) {
          info.duplicatasInternas++;
        }
        nomes.add(p.full_name);
      });
    });

    Array.from(empresasMap.values())
      .sort((a, b) => b.personas.length - a.personas.length)
      .forEach(info => {
        console.log(`\n🏢 ${info.nome}`);
        console.log(`   Personas: ${info.personas.length}`);
        console.log(`   Nomes únicos: ${new Set(info.personas.map(p => p.full_name)).size}`);
        if (info.duplicatasInternas > 0) {
          console.log(`   🚨 Duplicatas DENTRO da mesma empresa: ${info.duplicatasInternas}`);
        }
      });

    console.log('\n' + '=' .repeat(120));

    // Análise de padrões
    console.log('\n🔍 ANÁLISE DE PADRÕES');
    console.log('=' .repeat(120));

    // Verificar se personas duplicadas têm o mesmo cargo
    let mesmoCargoCount = 0;
    let cargosDiferentes = [];

    duplicatas.forEach(([nome, lista]) => {
      const cargos = new Set(lista.map(p => p.role));
      if (cargos.size === 1) {
        mesmoCargoCount++;
      } else {
        cargosDiferentes.push({
          nome,
          cargos: Array.from(cargos)
        });
      }
    });

    console.log(`\n📌 Duplicatas com MESMO cargo: ${mesmoCargoCount}/${duplicatas.length}`);
    console.log(`📌 Duplicatas com cargos DIFERENTES: ${cargosDiferentes.length}/${duplicatas.length}`);

    if (cargosDiferentes.length > 0) {
      console.log('\n🔄 Personas com nome duplicado mas cargos diferentes:');
      cargosDiferentes.forEach(({ nome, cargos }) => {
        console.log(`   • ${nome}: ${cargos.join(' | ')}`);
      });
    }

    console.log('\n' + '=' .repeat(120));
    console.log('💡 RECOMENDAÇÕES');
    console.log('=' .repeat(120));
    
    if (duplicatas.length > 0) {
      console.log(`
🚨 PROBLEMA IDENTIFICADO: ${duplicatas.length} nomes duplicados entre empresas

📋 CAUSAS POSSÍVEIS:
   1. Script de criação usa mesma base de nomes para todas as empresas
   2. Não há verificação de unicidade global de nomes
   3. Geração aleatória sem controle de duplicatas entre empresas

🔧 SOLUÇÕES RECOMENDADAS:
   1. IMEDIATA: Adicionar sufixo único por empresa (ex: "John Smith - ARVA")
   2. CURTO PRAZO: Verificar duplicatas antes de inserir
   3. LONGO PRAZO: Sistema de geração de nomes que garante unicidade global
   
⚠️  IMPACTO:
   - Confusão na interface (múltiplas "Ana Silva" em diferentes empresas)
   - Problemas em relatórios consolidados
   - Dificuldade em identificar personas específicas
   - Possíveis bugs em queries que assumem unicidade
      `);
    } else {
      console.log('\n✅ Nenhum problema de duplicatas! Sistema funcionando corretamente.');
    }

    console.log('=' .repeat(120));

  } catch (error) {
    console.error('\n❌ ERRO:', error);
    process.exit(1);
  }
}

analisarDuplicatas();
