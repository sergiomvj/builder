// ============================================================================
// SCRIPT 02B - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS VIA LLM
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 02A (dados básicos gerados)
//
// Este script:
// 1. Busca personas com dados básicos já preenchidos
// 2. Gera BIOGRAFIA ESTRUTURADA com LLM
// 3. Salva apenas em personas_biografias
//
// DEPENDE DE: Script 02A (dados básicos)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🚀 SCRIPT 02B - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS VIA LLM');
console.log('===========================================================');
console.log('🤖 Este script gera APENAS:');
console.log('   - Biografia estruturada completa via LLM');
console.log('   - Salva em personas_biografias');
console.log('===========================================================\n');

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
  console.log('📝 Uso: node 02B_generate_biografias_llm.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Gera biografia estruturada com LLM
 */
async function gerarBiografiaLLM(personaCompleta, empresa) {
  const prompt = `Você é um especialista em criação de personas empresariais realistas.

Crie uma biografia estruturada em JSON para:

DADOS DA PESSOA:
- Nome: ${personaCompleta.full_name}
- Nacionalidade: ${personaCompleta.nacionalidade}
- Gênero: ${personaCompleta.genero}
- Cargo: ${personaCompleta.role}
- Departamento: ${personaCompleta.department}
- Especialidade: ${personaCompleta.specialty}
- Anos de Experiência: ${personaCompleta.experiencia_anos}

DADOS DA EMPRESA:
- Nome: ${empresa.nome}
- Indústria: ${empresa.industria}
- País: ${empresa.pais}
- Descrição: ${empresa.descricao}

INSTRUÇÕES CRÍTICAS:
1. A biografia deve ser ESPECÍFICA para a nacionalidade ${personaCompleta.nacionalidade}
2. Considere o nível de experiência (${personaCompleta.experiencia_anos} anos)
3. Alinhe com o cargo (${personaCompleta.role}) e indústria (${empresa.industria})
4. Use referências culturais apropriadas à nacionalidade

RETORNE APENAS JSON VÁLIDO (sem markdown):

{
  "biografia_completa": "Biografia narrativa de 2-3 parágrafos, específica para a nacionalidade e cargo",
  "historia_profissional": "Trajetória de carreira detalhada",
  "motivacoes": {
    "intrinsecas": ["motivações internas específicas"],
    "extrinsecas": ["motivações externas"],
    "valores_pessoais": ["valores fundamentais"],
    "paixoes": ["áreas de paixão profissional"]
  },
  "desafios": {
    "profissionais": ["desafios específicos do cargo"],
    "pessoais": ["desafios de crescimento pessoal"],
    "tecnologicos": ["desafios técnicos"],
    "interpessoais": ["desafios de relacionamento"]
  },
  "objetivos_pessoais": ["objetivos de desenvolvimento"],
  "soft_skills": {
    "comunicacao": 8,
    "lideranca": 7,
    "trabalho_equipe": 8,
    "resolucao_problemas": 9,
    "criatividade": 7,
    "adaptabilidade": 8,
    "inteligencia_emocional": 7,
    "pensamento_critico": 8
  },
  "hard_skills": {
    "tecnologicas": {"skill1": 9, "skill2": 8},
    "ferramentas": ["ferramenta1", "ferramenta2"],
    "metodologias": ["metodologia1", "metodologia2"],
    "areas_conhecimento": ["área1", "área2"]
  },
  "educacao": {
    "formacao_superior": ["graduação específica"],
    "pos_graduacao": ["MBA ou mestrado"],
    "cursos_complementares": ["cursos relevantes"],
    "instituicoes": ["universidades"]
  },
  "certificacoes": ["certificações profissionais"],
  "idiomas_fluencia": {
    "nativo": ["idioma nativo"],
    "fluente": ["idiomas fluentes"],
    "intermediario": ["idiomas intermediários"],
    "basico": []
  },
  "experiencia_internacional": {
    "paises_trabalhou": ["países"],
    "projetos_globais": ["projetos internacionais"],
    "clientes_internacionais": true,
    "culturas_conhece": ["culturas"]
  },
  "redes_sociais": {
    "linkedin": "linkedin.com/in/${personaCompleta.email.split('@')[0]}",
    "twitter": "",
    "github": "",
    "website_pessoal": "",
    "outros": {}
  }
}`;

  // Tentar Gemini → OpenAI → Grok em cascata
  console.log('  🤖 Gerando biografia via LLM...');

  try {
    const biografiaData = await generateJSONWithFallback(prompt, {
      geminiModel: 'gemini-2.0-flash-exp',
      openaiModel: 'gpt-4',
      grokModel: 'x-ai/grok-4.1-fast:free',
      temperature: 0.8,
      maxTokens: 2500
    });
    return biografiaData;
  } catch (error) {
    console.error('  ❌ Todos os provedores LLM falharam:', error.message);
    return null;
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function generateBiografiasLLM() {
  try {
    // 1. Buscar empresa
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

    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`   Indústria: ${empresa.industria}\n`);

    // 2. Buscar personas com dados básicos preenchidos
    console.log('2️⃣ Buscando personas com dados básicos...\n');

    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError || !personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      process.exit(0);
    }

    // Filtrar personas que têm dados básicos mas não têm biografia
    const personasComDadosBasicos = personas.filter(p =>
      p.full_name &&
      p.email &&
      p.genero &&
      p.experiencia_anos !== null
    );

    if (personasComDadosBasicos.length === 0) {
      console.log('⚠️  Nenhuma persona com dados básicos encontrados');
      console.log('💡 Execute primeiro: node 02A_generate_dados_basicos.js --empresaId=' + empresa.id);
      process.exit(0);
    }

    // Verificar biografias existentes
    const { data: biografiasExistentes } = await supabase
      .from('personas_biografias')
      .select('persona_id');

    const idsComBiografia = new Set(biografiasExistentes?.map(b => b.persona_id) || []);
    const personasSemBiografia = personasComDadosBasicos.filter(p => !idsComBiografia.has(p.id));

    if (personasSemBiografia.length === 0) {
      console.log('✅ Todas as personas já têm biografia!');
      process.exit(0);
    }

    console.log(`📊 ${personasSemBiografia.length} personas prontas para geração de biografia\n`);

    // 3. Processar cada persona
    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < personasSemBiografia.length; i++) {
      const persona = personasSemBiografia[i];
      console.log(`\n[${i + 1}/${personasSemBiografia.length}] Gerando biografia para ${persona.full_name}...`);

      try {
        // 3.1 Gerar biografia com LLM
        const biografiaData = await gerarBiografiaLLM(persona, empresa);

        if (!biografiaData) {
          console.error(`  ❌ Falha ao gerar biografia`);
          erros++;
          continue;
        }

        // 3.2 Salvar biografia em personas_biografias
        const { error: bioError } = await supabase
          .from('personas_biografias')
          .insert({
            persona_id: persona.id,
            biografia_estruturada: biografiaData,
            updated_at: new Date().toISOString()
          });

        if (bioError) {
          console.error(`  ❌ Erro ao salvar biografia: ${bioError.message}`);
          erros++;
          continue;
        }

        console.log(`  ✅ Biografia salva com sucesso!`);
        sucessos++;

        // Pausa entre requisições
        if (i < personasSemBiografia.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`  ❌ Erro ao processar persona: ${error.message}`);
        erros++;
      }
    }

    // 4. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL - BIOGRAFIAS LLM');
    console.log('='.repeat(60));
    console.log(`✅ Biografias geradas: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📈 Taxa de sucesso: ${((sucessos / personasSemBiografia.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 02B CONCLUÍDO COM SUCESSO!');
      console.log('\n📝 PRÓXIMO PASSO:');
      console.log(`   node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=${empresa.id}`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

generateBiografiasLLM();