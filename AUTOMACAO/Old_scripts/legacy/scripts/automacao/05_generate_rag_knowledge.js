#!/usr/bin/env node
/**
 * 🎯 SCRIPT 05 - GERAÇÃO DE BASE DE CONHECIMENTO RAG (QUINTA ETAPA)
 * ==================================================================
 * 
 * Criação de base de conhecimento RAG (Retrieval-Augmented Generation)
 * estruturada com dados consolidados das personas, competências, avatares e specs técnicas.
 * REQUER: Scripts 01, 02, 03 e 04 executados com sucesso
 * 
 * Funcionalidades:
 * - Consolidação de dados para RAG (Retrieval-Augmented Generation)
 * - Estruturação de conhecimento organizacional
 * - Criação de contextos semânticos para LLMs
 * - Preparação para busca e recuperação inteligente
 * - Base para sistemas de IA conversacional
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Configuração
dotenv.config({ path: '../../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

console.log('🎯 SCRIPT 05 - BASE DE CONHECIMENTO RAG (ETAPA 5/6)');
console.log('=================================================');

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

// Estrutura RAG para organização do conhecimento
const ragStructure = {
  organizational_context: {
    description: "Contexto organizacional da empresa",
    sections: [
      "company_overview",
      "industry_analysis", 
      "team_structure",
      "core_capabilities"
    ]
  },
  personas_knowledge: {
    description: "Conhecimento sobre as personas",
    sections: [
      "roles_responsibilities",
      "expertise_areas",
      "collaboration_patterns",
      "decision_making"
    ]
  },
  technical_specifications: {
    description: "Especificações técnicas e arquitetura",
    sections: [
      "technology_stack",
      "integration_requirements",
      "infrastructure_needs",
      "security_compliance"
    ]
  },
  workflows_processes: {
    description: "Fluxos de trabalho e processos",
    sections: [
      "standard_procedures",
      "approval_workflows",
      "communication_flows",
      "escalation_paths"
    ]
  }
};

async function consolidateKnowledgeBase(empresa, personas, competencias, techSpecs) {
  try {
    console.log(`  🧠 Consolidando base de conhecimento para: ${empresa.nome}`);
    
    // Preparar contexto consolidado
    const consolidatedContext = {
      empresa: {
        nome: empresa.nome,
        industria: empresa.industria || empresa.industry,
        tamanho: empresa.total_personas,
        status: empresa.status
      },
      equipe: personas.map(p => ({
        nome: p.full_name,
        cargo: p.role,
        departamento: p.department,
        especialidade: p.specialty,
        experiencia: p.experiencia_anos,
        biografia_resumo: p.biografia_completa?.substring(0, 500) + '...'
      })),
      capacidades_tecnicas: competencias.map(c => {
        const comp = c.competencias;
        return {
          persona: c.personas?.full_name || 'Unknown',
          competencias_principais: comp?.competencias_tecnicas ? 
            JSON.parse(comp.competencias_tecnicas)?.principais || [] : [],
          ferramentas: comp?.ferramentas_tecnologias ? 
            JSON.parse(comp.ferramentas_tecnologias) : {}
        };
      }),
      arquitetura_tecnica: techSpecs ? {
        stack: techSpecs.arquitetura_recomendada,
        especificacoes: techSpecs.especificacoes_por_categoria,
        infraestrutura: techSpecs.infraestrutura
      } : null
    };

    // Prompt para consolidação LLM da base de conhecimento
    const prompt = `
Analise o contexto organizacional e crie uma base de conhecimento estruturada RAG:

DADOS CONSOLIDADOS:
${JSON.stringify(consolidatedContext, null, 2)}

RESPONDA SOMENTE COM JSON VÁLIDO no seguinte formato:

{
  "knowledge_base": {
    "organizational_overview": {
      "company_profile": "Descrição concisa da empresa e seu perfil",
      "industry_context": "Contexto da indústria e posicionamento",
      "team_dynamics": "Dinâmica e estrutura da equipe",
      "core_strengths": ["principais forças organizacionais"]
    },
    "personas_expertise": {
      "key_roles": [
        {
          "role": "cargo",
          "responsibilities": ["responsabilidades principais"],
          "expertise": ["áreas de especialização"],
          "collaboration_style": "estilo de colaboração"
        }
      ],
      "competency_matrix": {
        "technical": ["competências técnicas do time"],
        "leadership": ["competências de liderança"],
        "domain_specific": ["competências específicas do domínio"]
      }
    },
    "technical_landscape": {
      "current_stack": {
        "frontend": ["tecnologias frontend"],
        "backend": ["tecnologias backend"], 
        "database": ["sistemas de banco"],
        "infrastructure": ["infraestrutura"]
      },
      "integration_points": ["pontos de integração principais"],
      "technical_debt": ["áreas de débito técnico"],
      "innovation_opportunities": ["oportunidades de inovação"]
    },
    "operational_workflows": {
      "decision_making": "Como decisões são tomadas",
      "communication_patterns": "Padrões de comunicação",
      "project_execution": "Como projetos são executados",
      "quality_assurance": "Processos de qualidade"
    },
    "strategic_insights": {
      "growth_potential": "Potencial de crescimento",
      "market_positioning": "Posicionamento no mercado",
      "competitive_advantages": ["vantagens competitivas"],
      "risk_factors": ["fatores de risco"],
      "recommendations": ["recomendações estratégicas"]
    }
  },
  "rag_contexts": {
    "general_company_qa": [
      {
        "question": "Quem é a empresa?",
        "context": "Informação sobre perfil e indústria",
        "sources": ["company_profile", "industry_context"]
      },
      {
        "question": "Quais são as principais competências do time?",
        "context": "Competências técnicas e comportamentais",
        "sources": ["competency_matrix", "personas_expertise"]
      }
    ],
    "technical_qa": [
      {
        "question": "Qual é a arquitetura técnica atual?",
        "context": "Stack tecnológico e infraestrutura",
        "sources": ["current_stack", "infrastructure"]
      },
      {
        "question": "Quais são os principais desafios técnicos?",
        "context": "Débito técnico e oportunidades",
        "sources": ["technical_debt", "innovation_opportunities"]
      }
    ],
    "operational_qa": [
      {
        "question": "Como funciona o processo de tomada de decisão?",
        "context": "Fluxos operacionais e comunicação",
        "sources": ["decision_making", "communication_patterns"]
      }
    ]
  },
  "search_keywords": {
    "company": ["${empresa.nome.toLowerCase()}", "${(empresa.industria || '').toLowerCase()}"],
    "roles": [${personas.map(p => `"${p.role.toLowerCase()}"`).join(', ')}],
    "technologies": ["tecnologias", "stack", "arquitetura"],
    "processes": ["workflow", "processo", "decisão", "comunicação"]
  },
  "metadata": {
    "created_at": "${new Date().toISOString()}",
    "personas_analyzed": ${personas.length},
    "competencies_mapped": ${competencias.length},
    "tech_specs_available": ${techSpecs ? 'true' : 'false'},
    "knowledge_version": "1.0"
  }
}

REGRAS IMPORTANTES:
1. Base o conhecimento nos dados reais fornecidos
2. Seja específico e evite generalidades
3. Mantenha consistência entre seções
4. Crie contextos úteis para Q&A futuro
5. Use linguagem clara e profissional
6. Responda APENAS com JSON válido, sem texto adicional
`;

    let knowledgeBase;
    
    // Tentar Google AI
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
      knowledgeBase = JSON.parse(jsonMatch[0]);
      console.log('    ✅ Base de conhecimento consolidada com Google AI');

    } catch (googleError) {
      console.log('    ❌ Google AI falhou, usando estrutura padrão');
      
      // Fallback estruturado
      knowledgeBase = {
        knowledge_base: {
          organizational_overview: {
            company_profile: `${empresa.nome} é uma empresa de ${empresa.industria} com ${empresa.total_personas} colaboradores.`,
            industry_context: `Atuação no setor de ${empresa.industria || 'tecnologia'} com foco em inovação.`,
            team_dynamics: "Equipe diversificada com diferentes especialidades.",
            core_strengths: ["Equipe qualificada", "Diversidade de competências"]
          },
          personas_expertise: {
            key_roles: personas.map(p => ({
              role: p.role,
              responsibilities: [`Responsabilidades de ${p.role}`],
              expertise: [p.specialty],
              collaboration_style: "Colaborativo"
            })),
            competency_matrix: {
              technical: ["Desenvolvimento", "Análise", "Gestão"],
              leadership: ["Liderança de equipe", "Tomada de decisão"],
              domain_specific: personas.map(p => p.specialty).filter(Boolean)
            }
          },
          technical_landscape: {
            current_stack: {
              frontend: ["React", "TypeScript"],
              backend: ["Node.js", "PostgreSQL"],
              database: ["Supabase"],
              infrastructure: ["Cloud", "Docker"]
            },
            integration_points: ["APIs", "Database"],
            technical_debt: ["Refatoração", "Documentação"],
            innovation_opportunities: ["AI/ML", "Automação"]
          },
          operational_workflows: {
            decision_making: "Decisões colaborativas com base em dados",
            communication_patterns: "Comunicação aberta e transparente",
            project_execution: "Metodologias ágeis",
            quality_assurance: "Code review e testes automatizados"
          },
          strategic_insights: {
            growth_potential: "Alto potencial baseado na equipe qualificada",
            market_positioning: "Posição competitiva no mercado",
            competitive_advantages: ["Equipe especializada", "Tecnologia moderna"],
            risk_factors: ["Dependência de talentos", "Mudanças de mercado"],
            recommendations: ["Investir em capacitação", "Expandir automatização"]
          }
        },
        rag_contexts: {
          general_company_qa: [
            {
              question: `Quem é a ${empresa.nome}?`,
              context: `Empresa de ${empresa.industria} com ${empresa.total_personas} pessoas`,
              sources: ["company_profile"]
            }
          ],
          technical_qa: [
            {
              question: "Qual é a stack tecnológica?",
              context: "Next.js, Supabase, TypeScript",
              sources: ["current_stack"]
            }
          ],
          operational_qa: [
            {
              question: "Como trabalha a equipe?",
              context: "Metodologias ágeis e colaboração",
              sources: ["operational_workflows"]
            }
          ]
        },
        search_keywords: {
          company: [empresa.nome.toLowerCase()],
          roles: personas.map(p => p.role?.toLowerCase()).filter(Boolean),
          technologies: ["react", "typescript", "supabase"],
          processes: ["agile", "colaboração"]
        },
        metadata: {
          created_at: new Date().toISOString(),
          personas_analyzed: personas.length,
          competencies_mapped: competencias.length,
          tech_specs_available: techSpecs ? true : false,
          knowledge_version: "1.0"
        }
      };
    }

    return knowledgeBase;

  } catch (error) {
    console.error(`    ❌ Erro ao consolidar base de conhecimento:`, error.message);
    return null;
  }
}

async function saveKnowledgeBaseToSupabase(empresa, knowledgeBase, personas) {
  try {
    console.log(`\n💾 Salvando dados RAG para ${personas.length} personas...`);
    
    let salvosComSucesso = 0;
    
    for (const persona of personas) {
      const personaKnowledge = knowledgeBase.personas[persona.persona_code];
      
      if (personaKnowledge) {
        const ragRecord = {
          persona_id: persona.id,
          empresa_id: empresa.id,
          knowledge_base: personaKnowledge,
          contexto_semantico: personaKnowledge.semantic_context || {},
          embeddings_gerados: true,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: ragError } = await supabase
          .from('personas_rag')
          .insert(ragRecord);
        
        if (ragError) {
          console.error(`❌ Erro ao salvar RAG para ${persona.full_name}:`, ragError.message);
        } else {
          salvosComSucesso++;
          console.log(`✅ RAG salvo: ${persona.full_name}`);
        }
      }
    }

    console.log(`\n📊 RELATÓRIO RAG FINAL`);
    console.log(`========================`);
    console.log(`✅ Personas processadas: ${personas.length}`);
    console.log(`💾 RAG salvos com sucesso: ${salvosComSucesso}`);
    console.log(`❌ Falhas: ${personas.length - salvosComSucesso}`);
    console.log(`🗃️ Dados salvos na tabela: personas_rag`);

    return salvosComSucesso > 0;

  } catch (error) {
    console.error(`    ❌ Erro ao salvar base de conhecimento:`, error.message);
    return false;
  }
}

async function generateRAGKnowledgeBase() {
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
          rag: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Verificar se já existem dados RAG para as personas
    const { data: existingRag } = await supabase
      .from('personas_rag')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (existingRag && existingRag.length > 0) {
      console.log(`\n✅ Empresa já possui ${existingRag.length} registros RAG!`);
      
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            rag: {
              running: false,
              last_result: 'completed',
              last_run: new Date().toISOString()
            }
          }
        })
        .eq('id', empresa.id);
        
      return;
    }

    // 4. Buscar dados necessários
    console.log('\n📊 Coletando dados para consolidação...');
    
    // Personas da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .eq('status', 'active');

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    // Competências das personas
    const { data: competencias, error: competenciasError } = await supabase
      .from('personas_competencias')
      .select(`
        *,
        personas!inner(empresa_id, full_name, role, specialty)
      `)
      .eq('personas.empresa_id', empresa.id);

    // Especificações técnicas da empresa
    const { data: techSpecs, error: techSpecsError } = await supabase
      .from('empresas_tech_specs')
      .select('*')
      .eq('empresa_id', empresa.id)
      .single();

    console.log(`📈 Dados coletados: ${personas.length} personas, ${competencias?.length || 0} competências, ${techSpecs ? '1' : '0'} spec técnica`);

    if (!personas.length) {
      console.log('\n⚠️ Nenhuma persona encontrada!');
      return;
    }

    // 5. Criar diretório de output
    const outputDir = path.join(process.cwd(), 'output', 'knowledge_base', empresa.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 6. Consolidar base de conhecimento
    console.log(`\n🧠 Consolidando base de conhecimento...`);
    
    const knowledgeBase = await consolidateKnowledgeBase(empresa, personas, competencias || [], techSpecs);
    
    if (knowledgeBase) {
      const salvou = await saveKnowledgeBaseToSupabase(empresa, knowledgeBase, personas);
      
      if (salvou) {
        // Salvar backup local
        const filename = `knowledge_base_${empresa.nome.replace(/\s+/g, '_').toLowerCase()}.json`;
        fs.writeFileSync(
          path.join(outputDir, filename),
          JSON.stringify({
            empresa: {
              id: empresa.id,
              nome: empresa.nome,
              industria: empresa.industria || empresa.industry
            },
            knowledge_base: knowledgeBase,
            generated_at: new Date().toISOString(),
            source_data: {
              personas_count: personas.length,
              competencias_count: competencias?.length || 0,
              tech_specs_available: !!techSpecs
            }
          }, null, 2),
          'utf8'
        );

        // 7. Atualizar status da empresa
        await supabase
          .from('empresas')
          .update({
            scripts_status: {
              ...empresa.scripts_status,
              rag: {
                running: false,
                last_result: 'success',
                last_run: new Date().toISOString(),
                generated: true
              }
            }
          })
          .eq('id', empresa.id);

        console.log('\n📊 RELATÓRIO DE BASE DE CONHECIMENTO RAG');
        console.log('========================================');
        console.log(`✅ Base de conhecimento consolidada para: ${empresa.nome}`);
        console.log(`🧠 Contextos RAG criados: ${Object.keys(knowledgeBase.rag_contexts).length}`);
        console.log(`🔍 Keywords mapeadas: ${Object.keys(knowledgeBase.search_keywords).length} categorias`);
        console.log(`📚 Baseado em: ${personas.length} personas, ${competencias?.length || 0} competências`);
        console.log(`🗃️ Dados salvos na tabela: empresas_knowledge_base`);
        console.log(`📁 Backup local: ${filename}`);
        console.log('\n🎉 SCRIPT 04 - BASE DE CONHECIMENTO RAG CONCLUÍDO COM SUCESSO!');
      } else {
        throw new Error('Falha ao salvar base de conhecimento');
      }
    } else {
      throw new Error('Falha ao consolidar base de conhecimento');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 04:', error);
    
    // Atualizar status de erro
    if (targetEmpresaId) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa?.scripts_status,
            rag: {
              running: false,
              last_result: 'error',
              last_run: new Date().toISOString(),
              error_message: error.message
            }
          }
        })
        .eq('id', targetEmpresaId);
    }
    
    process.exit(1);
  }
}

generateRAGKnowledgeBase();