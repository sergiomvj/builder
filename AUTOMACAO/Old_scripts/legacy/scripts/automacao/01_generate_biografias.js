// SCRIPT 01 - GERAÇÃO DE BIOGRAFIAS ESTRUTURADAS (PRIMEIRA ETAPA)
// Usa dados básicos das personas + LLM para criar biografias completas
// DEVE SER EXECUTADO PRIMEIRO - Base para todos os outros scripts

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Configuração
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração LLMs
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🚀 SCRIPT 01 - BIOGRAFIAS ESTRUTURADAS (ETAPA 1/6)');
console.log('================================================');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    break;
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (targetEmpresaId) {
  console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
} else {
  console.log('⚠️ Nenhuma empresa específica - processará primeira empresa ativa');
}

async function generateBiografiaForPersona(persona, empresa) {
  try {
    console.log(`  🤖 Gerando biografia estruturada para: ${persona.full_name}`);
    
    // Prompt para gerar JSON estruturado
    const prompt = `
Você é um especialista em criação de personas empresariais. Crie uma biografia estruturada em JSON para:

DADOS DA PESSOA:
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Especialidade: ${persona.specialty}
- Departamento: ${persona.department}
- Anos de Experiência: ${persona.experiencia_anos}

DADOS DA EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.industria || empresa.industry}
- País: ${empresa.pais}

RETORNE APENAS JSON VÁLIDO com esta estrutura:

{
  "biografia_completa": "Biografia detalhada de 2-3 parágrafos sobre trajetória profissional",
  "historia_profissional": "História da carreira profissional e marcos importantes",
  "motivacoes": {
    "intrinsecas": ["lista de 3-4 motivações internas"],
    "extrinsecas": ["lista de 3-4 motivações externas"],
    "valores_pessoais": ["lista de 4-5 valores fundamentais"],
    "paixoes": ["lista de 3-4 paixões profissionais"]
  },
  "desafios": {
    "profissionais": ["3-4 desafios específicos do cargo"],
    "pessoais": ["2-3 desafios pessoais"],
    "tecnologicos": ["2-3 desafios técnicos da área"],
    "interpessoais": ["2-3 desafios de relacionamento"]
  },
  "objetivos_pessoais": ["lista de 4-5 objetivos de carreira"],
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
    "tecnologicas": {"JavaScript": 9, "Python": 8, "React": 9},
    "ferramentas": ["Visual Studio Code", "Git", "Docker"],
    "metodologias": ["Agile", "Scrum", "DevOps"],
    "areas_conhecimento": ["Desenvolvimento Web", "Arquitetura de Software"]
  },
  "educacao": {
    "formacao_superior": ["Bacharelado em Ciência da Computação"],
    "pos_graduacao": ["MBA em Gestão de TI"],
    "cursos_complementares": ["Certificação AWS", "Curso de Liderança"],
    "instituicoes": ["Universidade Federal", "FGV"]
  },
  "certificacoes": ["AWS Solutions Architect", "Scrum Master"],
  "idiomas_fluencia": {
    "nativo": ["Português"],
    "fluente": ["Inglês"],
    "intermediario": ["Espanhol"],
    "basico": []
  },
  "experiencia_internacional": {
    "paises_trabalhou": ["Brasil", "EUA"],
    "projetos_globais": ["Sistema multinacional", "App global"],
    "clientes_internacionais": true,
    "culturas_conhece": ["Brasileira", "Americana", "Europeia"]
  },
  "redes_sociais": {
    "linkedin": "linkedin.com/in/firstname-lastname",
    "twitter": "@firstname",
    "github": "github.com/firstname",
    "website_pessoal": "firstname.dev",
    "outros": {"Medium": "@firstname"}
  }
}

IMPORTANTE: 
- Base as informações no cargo e experiência fornecidos
- Use números realistas para skills (1-10)
- Seja específico nas tecnologias e ferramentas
- Retorne APENAS o JSON, sem markdown ou explicações
`;

    let biografiaData = null;

    // Tentar Google AI primeiro
    try {
      const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      
      // Limpar possível markdown e extrair JSON
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      
      biografiaData = JSON.parse(jsonMatch[0]);
      console.log('    ✅ Biografia gerada com Google AI');

    } catch (googleError) {
      console.log('    ⚠️ Google AI falhou, tentando OpenAI...');
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2000,
        });
        const rawText = completion.choices[0].message.content;
        
        // Limpar possível markdown e extrair JSON
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        
        biografiaData = JSON.parse(jsonMatch[0]);
        console.log('    ✅ Biografia gerada com OpenAI');

      } catch (openaiError) {
        console.log('    ❌ Ambos LLMs falharam, usando fallback estruturado');
        
        // Fallback estruturado baseado nos dados reais
        biografiaData = {
          biografia_completa: `${persona.full_name} é ${persona.role} na ${empresa.nome}, trazendo ${persona.experiencia_anos} anos de experiência em ${persona.specialty}. Profissional dedicado com foco em resultados e inovação contínua.`,
          historia_profissional: `Carreira sólida de ${persona.experiencia_anos} anos em ${persona.specialty}, com passagens por empresas de diferentes portes e participação em projetos desafiadores.`,
          motivacoes: {
            intrinsecas: ["Crescimento profissional", "Inovação tecnológica", "Aprendizado contínuo"],
            extrinsecas: ["Reconhecimento profissional", "Sucesso da empresa", "Impacto no mercado"],
            valores_pessoais: ["Integridade", "Excelência", "Colaboração", "Transparência"],
            paixoes: ["Tecnologia", "Liderança", "Solução de problemas"]
          },
          desafios: {
            profissionais: ["Escalabilidade de sistemas", "Liderança de equipes", "Inovação constante"],
            pessoais: ["Work-life balance", "Desenvolvimento pessoal"],
            tecnologicos: ["Novas tecnologias", "Arquitetura complexa"],
            interpessoais: ["Comunicação eficaz", "Gestão de conflitos"]
          },
          objetivos_pessoais: ["Expandir conhecimento técnico", "Liderar projetos inovadores", "Desenvolver pessoas", "Crescimento na carreira"],
          soft_skills: {
            comunicacao: 7,
            lideranca: 7,
            trabalho_equipe: 8,
            resolucao_problemas: 8,
            criatividade: 6,
            adaptabilidade: 7,
            inteligencia_emocional: 7,
            pensamento_critico: 8
          },
          hard_skills: {
            tecnologicas: { [persona.specialty]: 8, "JavaScript": 7, "Python": 6 },
            ferramentas: ["VS Code", "Git", "Docker", "AWS"],
            metodologias: ["Agile", "Scrum", "DevOps"],
            areas_conhecimento: [persona.specialty, "Gestão de projetos"]
          },
          educacao: {
            formacao_superior: ["Bacharelado em área relacionada"],
            pos_graduacao: ["MBA ou especialização"],
            cursos_complementares: ["Cursos técnicos", "Certificações"],
            instituicoes: ["Universidade renomada", "Instituto de tecnologia"]
          },
          certificacoes: [`Certificação em ${persona.specialty}`, "Certificação em gestão"],
          idiomas_fluencia: {
            nativo: ["Português"],
            fluente: ["Inglês"],
            intermediario: [],
            basico: []
          },
          experiencia_internacional: {
            paises_trabalhou: ["Brasil"],
            projetos_globais: [],
            clientes_internacionais: false,
            culturas_conhece: ["Brasileira"]
          },
          redes_sociais: {
            linkedin: `linkedin.com/in/${persona.full_name.toLowerCase().replace(/\s+/g, '-')}`,
            twitter: "",
            github: "",
            website_pessoal: "",
            outros: {}
          }
        };
      }
    }

    return biografiaData;
    
  } catch (error) {
    console.error(`    ❌ Erro na geração da biografia para ${persona.full_name}:`, error.message);
    return null;
  }
}

