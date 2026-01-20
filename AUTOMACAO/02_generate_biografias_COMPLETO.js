// ============================================================================
// SCRIPT 02 - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS + DADOS BÁSICOS
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 01 (placeholders criados)
// 
// Este script:
// 1. Gera NOMES REAIS baseados na nacionalidade
// 2. Gera EMAILS com domínio da empresa
// 3. Calcula EXPERIÊNCIA (anos) baseada no cargo
// 4. Gera BIOGRAFIA ESTRUTURADA com LLM
// 5. Salva tudo em personas e personas_biografias
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import dotenv from 'dotenv';
import { 
  gerarDistribuicaoNacionalidades, 
  atribuirNacionalidades, 
  gerarIdiomasEmpresa, 
  gerarRelatoriodiversidade, 
  validarDiversidade 
} from './lib/diversity_manager.js';
import { setupConsoleEncoding } from './lib/console_fix.js';

dotenv.config({ path: '../.env.local' });

// Corrigir encoding UTF-8 no Windows PowerShell
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🚀 SCRIPT 02 - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS');
console.log('==================================================');
console.log('⚠️  IMPORTANTE: Este script também preenche:');
console.log('   - Nome real baseado na nacionalidade');
console.log('   - Email com domínio da empresa');
console.log('   - Experiência (anos) baseada no cargo');
console.log('   - Gênero (masculino/feminino)');
console.log('🔧 TEMPERATURA LLM: 0.95 (alta variação)');
console.log('🔍 VALIDAÇÃO: Nomes únicos (até 3 tentativas)');
console.log('==================================================\n');

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
  console.log('📝 Uso: node 02_generate_biografias_COMPLETO.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Remove acentos e caracteres especiais para criar slugs
 */
function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function generateBiografiasCompletas() {
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
    console.log(`   Indústria: ${empresa.industria}`);
    console.log(`   Domínio: ${empresa.dominio || empresa.codigo + '.com'}\n`);
    
    // 2. Buscar placeholders (personas sem biografia)
    console.log('2️⃣ Buscando personas sem biografia...\n');
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);
    
    if (personasError || !personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      process.exit(0);
    }
    
    // Filtrar personas que ainda não têm biografia
    const { data: biografiasExistentes } = await supabase
      .from('personas_biografias')
      .select('persona_id');
    
    const idsComBiografia = new Set(biografiasExistentes?.map(b => b.persona_id) || []);
    const personasSemBiografia = personas.filter(p => !idsComBiografia.has(p.id));
    
    if (personasSemBiografia.length === 0) {
      console.log('✅ Todas as personas já têm biografia!');
      process.exit(0);
    }
    
    console.log(`📊 ${personasSemBiografia.length} personas sem biografia encontradas\n`);
    
    // 2.5 DIVERSIDADE AUTOMÁTICA - Distribuir nacionalidades
    console.log('🌍 Gerando distribuição de nacionalidades...\n');
    const distribuicao = gerarDistribuicaoNacionalidades(personasSemBiografia.length);
    const personasComNacionalidade = atribuirNacionalidades(personasSemBiografia, distribuicao);
    
    // Exibir relatório de diversidade
    console.log(gerarRelatoriodiversidade(distribuicao, personasSemBiografia.length));
    
    // Validar diversidade
    const validacao = validarDiversidade(distribuicao, personasSemBiografia.length);
    if (!validacao.valido) {
      console.error('❌ Distribuição de diversidade inválida:');
      validacao.erros.forEach(erro => console.error(`   - ${erro}`));
      process.exit(1);
    }
    
    console.log('✅ Distribuição validada com sucesso!\n');
    
    // 3. Processar cada persona
    let sucessos = 0;
    let erros = 0;
    // Limpar domínio (remover https:// ou http://)
    let dominio = empresa.dominio || `${empresa.codigo.toLowerCase()}.com`;
    dominio = dominio.replace('https://', '').replace('http://', '').replace(/\/+$/, '');
    
    // Obter idiomas da empresa
    const idiomasEmpresa = empresa.idiomas || gerarIdiomasEmpresa();
    
    for (let i = 0; i < personasComNacionalidade.length; i++) {
      const persona = personasComNacionalidade[i];
      const nacionalidade = persona.nacionalidade || 'Brasileiro';
      
      console.log(`\n[${i + 1}/${personasComNacionalidade.length}] Processando ${persona.role}...`);
      console.log(`  🌍 Nacionalidade: ${nacionalidade}`);
      console.log(`  🗣️ Idiomas da empresa: ${idiomasEmpresa.join(', ')}`);
      
      try {
        // 3.2 Gerar dados completos via LLM com nacionalidade específica
        const prompt = `INSTRUÇÕES IMPORTANTES:
Retorne APENAS JSON válido, sem markdown, sem comentários.
Comece diretamente com { e termine com }

Você é um especialista em criação de personas empresariais realistas e ÚNICAS.

CONTEXTO DA EMPRESA (CRÍTICO PARA UNICIDADE):
- ID Único da Empresa: ${empresa.id}
- Nome: ${empresa.nome}
- Indústria: ${empresa.industria}
- País: ${empresa.pais}
- Código: ${empresa.codigo}
- Descrição: ${empresa.descricao || 'Empresa no setor de ' + empresa.industria}

IMPORTANTE: Esta é uma empresa ESPECÍFICA com ID ${empresa.id}. 
OS NOMES GERADOS DEVEM SER ÚNICOS PARA ESTA EMPRESA e NÃO REPETIR nomes de outras empresas.

DADOS DA POSIÇÃO:
- Cargo: ${persona.role}
- Departamento: ${persona.department}
- Especialidade: ${persona.specialty}
- Nacionalidade ESPECÍFICA: ${nacionalidade}

INSTRUÇÕES CRÍTICAS PARA UNICIDADE:
1. Gere um NOME REAL COMPLETAMENTE ORIGINAL e ÚNICO para esta empresa ${empresa.nome} (ID: ${empresa.id})
2. NÃO use nomes comuns ou genéricos - crie variações únicas baseadas na nacionalidade ${nacionalidade}
3. Considere o contexto cultural da empresa ${empresa.pais} e indústria ${empresa.industria}
4. O nome deve ser apropriado para alguém trabalhando em ${empresa.industria} em ${empresa.pais}
5. Defina o GÊNERO (masculino/feminino) baseado no nome gerado
6. Calcule EXPERIÊNCIA (anos) apropriada para o cargo:
   - CEO/CTO/CFO: 10-15 anos
   - Diretor/VP: 7-12 anos
   - Manager/Senior: 5-10 anos
   - Pleno/Specialist: 3-7 anos
   - Junior/Assistant: 1-4 anos

EXEMPLOS DE NOMES ÚNICOS POR NACIONALIDADE:
- Americano: Ethan Caldwell, Nolan Whitaker, Sebastian Thornton, Julian Harrington, Nolan Prescott
- Brasileiro: Thiago Montenegro, Rafael Albuquerque, Gustavo Figueiredo, Leonardo Montenegro, Pedro Albuquerque
- Europeu: Lukas Zimmermann, Nikolai Petrov, Sven Larsen, Klaus Zimmermann, Nikolai Larsen

RETORNE JSON VÁLIDO:
{
  "full_name": "Nome completo único e original para empresa ${empresa.nome}",
  "genero": "masculino" ou "feminino",
  "experiencia_anos": número entre 1-15,
  "biografia_estruturada": {
    "biografia_completa": "Biografia narrativa de 2-3 parágrafos considerando nacionalidade ${nacionalidade} e cargo ${persona.role}",
    "historia_profissional": "Trajetória de carreira detalhada",
    "motivacoes": {
      "intrinsecas": ["motivações internas"],
      "extrinsecas": ["motivações externas"],
      "valores_pessoais": ["valores fundamentais"],
      "paixoes": ["áreas de paixão"]
    },
    "desafios": {
      "profissionais": ["desafios do cargo"],
      "pessoais": ["desafios pessoais"],
      "tecnologicos": ["desafios técnicos"],
      "interpessoais": ["desafios interpessoais"]
    },
    "objetivos_pessoais": ["objetivos de desenvolvimento"],
    "soft_skills": {
      "comunicacao": 1-10,
      "lideranca": 1-10,
      "trabalho_equipe": 1-10,
      "resolucao_problemas": 1-10,
      "criatividade": 1-10,
      "adaptabilidade": 1-10,
      "inteligencia_emocional": 1-10,
      "pensamento_critico": 1-10
    },
    "hard_skills": {
      "tecnologicas": {"skill": 1-10},
      "ferramentas": ["lista de ferramentas"],
      "metodologias": ["metodologias usadas"],
      "areas_conhecimento": ["áreas de especialização"]
    },
    "educacao": {
      "formacao_superior": ["graduação"],
      "pos_graduacao": ["MBA/mestrado"],
      "cursos_complementares": ["cursos"],
      "instituicoes": ["universidades apropriadas para ${nacionalidade}"]
    },
    "certificacoes": ["certificações profissionais"],
    "idiomas_fluencia": {
      "nativo": ["idioma nativo de ${nacionalidade}"],
      "fluente": ["idiomas fluentes"],
      "intermediario": ["idiomas intermediários"],
      "basico": []
    },
    "experiencia_internacional": {
      "paises_trabalhou": ["países"],
      "projetos_globais": ["projetos"],
      "clientes_internacionais": true/false,
      "culturas_conhece": ["culturas"]
    },
    "redes_sociais": {
      "linkedin": "url",
      "twitter": "",
      "github": "",
      "website_pessoal": "",
      "outros": {}
    }
  }
}`;

        let llmData;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            llmData = await generateJSONWithFallback(prompt, { temperature: 0.95, maxTokens: 2500 });
            
            // Verificar se nome já existe (evitar duplicatas)
            if (llmData && llmData.full_name) {
              const { data: existing } = await supabase
                .from('personas')
                .select('id')
                .eq('full_name', llmData.full_name)
                .neq('id', persona.id)
                .maybeSingle();
              
              if (existing) {
                console.log(`  ⚠️  Nome "${llmData.full_name}" já existe, gerando novo... (tentativa ${retries + 1}/${maxRetries})`);
                retries++;
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }
            
            break; // Nome único encontrado
          } catch (error) {
            console.error(`  ❌ Falha ao gerar dados via LLM: ${error.message}`);
            retries++;
            if (retries >= maxRetries) {
              erros++;
              continue;
            }
          }
        }
        
        if (retries >= maxRetries) {
          console.error('  ❌ Máximo de tentativas atingido');
          erros++;
          continue;
        }

        // Validar dados essenciais (nacionalidade não precisa pois já vem do Script 01)
        if (!llmData || !llmData.full_name || !llmData.genero || !llmData.experiencia_anos || !llmData.biografia_estruturada) {
          console.error('  ❌ Dados incompletos retornados pela LLM');
          console.error(`     Recebido: ${JSON.stringify(Object.keys(llmData || {}))}`);
          erros++;
          continue;
        }
        
        console.log(`  ✅ Nome: ${llmData.full_name}`);
        console.log(`  👤 Gênero: ${llmData.genero}`);
        console.log(`  📅 Experiência: ${llmData.experiencia_anos} anos`);

        // 3.3 Gerar email padronizado após receber nome da LLM
        const nomes = llmData.full_name.split(' ');
        const primeiroNome = slugify(nomes[0]);
        const ultimoNome = slugify(nomes[nomes.length - 1]);
        let email = `${primeiroNome}.${ultimoNome}@${dominio}`;
        
        // Verificar unicidade do email
        let counter = 1;
        while (counter < 100) {
          const { data: existing } = await supabase
            .from('personas')
            .select('id')
            .eq('email', email)
            .neq('id', persona.id)
            .maybeSingle();
          
          if (!existing) break;
          
          email = `${primeiroNome}.${ultimoNome}${counter}@${dominio}`;
          counter++;
        }
        
        if (counter >= 100) {
          email = `${primeiroNome}.${ultimoNome}.${Date.now()}@${dominio}`;
        }
        
        console.log(`  📧 Email: ${email}`);

        // Atualizar persona com dados da LLM (preservar nacionalidade do Script 01)
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            full_name: llmData.full_name,
            email: email,
            genero: llmData.genero,
            experiencia_anos: llmData.experiencia_anos
            // nacionalidade já foi definida no Script 01 (não sobrescrever)
          })
          .eq('id', persona.id);

        if (updateError) {
          console.error(`  ❌ Erro ao atualizar persona: ${updateError.message}`);
          erros++;
          continue;
        }

        // Salvar biografia estruturada
        const { error: bioError } = await supabase
          .from('personas_biografias')
          .upsert({
            persona_id: persona.id,
            biografia_estruturada: llmData.biografia_estruturada,
            updated_at: new Date().toISOString()
          }, { onConflict: 'persona_id' });

        if (bioError) {
          console.error(`  ❌ Erro ao salvar biografia: ${bioError.message}`);
          erros++;
          continue;
        }

        console.log(`  ✅ Dados completos e biografia salvos!`);
        sucessos++;

        // Pausa entre requisições
        if (i < personasComNacionalidade.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`  ❌ Erro ao processar persona: ${error.message}`);
        erros++;
      }
    }
    
    // 4. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL');
    console.log('='.repeat(60));
    console.log(`✅ Biografias geradas: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📈 Taxa de sucesso: ${((sucessos / personasComNacionalidade.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 02 CONCLUÍDO COM SUCESSO!');
      console.log('\n📝 PRÓXIMO PASSO:');
      console.log(`   node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=${empresa.id}`);
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

generateBiografiasCompletas();
