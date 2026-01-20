#!/usr/bin/env node
/**
 * 🎯 SCRIPT 02 - ANÁLISE DE COMPETÊNCIAS (SEGUNDA ETAPA)
 * ======================================================
 * 
 * Análise automática de competências técnicas e comportamentais das personas
 * baseada nas biografias estruturadas criadas no Script 01.
 * REQUER: Script 01 (Biografias) executado com sucesso
 * 
 * Funcionalidades:
 * - Leitura de personas do Supabase com biografias estruturadas
 * - Análise LLM para extração de competências específicas
 * - Mapeamento de ferramentas e tecnologias por especialidade
 * - Geração de relatórios detalhados de competências
 * - Preparação para geração de avatares (Script 03)
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('🎯 SCRIPT 02 - ANÁLISE DE COMPETÊNCIAS (ETAPA 2/6)');
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

// Templates de competências por especialidade
const competenciasPorEspecialidade = {
  hr: {
    tecnicas: [
      "Gestão de Talentos",
      "Recrutamento e Seleção", 
      "Desenvolvimento Organizacional",
      "Gestão de Performance",
      "Políticas de RH",
      "Employee Experience",
      "People Analytics"
    ],
    comportamentais: [
      "Liderança Empática",
      "Comunicação Assertiva", 
      "Mediação de Conflitos",
      "Pensamento Estratégico",
      "Orientação a Pessoas",
      "Adaptabilidade Cultural"
    ],
    ferramentas: [
      "HRIS Systems",
      "ATS Platforms",
      "Performance Management Tools",
      "Learning Management Systems",
      "Survey Tools"
    ]
  },
  tecnologia: {
    tecnicas: [
      "Desenvolvimento de Software",
      "Arquitetura de Sistemas",
      "DevOps e CI/CD",
      "Cloud Computing",
      "Segurança da Informação",
      "Análise de Dados",
      "Machine Learning"
    ],
    comportamentais: [
      "Resolução de Problemas",
      "Pensamento Analítico",
      "Inovação",
      "Trabalho em Equipe",
      "Adaptabilidade Tecnológica",
      "Orientação a Detalhes"
    ],
    ferramentas: [
      "Git", "Docker", "Kubernetes",
      "AWS/Azure/GCP",
      "JavaScript/Python/Java",
      "React/Angular/Vue",
      "SQL/NoSQL"
    ]
  },
  marketing: {
    tecnicas: [
      "Marketing Digital",
      "Gestão de Campanhas",
      "Análise de Métricas",
      "SEO/SEM",
      "Content Marketing",
      "Social Media",
      "Marketing Analytics"
    ],
    comportamentais: [
      "Criatividade",
      "Visão Estratégica",
      "Orientação a Resultados",
      "Comunicação Persuasiva",
      "Adaptabilidade de Mercado",
      "Foco no Cliente"
    ],
    ferramentas: [
      "Google Analytics",
      "Google Ads",
      "Facebook Business",
      "HubSpot",
      "Mailchimp",
      "Canva",
      "Hootsuite"
    ]
  },
  financeiro: {
    tecnicas: [
      "Análise Financeira",
      "Contabilidade Gerencial",
      "Orçamentos e Forecasting",
      "Gestão de Riscos",
      "Compliance Financeiro",
      "Auditoria",
      "Análise de Investimentos"
    ],
    comportamentais: [
      "Pensamento Analítico",
      "Precisão",
      "Tomada de Decisão",
      "Visão Estratégica",
      "Integridade",
      "Orientação a Detalhes"
    ],
    ferramentas: [
      "Excel Avançado",
      "Power BI",
      "SAP",
      "ERP Systems",
      "SQL",
      "Python/R",
      "Bloomberg Terminal"
    ]
  }
};

async function generateCompetenciasForPersona(persona, empresa) {
  try {
    console.log(`  🔍 Analisando competências de: ${persona.full_name}`);
    
    // Preparar dados da persona para análise
    const personaData = {
      nome: persona.full_name,
      cargo: persona.role,
      departamento: persona.department,
      especialidade: persona.specialty,
      biografia: persona.biografia_completa,
      experiencia: persona.experiencia_anos,
      soft_skills: persona.soft_skills ? JSON.parse(persona.soft_skills) : {},
      hard_skills: persona.hard_skills ? JSON.parse(persona.hard_skills) : {},
      educacao: persona.educacao ? JSON.parse(persona.educacao) : {}
    };

    // Obter template base por especialidade
    const especialidadeKey = getEspecialidadeKey(persona.specialty, persona.department);
    const templateBase = competenciasPorEspecialidade[especialidadeKey] || competenciasPorEspecialidade.tecnologia;

    // Prompt para análise LLM de competências
    const prompt = `
Analise o perfil profissional abaixo e gere uma análise detalhada de competências:

DADOS DA PERSONA:
${JSON.stringify(personaData, null, 2)}

TEMPLATE BASE (para referência):
${JSON.stringify(templateBase, null, 2)}

RESPONDA SOMENTE COM JSON VÁLIDO no seguinte formato:

{
  "competencias_tecnicas": {
    "principais": ["lista de 5-7 competências técnicas principais"],
    "secundarias": ["lista de 3-5 competências técnicas secundárias"],
    "nivel_proficiencia": {
      "competencia1": 9,
      "competencia2": 8,
      "competencia3": 7
    }
  },
  "competencias_comportamentais": {
    "principais": ["lista de 5-7 competências comportamentais"],
    "secundarias": ["lista de 3-5 competências comportamentais"],
    "nivel_desenvolvimento": {
      "comportamental1": 8,
      "comportamental2": 9,
      "comportamental3": 7
    }
  },
  "ferramentas_tecnologias": {
    "especialista": ["ferramentas que domina completamente"],
    "intermediario": ["ferramentas que usa regularmente"],
    "basico": ["ferramentas que conhece"],
    "categoria": "${especialidadeKey}"
  },
  "areas_expertise": {
    "primaria": "${persona.specialty}",
    "secundarias": ["áreas relacionadas"],
    "emergentes": ["áreas em desenvolvimento"]
  },
  "potencial_desenvolvimento": {
    "curto_prazo": ["competências para próximos 6 meses"],
    "medio_prazo": ["competências para próximo ano"],
    "longo_prazo": ["competências estratégicas 2+ anos"]
  },
  "pontos_fortes": ["lista de principais pontos fortes"],
  "areas_melhoria": ["áreas com potencial de melhoria"],
  "compatibilidade_cargo": {
    "atual": 85,
    "otimo_para": ["cargos ideais"],
    "pode_atuar_em": ["cargos possíveis"]
  }
}

REGRAS IMPORTANTES:
1. Base a análise nos dados reais fornecidos (biografia, skills, educação)
2. Use números realistas para proficiência (1-10) e compatibilidade (1-100)
3. Seja específico nas competências (evite generalidades)
4. Considere o nível de experiência (${persona.experiencia_anos} anos)
5. Mantenha coerência entre competências técnicas e comportamentais
6. Responda APENAS com JSON válido, sem texto adicional
`;

    let competenciasData;
    
    // Tentar Google AI primeiro
    try {
      const model = googleAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse do JSON retornado
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      competenciasData = JSON.parse(jsonMatch[0]);
      console.log('    ✅ Competências analisadas com Google AI');

    } catch (googleError) {
      console.log('    ⚠️ Google AI falhou, tentando OpenAI...');
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
        });
        const rawText = completion.choices[0].message.content;
        
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        competenciasData = JSON.parse(jsonMatch[0]);
        console.log('    ✅ Competências analisadas com OpenAI');

      } catch (openaiError) {
        console.log('    ❌ Ambos LLMs falharam, usando análise estruturada');
        
        // Fallback baseado em dados estruturados
        competenciasData = {
          competencias_tecnicas: {
            principais: templateBase.tecnicas.slice(0, 5),
            secundarias: templateBase.tecnicas.slice(5),
            nivel_proficiencia: {}
          },
          competencias_comportamentais: {
            principais: templateBase.comportamentais.slice(0, 5),
            secundarias: templateBase.comportamentais.slice(5),
            nivel_desenvolvimento: {}
          },
          ferramentas_tecnologias: {
            especialista: templateBase.ferramentas.slice(0, 3),
            intermediario: templateBase.ferramentas.slice(3, 6),
            basico: templateBase.ferramentas.slice(6),
            categoria: especialidadeKey
          },
          areas_expertise: {
            primaria: persona.specialty,
            secundarias: [persona.department],
            emergentes: ["Novas tecnologias"]
          },
          potencial_desenvolvimento: {
            curto_prazo: ["Aperfeiçoamento técnico"],
            medio_prazo: ["Liderança"],
            longo_prazo: ["Visão estratégica"]
          },
          pontos_fortes: ["Experiência sólida", "Conhecimento técnico"],
          areas_melhoria: ["Soft skills", "Novas tecnologias"],
          compatibilidade_cargo: {
            atual: 80,
            otimo_para: [persona.role],
            pode_atuar_em: [persona.department]
          }
        };
      }
    }

    return competenciasData;

  } catch (error) {
    console.error(`    ❌ Erro ao analisar competências de ${persona.full_name}:`, error.message);
    return null;
  }
}

function getEspecialidadeKey(specialty, department) {
  const spec = (specialty || '').toLowerCase();
  const dept = (department || '').toLowerCase();
  
  if (spec.includes('hr') || spec.includes('recursos humanos') || dept.includes('hr')) {
    return 'hr';
  }
  if (spec.includes('marketing') || dept.includes('marketing')) {
    return 'marketing';
  }
  if (spec.includes('financ') || spec.includes('contab') || dept.includes('financ')) {
    return 'financeiro';
  }
  if (spec.includes('tech') || spec.includes('tecnolog') || spec.includes('dev') || 
      spec.includes('engineer') || dept.includes('tecnologia') || dept.includes('ti')) {
    return 'tecnologia';
  }
  
  return 'tecnologia'; // default
}

async function saveCompetenciasToSupabase(persona, competenciasData) {
  try {
    // Preparar dados para inserção na tabela personas_competencias
    const competenciasRecord = {
      persona_id: persona.id,
      competencias_tecnicas: JSON.stringify(competenciasData.competencias_tecnicas),
      competencias_comportamentais: JSON.stringify(competenciasData.competencias_comportamentais),
      ferramentas_tecnologias: JSON.stringify(competenciasData.ferramentas_tecnologias),
      areas_expertise: JSON.stringify(competenciasData.areas_expertise),
      potencial_desenvolvimento: JSON.stringify(competenciasData.potencial_desenvolvimento),
      pontos_fortes: JSON.stringify(competenciasData.pontos_fortes),
      areas_melhoria: JSON.stringify(competenciasData.areas_melhoria),
      compatibilidade_cargo: JSON.stringify(competenciasData.compatibilidade_cargo),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Inserir ou atualizar competências
    const { error } = await supabase
      .from('personas_competencias')
      .upsert(competenciasRecord, {
        onConflict: 'persona_id'
      });

    if (error) {
      console.error(`    ❌ Erro ao salvar competências para ${persona.full_name}:`, error.message);
      return false;
    }

    console.log(`    ✅ Competências salvas para: ${persona.full_name}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao salvar competências para ${persona.full_name}:`, error.message);
    return false;
  }
}

async function generateCompetencias() {
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
          competencias: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Verificar se tabela personas_competencias existe, senão criar
    try {
      await supabase
        .from('personas_competencias')
        .select('count')
        .limit(1);
    } catch (tableError) {
      console.log('⚠️ Tabela personas_competencias não existe - será necessário criar via SQL');
    }

    // 4. Buscar personas com biografia mas sem competências analisadas
    const { data: personasComCompetencias } = await supabase
      .from('personas_competencias')
      .select('persona_id');

    const personasComCompetenciasIds = personasComCompetencias?.map(c => c.persona_id) || [];

    const { data: todasPersonas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .eq('status', 'active')
      .not('biografia_completa', 'is', null);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!todasPersonas.length) {
      console.log('\n⚠️ Nenhuma persona com biografia encontrada!');
      return;
    }

    // Filtrar personas que ainda não têm competências
    const personasSemCompetencias = todasPersonas.filter(p => 
      !personasComCompetenciasIds.includes(p.id)
    );

    if (!personasSemCompetencias.length) {
      console.log('\n✅ Todas as personas já possuem análise de competências!');
      
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            competencias: {
              running: false,
              last_result: 'completed',
              last_run: new Date().toISOString()
            }
          }
        })
        .eq('id', empresa.id);
        
      return;
    }

    console.log(`\n🔍 Analisando competências para ${personasSemCompetencias.length} personas...`);

    // 5. Criar diretório de output
    const outputDir = path.join(process.cwd(), 'output', 'competencias', empresa.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 6. Gerar análise de competências
    let sucessos = 0;
    let erros = 0;

    for (const persona of personasSemCompetencias) {
      const competenciasData = await generateCompetenciasForPersona(persona, empresa);
      
      if (competenciasData) {
        const salvou = await saveCompetenciasToSupabase(persona, competenciasData);
        
        if (salvou) {
          // Salvar backup local
          const filename = `competencias_${persona.full_name.replace(/\s+/g, '_').toLowerCase()}.json`;
          fs.writeFileSync(
            path.join(outputDir, filename),
            JSON.stringify({
              persona: {
                id: persona.id,
                nome: persona.full_name,
                cargo: persona.role,
                especialidade: persona.specialty,
                empresa: empresa.nome
              },
              competencias: competenciasData,
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
      
      // Pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // 7. Atualizar status da empresa
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          competencias: {
            running: false,
            last_result: erros > 0 ? 'partial_success' : 'success',
            last_run: new Date().toISOString(),
            total_analyzed: sucessos
          }
        }
      })
      .eq('id', empresa.id);

    // 8. Relatório final
    console.log('\n📊 RELATÓRIO DE COMPETÊNCIAS');
    console.log('============================');
    console.log(`✅ Análises concluídas com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na análise: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasSemCompetencias.length) * 100).toFixed(1)}%`);
    console.log(`🗃️ Dados salvos na tabela: personas_competencias`);

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 02 - COMPETÊNCIAS CONCLUÍDO COM SUCESSO!');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 02:', error);
    process.exit(1);
  }
}

generateCompetencias();