async function saveBiografiaToSupabase(persona, biografiaData) {
  try {
    // Preparar dados para inserção na tabela personas
    const updateData = {
      biografia_completa: biografiaData.biografia_completa,
      historia_profissional: biografiaData.historia_profissional,
      motivacoes: JSON.stringify(biografiaData.motivacoes),
      desafios: JSON.stringify(biografiaData.desafios),
      objetivos_pessoais: JSON.stringify(biografiaData.objetivos_pessoais),
      soft_skills: JSON.stringify(biografiaData.soft_skills),
      hard_skills: JSON.stringify(biografiaData.hard_skills),
      educacao: JSON.stringify(biografiaData.educacao),
      certificacoes: JSON.stringify(biografiaData.certificacoes),
      idiomas_fluencia: JSON.stringify(biografiaData.idiomas_fluencia),
      experiencia_internacional: JSON.stringify(biografiaData.experiencia_internacional),
      redes_sociais: JSON.stringify(biografiaData.redes_sociais),
      updated_at: new Date().toISOString()
    };
    
    // Atualizar persona com biografia
    const { error } = await supabase
      .from('personas')
      .update(updateData)
      .eq('id', persona.id);
      
    if (error) {
      console.error(`    ❌ Erro ao salvar biografia para ${persona.full_name}:`, error.message);
      return false;
    }
    
    console.log(`    ✅ Biografia salva para: ${persona.full_name}`);
    return true;
    
  } catch (error) {
    console.error(`    ❌ Erro ao salvar biografia para ${persona.full_name}:`, error.message);
    return false;
  }
}

