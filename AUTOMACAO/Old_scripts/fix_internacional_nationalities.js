#!/usr/bin/env node
/**
 * 🔧 SCRIPT DE CORREÇÃO - Nacionalidades "Internacional"
 * ====================================================
 * 
 * Corrige personas com nacionalidade genérica "Internacional" para
 * nacionalidades específicas baseadas no país da empresa.
 * 
 * Uso:
 *   node fix_internacional_nationalities.js [--empresaId=UUID] [--apply]
 * 
 * Flags:
 *   --empresaId=UUID : Processar apenas empresa específica
 *   --apply         : Aplicar mudanças (sem isso, apenas mostra preview)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env.local') });

// Credenciais Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente Supabase não configuradas');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeamento de nacionalidades por país
const NACIONALIDADES_POR_PAIS = {
  'BR': ['Brasileira', 'Portuguesa', 'Italiana', 'Alemã'],
  'Brasil': ['Brasileira', 'Portuguesa', 'Italiana', 'Alemã'],
  'US': ['Americana', 'Mexicana', 'Canadense'],
  'United States': ['Americana', 'Mexicana', 'Canadense'],
  'CA': ['Canadense', 'Francesa', 'Inglesa'],
  'Canada': ['Canadense', 'Francesa', 'Inglesa'],
  'MX': ['Mexicana', 'Americana', 'Espanhola'],
  'Mexico': ['Mexicana', 'Americana', 'Espanhola'],
  'GB': ['Inglesa', 'Escocesa', 'Galesa', 'Irlandesa'],
  'United Kingdom': ['Inglesa', 'Escocesa', 'Galesa', 'Irlandesa'],
  'DE': ['Alemã', 'Turca'],
  'Germany': ['Alemã', 'Turca'],
  'FR': ['Francesa', 'Magrebina'],
  'France': ['Francesa', 'Magrebina'],
  'IT': ['Italiana', 'Romena'],
  'Italy': ['Italiana', 'Romena'],
  'ES': ['Espanhola', 'Latino-Americana'],
  'Spain': ['Espanhola', 'Latino-Americana'],
  'AR': ['Argentina'],
  'Argentina': ['Argentina'],
  'CN': ['Chinesa'],
  'China': ['Chinesa'],
  'JP': ['Japonesa'],
  'Japan': ['Japonesa'],
  'KR': ['Sul-coreana'],
  'South Korea': ['Sul-coreana'],
  'RU': ['Russa'],
  'Russia': ['Russa'],
  'IN': ['Indiana'],
  'India': ['Indiana']
};

function getNacionalidadeParaPais(pais) {
  if (!pais) return 'Internacional';
  
  // Tentar match exato primeiro
  let nacs = NACIONALIDADES_POR_PAIS[pais];
  
  // Se não encontrou, tentar normalizar (maiúscula, minúscula, etc)
  if (!nacs) {
    const paisUpper = pais.toUpperCase();
    nacs = NACIONALIDADES_POR_PAIS[paisUpper];
  }
  
  // Se ainda não encontrou, tentar match parcial
  if (!nacs) {
    const paisLower = pais.toLowerCase();
    if (paisLower.includes('brasil') || paisLower.includes('brazil')) {
      nacs = NACIONALIDADES_POR_PAIS['BR'];
    } else if (paisLower.includes('estados unidos') || paisLower.includes('united states') || paisLower.includes('america')) {
      nacs = NACIONALIDADES_POR_PAIS['US'];
    } else if (paisLower.includes('canada')) {
      nacs = NACIONALIDADES_POR_PAIS['CA'];
    } else if (paisLower.includes('mexico') || paisLower.includes('méxico')) {
      nacs = NACIONALIDADES_POR_PAIS['MX'];
    } else if (paisLower.includes('reino unido') || paisLower.includes('united kingdom') || paisLower.includes('england') || paisLower.includes('inglaterra')) {
      nacs = NACIONALIDADES_POR_PAIS['GB'];
    } else if (paisLower.includes('alemanha') || paisLower.includes('germany')) {
      nacs = NACIONALIDADES_POR_PAIS['DE'];
    } else if (paisLower.includes('frança') || paisLower.includes('france')) {
      nacs = NACIONALIDADES_POR_PAIS['FR'];
    } else if (paisLower.includes('itália') || paisLower.includes('italy')) {
      nacs = NACIONALIDADES_POR_PAIS['IT'];
    } else if (paisLower.includes('espanha') || paisLower.includes('spain')) {
      nacs = NACIONALIDADES_POR_PAIS['ES'];
    } else if (paisLower.includes('argentina')) {
      nacs = NACIONALIDADES_POR_PAIS['AR'];
    } else if (paisLower.includes('china')) {
      nacs = NACIONALIDADES_POR_PAIS['CN'];
    } else if (paisLower.includes('japão') || paisLower.includes('japan')) {
      nacs = NACIONALIDADES_POR_PAIS['JP'];
    } else if (paisLower.includes('coreia') || paisLower.includes('korea')) {
      nacs = NACIONALIDADES_POR_PAIS['KR'];
    } else if (paisLower.includes('rússia') || paisLower.includes('russia')) {
      nacs = NACIONALIDADES_POR_PAIS['RU'];
    } else if (paisLower.includes('índia') || paisLower.includes('india')) {
      nacs = NACIONALIDADES_POR_PAIS['IN'];
    }
  }
  
  return nacs?.[0] || 'Internacional'; // Primeira nacionalidade da lista ou fallback
}

async function fixInternacionalNationalities() {
  try {
    console.log('🔍 CORREÇÃO DE NACIONALIDADES "INTERNACIONAL"\n');
    console.log('='.repeat(60));

    // Parse argumentos
    const args = process.argv.slice(2);
    const applyChanges = args.includes('--apply');
    const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
    const targetEmpresaId = empresaIdArg?.split('=')[1];

    if (targetEmpresaId) {
      console.log(`🎯 Empresa alvo: ${targetEmpresaId}`);
    } else {
      console.log('🌐 Processando TODAS as empresas');
    }

    if (!applyChanges) {
      console.log('⚠️  MODO PREVIEW - Use --apply para salvar alterações\n');
    } else {
      console.log('✅ MODO APLICAÇÃO - Alterações serão salvas\n');
    }

    // 1. Buscar empresas
    let empresasQuery = supabase
      .from('empresas')
      .select('id, nome, pais, codigo')
      .eq('status', 'ativa');

    if (targetEmpresaId) {
      empresasQuery = empresasQuery.eq('id', targetEmpresaId);
    }

    const { data: empresas, error: empresasError } = await empresasQuery;

    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return;
    }

    if (!empresas || empresas.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada');
      return;
    }

    console.log(`📊 ${empresas.length} empresa(s) encontrada(s)\n`);

    let totalCorrigidas = 0;
    let totalPersonasProcessadas = 0;

    // 2. Processar cada empresa
    for (const empresa of empresas) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 ${empresa.nome} (${empresa.codigo})`);
      console.log(`   País: ${empresa.pais}`);
      console.log(`${'='.repeat(60)}\n`);

      // Buscar personas com nacionalidade "Internacional"
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('id, full_name, personalidade')
        .eq('empresa_id', empresa.id);

      if (personasError) {
        console.error(`❌ Erro ao buscar personas da empresa ${empresa.nome}:`, personasError);
        continue;
      }

      if (!personas || personas.length === 0) {
        console.log('   ⚠️  Nenhuma persona encontrada nesta empresa');
        continue;
      }

      // Filtrar personas com nacionalidade "Internacional"
      const personasInternacional = personas.filter(p => {
        const nacionalidade = p.personalidade?.nacionalidade;
        return nacionalidade === 'Internacional' || 
               nacionalidade === 'internacional' ||
               nacionalidade?.toLowerCase().includes('internacion');
      });

      if (personasInternacional.length === 0) {
        console.log(`   ✅ Todas as ${personas.length} personas já têm nacionalidade específica`);
        continue;
      }

      console.log(`   🔍 Encontradas ${personasInternacional.length} persona(s) com "Internacional"`);
      
      const novaNacionalidade = getNacionalidadeParaPais(empresa.pais);
      console.log(`   🔄 Nova nacionalidade: ${novaNacionalidade}\n`);

      // Processar cada persona
      for (const persona of personasInternacional) {
        totalPersonasProcessadas++;
        
        console.log(`   📝 ${persona.full_name}`);
        console.log(`      Antiga: ${persona.personalidade?.nacionalidade || 'N/A'}`);
        console.log(`      Nova:   ${novaNacionalidade}`);

        if (applyChanges) {
          // Atualizar nacionalidade no objeto personalidade
          const personalidadeAtualizada = {
            ...persona.personalidade,
            nacionalidade: novaNacionalidade
          };

          const { error: updateError } = await supabase
            .from('personas')
            .update({
              personalidade: personalidadeAtualizada,
              updated_at: new Date().toISOString()
            })
            .eq('id', persona.id);

          if (updateError) {
            console.log(`      ❌ Erro ao atualizar: ${updateError.message}`);
          } else {
            console.log(`      ✅ Atualizada com sucesso`);
            totalCorrigidas++;
          }
        } else {
          console.log(`      ⏭️  (preview - use --apply para salvar)`);
        }
      }
    }

    // Resumo final
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 RESUMO DA CORREÇÃO');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total de empresas processadas: ${empresas.length}`);
    console.log(`Total de personas encontradas: ${totalPersonasProcessadas}`);
    
    if (applyChanges) {
      console.log(`✅ Personas corrigidas: ${totalCorrigidas}`);
      if (totalCorrigidas !== totalPersonasProcessadas) {
        console.log(`❌ Erros: ${totalPersonasProcessadas - totalCorrigidas}`);
      }
    } else {
      console.log(`\n⚠️  MODO PREVIEW - ${totalPersonasProcessadas} persona(s) serão corrigidas`);
      console.log(`\n💡 Execute com --apply para aplicar as alterações:`);
      if (targetEmpresaId) {
        console.log(`   node fix_internacional_nationalities.js --empresaId=${targetEmpresaId} --apply`);
      } else {
        console.log(`   node fix_internacional_nationalities.js --apply`);
      }
    }

    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
fixInternacionalNationalities();
