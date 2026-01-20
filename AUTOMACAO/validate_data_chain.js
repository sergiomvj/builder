// SCRIPT DE VALIDAÇÃO - VERIFICAR INTEGRIDADE DA CADEIA DE DADOS
// Executa checagem completa antes de gerar cenas de trabalho

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VALIDAÇÃO DA CADEIA DE DADOS');
console.log('=====================================\n');

async function validateDataChain(empresaId) {
  const issues = [];
  const warnings = [];
  let isValid = true;

  try {
    // 1. Verificar empresa existe
    console.log('📋 1. Verificando empresa...');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome, total_personas, status')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      issues.push('❌ Empresa não encontrada');
      isValid = false;
      return { isValid, issues, warnings };
    }

    console.log(`   ✅ Empresa encontrada: ${empresa.nome}`);
    console.log(`   📊 Total esperado de personas: ${empresa.total_personas}`);

    // 2. Verificar personas existem
    console.log('\n📋 2. Verificando personas...');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, role, system_prompt, created_at')
      .eq('empresa_id', empresaId);

    if (personasError) {
      issues.push(`❌ Erro ao buscar personas: ${personasError.message}`);
      isValid = false;
      return { isValid, issues, warnings };
    }

    const totalPersonas = personas?.length || 0;
    console.log(`   ✅ Personas encontradas: ${totalPersonas}/${empresa.total_personas}`);

    if (totalPersonas === 0) {
      issues.push('❌ CRÍTICO: Nenhuma persona criada');
      isValid = false;
      return { isValid, issues, warnings };
    }

    if (totalPersonas < empresa.total_personas) {
      warnings.push(`⚠️  Apenas ${totalPersonas}/${empresa.total_personas} personas criadas`);
    }

    // 3. Verificar system_prompts
    console.log('\n📋 3. Verificando System Prompts...');
    const personasComPrompt = personas.filter(p => p.system_prompt);
    const personasSemPrompt = personas.filter(p => !p.system_prompt);

    console.log(`   ✅ Com System Prompt: ${personasComPrompt.length}/${totalPersonas}`);
    
    if (personasSemPrompt.length > 0) {
      console.log(`   ⚠️  SEM System Prompt: ${personasSemPrompt.length}`);
      personasSemPrompt.forEach(p => {
        warnings.push(`   → ${p.full_name} (${p.role})`);
      });
      warnings.push('\n   💡 Execute: node 00_generate_avatares.js --empresaId=' + empresaId);
    }

    if (personasComPrompt.length === 0) {
      issues.push('❌ CRÍTICO: Nenhuma persona tem System Prompt');
      isValid = false;
      return { isValid, issues, warnings };
    }

    // 4. Validar estrutura JSON dos system_prompts
    console.log('\n📋 4. Validando estrutura JSON dos System Prompts...');
    let validPrompts = 0;
    let invalidPrompts = 0;
    const brokenPersonas = [];

    for (const persona of personasComPrompt) {
      try {
        const sp = JSON.parse(persona.system_prompt);
        
        // Verificar campos obrigatórios
        const requiredFields = [
          'descricao_fisica_completa',
          'metadata_geracao'
        ];

        const missingFields = requiredFields.filter(field => !sp[field]);
        
        if (missingFields.length > 0) {
          invalidPrompts++;
          brokenPersonas.push({
            name: persona.full_name,
            role: persona.role,
            missing: missingFields
          });
          warnings.push(`⚠️  ${persona.full_name}: Faltam campos ${missingFields.join(', ')}`);
        } else {
          // Verificar 15 parâmetros essenciais
          const desc = sp.descricao_fisica_completa;
          const essentialParams = [
            'tom_pele', 'formato_rosto', 'olhos', 'nariz', 'boca_labios',
            'expressao_tipica', 'cabelo', 'tipo_fisico', 'altura_aproximada',
            'postura_tipica', 'marcas_unicas', 'acessorios_permanentes',
            'estilo_roupa_padrao', 'estilo_renderizacao'
          ];

          const missingParams = essentialParams.filter(param => {
            if (param === 'olhos' || param === 'cabelo') {
              return !desc[param] || typeof desc[param] !== 'object';
            }
            return !desc[param];
          });

          if (missingParams.length > 0) {
            warnings.push(`⚠️  ${persona.full_name}: Parâmetros incompletos ${missingParams.join(', ')}`);
          }

          validPrompts++;
        }
      } catch (e) {
        invalidPrompts++;
        brokenPersonas.push({
          name: persona.full_name,
          role: persona.role,
          error: 'JSON inválido'
        });
        issues.push(`❌ ${persona.full_name}: JSON corrompido ou inválido`);
      }
    }

    console.log(`   ✅ System Prompts válidos: ${validPrompts}/${personasComPrompt.length}`);
    
    if (invalidPrompts > 0) {
      console.log(`   ❌ System Prompts inválidos: ${invalidPrompts}`);
      warnings.push('\n   💡 Regere avatares para personas com problemas');
    }

    // 5. Verificar avatares_personas
    console.log('\n📋 5. Verificando tabela avatares_personas...');
    const { data: avatares, error: avataresError } = await supabase
      .from('avatares_personas')
      .select('persona_id, avatar_url, biometrics')
      .eq('ativo', true)
      .in('persona_id', personas.map(p => p.id));

    if (avataresError) {
      warnings.push(`⚠️  Erro ao buscar avatares: ${avataresError.message}`);
    } else {
      console.log(`   ✅ Avatares encontrados: ${avatares?.length || 0}/${totalPersonas}`);
      
      if ((avatares?.length || 0) < totalPersonas) {
        warnings.push(`⚠️  Alguns avatares não foram gerados`);
      }
      
      // NOVO: Verificar duplicatas
      const personaIdCount = {};
      avatares?.forEach(avatar => {
        personaIdCount[avatar.persona_id] = (personaIdCount[avatar.persona_id] || 0) + 1;
      });
      
      const duplicatas = Object.entries(personaIdCount).filter(([id, count]) => count > 1);
      if (duplicatas.length > 0) {
        issues.push(`🚨 DUPLICATAS EM avatares_personas: ${duplicatas.length} personas com múltiplos avatares`);
        console.log(`   ❌ Duplicatas detectadas:`);
        duplicatas.forEach(([personaId, count]) => {
          const persona = personas.find(p => p.id === personaId);
          console.log(`      • ${persona?.full_name || personaId}: ${count} avatares`);
        });
        console.log(`\n   💡 SOLUÇÃO: node 00_generate_avatares.js --empresaId=${empresaId} --force`);
        isValid = false;
      }
    }
    
    // 5.5. Verificar duplicatas em atribuições
    console.log('\n📋 5.5. Verificando duplicatas em atribuições...');
    const { data: atribuicoes, error: atribuicoesError } = await supabase
      .from('personas_atribuicoes')
      .select('persona_id, titulo')
      .in('persona_id', personas.map(p => p.id));

    if (atribuicoesError) {
      warnings.push(`⚠️  Erro ao buscar atribuições: ${atribuicoesError.message}`);
    } else {
      const atribuicoesPorPersona = {};
      atribuicoes?.forEach(atr => {
        atribuicoesPorPersona[atr.persona_id] = (atribuicoesPorPersona[atr.persona_id] || 0) + 1;
      });
      
      const excessivas = Object.entries(atribuicoesPorPersona).filter(([id, count]) => count > 30);
      if (excessivas.length > 0) {
        issues.push(`🚨 POSSÍVEIS DUPLICATAS em personas_atribuicoes: ${excessivas.length} personas com 30+ atribuições`);
        console.log(`   ❌ Atribuições excessivas detectadas:`);
        excessivas.forEach(([personaId, count]) => {
          const persona = personas.find(p => p.id === personaId);
          console.log(`      • ${persona?.full_name || personaId}: ${count} atribuições`);
        });
        console.log(`\n   💡 SOLUÇÃO: node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=${empresaId} --force`);
        warnings.push(`⚠️  Atribuições duplicadas podem ter sido criadas por múltiplas execuções`);
      } else {
        console.log(`   ✅ Atribuições: ${atribuicoes?.length || 0} total (média: ${Math.round((atribuicoes?.length || 0) / totalPersonas)} por persona)`);
      }
    }

    // 6. Simular carga de cenários
    console.log('\n📋 6. Simulando carga de cenários...');
    const testScenarios = [
      { roles: ['CEO', 'CFO', 'CTO'] },
      { roles: ['CTO', 'Engenheiro de Software', 'Designer UX/UI'] },
      { roles: ['Designer UX/UI', 'Marketing Manager', 'Product Manager'] }
    ];

    for (const scenario of testScenarios) {
      const foundRoles = scenario.roles.map(role => {
        const found = personasComPrompt.find(p => 
          p.role.includes(role) || role.includes(p.role)
        );
        return { role, found: !!found };
      });

      const missingRoles = foundRoles.filter(r => !r.found);
      if (missingRoles.length > 0) {
        warnings.push(`⚠️  Cenário incompleto: faltam ${missingRoles.map(r => r.role).join(', ')}`);
      }
    }

    console.log(`   ✅ Simulação de cenários concluída`);

    // 7. Verificar dependências técnicas
    console.log('\n📋 7. Verificando dependências...');
    
    if (!supabaseUrl || !supabaseKey) {
      issues.push('❌ Variáveis de ambiente do Supabase não configuradas');
      isValid = false;
    } else {
      console.log('   ✅ Supabase configurado');
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      warnings.push('⚠️  GOOGLE_AI_API_KEY não configurada (necessária para gerar novos avatares)');
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA VALIDAÇÃO');
    console.log('='.repeat(60));
    
    console.log(`\n✅ DADOS VÁLIDOS:`);
    console.log(`   • Empresa: ${empresa.nome}`);
    console.log(`   • Personas: ${totalPersonas}`);
    console.log(`   • Com System Prompt: ${personasComPrompt.length}`);
    console.log(`   • System Prompts válidos: ${validPrompts}`);
    console.log(`   • Avatares: ${avatares?.length || 0}`);

    if (warnings.length > 0) {
      console.log(`\n⚠️  AVISOS (${warnings.length}):`);
      warnings.forEach(w => console.log(`   ${w}`));
    }

    if (issues.length > 0) {
      console.log(`\n❌ PROBLEMAS CRÍTICOS (${issues.length}):`);
      issues.forEach(i => console.log(`   ${i}`));
      isValid = false;
    }

    console.log('\n' + '='.repeat(60));

    if (isValid) {
      console.log('✅ VALIDAÇÃO APROVADA - Pronto para gerar cenas de trabalho');
      console.log('\n💡 Próximo passo:');
      console.log(`   node 06_generate_workplace_scenes.js --empresaId=${empresaId}`);
    } else {
      console.log('❌ VALIDAÇÃO REPROVADA - Corrija os problemas antes de continuar');
    }

    console.log('='.repeat(60) + '\n');

    return { isValid, issues, warnings, stats: {
      totalPersonas,
      personasComPrompt: personasComPrompt.length,
      validPrompts,
      invalidPrompts,
      avatares: avatares?.length || 0
    }};

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    return { isValid: false, issues: [error.message], warnings };
  }
}

// Executar validação
async function main() {
  let targetEmpresaId = null;
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) {
      targetEmpresaId = arg.split('=')[1];
      break;
    }
  }

  if (!targetEmpresaId && args.length > 0) {
    targetEmpresaId = args[0];
  }

  if (!targetEmpresaId) {
    console.log('⚠️  Uso: node validate_data_chain.js --empresaId=<ID>');
    console.log('⚠️  Ou: node validate_data_chain.js <ID>\n');
    
    // Buscar primeira empresa ativa
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome')
      .eq('status', 'ativa')
      .limit(1);
    
    if (empresas && empresas.length > 0) {
      targetEmpresaId = empresas[0].id;
      console.log(`✅ Usando primeira empresa ativa: ${empresas[0].nome}\n`);
    } else {
      console.error('❌ Nenhuma empresa ativa encontrada');
      process.exit(1);
    }
  }

  const result = await validateDataChain(targetEmpresaId);
  
  // Exit code para automação
  process.exit(result.isValid ? 0 : 1);
}

main();