async function generateBiografias() {
  try {
    // 1. Buscar empresa
    let empresa;
    
    if (targetEmpresaId) {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', targetEmpresaId)
        .single();
      
      if (error) throw new Error(`Empresa não encontrada: ${error.message}`);
      empresa = data;
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .gt('total_personas', 0)
        .order('total_personas', { ascending: false })
        .limit(1);
      
      if (error || !data.length) throw new Error('Nenhuma empresa ativa encontrada');
      empresa = data[0];
    }

    console.log(`\n🏢 Processando empresa: ${empresa.nome}`);
    
    // 2. Marcar script como em execução
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          biografias: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Buscar personas da empresa sem biografia
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .eq('status', 'active')
      .or('biografia_completa.is.null,biografia_completa.eq.""');

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!personas.length) {
      console.log('\n✅ Todas as personas já possuem biografias completas!');
      
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            biografias: {
              running: false,
              last_result: 'completed',
              last_run: new Date().toISOString()
            }
          }
        })
        .eq('id', empresa.id);
        
      return;
    }

    console.log(`\n🤖 Gerando biografias estruturadas para ${personas.length} personas...`);

    // 4. Criar diretório de output
    const outputDir = path.join(process.cwd(), 'output', 'biografias', empresa.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 5. Gerar biografias
    let sucessos = 0;
    let erros = 0;

    for (const persona of personas) {
      const biografiaData = await generateBiografiaForPersona(persona, empresa);
      
      if (biografiaData) {
        const salvou = await saveBiografiaToSupabase(persona, biografiaData);
        
        if (salvou) {
          // Salvar backup local
          const filename = `biografia_${persona.full_name.replace(/\s+/g, '_').toLowerCase()}.json`;
          fs.writeFileSync(
            path.join(outputDir, filename),
            JSON.stringify({
              persona: {
                id: persona.id,
                nome: persona.full_name,
                cargo: persona.role,
                empresa: empresa.nome
              },
              biografia: biografiaData,
              generated_at: new Date().toISOString()
            }, null, 2),
            'utf8'
          );
          
          sucessos++;
        } else {
          erros++;
        }
      } else {
        erros++;
      }
      
      // Pausa entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 6. Atualizar status da empresa
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          biografias: {
            running: false,
            last_result: erros > 0 ? 'partial_success' : 'success',
            last_run: new Date().toISOString(),
            total_generated: sucessos
          }
        }
      })
      .eq('id', empresa.id);

    // 7. Relatório final
    console.log('\n📊 RELATÓRIO DE BIOGRAFIAS');
    console.log('==========================');
    console.log(`✅ Biografias geradas com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na geração: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personas.length) * 100).toFixed(1)}%`);
    console.log(`🗃️ Dados salvos na tabela: personas`);

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 01 - BIOGRAFIAS CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 01:', error);
    process.exit(1);
  }
}

generateBiografias();