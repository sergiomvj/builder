#!/usr/bin/env node
/**
 * 🎯 SCRIPT 06 - ANÁLISE DE FLUXOS DE TRABALHO (ETAPA FINAL)
 * ==========================================================
 * 
 * Análise e mapeamento de fluxos de trabalho baseados na base de conhecimento completa.
 * REQUER: TODOS os scripts anteriores (01-05) executados com sucesso
 * ESTE É O SCRIPT FINAL DA CASCATA DE AUTOMAÇÃO
 * 
 * Funcionalidades:
 * - Mapeamento de processos de negócio por área
 * - Identificação de gargalos e oportunidades de automação
 * - Análise de colaboração entre personas
 * - Geração de workflows conceituais
 * - Preparação de dados para automação futura
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

console.log('🎯 SCRIPT 06 - ANÁLISE DE WORKFLOWS (ETAPA FINAL 6/6)');
console.log('===================================================');

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

// Templates de processos por área/especialidade
const processTemplates = {
  hr: {
    categoria: "Recursos Humanos",
    processos_principais: [
      {
        nome: "Recrutamento e Seleção",
        etapas: ["Abertura de vaga", "Triagem curricular", "Entrevistas", "Testes", "Contratação"],
        personas_envolvidas: ["HR Business Partner", "Recrutador", "Gerente"],
        ferramentas: ["ATS", "LinkedIn", "Calendário", "E-mail"],
        automacao_potencial: 70,
        tempo_medio: "15-30 dias"
      },
      {
        nome: "Onboarding",
        etapas: ["Documentação", "Treinamentos", "Apresentação", "Setup", "Follow-up"],
        personas_envolvidas: ["HR Generalist", "Manager", "IT"],
        ferramentas: ["HRIS", "LMS", "Slack"],
        automacao_potencial: 60,
        tempo_medio: "1-2 semanas"
      }
    ]
  },
  tecnologia: {
    categoria: "Tecnologia",
    processos_principais: [
      {
        nome: "Desenvolvimento de Software",
        etapas: ["Planejamento", "Desenvolvimento", "Code Review", "Testes", "Deploy"],
        personas_envolvidas: ["Tech Lead", "Desenvolvedor", "QA", "DevOps"],
        ferramentas: ["Git", "IDE", "CI/CD", "Docker"],
        automacao_potencial: 80,
        tempo_medio: "1-4 sprints"
      },
      {
        nome: "Resolução de Bugs",
        etapas: ["Identificação", "Reprodução", "Diagnóstico", "Correção", "Verificação"],
        personas_envolvidas: ["Desenvolvedor", "QA", "Product Owner"],
        ferramentas: ["Issue Tracker", "Logs", "Monitoring"],
        automacao_potencial: 50,
        tempo_medio: "1-5 dias"
      }
    ]
  },
  marketing: {
    categoria: "Marketing",
    processos_principais: [
      {
        nome: "Criação de Campanhas",
        etapas: ["Briefing", "Planejamento", "Criação", "Aprovação", "Lançamento", "Análise"],
        personas_envolvidas: ["Marketing Manager", "Designer", "Copywriter", "Data Analyst"],
        ferramentas: ["Google Ads", "Canva", "Analytics", "Social Media"],
        automacao_potencial: 60,
        tempo_medio: "1-3 semanas"
      },
      {
        nome: "Análise de Performance",
        etapas: ["Coleta de dados", "Análise", "Insights", "Relatório", "Recomendações"],
        personas_envolvidas: ["Data Analyst", "Marketing Manager"],
        ferramentas: ["Google Analytics", "Power BI", "Excel"],
        automacao_potencial: 85,
        tempo_medio: "2-5 dias"
      }
    ]
  },
  financeiro: {
    categoria: "Financeiro",
    processos_principais: [
      {
        nome: "Fechamento Mensal",
        etapas: ["Conciliação", "Lançamentos", "Análise", "Relatórios", "Aprovação"],
        personas_envolvidas: ["Contador", "Analista Financeiro", "Controller"],
        ferramentas: ["ERP", "Excel", "Sistema Bancário"],
        automacao_potencial: 75,
        tempo_medio: "5-10 dias"
      },
      {
        nome: "Aprovação de Despesas",
        etapas: ["Solicitação", "Validação", "Aprovação", "Pagamento", "Contabilização"],
        personas_envolvidas: ["Solicitante", "Gestor", "Financeiro"],
        ferramentas: ["Sistema de Despesas", "ERP"],
        automacao_potencial: 90,
        tempo_medio: "1-3 dias"
      }
    ]
  }
};

async function analyzeWorkflowsForEmpresa(empresa, personas, competencias, knowledgeBase) {
  try {
    console.log(`  🔄 Analisando fluxos de trabalho para: ${empresa.nome}`);
    
    // Identificar áreas presentes na empresa
    const areasPresentes = [...new Set(personas.map(p => 
      getAreaFromRole(p.role, p.department, p.specialty)
    ))].filter(Boolean);

    // Mapear competências por área
    const competenciasPorArea = {};
    areasPresentes.forEach(area => {
      competenciasPorArea[area] = personas
        .filter(p => getAreaFromRole(p.role, p.department, p.specialty) === area)
        .map(p => {
          const comp = competencias.find(c => c.persona_id === p.id);
          return {
            persona: p,
            competencias: comp ? JSON.parse(comp.competencias_tecnicas || '{}') : {},
            ferramentas: comp ? JSON.parse(comp.ferramentas_tecnologias || '{}') : {}
          };
        });
    });

    // Preparar contexto para análise LLM
    const workflowContext = {
      empresa: {
        nome: empresa.nome,
        industria: empresa.industria || empresa.industry,
        tamanho: empresa.total_personas
      },
      areas_presentes: areasPresentes,
      team_structure: competenciasPorArea,
      knowledge_base: knowledgeBase ? JSON.parse(knowledgeBase.knowledge_base) : null
    };

    // Prompt para análise LLM de fluxos de trabalho
    const prompt = `
Analise a estrutura organizacional e gere uma análise completa de fluxos de trabalho:

CONTEXTO ORGANIZACIONAL:
${JSON.stringify(workflowContext, null, 2)}

TEMPLATES DE REFERÊNCIA:
${JSON.stringify(processTemplates, null, 2)}

RESPONDA SOMENTE COM JSON VÁLIDO no seguinte formato:

{
  "workflow_analysis": {
    "empresa_overview": {
      "nome": "${empresa.nome}",
      "areas_ativas": [${areasPresentes.map(a => `"${a}"`).join(', ')}],
      "complexidade_operacional": "baixa/media/alta",
      "maturidade_processos": "inicial/intermediaria/avancada"
    },
    "processos_mapeados": [
      {
        "area": "area",
        "processo": "nome do processo",
        "descricao": "descrição do processo",
        "etapas": ["etapa 1", "etapa 2"],
        "personas_envolvidas": ["persona 1", "persona 2"],
        "ferramentas_utilizadas": ["ferramenta 1", "ferramenta 2"],
        "tempo_estimado": "X dias/semanas",
        "frequencia": "diario/semanal/mensal",
        "criticidade": "baixa/media/alta",
        "automacao_potencial": 75,
        "gargalos_identificados": ["gargalo 1", "gargalo 2"],
        "melhorias_sugeridas": ["melhoria 1", "melhoria 2"]
      }
    ],
    "colaboracao_inter_areas": {
      "fluxos_principais": [
        {
          "origem": "area origem",
          "destino": "area destino", 
          "tipo_interacao": "aprovação/informação/execução",
          "ferramentas_compartilhadas": ["ferramenta 1"],
          "frequencia": "diaria/semanal",
          "pontos_friccao": ["friccao 1"]
        }
      ],
      "dependencias_criticas": ["dependencia 1", "dependencia 2"]
    },
    "oportunidades_automacao": {
      "alta_prioridade": [
        {
          "processo": "nome do processo",
          "area": "area",
          "potencial_economia": "horas/semana economizadas",
          "complexidade_implementacao": "baixa/media/alta",
          "ferramentas_necessarias": ["ferramenta 1"],
          "roi_estimado": "X meses"
        }
      ],
      "media_prioridade": [],
      "baixa_prioridade": []
    },
    "kpis_sugeridos": {
      "eficiencia": [
        {
          "nome": "Nome do KPI",
          "descricao": "Descrição do KPI",
          "area": "area",
          "meta_sugerida": "valor meta",
          "frequencia_medicao": "diaria/semanal/mensal"
        }
      ],
      "qualidade": [],
      "produtividade": []
    }
  },
  "roadmap_otimizacao": {
    "curto_prazo": {
      "periodo": "0-3 meses",
      "acoes": ["ação 1", "ação 2"],
      "investimento": "baixo/medio/alto",
      "beneficios": ["beneficio 1", "beneficio 2"]
    },
    "medio_prazo": {
      "periodo": "3-12 meses", 
      "acoes": ["ação 1", "ação 2"],
      "investimento": "baixo/medio/alto",
      "beneficios": ["beneficio 1", "beneficio 2"]
    },
    "longo_prazo": {
      "periodo": "12+ meses",
      "acoes": ["ação 1", "ação 2"],
      "investimento": "baixo/medio/alto",
      "beneficios": ["beneficio 1", "beneficio 2"]
    }
  },
  "riscos_implementacao": [
    {
      "risco": "descrição do risco",
      "probabilidade": "baixa/media/alta",
      "impacto": "baixo/medio/alto",
      "mitigacao": "estratégia de mitigação"
    }
  ],
  "metadata": {
    "total_processos_analisados": 0,
    "areas_cobertas": [${areasPresentes.map(a => `"${a}"`).join(', ')}],
    "automacao_media_potencial": 70,
    "analise_data": "${new Date().toISOString()}"
  }
}

REGRAS IMPORTANTES:
1. Base a análise na estrutura real da empresa (${empresa.total_personas} pessoas)
2. Seja específico para as áreas presentes: ${areasPresentes.join(', ')}
3. Considere as competências e ferramentas reais das personas
4. Priorize oportunidades de automação realistas
5. Inclua KPIs mensuráveis e relevantes
6. Responda APENAS com JSON válido, sem texto adicional
`;

    let workflowData;
    
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
      workflowData = JSON.parse(jsonMatch[0]);
      console.log('    ✅ Análise de workflows gerada com Google AI');

    } catch (googleError) {
      console.log('    ⚠️ Google AI falhou, tentando OpenAI...');
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4000,
        });
        const rawText = completion.choices[0].message.content;
        
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Resposta não contém JSON válido');
        }
        workflowData = JSON.parse(jsonMatch[0]);
        console.log('    ✅ Análise de workflows gerada com OpenAI');

      } catch (openaiError) {
        console.log('    ❌ Ambos LLMs falharam, usando análise estruturada');
        
        // Fallback baseado na estrutura da empresa
        const processosBase = areasPresentes.flatMap(area => 
          processTemplates[area]?.processos_principais || []
        );

        workflowData = {
          workflow_analysis: {
            empresa_overview: {
              nome: empresa.nome,
              areas_ativas: areasPresentes,
              complexidade_operacional: empresa.total_personas > 30 ? 'alta' : 'media',
              maturidade_processos: 'intermediaria'
            },
            processos_mapeados: processosBase.map(p => ({
              area: areasPresentes[0] || 'geral',
              processo: p.nome,
              descricao: `Processo de ${p.nome} da empresa`,
              etapas: p.etapas,
              personas_envolvidas: p.personas_envolvidas,
              ferramentas_utilizadas: p.ferramentas,
              tempo_estimado: p.tempo_medio,
              frequencia: 'semanal',
              criticidade: 'media',
              automacao_potencial: p.automacao_potencial,
              gargalos_identificados: ['Aprovações manuais', 'Comunicação'],
              melhorias_sugeridas: ['Automatizar etapas', 'Melhorar comunicação']
            })),
            colaboracao_inter_areas: {
              fluxos_principais: areasPresentes.length > 1 ? [
                {
                  origem: areasPresentes[0],
                  destino: areasPresentes[1] || areasPresentes[0],
                  tipo_interacao: 'informação',
                  ferramentas_compartilhadas: ['Email', 'Slack'],
                  frequencia: 'diaria',
                  pontos_friccao: ['Comunicação assíncrona']
                }
              ] : [],
              dependencias_criticas: ['Comunicação eficaz', 'Acesso a sistemas']
            },
            oportunidades_automacao: {
              alta_prioridade: [
                {
                  processo: processosBase[0]?.nome || 'Processo principal',
                  area: areasPresentes[0] || 'geral',
                  potencial_economia: '5-10 horas/semana',
                  complexidade_implementacao: 'media',
                  ferramentas_necessarias: ['Automação workflow'],
                  roi_estimado: '3-6 meses'
                }
              ],
              media_prioridade: [],
              baixa_prioridade: []
            },
            kpis_sugeridos: {
              eficiencia: [
                {
                  nome: 'Tempo de Ciclo',
                  descricao: 'Tempo médio para completar processos',
                  area: areasPresentes[0] || 'geral',
                  meta_sugerida: 'Redução de 20%',
                  frequencia_medicao: 'semanal'
                }
              ],
              qualidade: [
                {
                  nome: 'Taxa de Erro',
                  descricao: 'Percentual de erros em processos',
                  area: areasPresentes[0] || 'geral',
                  meta_sugerida: '< 5%',
                  frequencia_medicao: 'mensal'
                }
              ],
              produtividade: [
                {
                  nome: 'Tarefas por Pessoa',
                  descricao: 'Número de tarefas completadas por pessoa',
                  area: areasPresentes[0] || 'geral',
                  meta_sugerida: 'Aumento de 15%',
                  frequencia_medicao: 'semanal'
                }
              ]
            }
          },
          roadmap_otimizacao: {
            curto_prazo: {
              periodo: '0-3 meses',
              acoes: ['Mapear processos atuais', 'Identificar gargalos'],
              investimento: 'baixo',
              beneficios: ['Maior visibilidade', 'Quick wins']
            },
            medio_prazo: {
              periodo: '3-12 meses',
              acoes: ['Implementar automações', 'Treinar equipe'],
              investimento: 'medio',
              beneficios: ['Maior eficiência', 'Redução de custos']
            },
            longo_prazo: {
              periodo: '12+ meses',
              acoes: ['Otimização contínua', 'IA avançada'],
              investimento: 'alto',
              beneficios: ['Transformação digital', 'Vantagem competitiva']
            }
          },
          riscos_implementacao: [
            {
              risco: 'Resistência à mudança',
              probabilidade: 'media',
              impacto: 'medio',
              mitigacao: 'Treinamento e comunicação clara'
            },
            {
              risco: 'Complexidade técnica',
              probabilidade: 'baixa',
              impacto: 'alto',
              mitigacao: 'Implementação faseada e suporte técnico'
            }
          ],
          metadata: {
            total_processos_analisados: processosBase.length,
            areas_cobertas: areasPresentes,
            automacao_media_potencial: 70,
            analise_data: new Date().toISOString()
          }
        };
      }
    }

    return workflowData;

  } catch (error) {
    console.error(`    ❌ Erro ao analisar workflows para ${empresa.nome}:`, error.message);
    return null;
  }
}

function getAreaFromRole(role, department, specialty) {
  const text = `${role} ${department} ${specialty}`.toLowerCase();
  
  if (text.includes('hr') || text.includes('recursos humanos') || text.includes('people')) {
    return 'hr';
  }
  if (text.includes('marketing') || text.includes('market')) {
    return 'marketing';
  }
  if (text.includes('financ') || text.includes('contab') || text.includes('finance')) {
    return 'financeiro';
  }
  if (text.includes('tech') || text.includes('dev') || text.includes('engineer') || 
      text.includes('tecnolog') || text.includes('software')) {
    return 'tecnologia';
  }
  
  return 'geral';
}

async function saveWorkflowsToSupabase(empresa, workflowData) {
  try {
    // Preparar dados para inserção na tabela empresas_workflows
    const workflowRecord = {
      empresa_id: empresa.id,
      workflow_analysis: JSON.stringify(workflowData.workflow_analysis),
      roadmap_otimizacao: JSON.stringify(workflowData.roadmap_otimizacao),
      riscos_implementacao: JSON.stringify(workflowData.riscos_implementacao),
      metadata: JSON.stringify(workflowData.metadata),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Inserir ou atualizar análise de workflows
    const { error } = await supabase
      .from('empresas_workflows')
      .upsert(workflowRecord, {
        onConflict: 'empresa_id'
      });

    if (error) {
      console.error(`    ❌ Erro ao salvar análise de workflows:`, error.message);
      return false;
    }

    console.log(`    ✅ Análise de workflows salva para: ${empresa.nome}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao salvar análise de workflows:`, error.message);
    return false;
  }
}

async function generateWorkflowAnalysis() {
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
          fluxos: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 3. Verificar se já existe análise de workflows
    const { data: existingWorkflow } = await supabase
      .from('empresas_workflows')
      .select('*')
      .eq('empresa_id', empresa.id)
      .single();

    if (existingWorkflow) {
      console.log('\n✅ Empresa já possui análise de workflows!');
      
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            fluxos: {
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
    console.log('\n📊 Coletando dados para análise...');
    
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
      .select('*')
      .eq('personas.empresa_id', empresa.id);

    // Base de conhecimento da empresa
    const { data: knowledgeBase, error: knowledgeError } = await supabase
      .from('empresas_knowledge_base')
      .select('*')
      .eq('empresa_id', empresa.id)
      .single();

    console.log(`📈 Dados coletados: ${personas.length} personas, ${competencias?.length || 0} competências, ${knowledgeBase ? '1' : '0'} knowledge base`);

    if (!personas.length) {
      console.log('\n⚠️ Nenhuma persona encontrada!');
      return;
    }

    // 5. Criar diretório de output
    const outputDir = path.join(process.cwd(), 'output', 'workflows', empresa.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 6. Gerar análise de workflows
    console.log(`\n🔄 Analisando fluxos de trabalho...`);
    
    const workflowData = await analyzeWorkflowsForEmpresa(empresa, personas, competencias || [], knowledgeBase);
    
    if (workflowData) {
      const salvou = await saveWorkflowsToSupabase(empresa, workflowData);
      
      if (salvou) {
        // Salvar backup local
        const filename = `workflows_analysis_${empresa.nome.replace(/\s+/g, '_').toLowerCase()}.json`;
        fs.writeFileSync(
          path.join(outputDir, filename),
          JSON.stringify({
            empresa: {
              id: empresa.id,
              nome: empresa.nome,
              industria: empresa.industria || empresa.industry
            },
            workflow_analysis: workflowData,
            generated_at: new Date().toISOString(),
            source_data: {
              personas_count: personas.length,
              competencias_count: competencias?.length || 0,
              knowledge_base_available: !!knowledgeBase
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
              fluxos: {
                running: false,
                last_result: 'success',
                last_run: new Date().toISOString(),
                generated: true
              }
            }
          })
          .eq('id', empresa.id);

        console.log('\n📊 RELATÓRIO DE ANÁLISE DE WORKFLOWS');
        console.log('===================================');
        console.log(`✅ Workflows analisados para: ${empresa.nome}`);
        console.log(`🔄 Processos mapeados: ${workflowData.metadata.total_processos_analisados}`);
        console.log(`📈 Áreas cobertas: ${workflowData.metadata.areas_cobertas.join(', ')}`);
        console.log(`🤖 Potencial médio de automação: ${workflowData.metadata.automacao_media_potencial}%`);
        console.log(`🗃️ Dados salvos na tabela: empresas_workflows`);
        console.log(`📁 Backup local: ${filename}`);
        console.log('\n🎉 SCRIPT 05 - ANÁLISE DE WORKFLOWS CONCLUÍDO COM SUCESSO!');
      } else {
        throw new Error('Falha ao salvar análise de workflows');
      }
    } else {
      throw new Error('Falha ao gerar análise de workflows');
    }

  } catch (error) {
    console.error('❌ Erro crítico no Script 05:', error);
    
    // Atualizar status de erro
    if (targetEmpresaId) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa?.scripts_status,
            fluxos: {
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

generateWorkflowAnalysis();